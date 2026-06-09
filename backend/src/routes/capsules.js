const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, content, article_title, type, unlock_at, created_at
       FROM posts
       WHERE profile_id = $1 AND is_time_capsule = true
       ORDER BY unlock_at ASC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(r => ({
      id: r.id,
      content: r.content,
      articleTitle: r.article_title,
      type: r.type,
      unlockAt: r.unlock_at,
      createdAt: r.created_at,
    })))
  } catch (err) {
    console.error('GET /capsules error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM posts WHERE id = $1 AND profile_id = $2 AND is_time_capsule = true RETURNING id`,
      [req.params.id, req.user.profileId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cápsula não encontrada.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /capsules/:id error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

module.exports = router
