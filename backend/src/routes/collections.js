const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { normalizeVisibility } = require('../utils/social')

const router = express.Router()
router.use(requireAuth)

function toCollection(row) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    visibility: row.visibility || 'private',
    postCount: parseInt(row.post_count || 0),
    createdAt: row.created_at,
  }
}

// GET /api/collections
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(p.id) AS post_count
       FROM collections c
       LEFT JOIN posts p ON p.collection_id = c.id AND p.profile_id = c.profile_id
       WHERE c.profile_id = $1
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toCollection))
  } catch (err) {
    console.error('GET /collections error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// POST /api/collections
router.post('/', async (req, res) => {
  try {
    const { name, emoji, color, visibility } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome obrigatório.' })
    const cleanVisibility = normalizeVisibility(visibility)
    const result = await pool.query(
      `INSERT INTO collections (profile_id, name, emoji, color, visibility)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *, 0 AS post_count`,
      [req.user.profileId, name.trim().slice(0, 100), emoji || '📁', color || '#6366f1', cleanVisibility]
    )
    res.status(201).json(toCollection(result.rows[0]))
  } catch (err) {
    console.error('POST /collections error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// PATCH /api/collections/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, emoji, color, visibility } = req.body
    const fields = []
    const values = []
    let i = 1

    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name.trim().slice(0, 100)) }
    if (emoji !== undefined) { fields.push(`emoji = $${i++}`); values.push(emoji) }
    if (color !== undefined) { fields.push(`color = $${i++}`); values.push(color) }
    if (visibility !== undefined) { fields.push(`visibility = $${i++}`); values.push(normalizeVisibility(visibility)) }

    if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar.' })

    fields.push(`updated_at = now()`)
    values.push(id, req.user.profileId)

    const result = await pool.query(
      `UPDATE collections SET ${fields.join(', ')}
       WHERE id = $${i} AND profile_id = $${i + 1}
       RETURNING *, (SELECT COUNT(*) FROM posts WHERE collection_id = $${i}) AS post_count`,
      values
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Coleção não encontrada.' })
    res.json(toCollection(result.rows[0]))
  } catch (err) {
    console.error('PATCH /collections/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// DELETE /api/collections/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    // Unlink posts from this collection before deleting
    await pool.query(
      'UPDATE posts SET collection_id = NULL WHERE collection_id = $1 AND profile_id = $2',
      [id, req.user.profileId]
    )
    const result = await pool.query(
      'DELETE FROM collections WHERE id = $1 AND profile_id = $2',
      [id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Coleção não encontrada.' })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /collections/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
