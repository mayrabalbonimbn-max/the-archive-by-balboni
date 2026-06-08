const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, actor.name AS actor_name, actor.handle AS actor_handle, actor.avatar AS actor_avatar
       FROM notifications n
       LEFT JOIN profiles actor ON actor.id = n.actor_id
       WHERE n.profile_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.profileId]
    )
    res.json(result.rows.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      postId: row.post_id,
      commentId: row.comment_id,
      readAt: row.read_at,
      createdAt: row.created_at,
      actor: row.actor_id ? {
        id: row.actor_id,
        name: row.actor_name,
        handle: row.actor_handle,
        avatar: row.actor_avatar,
      } : null,
    })))
  } catch (err) {
    console.error('GET /notifications error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.patch('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET read_at = COALESCE(read_at, now())
       WHERE id = $1 AND profile_id = $2
       RETURNING id, read_at`,
      [req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Notificação não encontrada.' })
    res.json({ id: result.rows[0].id, readAt: result.rows[0].read_at })
  } catch (err) {
    console.error('PATCH /notifications/:id/read error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE profile_id = $1', [req.user.profileId])
    res.json({ ok: true })
  } catch (err) {
    console.error('POST /notifications/read-all error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
