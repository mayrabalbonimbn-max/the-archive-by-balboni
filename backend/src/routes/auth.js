const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const pool = require('../db')
const { sendPushToUser } = require('../utils/push')

const router = express.Router()
const resetAttempts = new Map()
const RESET_WINDOW_MS = 15 * 60 * 1000
const MAX_RESET_ATTEMPTS = 5

function toProfile(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio,
    avatar: row.avatar,
    headerColor: row.header_color,
    createdAt: row.created_at,
  }
}

function signToken(profile) {
  return jwt.sign(
    { profileId: profile.id, handle: profile.handle },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )
}

function normalizeHandle(handle) {
  const value = handle.trim()
  return value.startsWith('@') ? value : '@' + value
}

function codesMatch(received, expected) {
  const receivedHash = crypto.createHash('sha256').update(received).digest()
  const expectedHash = crypto.createHash('sha256').update(expected).digest()
  return crypto.timingSafeEqual(receivedHash, expectedHash)
}

function allowResetAttempt(ip) {
  const now = Date.now()
  const current = resetAttempts.get(ip)
  if (!current || now - current.startedAt >= RESET_WINDOW_MS) {
    resetAttempts.set(ip, { count: 1, startedAt: now })
    return true
  }
  current.count += 1
  return current.count <= MAX_RESET_ATTEMPTS
}

function databaseErrorResponse(err, res) {
  if (err.code === '42P01' || err.code === '42703') {
    return res.status(503).json({
      error: 'O banco ainda não foi atualizado. Reinicie o backend para aplicar as migrações.',
    })
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01'].includes(err.code)) {
    return res.status(503).json({ error: 'Não foi possível conectar ao banco de dados.' })
  }
  return res.status(500).json({ error: 'Não foi possível redefinir a senha. Consulte os logs do backend.' })
}

async function notifyNetworkJoin(newProfile) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (profile_id, actor_id, type, message)
     SELECT id, $1, 'join', $2
     FROM profiles
     WHERE id != $1 AND password_hash IS NOT NULL
     RETURNING profile_id`,
    [newProfile.id, `${newProfile.name} entrou no The Archive.`]
  )
  // Fire push to each profile that received the notification (fire-and-forget).
  // Only profiles with an active push subscription will actually receive anything.
  for (const row of rows) {
    sendPushToUser(row.profile_id, {
      title: 'The Archive',
      body: `${newProfile.name} entrou no The Archive.`,
      url: '/notifications',
      tag: `join-${newProfile.id}`,
    }).catch(() => {})
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, handle, password, bio, headerColor } = req.body

    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' })
    if (!handle || !handle.trim()) return res.status(400).json({ error: '@handle é obrigatório.' })
    if (!password || password.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' })

    const cleanHandle = normalizeHandle(handle)

    // Check uniqueness (case-insensitive)
    const existing = await pool.query(
      'SELECT * FROM profiles WHERE lower(handle) = lower($1)',
      [cleanHandle]
    )
    if (existing.rows.length > 0) {
      const legacyProfile = existing.rows[0]
      if (!legacyProfile.password_hash) {
        const passwordHash = await bcrypt.hash(password, 12)
        const activated = await pool.query(
          `UPDATE profiles
           SET name = $1, bio = $2, avatar = $3, header_color = $4,
               password_hash = $5, updated_at = now()
           WHERE id = $6
           RETURNING *`,
          [
            name.trim(),
            bio?.trim() || '',
            legacyProfile.avatar || null,
            headerColor || legacyProfile.header_color || 'linear-gradient(135deg, #c084fc, #f472b6)',
            passwordHash,
            legacyProfile.id,
          ]
        )
        const profile = toProfile(activated.rows[0])
        return res.status(200).json({ token: signToken(profile), profile })
      }
      return res.status(409).json({ error: 'Esse @handle já está em uso.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO profiles (name, handle, bio, avatar, header_color, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        cleanHandle,
        bio?.trim() || '',
        null,
        headerColor || 'linear-gradient(135deg, #c084fc, #f472b6)',
        passwordHash,
      ]
    )

    const profile = toProfile(result.rows[0])
    await notifyNetworkJoin(profile)
    const token = signToken(profile)
    res.status(201).json({ token, profile })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { handle, password } = req.body

    if (!handle || !password) {
      return res.status(400).json({ error: 'Handle e senha são obrigatórios.' })
    }

    const cleanHandle = normalizeHandle(handle)

    const result = await pool.query(
      'SELECT * FROM profiles WHERE lower(handle) = lower($1)',
      [cleanHandle]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Handle ou senha incorretos.' })
    }

    const row = result.rows[0]
    if (!row.password_hash) {
      return res.status(403).json({
        error: 'Este perfil antigo ainda não tem senha. Use Criar perfil com o mesmo @handle para ativá-lo.',
      })
    }
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Handle ou senha incorretos.' })
    }

    const profile = toProfile(row)
    const token = signToken(profile)
    res.json({ token, profile })
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { handle, recoveryCode, newPassword } = req.body
    const configuredCode = process.env.PASSWORD_RECOVERY_CODE

    if (!configuredCode || configuredCode.length < 12) {
      return res.status(503).json({ error: 'Recuperação de senha ainda não foi configurada.' })
    }
    if (!allowResetAttempt(req.ip)) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' })
    }
    if (!handle || !recoveryCode || !newPassword) {
      return res.status(400).json({ error: 'Preencha todos os campos.' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres.' })
    }
    if (!codesMatch(recoveryCode, configuredCode)) {
      return res.status(403).json({ error: 'Código de recuperação inválido.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    const cleanHandle = normalizeHandle(handle)
    let result
    try {
      result = await pool.query(
        `UPDATE profiles SET password_hash = $1
         WHERE lower(handle) = lower($2) RETURNING id`,
        [passwordHash, cleanHandle]
      )
    } catch (err) {
      if (err.code !== '42703') throw err

      await pool.ensureAuthSchema()
      result = await pool.query(
        `UPDATE profiles SET password_hash = $1
         WHERE lower(handle) = lower($2) RETURNING id`,
        [passwordHash, cleanHandle]
      )
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado.' })
    }

    resetAttempts.delete(req.ip)
    res.json({ ok: true })
  } catch (err) {
    console.error('reset password error:', err)
    databaseErrorResponse(err, res)
  }
})

module.exports = router
