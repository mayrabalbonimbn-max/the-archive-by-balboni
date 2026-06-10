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

    // daysInArchive: calendar days from first entry to today, inclusive.
    // Calculated server-side to avoid browser timezone issues.
    let daysInArchive = null
    if (days.length > 0) {
      const firstDay = Math.min(...days)
      daysInArchive = Math.floor((today.valueOf() - firstDay) / 86400000) + 1
    }

    res.json({ current, best, totalActiveDays: days.length, daysInArchive })
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
    const topCategory = await pool.query(
      `SELECT categoria AS name, COUNT(*)::int AS count
       FROM posts
       WHERE profile_id = $1 AND categoria IS NOT NULL
       GROUP BY categoria
       ORDER BY count DESC, categoria ASC
       LIMIT 1`,
      [req.user.profileId]
    )
    const topMonth = await pool.query(
      `SELECT date_trunc('month', created_at) AS month, COUNT(*)::int AS count
       FROM posts
       WHERE profile_id = $1
       GROUP BY month
       ORDER BY count DESC, month DESC
       LIMIT 1`,
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
      topCategory: topCategory.rows[0] || null,
      topMonth: topMonth.rows[0] || null,
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

    // Build a safe tsquery — websearch_to_tsquery never throws on bad input
    const [posts, files, collections, users] = await Promise.all([
      pool.query(
        `SELECT p.*, c.name AS collection_name,
            ts_rank(
              to_tsvector('portuguese', coalesce(p.article_title,'') || ' ' || coalesce(p.content,'')),
              websearch_to_tsquery('portuguese', $2)
            ) AS rank,
            ts_headline(
              'portuguese',
              coalesce(p.content, p.article_title, ''),
              websearch_to_tsquery('portuguese', $2),
              'StartSel=<<<, StopSel=>>>, MaxWords=25, MinWords=10, MaxFragments=1, FragmentDelimiter= … '
            ) AS excerpt
         FROM posts p
         LEFT JOIN collections c ON c.id = p.collection_id
         WHERE p.profile_id = $1
           AND to_tsvector('portuguese', coalesce(p.article_title,'') || ' ' || coalesce(p.content,''))
               @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY rank DESC, p.created_at DESC LIMIT 12`,
        [req.user.profileId, q]
      ),
      pool.query(
        `SELECT a.*, p.content AS post_content, p.article_title,
            ts_rank(
              to_tsvector('portuguese', coalesce(a.title,'') || ' ' || coalesce(a.original_name,'') || ' ' || coalesce(a.description,'')),
              websearch_to_tsquery('portuguese', $2)
            ) AS rank
         FROM post_attachments a
         JOIN posts p ON p.id = a.post_id
         WHERE a.profile_id = $1
           AND to_tsvector('portuguese', coalesce(a.title,'') || ' ' || coalesce(a.original_name,'') || ' ' || coalesce(a.description,''))
               @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY rank DESC, a.created_at DESC LIMIT 8`,
        [req.user.profileId, q]
      ),
      pool.query(
        `SELECT *,
            ts_rank(to_tsvector('portuguese', name), websearch_to_tsquery('portuguese', $2)) AS rank
         FROM collections
         WHERE profile_id = $1
           AND to_tsvector('portuguese', name) @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY rank DESC LIMIT 6`,
        [req.user.profileId, q]
      ),
      pool.query(
        `SELECT id, name, handle, avatar FROM profiles
         WHERE id != $1 AND (name ILIKE $2 OR handle ILIKE $2)
         ORDER BY name LIMIT 6`,
        [req.user.profileId, `%${q}%`]
      ),
    ])

    const tagRows = await pool.query(
      'SELECT id, content, code_content, created_at FROM posts WHERE profile_id = $1 ORDER BY created_at DESC LIMIT 500',
      [req.user.profileId]
    )
    const qLower = q.replace(/^#/, '').toLowerCase()
    const tags = []
    const backlinks = []
    tagRows.rows.forEach(row => {
      extractTags(`${row.content || ''} ${row.code_content || ''}`).forEach(tag => {
        if (tag.includes(qLower)) tags.push({ tag, postId: row.id, createdAt: row.created_at })
      })
      extractLinks(row.content || '').forEach(link => {
        if (link.toLowerCase().includes(q.toLowerCase())) backlinks.push({ title: link, postId: row.id, createdAt: row.created_at })
      })
    })

    res.json({
      posts: posts.rows.map(row => ({ ...postJson(row), excerpt: row.excerpt || null, rank: row.rank })),
      files: files.rows.map(row => ({ ...fileJson(row), rank: row.rank })),
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

router.get('/videos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.content AS post_content, p.article_title, p.id AS post_id_full
       FROM post_attachments a
       JOIN posts p ON p.id = a.post_id
       WHERE a.profile_id = $1 AND a.file_type = 'video'
       ORDER BY a.created_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(fileJson))
  } catch (err) {
    console.error('GET /archive/videos error:', err)
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

// GET /archive/graph
router.get('/graph', async (req, res) => {
  try {
    const pid = req.user.profileId
    const postsRes = await pool.query(
      `SELECT id, type, is_article, code_language, content, created_at, project_id, collection_id, article_title
       FROM posts WHERE profile_id=$1 ORDER BY created_at DESC LIMIT 150`,
      [pid]
    )
    const projectsRes = await pool.query(
      `SELECT id, title, emoji, status FROM projects WHERE profile_id=$1`,
      [pid]
    )
    const collectionsRes = await pool.query(
      `SELECT id, name, emoji FROM collections WHERE profile_id=$1`,
      [pid]
    )

    const nodes = []
    const links = []
    const tagSet = new Map()

    for (const row of postsRes.rows) {
      const group = row.is_article ? 'article' : row.code_language ? 'code' : 'post'
      nodes.push({
        id: row.id,
        type: row.is_article ? 'article' : 'post',
        label: (row.article_title || (row.content || '').slice(0, 50)).trim(),
        group,
        createdAt: row.created_at,
      })
      if (row.project_id) links.push({ source: row.id, target: row.project_id, kind: 'project' })
      if (row.collection_id) links.push({ source: row.id, target: row.collection_id, kind: 'collection' })

      const tagMatches = (row.content || '').match(/#[\p{L}\p{N}_-]+/gu) || []
      for (const tag of tagMatches) {
        const name = tag.slice(1)
        if (!tagSet.has(name)) tagSet.set(name, 0)
        tagSet.set(name, tagSet.get(name) + 1)
        links.push({ source: row.id, target: 'tag:' + name, kind: 'tag' })
      }
    }

    for (const row of projectsRes.rows) {
      nodes.push({ id: row.id, type: 'project', label: (row.emoji || '') + ' ' + row.title, group: 'project', createdAt: null })
    }
    for (const row of collectionsRes.rows) {
      nodes.push({ id: row.id, type: 'collection', label: (row.emoji || '') + ' ' + row.name, group: 'collection', createdAt: null })
    }

    const topTags = [...tagSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
    for (const [name] of topTags) {
      nodes.push({ id: 'tag:' + name, type: 'tag', label: '#' + name, group: 'tag', createdAt: null })
    }

    res.json({ nodes, links })
  } catch (err) {
    console.error('GET /archive/graph error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /archive/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const pid = req.user.profileId
    const [last30, last12, summaryRes, photosRes, projectsRes, capsulesRes] = await Promise.all([
      pool.query(
        `SELECT created_at::date AS day, COUNT(*)::int AS count FROM posts WHERE profile_id=$1 AND created_at >= now()-'30 days'::interval GROUP BY day ORDER BY day`,
        [pid]
      ),
      pool.query(
        `SELECT date_trunc('month', created_at) AS month, COUNT(*)::int AS count FROM posts WHERE profile_id=$1 AND created_at >= now()-'12 months'::interval GROUP BY month ORDER BY month`,
        [pid]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total_posts, COUNT(*) FILTER (WHERE is_article)::int AS total_articles, COUNT(*) FILTER (WHERE code_language IS NOT NULL)::int AS total_codes, MIN(created_at) AS first_post FROM posts WHERE profile_id=$1`,
        [pid]
      ),
      pool.query(`SELECT COUNT(*)::int AS total_photos FROM post_attachments WHERE profile_id=$1 AND file_type='image'`, [pid]),
      pool.query(`SELECT COUNT(*)::int AS active_projects FROM projects WHERE profile_id=$1 AND status IN ('ativo','construindo')`, [pid]),
      pool.query(`SELECT COUNT(*)::int AS capsules_waiting FROM posts WHERE profile_id=$1 AND is_time_capsule=true AND unlock_at > now()`, [pid]),
    ])
    const s = summaryRes.rows[0]
    res.json({
      last30: last30.rows,
      last12: last12.rows,
      summary: {
        totalPosts: s.total_posts,
        totalArticles: s.total_articles,
        totalCodes: s.total_codes,
        totalPhotos: photosRes.rows[0].total_photos,
        activeProjects: projectsRes.rows[0].active_projects,
        capsulesWaiting: capsulesRes.rows[0].capsules_waiting,
        firstPost: s.first_post,
      },
    })
  } catch (err) {
    console.error('GET /archive/dashboard error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /archive/year-review/:year
router.get('/year-review/:year', async (req, res) => {
  try {
    const pid = req.user.profileId
    const year = parseInt(req.params.year, 10)
    const [statsRes, bestMonthRes, projCreatedRes, projCompletedRes, firstPostRes, topProjectsRes, reflectionsRes, photosRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_article)::int AS articles, COUNT(*) FILTER (WHERE code_language IS NOT NULL)::int AS codes, COUNT(DISTINCT created_at::date)::int AS active_days FROM posts WHERE profile_id=$1 AND EXTRACT(YEAR FROM created_at)=$2`,
        [pid, year]
      ),
      pool.query(
        `SELECT EXTRACT(MONTH FROM created_at)::int AS month, COUNT(*)::int AS count FROM posts WHERE profile_id=$1 AND EXTRACT(YEAR FROM created_at)=$2 GROUP BY month ORDER BY count DESC LIMIT 1`,
        [pid, year]
      ),
      pool.query(`SELECT COUNT(*)::int AS created FROM projects WHERE profile_id=$1 AND EXTRACT(YEAR FROM created_at)=$2`, [pid, year]),
      pool.query(`SELECT COUNT(*)::int AS completed FROM projects WHERE profile_id=$1 AND EXTRACT(YEAR FROM completed_at)=$2`, [pid, year]),
      pool.query(
        `SELECT content, article_title, created_at FROM posts WHERE profile_id=$1 AND EXTRACT(YEAR FROM created_at)=$2 ORDER BY created_at ASC LIMIT 1`,
        [pid, year]
      ),
      pool.query(
        `SELECT pr.title, pr.emoji, COUNT(*)::int AS post_count FROM posts p JOIN projects pr ON pr.id = p.project_id WHERE p.profile_id=$1 AND EXTRACT(YEAR FROM p.created_at)=$2 GROUP BY pr.id, pr.title, pr.emoji ORDER BY post_count DESC LIMIT 3`,
        [pid, year]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS reflections FROM posts WHERE profile_id=$1 AND parent_memory_post_id IS NOT NULL AND EXTRACT(YEAR FROM created_at)=$2`,
        [pid, year]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS photos FROM post_attachments WHERE profile_id=$1 AND file_type='image' AND EXTRACT(YEAR FROM created_at)=$2`,
        [pid, year]
      ),
    ])
    const s = statsRes.rows[0]
    const bm = bestMonthRes.rows[0] || null
    const fp = firstPostRes.rows[0] || null
    res.json({
      year,
      stats: {
        total: s.total,
        articles: s.articles,
        codes: s.codes,
        activeDays: s.active_days,
        reflections: reflectionsRes.rows[0].reflections,
        photos: photosRes.rows[0].photos,
      },
      bestMonth: bm ? { month: bm.month, count: bm.count } : null,
      projects: { created: projCreatedRes.rows[0].created, completed: projCompletedRes.rows[0].completed },
      topProjects: topProjectsRes.rows.map(r => ({ title: r.title, emoji: r.emoji, postCount: r.post_count })),
      firstPost: fp ? { content: fp.content, articleTitle: fp.article_title, createdAt: fp.created_at } : null,
    })
  } catch (err) {
    console.error('GET /archive/year-review error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /archive/growth
router.get('/growth', async (req, res) => {
  try {
    const pid = req.user.profileId
    const [
      firstPost, firstPhoto, firstArticle, firstProject,
      firstCapsule, firstReflection, profileRes,
      mostActiveProjectRes, mostFrequentCategoryRes,
      mostActiveYearRes, summaryRes, photosCountRes,
    ] = await Promise.all([
      pool.query(`SELECT id, content, article_title, created_at FROM posts WHERE profile_id=$1 ORDER BY created_at ASC LIMIT 1`, [pid]),
      pool.query(`SELECT a.id, a.original_name, a.created_at FROM post_attachments a WHERE a.profile_id=$1 AND a.file_type='image' ORDER BY a.created_at ASC LIMIT 1`, [pid]),
      pool.query(`SELECT id, article_title, content, created_at FROM posts WHERE profile_id=$1 AND is_article=true ORDER BY created_at ASC LIMIT 1`, [pid]),
      pool.query(`SELECT id, title, emoji, created_at FROM projects WHERE profile_id=$1 ORDER BY created_at ASC LIMIT 1`, [pid]),
      pool.query(`SELECT id, created_at FROM posts WHERE profile_id=$1 AND is_time_capsule=true ORDER BY created_at ASC LIMIT 1`, [pid]),
      pool.query(`SELECT id, content, created_at FROM posts WHERE profile_id=$1 AND parent_memory_post_id IS NOT NULL ORDER BY created_at ASC LIMIT 1`, [pid]),
      pool.query(`SELECT created_at FROM profiles WHERE id=$1`, [pid]),
      pool.query(
        `SELECT pr.id, pr.title, pr.emoji, COUNT(*)::int AS post_count
         FROM posts p JOIN projects pr ON pr.id = p.project_id
         WHERE p.profile_id=$1 AND p.project_id IS NOT NULL
           AND (p.is_time_capsule = false OR p.is_time_capsule IS NULL)
         GROUP BY pr.id, pr.title, pr.emoji
         ORDER BY post_count DESC LIMIT 1`,
        [pid]
      ),
      pool.query(
        `SELECT categoria, COUNT(*)::int AS count FROM posts
         WHERE profile_id=$1 AND categoria IS NOT NULL
         GROUP BY categoria ORDER BY count DESC LIMIT 1`,
        [pid]
      ),
      pool.query(
        `SELECT EXTRACT(YEAR FROM created_at)::int AS year, COUNT(*)::int AS count
         FROM posts WHERE profile_id=$1
           AND (is_time_capsule = false OR is_time_capsule IS NULL)
         GROUP BY year ORDER BY count DESC LIMIT 1`,
        [pid]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total_posts,
                COUNT(*) FILTER (WHERE is_article)::int AS total_articles,
                COUNT(*) FILTER (WHERE code_language IS NOT NULL)::int AS total_codes
         FROM posts WHERE profile_id=$1
           AND (is_time_capsule = false OR is_time_capsule IS NULL)`,
        [pid]
      ),
      pool.query(`SELECT COUNT(*)::int AS total_photos FROM post_attachments WHERE profile_id=$1 AND file_type='image'`, [pid]),
    ])

    const fp  = firstPost.rows[0]
    const fph = firstPhoto.rows[0]
    const fa  = firstArticle.rows[0]
    const fpr = firstProject.rows[0]
    const fc  = firstCapsule.rows[0]
    const fr  = firstReflection.rows[0]

    const milestones = []
    const add = (type, label, row, fields) => {
      if (!row) return
      milestones.push({
        type,
        label,
        date: row.created_at,
        description: fields.description || null,  // kept for GrowthPage compatibility
        excerpt: fields.excerpt || null,
        title: fields.title || null,
        emoji: fields.emoji || null,
      })
    }

    add('first_post',       'Primeiro registro',        fp,  { description: fp?.content?.slice(0, 80),  excerpt: fp?.content?.slice(0, 150) })
    add('first_photo',      'Primeira foto',             fph, { description: fph?.original_name })
    add('first_article',    'Primeiro ensaio',           fa,  { description: fa?.article_title, title: fa?.article_title, excerpt: fa?.content?.slice(0, 150) })
    add('first_project',    'Primeiro projeto',          fpr, { description: fpr?.title, title: fpr?.title, emoji: fpr?.emoji })
    add('first_capsule',    'Primeira cápsula do tempo', fc,  {})  // no excerpt — capsules are sealed
    add('first_reflection', 'Primeira reflexão',         fr,  { description: fr?.content?.slice(0, 80), excerpt: fr?.content?.slice(0, 150) })

    milestones.sort((a, b) => new Date(a.date) - new Date(b.date))

    const map = mostActiveProjectRes.rows[0] || null
    const mfc = mostFrequentCategoryRes.rows[0] || null
    const may = mostActiveYearRes.rows[0] || null
    const sum = summaryRes.rows[0] || {}

    res.json({
      accountCreatedAt: profileRes.rows[0]?.created_at || null,
      milestones,
      insights: {
        mostActiveProject:    map ? { id: map.id, title: map.title, emoji: map.emoji, postCount: map.post_count } : null,
        mostFrequentCategory: mfc ? { name: mfc.categoria, count: Number(mfc.count) } : null,
        mostActiveYear:       may ? { year: may.year, count: Number(may.count) } : null,
        summary: {
          totalPosts:    Number(sum.total_posts    || 0),
          totalArticles: Number(sum.total_articles || 0),
          totalCodes:    Number(sum.total_codes    || 0),
          totalPhotos:   Number(photosCountRes.rows[0]?.total_photos || 0),
        },
      },
    })
  } catch (err) {
    console.error('GET /archive/growth error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /archive/achievements
router.get('/achievements', async (req, res) => {
  try {
    const pid = req.user.profileId
    const [countsRes, photosRes, projectsRes, daysRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS posts, COUNT(*) FILTER (WHERE is_article)::int AS articles, COUNT(*) FILTER (WHERE code_language IS NOT NULL)::int AS codes, COUNT(*) FILTER (WHERE parent_memory_post_id IS NOT NULL)::int AS reflections, COUNT(*) FILTER (WHERE is_time_capsule)::int AS capsules FROM posts WHERE profile_id=$1`,
        [pid]
      ),
      pool.query(`SELECT COUNT(*)::int AS photos FROM post_attachments WHERE profile_id=$1 AND file_type='image'`, [pid]),
      pool.query(`SELECT COUNT(*)::int AS projects FROM projects WHERE profile_id=$1`, [pid]),
      pool.query(`SELECT DISTINCT created_at::date AS day FROM posts WHERE profile_id=$1 ORDER BY day`, [pid]),
    ])
    const c = countsRes.rows[0]
    const posts = c.posts, articles = c.articles, codes = c.codes, reflections = c.reflections, capsules = c.capsules
    const photos = photosRes.rows[0].photos
    const projects = projectsRes.rows[0].projects

    // compute best streak
    const days = daysRes.rows.map(r => r.day instanceof Date ? r.day : new Date(r.day))
    let bestStreak = 0, cur = 0
    for (let i = 0; i < days.length; i++) {
      if (i === 0) { cur = 1; continue }
      const diff = (days[i] - days[i-1]) / 86400000
      if (diff === 1) { cur++; if (cur > bestStreak) bestStreak = cur }
      else { if (cur > bestStreak) bestStreak = cur; cur = 1 }
    }
    if (cur > bestStreak) bestStreak = cur
    const activeDays = days.length

    const all = [
      { id: 'first_post', emoji: '🌱', title: 'Primeiro registro', desc: 'Criou seu primeiro post', earned: posts >= 1 },
      { id: 'posts_10', emoji: '📖', title: '10 registros', desc: '', earned: posts >= 10 },
      { id: 'posts_50', emoji: '📚', title: '50 registros', desc: '', earned: posts >= 50 },
      { id: 'posts_100', emoji: '🏛️', title: '100 registros', desc: '', earned: posts >= 100 },
      { id: 'first_article', emoji: '✍️', title: 'Primeiro ensaio', desc: '', earned: articles >= 1 },
      { id: 'first_code', emoji: '💻', title: 'Primeiro código', desc: '', earned: codes >= 1 },
      { id: 'first_photo', emoji: '📷', title: 'Primeira foto', desc: '', earned: photos >= 1 },
      { id: 'photos_50', emoji: '🎞️', title: '50 fotos', desc: '', earned: photos >= 50 },
      { id: 'first_project', emoji: '🌱', title: 'Primeiro projeto', desc: '', earned: projects >= 1 },
      { id: 'projects_5', emoji: '🏗️', title: '5 projetos', desc: '', earned: projects >= 5 },
      { id: 'first_capsule', emoji: '📦', title: 'Primeira cápsula', desc: '', earned: capsules >= 1 },
      { id: 'first_reflection', emoji: '🧠', title: 'Primeira reflexão', desc: '', earned: reflections >= 1 },
      { id: 'streak_7', emoji: '🔥', title: '7 dias seguidos', desc: '', earned: bestStreak >= 7 },
      { id: 'streak_30', emoji: '🔥', title: '30 dias seguidos', desc: '', earned: bestStreak >= 30 },
      { id: 'streak_100', emoji: '🔥', title: '100 dias seguidos', desc: '', earned: bestStreak >= 100 },
      { id: 'active_30', emoji: '📅', title: '30 dias ativos', desc: '', earned: activeDays >= 30 },
      { id: 'active_100', emoji: '🗓️', title: '100 dias ativos', desc: '', earned: activeDays >= 100 },
    ]
    const earned = all.filter(a => a.earned)
    const unearned = all.filter(a => !a.earned)
    res.json({ achievements: [...earned, ...unearned], earnedCount: earned.length, totalCount: all.length })
  } catch (err) {
    console.error('GET /archive/achievements error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

module.exports = router
