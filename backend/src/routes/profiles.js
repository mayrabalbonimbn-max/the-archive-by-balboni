const express = require('express')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { attachmentVisibleSql, reactionCountsSql, viewerReactionsSql, visibleSql } = require('../utils/social')

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')

function isStoredFile(value) {
  return typeof value === 'string' && path.basename(value) === value && /^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(value)
}

router.use(requireAuth)

const attachmentJsonSql = `
  COALESCE(jsonb_agg(jsonb_build_object(
    'id', a.id, 'postId', a.post_id, 'originalName', a.original_name, 'title', a.title, 'description', a.description,
    'mimeType', a.mime_type, 'size', a.size, 'fileType', a.file_type,
    'visibility', a.visibility, 'createdAt', a.created_at
  ) ORDER BY a.created_at, a.id) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb) AS attachments`

function toPublicProfile(row) {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio,
    avatar: isStoredFile(row.avatar) ? null : row.avatar,
    hasAvatar: Boolean(row.avatar),
    headerColor: row.header_color,
    interests: row.interests || '',
    coverImage: isStoredFile(row.cover_image) ? null : row.cover_image || null,
    hasCoverImage: Boolean(row.cover_image),
    createdAt: row.created_at,
    followerCount: Number(row.follower_count || 0),
    followingCount: Number(row.following_count || 0),
    friendCount: Number(row.friend_count || 0),
    isFollowing: row.is_following === true,
    isFriend: row.is_friend === true,
    verified: row.is_system || false,
  }
}

function toPost(row) {
  const reactionCounts = row.reaction_counts || {}
  const viewerReactions = row.viewer_reactions || []
  return {
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
    attachments: row.attachments || [],
    codeBlock: row.code_language ? { language: row.code_language, code: row.code_content || '' } : null,
    liked: viewerReactions.includes('heart') || row.liked,
    likeCount: Number(reactionCounts.heart ?? row.like_count ?? 0),
    saved: viewerReactions.includes('save') || row.saved,
    reactionCounts,
    viewerReactions,
    commentCount: Number(row.comment_count || 0),
    pinned: row.pinned,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      name: row.author_name,
      handle: row.author_handle,
      avatar: row.author_avatar,
      verified: row.author_is_system || false,
    },
  }
}

// GET /profiles/username/:username — lookup by handle (case-insensitive)
router.get('/username/:username', async (req, res) => {
  const handle = req.params.username.replace(/^@/, '').trim().toLowerCase()
  if (!handle) return res.status(400).json({ error: 'Username inválido.' })
  try {
    const result = await pool.query(
      `SELECT p.*,
        EXISTS (SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.following_id = p.id) AS is_following,
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
            AND ((f.requester_id = $1 AND f.receiver_id = p.id) OR (f.receiver_id = $1 AND f.requester_id = p.id))
        ) AS is_friend,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.following_id = p.id) AS follower_count,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.follower_id = p.id) AS following_count,
        (SELECT COUNT(*)::int FROM friendships f WHERE f.status = 'accepted' AND (f.requester_id = p.id OR f.receiver_id = p.id)) AS friend_count
       FROM profiles p
       WHERE LOWER(TRIM(LEADING '@' FROM p.handle)) = $2`,
      [req.user.profileId, handle]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Perfil não encontrado.' })
    res.json(toPublicProfile(result.rows[0]))
  } catch (err) {
    console.error('GET /profiles/username/:username error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        EXISTS (SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.following_id = p.id) AS is_following,
        EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.status = 'accepted'
            AND ((f.requester_id = $1 AND f.receiver_id = p.id) OR (f.receiver_id = $1 AND f.requester_id = p.id))
        ) AS is_friend,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.following_id = p.id) AS follower_count,
        (SELECT COUNT(*)::int FROM follows fl WHERE fl.follower_id = p.id) AS following_count,
        (SELECT COUNT(*)::int FROM friendships f WHERE f.status = 'accepted' AND (f.requester_id = p.id OR f.receiver_id = p.id)) AS friend_count
       FROM profiles p
       WHERE p.id = $2`,
      [req.user.profileId, req.params.id]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Perfil não encontrado.' })
    res.json(toPublicProfile(result.rows[0]))
  } catch (err) {
    console.error('GET /profiles/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/:id/posts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        owner.id AS author_id, owner.name AS author_name, owner.handle AS author_handle, owner.avatar AS author_avatar, owner.is_system AS author_is_system,
        ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$1')},
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        ${attachmentJsonSql}
       FROM posts p
       JOIN profiles owner ON owner.id = p.profile_id
       LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p')}
       WHERE p.profile_id = $2 AND ${visibleSql('p')}
       GROUP BY p.id, owner.id
       ORDER BY p.pinned DESC, p.created_at DESC`,
      [req.user.profileId, req.params.id]
    )
    res.json(result.rows.map(toPost))
  } catch (err) {
    console.error('GET /profiles/:id/posts error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

router.get('/:id/summary', async (req, res) => {
  try {
    const profileId = req.params.id
    const [collections, recent, articles, photos, tagRows] = await Promise.all([
      pool.query(
        `SELECT c.id, c.name, COUNT(p.id)::int AS count
         FROM collections c
         JOIN posts p ON p.collection_id = c.id
         WHERE c.profile_id = $2 AND p.profile_id = $2 AND ${visibleSql('p')}
         GROUP BY c.id
         ORDER BY count DESC, c.name
         LIMIT 5`,
        [req.user.profileId, profileId]
      ),
      pool.query(
        `SELECT p.*, c.name AS collection_name
         FROM posts p
         LEFT JOIN collections c ON c.id = p.collection_id
         WHERE p.profile_id = $2 AND ${visibleSql('p')}
         ORDER BY p.created_at DESC
         LIMIT 5`,
        [req.user.profileId, profileId]
      ),
      pool.query(
        `SELECT p.*, c.name AS collection_name
         FROM posts p
         LEFT JOIN collections c ON c.id = p.collection_id
         WHERE p.profile_id = $2 AND p.is_article = true AND ${visibleSql('p')}
         ORDER BY p.created_at DESC
         LIMIT 3`,
        [req.user.profileId, profileId]
      ),
      pool.query(
        `SELECT a.id, a.post_id, a.title, a.original_name, a.mime_type, a.file_type, a.created_at
         FROM post_attachments a
         JOIN posts p ON p.id = a.post_id
         WHERE a.profile_id = $2 AND a.file_type = 'image' AND ${attachmentVisibleSql('a', 'p')}
         ORDER BY a.created_at DESC
         LIMIT 6`,
        [req.user.profileId, profileId]
      ),
      pool.query(
        `SELECT content, code_content
         FROM posts p
         WHERE p.profile_id = $2 AND ${visibleSql('p')}
         ORDER BY p.created_at DESC
         LIMIT 300`,
        [req.user.profileId, profileId]
      ),
    ])

    const tagCounts = new Map()
    tagRows.rows.forEach(row => {
      const text = `${row.content || ''} ${row.code_content || ''}`
      const tags = text.match(/#[\p{L}\p{N}_-]+/gu) || []
      tags.forEach(tag => {
        const clean = tag.slice(1).toLowerCase()
        tagCounts.set(clean, (tagCounts.get(clean) || 0) + 1)
      })
    })

    res.json({
      collections: collections.rows,
      tags: [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count })),
      recentActivity: recent.rows.map(toPost),
      recentArticles: articles.rows.map(toPost),
      recentPhotos: photos.rows.map(row => ({
        id: row.id,
        postId: row.post_id,
        title: row.title || row.original_name,
        originalName: row.original_name,
        mimeType: row.mime_type,
        fileType: row.file_type,
        createdAt: row.created_at,
      })),
    })
  } catch (err) {
    console.error('GET /profiles/:id/summary error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

const MEDIA_COLUMN = { avatar: 'avatar', cover: 'cover_image' }

router.get('/:id/media/:kind', async (req, res) => {
  const column = MEDIA_COLUMN[req.params.kind]
  if (!column) return res.status(404).json({ error: 'Mídia não encontrada.' })
  try {
    const result = await pool.query(`SELECT ${column} AS stored_name FROM profiles WHERE id = $1`, [req.params.id])
    const storedName = result.rows[0]?.stored_name
    if (!isStoredFile(storedName)) return res.status(404).json({ error: 'Mídia não encontrada.' })
    res.sendFile(path.join(uploadDir, storedName), err => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado.' })
    })
  } catch (err) {
    console.error('GET /profiles/:id/media error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
