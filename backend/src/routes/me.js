const express = require('express')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')

// Startup migration: add profile fields if missing
;(async () => {
  try {
    await pool.query(`
      ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS title    TEXT,
        ADD COLUMN IF NOT EXISTS location TEXT,
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member',
        ADD COLUMN IF NOT EXISTS onboarding_goals TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS public_sections TEXT[] DEFAULT '{"projects","collections","photos","entries"}',
        ADD COLUMN IF NOT EXISTS public_intro TEXT DEFAULT ''
    `)
    await pool.query(`UPDATE profiles SET role = 'admin' WHERE lower(handle) = lower('@mayrabalboni')`)
  } catch (err) {
    console.error('[me] migration error:', err.message)
  }
})()
const PROFILE_MEDIA = {
  avatar: 'avatar',
  cover: 'cover_image',
}
const imageTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(uploadDir, { recursive: true }).then(() => callback(null, uploadDir)).catch(callback)
    },
    filename(req, file, callback) {
      callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const mimeType = imageTypes[path.extname(file.originalname).toLowerCase()]
    if (!mimeType) return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
    file.canonicalMimeType = mimeType
    callback(null, true)
  },
})

router.use(requireAuth)

function isStoredFile(value) {
  return typeof value === 'string' && path.basename(value) === value && /^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(value)
}

async function validImage(file) {
  const data = await fs.readFile(file.path)
  if (file.canonicalMimeType === 'image/jpeg') return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (file.canonicalMimeType === 'image/png') return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (file.canonicalMimeType === 'image/webp') return data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP'
  return false
}

function toProfile(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio,
    title: row.title || null,
    location: row.location || null,
    avatar: isStoredFile(row.avatar) ? null : row.avatar,
    hasAvatar: Boolean(row.avatar),
    headerColor: row.header_color,
    interests: row.interests || '',
    coverImage: isStoredFile(row.cover_image) ? null : row.cover_image || null,
    hasCoverImage: Boolean(row.cover_image),
    friendCount: Number(row.friend_count || 0),
    followerCount: Number(row.follower_count || 0),
    followingCount: Number(row.following_count || 0),
    onboardingCompleted: Boolean(row.onboarding_completed),
    onboardingGoals: row.onboarding_goals || [],
    publicSections: row.public_sections || ['projects', 'collections', 'photos', 'entries'],
    publicIntro: row.public_intro || '',
    role: row.role || 'member',
    isAdmin: row.role === 'admin',
    createdAt: row.created_at,
    verified: row.is_system || false,
  }
}

// GET /api/me
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*)::int FROM friendships f
         WHERE f.status = 'accepted'
           AND (f.requester_id = p.id OR f.receiver_id = p.id)) AS friend_count
        ,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.following_id = p.id) AS follower_count,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.follower_id = p.id) AS following_count
       FROM profiles p WHERE p.id = $1`,
      [req.user.profileId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado.' })
    res.json(toProfile(result.rows[0]))
  } catch (err) {
    console.error('GET /me error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// PATCH /api/me
router.patch('/', async (req, res) => {
  try {
    const { name, handle, bio, title, location, headerColor, interests, onboardingCompleted, onboardingGoals, publicSections, publicIntro } = req.body
    const fields = []
    const values = []
    let i = 1

    if (name !== undefined)     { fields.push(`name = $${i++}`);               values.push(name) }
    if (bio !== undefined)      { fields.push(`bio = $${i++}`);                values.push(bio) }
    if (title !== undefined)    { fields.push(`title = $${i++}`);              values.push(title || null) }
    if (location !== undefined) { fields.push(`location = $${i++}`);           values.push(location || null) }
    if (headerColor !== undefined) { fields.push(`header_color = $${i++}`);   values.push(headerColor) }
    if (interests !== undefined)   { fields.push(`interests = $${i++}`);       values.push(interests) }
    if (onboardingCompleted !== undefined) { fields.push(`onboarding_completed = $${i++}`); values.push(Boolean(onboardingCompleted)) }
    if (Array.isArray(onboardingGoals)) {
      fields.push(`onboarding_goals = $${i++}`)
      values.push(onboardingGoals.map(String).slice(0, 8))
    }
    if (Array.isArray(publicSections)) {
      const allowed = new Set(['projects', 'collections', 'photos', 'articles', 'entries', 'trajectory'])
      fields.push(`public_sections = $${i++}`)
      values.push(publicSections.filter(s => allowed.has(s)).slice(0, 6))
    }
    if (publicIntro !== undefined) {
      fields.push(`public_intro = $${i++}`)
      values.push(String(publicIntro || '').slice(0, 240))
    }

    if (handle !== undefined) {
      const cleanHandle = handle.startsWith('@') ? handle.trim() : '@' + handle.trim()
      // Check uniqueness excluding current profile
      const dup = await pool.query(
        'SELECT id FROM profiles WHERE lower(handle) = lower($1) AND id != $2',
        [cleanHandle, req.user.profileId]
      )
      if (dup.rows.length > 0) return res.status(409).json({ error: 'Esse @handle já está em uso.' })
      fields.push(`handle = $${i++}`)
      values.push(cleanHandle)
    }

    if (fields.length === 0) {
      const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.user.profileId])
      return res.json(toProfile(result.rows[0]))
    }

    fields.push(`updated_at = now()`)
    values.push(req.user.profileId)

    const result = await pool.query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    res.json(toProfile(result.rows[0]))
  } catch (err) {
    console.error('PATCH /me error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/media/:kind', async (req, res) => {
  const column = PROFILE_MEDIA[req.params.kind]
  if (!column) return res.status(404).json({ error: 'Mídia não encontrada.' })

  try {
    const result = await pool.query(`SELECT ${column} AS stored_name FROM profiles WHERE id = $1`, [req.user.profileId])
    const storedName = result.rows[0]?.stored_name
    if (!isStoredFile(storedName)) return res.status(404).json({ error: 'Mídia não encontrada.' })
    res.sendFile(path.join(uploadDir, storedName), err => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
    })
  } catch (err) {
    console.error('GET /me/media error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/media/:kind', (req, res) => {
  const column = PROFILE_MEDIA[req.params.kind]
  if (!column) return res.status(404).json({ error: 'Mídia não encontrada.' })

  upload.single('file')(req, res, async err => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'A imagem deve ter no máximo 10 MB.'
        : 'Tipo de imagem inválido. Use JPG, PNG ou WebP.'
      return res.status(400).json({ error: message })
    }
    if (!req.file) return res.status(400).json({ error: 'Selecione uma imagem.' })

    try {
      if (!await validImage(req.file)) {
        await fs.unlink(req.file.path).catch(() => {})
        return res.status(400).json({ error: 'O conteúdo não corresponde a uma imagem válida.' })
      }
      const previous = await pool.query(`SELECT ${column} AS stored_name FROM profiles WHERE id = $1`, [req.user.profileId])
      const result = await pool.query(
        `UPDATE profiles SET ${column} = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [req.file.filename, req.user.profileId]
      )
      const oldName = previous.rows[0]?.stored_name
      if (isStoredFile(oldName)) await fs.unlink(path.join(uploadDir, oldName)).catch(() => {})
      res.json(toProfile(result.rows[0]))
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {})
      console.error('POST /me/media error:', error)
      res.status(500).json({ error: 'Não foi possível salvar a imagem.' })
    }
  })
})

router.delete('/media/:kind', async (req, res) => {
  const column = PROFILE_MEDIA[req.params.kind]
  if (!column) return res.status(404).json({ error: 'Mídia não encontrada.' })

  try {
    const previous = await pool.query(`SELECT ${column} AS stored_name FROM profiles WHERE id = $1`, [req.user.profileId])
    const result = await pool.query(
      `UPDATE profiles SET ${column} = NULL, updated_at = now() WHERE id = $1 RETURNING *`,
      [req.user.profileId]
    )
    const oldName = previous.rows[0]?.stored_name
    if (isStoredFile(oldName)) await fs.unlink(path.join(uploadDir, oldName)).catch(() => {})
    res.json(toProfile(result.rows[0]))
  } catch (err) {
    console.error('DELETE /me/media error:', err)
    res.status(500).json({ error: 'Não foi possível remover a imagem.' })
  }
})

// GET /api/me/stats
router.get('/stats', async (req, res) => {
  const pid = req.user.profileId
  try {
    const [postStats, projectStats, categoryStats, activeProject, tagStats] = await Promise.all([
      pool.query(
        `SELECT
           MIN(created_at) FILTER (WHERE is_time_capsule = false OR is_time_capsule IS NULL) AS first_entry_at,
           COUNT(*) FILTER (WHERE is_time_capsule = false OR is_time_capsule IS NULL)::int AS total_memories,
           COUNT(*) FILTER (WHERE is_time_capsule AND opened_at IS NOT NULL)::int AS opened_capsules,
           COUNT(DISTINCT created_at::date) FILTER (WHERE is_time_capsule = false OR is_time_capsule IS NULL)::int AS days_writing
         FROM posts
         WHERE profile_id = $1`,
        [pid]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS active_projects
         FROM projects
         WHERE profile_id = $1 AND status IN ('ativo', 'construindo')`,
        [pid]
      ),
      pool.query(
        `SELECT categoria, COUNT(*)::int AS count
         FROM posts
         WHERE profile_id = $1
           AND categoria IS NOT NULL
           AND (is_time_capsule = false OR is_time_capsule IS NULL)
         GROUP BY categoria
         ORDER BY count DESC
         LIMIT 1`,
        [pid]
      ),
      pool.query(
        `SELECT pr.title, pr.emoji, COUNT(p.id)::int AS post_count
         FROM projects pr
         JOIN posts p ON p.project_id = pr.id
         WHERE pr.profile_id = $1
         GROUP BY pr.id
         ORDER BY post_count DESC, pr.updated_at DESC
         LIMIT 1`,
        [pid]
      ),
      pool.query(
        `SELECT t.slug, COUNT(*)::int AS count
         FROM post_tags pt
         JOIN tags t ON t.id = pt.tag_id
         JOIN posts p ON p.id = pt.post_id
         WHERE t.profile_id = $1 AND p.profile_id = $1
         GROUP BY t.slug
         ORDER BY count DESC, t.slug
         LIMIT 5`,
        [pid]
      ),
    ])

    const p = postStats.rows[0]
    const category = categoryStats.rows[0]
    const project = activeProject.rows[0]
    res.json({
      firstEntryAt:    p.first_entry_at || null,
      totalMemories:   p.total_memories || 0,
      openedCapsules:  p.opened_capsules || 0,
      daysWriting:     p.days_writing || 0,
      activeProjects:  projectStats.rows[0]?.active_projects || 0,
      mostFrequentCategory: category ? { name: category.categoria, count: category.count } : null,
      mostActiveProject: project ? { title: project.title, emoji: project.emoji, postCount: project.post_count } : null,
      topTags: tagStats.rows.map(r => ({ tag: r.slug, count: r.count })),
    })
  } catch (err) {
    console.error('GET /me/stats error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/me/password
router.post('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter ao menos 6 caracteres.' })
    }

    const result = await pool.query('SELECT password_hash FROM profiles WHERE id = $1', [req.user.profileId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado.' })

    const ok = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta.' })

    const newHash = await bcrypt.hash(newPassword, 12)
    await pool.query(
      'UPDATE profiles SET password_hash = $1, updated_at = now() WHERE id = $2',
      [newHash, req.user.profileId]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /me/password error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
