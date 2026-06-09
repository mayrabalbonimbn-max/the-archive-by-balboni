const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9À-ɏ_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

function tagJson(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    count: Number(row.count || 0),
    createdAt: row.created_at,
  }
}

// GET /api/tags — all tags for user with post count
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, COUNT(pt.post_id)::int AS count
       FROM tags t
       LEFT JOIN post_tags pt ON pt.tag_id = t.id
       WHERE t.profile_id = $1
       GROUP BY t.id
       ORDER BY count DESC, t.name`,
      [req.user.profileId]
    )
    res.json(result.rows.map(tagJson))
  } catch (err) { next(err) }
})

// POST /api/tags — create or return existing tag
router.post('/', async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim().slice(0, 50)
    if (!name) return res.status(400).json({ error: 'Nome da tag é obrigatório.' })
    const slug = slugify(name)
    if (!slug) return res.status(400).json({ error: 'Nome de tag inválido.' })

    const result = await pool.query(
      `INSERT INTO tags (profile_id, name, slug)
       VALUES ($1, $2, $3)
       ON CONFLICT (profile_id, slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [req.user.profileId, name, slug]
    )
    res.status(201).json(tagJson(result.rows[0]))
  } catch (err) { next(err) }
})

// DELETE /api/tags/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM tags WHERE id = $1 AND profile_id = $2',
      [req.params.id, req.user.profileId]
    )
    res.status(204).send()
  } catch (err) { next(err) }
})

// PUT /api/tags/post/:postId — set tags for a post (replaces all)
router.put('/post/:postId', async (req, res, next) => {
  const client = await pool.connect()
  try {
    // Verify post ownership
    const post = await client.query(
      'SELECT id FROM posts WHERE id = $1 AND profile_id = $2',
      [req.params.postId, req.user.profileId]
    )
    if (post.rowCount === 0) return res.status(404).json({ error: 'Post não encontrado.' })

    const slugs = (Array.isArray(req.body.tags) ? req.body.tags : [])
      .map(s => slugify(String(s)))
      .filter(Boolean)
      .slice(0, 10)

    await client.query('BEGIN')

    // Remove existing
    await client.query('DELETE FROM post_tags WHERE post_id = $1', [req.params.postId])

    if (slugs.length > 0) {
      // Upsert tags and link
      for (const slug of slugs) {
        const name = req.body.names?.[slug] || slug
        const tag = await client.query(
          `INSERT INTO tags (profile_id, name, slug)
           VALUES ($1, $2, $3)
           ON CONFLICT (profile_id, slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [req.user.profileId, name, slug]
        )
        await client.query(
          'INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.postId, tag.rows[0].id]
        )
      }
    }

    await client.query('COMMIT')

    const updated = await pool.query(
      `SELECT t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = $1 ORDER BY t.slug`,
      [req.params.postId]
    )
    res.json(updated.rows.map(r => r.slug))
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    next(err)
  } finally {
    client.release()
  }
})

router.use((err, req, res, next) => {
  console.error('tags error:', err)
  if (!res.headersSent) res.status(500).json({ error: 'Erro interno do servidor.' })
})

module.exports = router
