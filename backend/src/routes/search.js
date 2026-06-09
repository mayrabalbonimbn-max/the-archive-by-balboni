const express = require('express')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function isStoredFile(value) {
  return typeof value === 'string' && path.basename(value) === value && /^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(value)
}

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio || '',
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
  if (q.length < 2) return res.json({ users: [], posts: [], articles: [] })

  const like = `%${q}%`

  try {
    const [usersResult, postsResult] = await Promise.all([
      pool.query(
        `SELECT p.id, p.name, p.handle, p.avatar, p.bio, p.is_system,
           EXISTS (
             SELECT 1 FROM follows fl
             WHERE fl.follower_id = $1 AND fl.following_id = p.id
           ) AS is_following
         FROM profiles p
         WHERE p.id != $1
           AND (p.name ILIKE $2 OR p.handle ILIKE $2)
         ORDER BY p.name
         LIMIT 20`,
        [req.user.profileId, like]
      ),
      pool.query(
        `SELECT
           p.id, p.content, p.article_title, p.is_article, p.type, p.created_at,
           owner.id AS author_id, owner.name AS author_name,
           owner.handle AS author_handle, owner.avatar AS author_avatar
         FROM posts p
         JOIN profiles owner ON owner.id = p.profile_id
         WHERE p.visibility = 'public'
           AND (p.content ILIKE $1 OR p.article_title ILIKE $1)
         ORDER BY p.created_at DESC
         LIMIT 30`,
        [like]
      ),
    ])

    const allPosts = postsResult.rows.map(toPost)

    res.json({
      users: usersResult.rows.map(toUser),
      posts: allPosts.filter(p => !p.isArticle),
      articles: allPosts.filter(p => p.isArticle),
    })
  } catch (err) {
    console.error('GET /search error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
