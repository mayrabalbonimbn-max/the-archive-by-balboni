const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const pool = require('../db')
const { sendPushToUser } = require('../utils/push')

const router = express.Router()

// ─── Rate limiters ────────────────────────────────────────────────────────────

const resetAttempts = new Map()
const RESET_WINDOW_MS = 15 * 60 * 1000
const MAX_RESET_ATTEMPTS = 5

const registerAttempts = new Map()
const REGISTER_WINDOW_MS = 15 * 60 * 1000
const MAX_REGISTER_ATTEMPTS = 10

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

function allowRegisterAttempt(ip) {
  const now = Date.now()
  const current = registerAttempts.get(ip)
  if (!current || now - current.startedAt >= REGISTER_WINDOW_MS) {
    registerAttempts.set(ip, { count: 1, startedAt: now })
    return true
  }
  current.count += 1
  return current.count <= MAX_REGISTER_ATTEMPTS
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getSignupMode() {
  const mode = (process.env.SIGNUP_MODE || 'invite_only').toLowerCase()
  if (['open', 'invite_only', 'disabled'].includes(mode)) return mode
  return 'invite_only'
}

function requireAdminSecret(req, res, next) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return res.status(503).json({ error: 'Admin não configurado.' })
  const provided = req.headers['x-admin-secret'] || ''
  if (!provided || !codesMatch(provided, secret)) {
    return res.status(403).json({ error: 'Acesso negado.' })
  }
  next()
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
  return res.status(500).json({ error: 'Erro interno.' })
}

async function notifyNetworkJoin(newProfile) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (profile_id, actor_id, type, message)
     SELECT id, $1, 'join', $2
     FROM profiles
     WHERE lower(handle) = lower('@mayrabalboni') AND id != $1
     RETURNING profile_id`,
    [newProfile.id, `${newProfile.name} entrou no The Archive.`]
  )
  for (const row of rows) {
    sendPushToUser(row.profile_id, {
      title: 'The Archive',
      body: `${newProfile.name} entrou no The Archive.`,
      url: '/notifications',
      tag: `join-${newProfile.id}`,
    }).catch(() => {})
  }
}

// ─── GET /api/auth/signup-mode ────────────────────────────────────────────────

router.get('/signup-mode', (req, res) => {
  res.json({ mode: getSignupMode() })
})

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const mode = getSignupMode()

    if (mode === 'disabled') {
      return res.status(403).json({ error: 'O Archive está disponível apenas por convite.' })
    }

    if (!allowRegisterAttempt(req.ip)) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' })
    }

    const { name, handle, password, bio, headerColor, inviteCode } = req.body

    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' })
    if (!handle || !handle.trim()) return res.status(400).json({ error: '@handle é obrigatório.' })
    if (!password || password.length < 6) return res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres.' })

    if (mode === 'invite_only') {
      if (!inviteCode || !inviteCode.trim()) {
        return res.status(403).json({ error: 'É necessário um código de convite para criar uma conta.' })
      }
    }

    const cleanHandle = normalizeHandle(handle)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Validate and consume invite code inside transaction
      let inviteId = null
      if (mode === 'invite_only') {
        const inviteResult = await client.query(
          `SELECT id FROM invite_codes
           WHERE code = $1
             AND revoked_at IS NULL
             AND (expires_at IS NULL OR expires_at > NOW())
             AND used_count < max_uses
           FOR UPDATE`,
          [inviteCode.trim()]
        )
        if (!inviteResult.rows.length) {
          await client.query('ROLLBACK')
          return res.status(403).json({ error: 'Código de convite inválido, expirado ou já utilizado.' })
        }
        inviteId = inviteResult.rows[0].id
      }

      // Check handle uniqueness
      const existing = await client.query(
        'SELECT * FROM profiles WHERE lower(handle) = lower($1)',
        [cleanHandle]
      )

      let profile

      if (existing.rows.length > 0) {
        const legacyProfile = existing.rows[0]
        if (!legacyProfile.password_hash) {
          const passwordHash = await bcrypt.hash(password, 12)
          const activated = await client.query(
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
          profile = toProfile(activated.rows[0])
        } else {
          await client.query('ROLLBACK')
          return res.status(409).json({ error: 'Esse @handle já está em uso.' })
        }
      } else {
        const passwordHash = await bcrypt.hash(password, 12)
        const result = await client.query(
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
        profile = toProfile(result.rows[0])
      }

      // Consume invite
      if (inviteId) {
        await client.query(
          `UPDATE invite_codes SET used_count = used_count + 1 WHERE id = $1`,
          [inviteId]
        )
      }

      await client.query('COMMIT')

      notifyNetworkJoin(profile).catch(() => {})
      const token = signToken(profile)
      res.status(201).json({ token, profile })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

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

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

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

// ─── Admin: invite management ─────────────────────────────────────────────────
// All routes below require X-Admin-Secret header matching ADMIN_SECRET env var.

// POST /api/auth/admin/invites — create invite code
router.post('/admin/invites', requireAdminSecret, async (req, res) => {
  try {
    const { maxUses = 1, expiresDays, note } = req.body
    const code = crypto.randomBytes(8).toString('hex') // 16-char hex
    const expiresAt = expiresDays
      ? new Date(Date.now() + Number(expiresDays) * 86400000).toISOString()
      : null

    const { rows } = await pool.query(
      `INSERT INTO invite_codes (code, max_uses, expires_at, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code, Math.max(1, Number(maxUses) || 1), expiresAt, note || null]
    )
    res.status(201).json(toInvite(rows[0]))
  } catch (err) {
    console.error('create invite error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /api/auth/admin/invites — list invite codes
router.get('/admin/invites', requireAdminSecret, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM invite_codes ORDER BY created_at DESC`
    )
    res.json(rows.map(toInvite))
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// DELETE /api/auth/admin/invites/:code — revoke invite code
router.delete('/admin/invites/:code', requireAdminSecret, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE invite_codes SET revoked_at = NOW()
       WHERE code = $1 AND revoked_at IS NULL RETURNING id`,
      [req.params.code]
    )
    if (!rows.length) return res.status(404).json({ error: 'Código não encontrado ou já revogado.' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

function toInvite(r) {
  const isValid = !r.revoked_at && (r.expires_at === null || new Date(r.expires_at) > new Date()) && r.used_count < r.max_uses
  return {
    id: r.id,
    code: r.code,
    maxUses: r.max_uses,
    usedCount: r.used_count,
    expiresAt: r.expires_at || null,
    revokedAt: r.revoked_at || null,
    note: r.note || null,
    createdAt: r.created_at,
    valid: isValid,
  }
}

module.exports = router
