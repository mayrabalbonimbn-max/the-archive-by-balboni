const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/library
router.get('/', async (req, res) => {
  try {
    const { q, type } = req.query
    const conditions = ['a.profile_id = $1']
    const params = [req.user.profileId]
    let i = 2

    if (q && q.trim()) {
      conditions.push(`a.original_name ILIKE $${i++}`)
      params.push(`%${q.trim()}%`)
    }
    if (type && type !== 'all') {
      conditions.push(`a.file_type = $${i++}`)
      params.push(type)
    }

    const result = await pool.query(
      `SELECT
         a.id, a.post_id, a.original_name, a.title, a.description, a.mime_type, a.size, a.file_type, a.visibility, a.created_at,
         p.content AS post_content, p.created_at AS post_created_at,
         p.is_article, p.article_title
       FROM post_attachments a
       JOIN posts p ON a.post_id = p.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.created_at DESC`,
      params
    )

    res.json(result.rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      originalName: row.original_name,
      title: row.title,
      description: row.description || '',
      mimeType: row.mime_type,
      size: row.size,
      fileType: row.file_type,
      visibility: row.visibility,
      createdAt: row.created_at,
      postContent: row.post_content,
      postCreatedAt: row.post_created_at,
      isArticle: row.is_article,
      articleTitle: row.article_title,
    })))
  } catch (err) {
    console.error('GET /library error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
