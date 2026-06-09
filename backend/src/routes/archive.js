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
    exifData: row.exif_data || null,
    hasThumbnail: !!row.thumbnail_path,
    hasOptimized: !!row.optimized_path,
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
        END AS memory_label,
        (SELECT COUNT(*)::int FROM posts r WHERE r.parent_memory_post_id = p.id AND r.profile_id = $1) AS reflection_count
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
    res.json(result.rows.map(row => ({ ...postJson(row), label: row.memory_label, reflectionCount: Number(row.reflection_count || 0) })))
  } catch (err) {
    console.error('GET /archive/memories error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/streak', async (req, res) => {
  try {
    // Get all distinct posting dates descending
    const { rows } = await pool.query(
      `SELECT DISTINCT created_at::date AS day FROM posts
       WHERE profile_id = $1 AND (is_time_capsule = false OR is_time_capsule IS NULL)
       ORDER BY day DESC`,
      [req.user.profileId]
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = rows.map(r => new Date(r.day).setHours(0, 0, 0, 0))

    // Current streak: consecutive days ending today or yesterday
    let current = 0
    let cursor = today.valueOf()
    const DAY = 86400000
    if (days.includes(cursor) || days.includes(cursor - DAY)) {
      if (!days.includes(cursor)) cursor -= DAY
      while (days.includes(cursor)) {
        current++
        cursor -= DAY
      }
    }

    // Best streak
    let best = 0, run = 0, prev = null
    for (const d of [...days].reverse()) {
      if (prev === null || d - prev === DAY) { run++; best = Math.max(best, run) }
      else run = 1
      prev = d
    }

    res.json({ current, best, totalActiveDays: days.length })
  } catch (err) {
    console.error('GET /archive/streak error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.get('/life-map', async (req, res) => {
  try {
    const posts = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        EXTRACT(MONTH FROM created_at)::int AS month,
        COUNT(*)::int AS post_count,
        COUNT(*) FILTER (WHERE is_article)::int AS article_count,
        COUNT(*) FILTER (WHERE code_language IS NOT NULL)::int AS code_count
       FROM posts
       WHERE profile_id = $1 AND (is_time_capsule = false OR is_time_capsule IS NULL)
       GROUP BY year, month ORDER BY year DESC, month DESC`,
      [req.user.profileId]
    )
    const photos = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        EXTRACT(MONTH FROM created_at)::int AS month,
        COUNT(*)::int AS photo_count
       FROM post_attachments
       WHERE profile_id = $1 AND file_type = 'image'
       GROUP BY year, month`,
      [req.user.profileId]
    )
    const projects = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        EXTRACT(MONTH FROM created_at)::int AS month,
        COUNT(*)::int AS project_count
       FROM projects WHERE profile_id = $1
       GROUP BY year, month`,
      [req.user.profileId]
    )

    // Merge into year → months map
    const map = new Map()
    const key = (y, m) => `${y}-${m}`
    for (const r of posts.rows) {
      map.set(key(r.year, r.month), { year: r.year, month: r.month, postCount: r.post_count, articleCount: r.article_count, codeCount: r.code_count, photoCount: 0, projectCount: 0 })
    }
    for (const r of photos.rows) {
      const k = key(r.year, r.month)
      if (map.has(k)) map.get(k).photoCount = r.photo_count
      else map.set(k, { year: r.year, month: r.month, postCount: 0, articleCount: 0, codeCount: 0, photoCount: r.photo_count, projectCount: 0 })
    }
    for (const r of projects.rows) {
      const k = key(r.year, r.month)
      if (map.has(k)) map.get(k).projectCount = r.project_count
      else map.set(k, { year: r.year, month: r.month, postCount: 0, articleCount: 0, codeCount: 0, photoCount: 0, projectCount: r.project_count })
    }

    const sorted = [...map.values()].sort((a, b) => b.year - a.year || b.month - a.month)
    // Group by year
    const byYear = []
    let currentYear = null
    for (const m of sorted) {
      if (!currentYear || currentYear.year !== m.year) {
        currentYear = { year: m.year, months: [] }
        byYear.push(currentYear)
      }
      currentYear.months.push(m)
    }

    res.json(byYear)
  } catch (err) {
    console.error('GET /archive/life-map error:', err)
    res.status(500).json({ error: 'Erro interno.' })
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

router.get('/tags', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.slug, COUNT(pt.post_id)::int AS count
       FROM tags t
       LEFT JOIN post_tags pt ON pt.tag_id = t.id
       WHERE t.profile_id = $1
       GROUP BY t.id ORDER BY count DESC, t.name`,
      [req.user.profileId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('GET /archive/tags error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/tags/:tag', async (req, res) => {
  try {
    const tag = req.params.tag.replace(/^#/, '')
    const result = await pool.query(
      `SELECT p.*, c.name AS collection_name
       FROM posts p
       LEFT JOIN collections c ON c.id = p.collection_id
       WHERE p.profile_id = $1
         AND (
           EXISTS (
             SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
             WHERE pt.post_id = p.id AND t.slug = $2 AND t.profile_id = p.profile_id
           )
           OR p.content ILIKE $3
           OR p.code_content ILIKE $3
         )
       ORDER BY p.created_at DESC`,
      [req.user.profileId, tag, `%#${tag}%`]
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
