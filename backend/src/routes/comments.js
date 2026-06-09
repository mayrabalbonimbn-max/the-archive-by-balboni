const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { visibleSql } = require('../utils/social')
const { sendPushToUser } = require('../utils/push')

const router = express.Router()
router.use(requireAuth)

const MAX_COMMENT_LENGTH = 2000

function toReply(row) {
  return {
    id: row.id,
    commentId: row.comment_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: { id: row.author_id, name: row.author_name, handle: row.author_handle, avatar: row.author_avatar },
    canEdit: row.author_id === row.viewer_id,
  }
}

function toComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: { id: row.author_id, name: row.author_name, handle: row.author_handle, avatar: row.author_avatar },
    canEdit: row.author_id === row.viewer_id,
    replies: row.replies || [],
  }
}

async function visiblePost(postId, viewerId) {
  const result = await pool.query(
    `SELECT p.*, owner.name AS owner_name
     FROM posts p
     JOIN profiles owner ON owner.id = p.profile_id
     WHERE p.id = $1 AND ${visibleSql('p').replaceAll('$1', '$2')}`,
    [postId, viewerId]
  )
  return result.rows[0] || null
}

async function notify(profileId, actorId, type, message, postId, commentId = null) {
  if (!profileId || profileId === actorId) return
  await pool.query(
    `INSERT INTO notifications (profile_id, actor_id, post_id, comment_id, type, message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [profileId, actorId, postId, commentId, type, message]
  )
}

router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const post = await visiblePost(req.params.postId, req.user.profileId)
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' })
    const result = await pool.query(
      `SELECT c.*, $2::uuid AS viewer_id,
        author.name AS author_name, author.handle AS author_handle, author.avatar AS author_avatar,
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', r.id,
            'commentId', r.comment_id,
            'content', r.content,
            'createdAt', r.created_at,
            'updatedAt', r.updated_at,
            'canEdit', r.author_id = $2,
            'author', jsonb_build_object('id', ra.id, 'name', ra.name, 'handle', ra.handle, 'avatar', ra.avatar)
          ) ORDER BY r.created_at ASC)
          FROM comment_replies r
          JOIN profiles ra ON ra.id = r.author_id
          WHERE r.comment_id = c.id
        ), '[]'::jsonb) AS replies
       FROM comments c
       JOIN profiles author ON author.id = c.author_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.postId, req.user.profileId]
    )
    res.json(result.rows.map(toComment))
  } catch (err) {
    console.error('GET /comments error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const content = (req.body.content || '').trim()
    if (!content) return res.status(400).json({ error: 'Comentário vazio.' })
    if (content.length > MAX_COMMENT_LENGTH) return res.status(400).json({ error: 'Comentário muito longo.' })
    const post = await visiblePost(req.params.postId, req.user.profileId)
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' })
    const result = await pool.query(
      `INSERT INTO comments (post_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.postId, req.user.profileId, content]
    )
    const author = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
    const msg = `${author.rows[0]?.name || 'Alguém'} comentou seu post.`
    await notify(post.profile_id, req.user.profileId, 'comment', msg, post.id, result.rows[0].id)
    sendPushToUser(post.profile_id, { title: 'The Archive', body: msg, url: `/posts/${post.id}`, tag: `comment-${post.id}` }).catch(() => {})
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('POST /comments error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.patch('/comments/:id', async (req, res) => {
  try {
    const content = (req.body.content || '').trim()
    if (!content) return res.status(400).json({ error: 'Comentário vazio.' })
    const result = await pool.query(
      `UPDATE comments SET content = $1, updated_at = now()
       WHERE id = $2 AND author_id = $3
       RETURNING *`,
      [content.slice(0, MAX_COMMENT_LENGTH), req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Comentário não encontrado.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('PATCH /comments/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.delete('/comments/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM comments WHERE id = $1 AND author_id = $2', [req.params.id, req.user.profileId])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Comentário não encontrado.' })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /comments/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.post('/comments/:id/replies', async (req, res) => {
  try {
    const content = (req.body.content || '').trim()
    if (!content) return res.status(400).json({ error: 'Resposta vazia.' })
    if (content.length > MAX_COMMENT_LENGTH) return res.status(400).json({ error: 'Resposta muito longa.' })
    const comment = await pool.query(
      `SELECT c.*, p.profile_id AS post_owner_id
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.id = $1 AND ${visibleSql('p').replaceAll('$1', '$2')}`,
      [req.params.id, req.user.profileId]
    )
    if (comment.rowCount === 0) return res.status(404).json({ error: 'Comentário não encontrado.' })
    const result = await pool.query(
      `INSERT INTO comment_replies (comment_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.user.profileId, content]
    )
    const author = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
    const replyMsg = `${author.rows[0]?.name || 'Alguém'} respondeu seu comentário.`
    await notify(comment.rows[0].author_id, req.user.profileId, 'reply', replyMsg, comment.rows[0].post_id, req.params.id)
    sendPushToUser(comment.rows[0].author_id, { title: 'The Archive', body: replyMsg, url: `/posts/${comment.rows[0].post_id}`, tag: `reply-${req.params.id}` }).catch(() => {})
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('POST /comments/:id/replies error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.patch('/replies/:id', async (req, res) => {
  try {
    const content = (req.body.content || '').trim()
    if (!content) return res.status(400).json({ error: 'Resposta vazia.' })
    const result = await pool.query(
      `UPDATE comment_replies SET content = $1, updated_at = now()
       WHERE id = $2 AND author_id = $3
       RETURNING *`,
      [content.slice(0, MAX_COMMENT_LENGTH), req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Resposta não encontrada.' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('PATCH /replies/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.delete('/replies/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM comment_replies WHERE id = $1 AND author_id = $2', [req.params.id, req.user.profileId])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Resposta não encontrada.' })
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /replies/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
