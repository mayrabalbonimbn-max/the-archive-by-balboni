const express = require('express')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GIN indexes for FTS — created once at startup, safe to repeat
;(async () => {
  try {
    await pool.query(`
      CREATE INDEX IF NOT EXISTS posts_fts_idx
        ON posts USING GIN(
          to_tsvector('portuguese', coalesce(content,'') || ' ' || coalesce(article_title,''))
        )
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS projects_fts_idx
        ON projects USING GIN(
          to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,''))
        )
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS collections_fts_idx
        ON collections USING GIN(
          to_tsvector('portuguese', coalesce(name,''))
        )
    `)
  } catch (err) {
    console.error('[search] index migration error:', err.message)
  }
})()

function isStoredFile(value) {
  return typeof value === 'string' && path.basename(value) === value && /^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(value)
}

const HL_OPTS = "StartSel=«, StopSel=», MaxWords=40, MinWords=15, ShortWord=3, HighlightAll=false, MaxFragments=1"

function sanitizeHeadline(raw) {
  if (!raw) return null
  // Replace our safe delimiters with HTML mark tags
  return raw
    .replace(/«/g, '<mark>')
    .replace(/»/g, '</mark>')
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio || '',
    title: row.title || '',
    location: row.location || '',
    hasAvatar: Boolean(row.avatar) && isStoredFile(row.avatar),
    isFollowing: row.is_following === true,
    verified: row.is_system || false,
  }
}

function toPost(row) {
  return {
    id: row.id,
    content: row.content,
    articleTitle: row.article_title || null,
    isArticle: row.is_article || false,
    type: row.type,
    createdAt: row.created_at,
    rank: parseFloat(row.rank) || 0,
    headline: sanitizeHeadline(row.headline),
    author: {
      id: row.author_id,
      name: row.author_name,
      handle: row.author_handle,
      hasAvatar: Boolean(row.author_avatar) && isStoredFile(row.author_avatar),
    },
  }
}

router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.json({ users: [], posts: [], articles: [], projects: [], collections: [] })

  const profileId = req.user.profileId
  const like = `%${q}%`

  try {
    const [usersResult, postsResult, projectsResult, collectionsResult, capsulesResult] = await Promise.all([

      // Users: ILIKE on name, handle, bio, title, location
      pool.query(
        `SELECT p.id, p.name, p.handle, p.avatar, p.bio, p.title, p.location, p.is_system,
           EXISTS (
             SELECT 1 FROM follows fl
             WHERE fl.follower_id = $1 AND fl.following_id = p.id
           ) AS is_following
         FROM profiles p
         WHERE p.id != $1
           AND (
             p.name ILIKE $2
             OR p.handle ILIKE $2
             OR coalesce(p.bio,'') ILIKE $2
             OR coalesce(p.title,'') ILIKE $2
             OR coalesce(p.location,'') ILIKE $2
           )
         ORDER BY p.name
         LIMIT 10`,
        [profileId, like]
      ),

      // Posts + Articles: FTS ranked by relevance, own posts boosted
      pool.query(
        `SELECT
           p.id, p.content, p.article_title, p.is_article, p.type, p.created_at,
           owner.id   AS author_id,
           owner.name AS author_name,
           owner.handle AS author_handle,
           owner.avatar AS author_avatar,
           ts_rank(
             to_tsvector('portuguese', coalesce(p.content,'') || ' ' || coalesce(p.article_title,'')),
             websearch_to_tsquery('portuguese', $2)
           ) AS rank,
           ts_headline(
             'portuguese',
             coalesce(p.article_title || E'\\n', '') || coalesce(p.content, ''),
             websearch_to_tsquery('portuguese', $2),
             $3
           ) AS headline
         FROM posts p
         JOIN profiles owner ON owner.id = p.profile_id
         WHERE p.is_time_capsule = false
           AND (p.profile_id = $1 OR p.visibility = 'public')
           AND to_tsvector('portuguese', coalesce(p.content,'') || ' ' || coalesce(p.article_title,''))
               @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY
           (CASE WHEN p.profile_id = $1 THEN 1 ELSE 0 END) DESC,
           rank DESC
         LIMIT 25`,
        [profileId, q, HL_OPTS]
      ),

      // Projects: FTS
      pool.query(
        `SELECT
           id, title, slug, description, status, emoji, color,
           ts_rank(
             to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,'')),
             websearch_to_tsquery('portuguese', $2)
           ) AS rank,
           ts_headline(
             'portuguese',
             coalesce(title,'') || '. ' || coalesce(description,''),
             websearch_to_tsquery('portuguese', $2),
             $3
           ) AS headline
         FROM projects
         WHERE profile_id = $1
           AND to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,''))
               @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY rank DESC
         LIMIT 8`,
        [profileId, q, HL_OPTS]
      ),

      // Collections: FTS (no description column)
      pool.query(
        `SELECT
           id, name, emoji, color,
           ts_rank(
             to_tsvector('portuguese', coalesce(name,'')),
             websearch_to_tsquery('portuguese', $2)
           ) AS rank,
           ts_headline(
             'portuguese',
             coalesce(name,''),
             websearch_to_tsquery('portuguese', $2),
             $3
           ) AS headline
         FROM collections
         WHERE profile_id = $1
           AND to_tsvector('portuguese', coalesce(name,''))
               @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY rank DESC
         LIMIT 8`,
        [profileId, q, HL_OPTS]
      ),

      // Capsules: FTS on title + content (locked capsules excluded from preview)
      pool.query(
        `SELECT
           p.id, p.article_title, p.content, p.unlock_at, p.is_time_capsule,
           ts_rank(
             to_tsvector('portuguese', coalesce(p.article_title,'') || ' ' || coalesce(p.content,'')),
             websearch_to_tsquery('portuguese', $2)
           ) AS rank
         FROM posts p
         WHERE p.profile_id = $1
           AND p.is_time_capsule = true
           AND (p.unlock_at IS NULL OR p.unlock_at <= now())
           AND to_tsvector('portuguese', coalesce(p.article_title,'') || ' ' || coalesce(p.content,''))
               @@ websearch_to_tsquery('portuguese', $2)
         ORDER BY rank DESC
         LIMIT 6`,
        [profileId, q]
      ),
    ])

    const allPosts = postsResult.rows.map(toPost)

    res.json({
      users: usersResult.rows.map(toUser),
      posts: allPosts.filter(p => !p.isArticle),
      articles: allPosts.filter(p => p.isArticle),
      projects: projectsResult.rows.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        status: r.status,
        emoji: r.emoji,
        rank: parseFloat(r.rank) || 0,
        headline: sanitizeHeadline(r.headline),
      })),
      collections: collectionsResult.rows.map(r => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        rank: parseFloat(r.rank) || 0,
        headline: sanitizeHeadline(r.headline),
      })),
      capsules: capsulesResult.rows.map(r => ({
        id: r.id,
        title: r.article_title || r.content?.slice(0, 60) || 'Cápsula do tempo',
        unlockAt: r.unlock_at,
        rank: parseFloat(r.rank) || 0,
      })),
    })
  } catch (err) {
    console.error('GET /search error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
