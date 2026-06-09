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

// GET /api/collections/:id/posts
router.get('/:id/posts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
         (SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', a.id, 'postId', a.post_id, 'originalName', a.original_name,
           'title', a.title, 'mimeType', a.mime_type, 'size', a.size,
           'fileType', a.file_type, 'visibility', a.visibility, 'createdAt', a.created_at
         ) ORDER BY a.created_at, a.id) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb)
          FROM post_attachments a WHERE a.post_id = p.id AND a.profile_id = p.profile_id) AS attachments
       FROM posts p
       JOIN collections c ON c.id = $2 AND c.profile_id = $1
       WHERE p.collection_id = $2 AND p.profile_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.profileId, req.params.id]
    )
    res.json(result.rows.map(row => ({
      id: row.id,
      profileId: row.profile_id,
      content: row.content,
      type: row.type,
      isDiary: row.is_diary,
      isPrivate: row.is_private,
      visibility: row.visibility,
      isArticle: row.is_article || false,
      articleTitle: row.article_title || null,
      collectionId: row.collection_id || null,
      codeBlock: row.code_language ? { language: row.code_language, code: row.code_content || '' } : null,
      attachments: row.attachments || [],
      liked: false,
      likeCount: 0,
      saved: false,
      commentCount: 0,
      pinned: row.pinned,
      createdAt: row.created_at,
      author: null,
    })))
  } catch (err) {
    console.error('GET /collections/:id/posts error:', err)
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
