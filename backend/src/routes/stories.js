const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs/promises')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')

const imageTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdir(uploadDir, { recursive: true }).then(() => cb(null, uploadDir)).catch(cb)
    },
    filename(req, file, cb) {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!imageTypes[ext]) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'))
    file.canonicalMimeType = imageTypes[ext]
    cb(null, true)
  },
})

function toStory(row, myProfileId) {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.type,
    content: row.content || null,
    bgColor: row.bg_color || '#0a0a0a',
    fontStyle: row.font_style || 'serif',
    hasMedia: Boolean(row.media_path),
    visibility: row.visibility,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    mine: row.profile_id === myProfileId,
    authorName: row.author_name || '',
    authorHandle: row.author_handle || '',
    authorAvatarRaw: row.author_avatar || null,
    viewed: Boolean(row.viewed),
  }
}

router.use(requireAuth)

// GET /api/stories/archive — own stories, all time (must come before /:id)
router.get('/archive', async (req, res) => {
  const pid = req.user.profileId
  try {
    const result = await pool.query(`
      SELECT s.*,
        p.name AS author_name, p.handle AS author_handle, p.avatar AS author_avatar,
        true AS viewed
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE s.profile_id = $1
      ORDER BY s.created_at DESC
    `, [pid])
    res.json(result.rows.map(r => toStory(r, pid)))
  } catch (err) {
    console.error('GET /stories/archive error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /api/stories — active feed (self + friends + following)
router.get('/', async (req, res) => {
  const pid = req.user.profileId
  try {
    const result = await pool.query(`
      SELECT s.*,
        p.name AS author_name, p.handle AS author_handle, p.avatar AS author_avatar,
        (sv.viewer_id IS NOT NULL) AS viewed
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      LEFT JOIN story_views sv ON sv.story_id = s.id AND sv.viewer_id = $1
      WHERE s.expires_at > NOW()
        AND (
          s.profile_id = $1
          OR (
            s.visibility IN ('public', 'friends')
            AND EXISTS (
              SELECT 1 FROM friendships f
              WHERE f.status = 'accepted'
                AND (
                  (f.requester_id = $1 AND f.receiver_id = s.profile_id)
                  OR (f.receiver_id = $1 AND f.requester_id = s.profile_id)
                )
            )
          )
          OR (
            s.visibility = 'public'
            AND EXISTS (
              SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.following_id = s.profile_id
            )
          )
        )
      ORDER BY (s.profile_id = $1) DESC, s.created_at ASC
    `, [pid])
    res.json(result.rows.map(r => toStory(r, pid)))
  } catch (err) {
    console.error('GET /stories error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/stories — create (photo via multipart, text via JSON)
router.post('/', upload.single('file'), async (req, res) => {
  const pid = req.user.profileId
  try {
    const { type, content, bgColor, fontStyle, visibility = 'friends' } = req.body
    const storyType = req.file ? 'photo' : (type || 'text')
    const mediaPath = req.file ? req.file.filename : null

    if (storyType === 'text' && !content?.trim()) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório para story de texto.' })
    }
    if (storyType === 'photo' && !mediaPath) {
      return res.status(400).json({ error: 'Arquivo é obrigatório para story de foto.' })
    }

    const validVisibility = ['public', 'friends', 'private'].includes(visibility) ? visibility : 'friends'

    const result = await pool.query(`
      INSERT INTO stories (profile_id, type, content, media_path, bg_color, font_style, visibility, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '24 hours')
      RETURNING *
    `, [pid, storyType, content?.trim() || null, mediaPath, bgColor || '#0a0a0a', fontStyle || 'serif', validVisibility])

    const row = result.rows[0]
    const pRes = await pool.query('SELECT name, handle, avatar FROM profiles WHERE id = $1', [pid])
    const p = pRes.rows[0] || {}

    res.status(201).json(toStory({ ...row, author_name: p.name, author_handle: p.handle, author_avatar: p.avatar, viewed: true }, pid))
  } catch (err) {
    if (req.file) fs.unlink(path.join(uploadDir, req.file.filename)).catch(() => {})
    console.error('POST /stories error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /api/stories/:id/media
router.get('/:id/media', async (req, res) => {
  const pid = req.user.profileId
  try {
    const result = await pool.query(
      'SELECT media_path, profile_id, expires_at FROM stories WHERE id = $1',
      [req.params.id]
    )
    if (!result.rows.length || !result.rows[0].media_path)
      return res.status(404).json({ error: 'Mídia não encontrada.' })

    const { media_path, profile_id, expires_at } = result.rows[0]
    const isOwn = profile_id === pid
    const isActive = new Date(expires_at) > new Date()
    if (!isOwn && !isActive) return res.status(404).json({ error: 'Story expirado.' })

    res.sendFile(path.join(uploadDir, media_path), err => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado.' })
    })
  } catch (err) {
    console.error('GET /stories/:id/media error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/stories/:id/view
router.post('/:id/view', async (req, res) => {
  const pid = req.user.profileId
  try {
    await pool.query(
      'INSERT INTO story_views (story_id, viewer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, pid]
    )
    res.status(204).end()
  } catch (err) {
    console.error('POST /stories/:id/view error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// DELETE /api/stories/:id
router.delete('/:id', async (req, res) => {
  const pid = req.user.profileId
  try {
    const result = await pool.query(
      'DELETE FROM stories WHERE id = $1 AND profile_id = $2 RETURNING media_path',
      [req.params.id, pid]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Story não encontrado.' })
    const { media_path } = result.rows[0]
    if (media_path) fs.unlink(path.join(uploadDir, media_path)).catch(() => {})
    res.status(204).end()
  } catch (err) {
    console.error('DELETE /stories/:id error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

module.exports = router
