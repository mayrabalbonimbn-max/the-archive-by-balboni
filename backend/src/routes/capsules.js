const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// One-time migration: add opened_at column if not present
pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ')
  .catch(err => console.error('[capsules] migration error:', err.message))

function capsuleStatus(unlockAt, openedAt) {
  if (openedAt) return 'opened'
  if (new Date(unlockAt) <= new Date()) return 'ready'
  return 'locked'
}

// GET /api/capsules  — list all, status-sorted, content hidden until opened
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, content, article_title, type, unlock_at, created_at, opened_at
       FROM posts
       WHERE profile_id = $1 AND is_time_capsule = true
       ORDER BY
         CASE WHEN opened_at IS NULL AND unlock_at <= NOW() THEN 0 ELSE 1 END,
         CASE WHEN opened_at IS NULL THEN unlock_at END ASC NULLS LAST,
         opened_at DESC`,
      [req.user.profileId]
    )
    res.json(rows.map(r => {
      const status = capsuleStatus(r.unlock_at, r.opened_at)
      return {
        id: r.id,
        content: status === 'opened' ? r.content : null,
        articleTitle: status === 'opened' ? r.article_title : null,
        preview: status !== 'locked'
          ? (r.article_title || r.content?.slice(0, 60) || null)
          : null,
        type: r.type,
        unlockAt: r.unlock_at,
        createdAt: r.created_at,
        openedAt: r.opened_at,
        status,
      }
    }))
  } catch (err) {
    console.error('GET /capsules error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /api/capsules/:id  — single capsule (content only if opened)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, content, article_title, type, unlock_at, created_at, opened_at
       FROM posts
       WHERE id = $1 AND profile_id = $2 AND is_time_capsule = true`,
      [req.params.id, req.user.profileId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Cápsula não encontrada.' })
    const r = rows[0]
    const status = capsuleStatus(r.unlock_at, r.opened_at)
    res.json({
      id: r.id,
      content: status === 'opened' ? r.content : null,
      articleTitle: status === 'opened' ? r.article_title : null,
      preview: status !== 'locked'
        ? (r.article_title || r.content?.slice(0, 60) || null)
        : null,
      type: r.type,
      unlockAt: r.unlock_at,
      createdAt: r.created_at,
      openedAt: r.opened_at,
      status,
    })
  } catch (err) {
    console.error('GET /capsules/:id error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// PATCH /api/capsules/:id/open  — the ceremony: reveals content and marks as opened
router.patch('/:id/open', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE posts
       SET opened_at = NOW()
       WHERE id = $1
         AND profile_id = $2
         AND is_time_capsule = true
         AND unlock_at <= NOW()
         AND opened_at IS NULL
       RETURNING id, content, article_title, type, unlock_at, created_at, opened_at`,
      [req.params.id, req.user.profileId]
    )
    if (!rows.length) {
      return res.status(400).json({ error: 'Cápsula não pode ser aberta agora.' })
    }
    const r = rows[0]
    res.json({
      id: r.id,
      content: r.content,
      articleTitle: r.article_title,
      type: r.type,
      unlockAt: r.unlock_at,
      createdAt: r.created_at,
      openedAt: r.opened_at,
      status: 'opened',
    })
  } catch (err) {
    console.error('PATCH /capsules/:id/open error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// DELETE /api/capsules/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM posts WHERE id = $1 AND profile_id = $2 AND is_time_capsule = true RETURNING id`,
      [req.params.id, req.user.profileId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Cápsula não encontrada.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /capsules/:id error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

module.exports = router
