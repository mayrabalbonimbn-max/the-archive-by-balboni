const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function postJson(row) {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    isArticle: row.is_article,
    articleTitle: row.article_title,
    codeLanguage: row.code_language,
    createdAt: row.created_at,
    collectionName: row.collection_name || null,
    itemType: row.item_type || (row.is_article ? 'article' : row.code_language ? 'code' : 'post'),
  }
}

function fileJson(row) {
  return {
    id: row.id,
    postId: row.post_id,
    title: row.title,
    originalName: row.original_name,
    fileType: row.file_type,
    mimeType: row.mime_type,
    size: Number(row.size || 0),
    createdAt: row.created_at,
    postContent: row.post_content || '',
    articleTitle: row.article_title || null,
  }
}

function extractTags(text = '') {
  return [...new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map(tag => tag.slice(1).toLowerCase()))]
}

function extractLinks(text = '') {
  return [...new Set([...text.matchAll(/\[\[([^\]]{1,100})\]\]/g)].map(match => match[1].trim()).filter(Boolean))]
}

router.get('/memories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS collection_name,
        CASE
          WHEN p.created_at::date = (CURRENT_DATE - INTERVAL '1 year')::date THEN 'Há 1 ano'
          WHEN p.created_at::date = (CURRENT_DATE - INTERVAL '2 years')::date THEN 'Há 2 anos'
          WHEN p.created_at::date = (CURRENT_DATE - INTERVAL '3 years')::date THEN 'Há 3 anos'
          WHEN EXTRACT(WEEK FROM p.created_at) = EXTRACT(WEEK FROM CURRENT_DATE)
               AND EXTRACT(YEAR FROM p.created_at) < EXTRACT(YEAR FROM CURRENT_DATE) THEN 'Mesma semana'
          WHEN EXTRACT(MONTH FROM p.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
               AND EXTRACT(YEAR FROM p.created_at) < EXTRACT(YEAR FROM CURRENT_DATE) THEN 'Mesmo mês'
          ELSE NULL
        END AS memory_label
       FROM posts p
       LEFT JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1
         AND (
          p.created_at::date IN ((CURRENT_DATE - INTERVAL '1 year')::date, (CURRENT_DATE - INTERVAL '2 years')::date, (CURRENT_DATE - INTERVAL '3 years')::date)
          OR (EXTRACT(WEEK FROM p.created_at) = EXTRACT(WEEK FROM CURRENT_DATE) AND EXTRACT(YEAR FROM p.created_at) < EXTRACT(YEAR FROM CURRENT_DATE))
          OR (EXTRACT(MONTH FROM p.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM p.created_at) < EXTRACT(YEAR FROM CURRENT_DATE))
         )
       ORDER BY p.created_at DESC
       LIMIT 60`,
      [req.user.profileId]
    )
    res.json(result.rows.map(row => ({ ...postJson(row), label: row.memory_label })))
  } catch (err) {
    console.error('GET /archive/memories error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/calendar', async (req, res) => {
  try {
    const posts = await pool.query(
      `SELECT date_trunc('month', created_at) AS month, COUNT(*)::int AS count
       FROM posts WHERE profile_id = $1
       GROUP BY month ORDER BY month DESC`,
      [req.user.profileId]
    )
    res.json(posts.rows.map(row => ({ month: row.month, count: row.count })))
  } catch (err) {
    console.error('GET /archive/calendar error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const start = `${req.params.year}-${String(req.params.month).padStart(2, '0')}-01`
    const result = await pool.query(
      `SELECT p.*, c.name AS collection_name
       FROM posts p
       LEFT JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1
         AND p.created_at >= $2::date
         AND p.created_at < ($2::date + INTERVAL '1 month')
       ORDER BY p.created_at DESC`,
      [req.user.profileId, start]
    )
    const files = await pool.query(
      `SELECT a.*, p.content AS post_content, p.article_title
       FROM post_attachments a
       JOIN posts p ON p.id = a.post_id
       WHERE a.profile_id = $1
         AND a.created_at >= $2::date
         AND a.created_at < ($2::date + INTERVAL '1 month')
       ORDER BY a.created_at DESC`,
      [req.user.profileId, start]
    )
    res.json({ posts: result.rows.map(postJson), files: files.rows.map(fileJson) })
  } catch (err) {
    console.error('GET /archive/calendar/:year/:month error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE p.created_at::date = CURRENT_DATE)::int AS posts_today,
        COUNT(*) FILTER (WHERE p.is_article AND p.created_at::date = CURRENT_DATE)::int AS articles_today,
        COUNT(*) FILTER (WHERE p.code_language IS NOT NULL AND p.created_at::date = CURRENT_DATE)::int AS codes_today,
        (SELECT COUNT(*)::int FROM post_attachments a WHERE a.profile_id = $1 AND a.created_at::date = CURRENT_DATE AND a.file_type = 'pdf') AS pdfs_today,
        (SELECT COUNT(*)::int FROM post_attachments a WHERE a.profile_id = $1 AND a.created_at::date = CURRENT_DATE AND a.file_type = 'image') AS images_today,
        (SELECT COUNT(DISTINCT created_at::date)::int FROM posts WHERE profile_id = $1) AS active_days
       FROM posts p WHERE p.profile_id = $1`,
      [req.user.profileId]
    )
    const latest = await pool.query(
      `SELECT content, article_title, created_at FROM posts WHERE profile_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.profileId]
    )
    const collection = await pool.query(
      `SELECT c.name, COUNT(*)::int AS count
       FROM posts p JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1
       GROUP BY c.id ORDER BY count DESC LIMIT 1`,
      [req.user.profileId]
    )
    res.json({ ...result.rows[0], latest: latest.rows[0] || null, topCollection: collection.rows[0] || null })
  } catch (err) {
    console.error('GET /archive/today error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS posts,
        COUNT(*) FILTER (WHERE is_article)::int AS articles,
        COUNT(*) FILTER (WHERE code_language IS NOT NULL)::int AS codes,
        COUNT(DISTINCT created_at::date)::int AS active_days,
        MIN(created_at) AS first_post
       FROM posts WHERE profile_id = $1`,
      [req.user.profileId]
    )
    const files = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE file_type = 'pdf')::int AS pdfs,
        COUNT(*) FILTER (WHERE file_type = 'image')::int AS images
       FROM post_attachments WHERE profile_id = $1`,
      [req.user.profileId]
    )
    const topCollection = await pool.query(
      `SELECT c.name, COUNT(*)::int AS count
       FROM posts p JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1 GROUP BY c.id ORDER BY count DESC LIMIT 1`,
      [req.user.profileId]
    )
    const all = await pool.query('SELECT content, code_content FROM posts WHERE profile_id = $1', [req.user.profileId])
    const tagCounts = new Map()
    all.rows.forEach(row => {
      extractTags(`${row.content || ''} ${row.code_content || ''}`).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1))
    })
    res.json({
      ...result.rows[0],
      ...files.rows[0],
      topCollection: topCollection.rows[0] || null,
      topTags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tag, count]) => ({ tag, count })),
    })
  } catch (err) {
    console.error('GET /archive/stats error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json({ posts: [], files: [], collections: [], users: [], tags: [], backlinks: [] })
    const like = `%${q}%`
    const [posts, files, collections, users] = await Promise.all([
      pool.query(
        `SELECT p.*, c.name AS collection_name
         FROM posts p LEFT JOIN collections c ON c.id = p.collection_id
         WHERE p.profile_id = $1 AND (p.content ILIKE $2 OR p.article_title ILIKE $2 OR p.code_content ILIKE $2)
         ORDER BY p.created_at DESC LIMIT 12`,
        [req.user.profileId, like]
      ),
      pool.query(
        `SELECT a.*, p.content AS post_content, p.article_title
         FROM post_attachments a JOIN posts p ON p.id = a.post_id
         WHERE a.profile_id = $1 AND (a.original_name ILIKE $2 OR a.title ILIKE $2 OR a.description ILIKE $2)
         ORDER BY a.created_at DESC LIMIT 12`,
        [req.user.profileId, like]
      ),
      pool.query('SELECT * FROM collections WHERE profile_id = $1 AND name ILIKE $2 ORDER BY created_at DESC LIMIT 8', [req.user.profileId, like]),
      pool.query('SELECT id, name, handle, avatar FROM profiles WHERE id != $1 AND (name ILIKE $2 OR handle ILIKE $2) ORDER BY name LIMIT 8', [req.user.profileId, like]),
    ])
    const tagRows = await pool.query('SELECT id, content, code_content, created_at FROM posts WHERE profile_id = $1 ORDER BY created_at DESC LIMIT 500', [req.user.profileId])
    const tags = []
    const backlinks = []
    tagRows.rows.forEach(row => {
      extractTags(`${row.content || ''} ${row.code_content || ''}`).forEach(tag => {
        if (tag.includes(q.replace(/^#/, '').toLowerCase())) tags.push({ tag, postId: row.id, createdAt: row.created_at })
      })
      extractLinks(row.content || '').forEach(link => {
        if (link.toLowerCase().includes(q.toLowerCase())) backlinks.push({ title: link, postId: row.id, createdAt: row.created_at })
      })
    })
    res.json({
      posts: posts.rows.map(postJson),
      files: files.rows.map(fileJson),
      collections: collections.rows,
      users: users.rows,
      tags: tags.slice(0, 12),
      backlinks: backlinks.slice(0, 12),
    })
  } catch (err) {
    console.error('GET /archive/search error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/photos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.content AS post_content, p.article_title
       FROM post_attachments a
       JOIN posts p ON p.id = a.post_id
       WHERE a.profile_id = $1 AND a.file_type = 'image'
       ORDER BY a.created_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(fileJson))
  } catch (err) {
    console.error('GET /archive/photos error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/tags/:tag', async (req, res) => {
  try {
    const tag = req.params.tag.replace(/^#/, '')
    const result = await pool.query(
      `SELECT p.*, c.name AS collection_name
       FROM posts p LEFT JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1 AND (p.content ILIKE $2 OR p.code_content ILIKE $2)
       ORDER BY p.created_at DESC`,
      [req.user.profileId, `%#${tag}%`]
    )
    res.json(result.rows.map(postJson))
  } catch (err) {
    console.error('GET /archive/tags/:tag error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/backlinks/:title', async (req, res) => {
  try {
    const title = req.params.title
    const result = await pool.query(
      `SELECT p.*, c.name AS collection_name
       FROM posts p LEFT JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1 AND p.content ILIKE $2
       ORDER BY p.created_at DESC`,
      [req.user.profileId, `%[[${title}]]%`]
    )
    res.json({ title, posts: result.rows.map(postJson) })
  } catch (err) {
    console.error('GET /archive/backlinks/:title error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
