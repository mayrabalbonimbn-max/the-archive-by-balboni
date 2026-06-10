const express = require('express')
const fs = require('fs/promises')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { REACTIONS, PRIMARY_REACTIONS, attachmentVisibleSql, normalizeVisibility, reactionCountsSql, viewerReactionsSql, visibleSql } = require('../utils/social')
const { sendPushToUser } = require('../utils/push')
const { notifyMentions } = require('../utils/mentions')

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')
const CODE_LANGUAGES = new Set([
  'javascript', 'typescript', 'jsx', 'tsx', 'python', 'html', 'css', 'json',
  'bash', 'sql', 'markdown', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'plaintext',
])
const MAX_CODE_LENGTH = 50000
router.use(requireAuth)

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
    visibility: row.visibility || (row.is_private ? 'private' : 'private'),
    isArticle: row.is_article || false,
    articleTitle: row.article_title || null,
    collectionId: row.collection_id || null,
    isTimeCapsule: row.is_time_capsule || false,
    unlockAt: row.unlock_at || null,
    projectId: row.project_id || null,
    parentMemoryPostId: row.parent_memory_post_id || null,
    categoria: row.categoria || null,
    reflectionCount: Number(row.reflection_count || 0),
    attachments: row.attachments || [],
    tags: row.tags || [],
    linkPreview: row.link_preview || null,
    codeBlock: row.code_language ? { language: row.code_language, code: row.code_content || '' } : null,
    liked: viewerReactions.includes('heart') || row.liked,
    likeCount: Number(reactionCounts.heart ?? row.like_count ?? 0),
    saved: viewerReactions.includes('save') || row.saved,
    reactionCounts,
    viewerReactions,
    commentCount: Number(row.comment_count || 0),
    pinned: row.pinned,
    pinOrder: row.pin_order || 0,
    createdAt: row.created_at,
    author: row.author_id ? {
      id: row.author_id,
      name: row.author_name,
      handle: row.author_handle,
      avatar: row.author_avatar,
      verified: row.author_is_system || false,
    } : null,
  }
}

function commentCountSql(postAlias = 'p') {
  return `(SELECT COUNT(*)::int FROM comments c WHERE c.post_id = ${postAlias}.id) AS comment_count`
}

async function notifyPostOwner(post, actorId, type, message) {
  if (!post?.profile_id || post.profile_id === actorId) return
  await pool.query(
    `INSERT INTO notifications (profile_id, actor_id, post_id, type, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [post.profile_id, actorId, post.id, type, message]
  )
  sendPushToUser(post.profile_id, {
    title: 'The Archive',
    body: message,
    url: post.id ? `/posts/${post.id}` : '/',
    tag: `${type}-${post.id}`,
  }).catch(() => {})
}

const tagsSubquerySql = `
  (SELECT COALESCE(jsonb_agg(t.slug ORDER BY t.slug), '[]'::jsonb)
   FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
   WHERE pt.post_id = p.id) AS tags`

const attachmentJsonSql = `
  COALESCE(jsonb_agg(jsonb_build_object(
    'id', a.id, 'postId', a.post_id, 'originalName', a.original_name, 'title', a.title, 'description', a.description,
    'mimeType', a.mime_type, 'size', a.size, 'fileType', a.file_type,
    'visibility', a.visibility, 'createdAt', a.created_at,
    'exifData', a.exif_data,
    'hasThumbnail', (a.thumbnail_path IS NOT NULL),
    'hasOptimized', (a.optimized_path IS NOT NULL)
  ) ORDER BY a.created_at, a.id) FILTER (WHERE a.id IS NOT NULL), '[]'::jsonb) AS attachments`

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const { q } = req.query
    let query, params

    const { tag, type } = req.query
    const conditions = ['p.profile_id = $1', '(p.is_time_capsule = false OR p.is_time_capsule IS NULL)']
    params = [req.user.profileId]

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`)
      conditions.push(`(p.content ILIKE $${params.length} OR p.article_title ILIKE $${params.length})`)
    }
    if (tag) {
      params.push(tag.replace(/^#/, ''))
      conditions.push(`EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = $${params.length} AND t.profile_id = p.profile_id)`)
    }
    if (type && type !== 'all') {
      if (type === 'article') {
        conditions.push('p.is_article = true')
      } else if (type === 'code') {
        conditions.push('p.code_language IS NOT NULL')
      } else if (type === 'diary') {
        conditions.push('p.is_diary = true')
      } else if (type === 'media') {
        conditions.push(`EXISTS (SELECT 1 FROM post_attachments a2 WHERE a2.post_id = p.id AND a2.file_type = 'image')`)
      } else {
        params.push(type)
        conditions.push(`p.type = $${params.length}`)
      }
    }

    query = `SELECT p.*, ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$1')}, ${commentCountSql('p')},
              ${attachmentJsonSql}, ${tagsSubquerySql}
             FROM posts p
             LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p')}
             WHERE ${conditions.join(' AND ')}
             GROUP BY p.id
             ORDER BY p.pinned DESC, p.pin_order ASC, p.created_at DESC`

    const result = await pool.query(query, params)
    res.json(result.rows.map(toPost))
  } catch (err) {
    console.error('GET /posts error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// GET /api/posts/friends
router.get('/friends', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        owner.id AS author_id, owner.name AS author_name, owner.handle AS author_handle, owner.avatar AS author_avatar, owner.is_system AS author_is_system,
        ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$1')},
        ${attachmentJsonSql}
       FROM posts p
       JOIN profiles owner ON owner.id = p.profile_id
       LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p')}
       WHERE p.profile_id != $1
         AND p.visibility IN ('friends', 'public')
         AND EXISTS (
           SELECT 1 FROM friendships f
           WHERE f.status = 'accepted'
             AND (
               (f.requester_id = $1 AND f.receiver_id = p.profile_id)
               OR (f.receiver_id = $1 AND f.requester_id = p.profile_id)
             )
         )
       GROUP BY p.id, owner.id
       ORDER BY p.created_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toPost))
  } catch (err) {
    console.error('GET /posts/friends error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// GET /api/posts/following
router.get('/following', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        owner.id AS author_id, owner.name AS author_name, owner.handle AS author_handle, owner.avatar AS author_avatar, owner.is_system AS author_is_system,
        ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$1')}, ${commentCountSql('p')},
        ${attachmentJsonSql}
       FROM posts p
       JOIN profiles owner ON owner.id = p.profile_id
       LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p')}
       WHERE p.profile_id != $1
         AND EXISTS (SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.following_id = p.profile_id)
         AND ${visibleSql('p')}
       GROUP BY p.id, owner.id
       ORDER BY p.created_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toPost))
  } catch (err) {
    console.error('GET /posts/following error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// GET /api/posts/guide — public posts by @thearchive system profile
router.get('/guide', async (req, res) => {
  try {
    const { rows: [sys] } = await pool.query(
      "SELECT id FROM profiles WHERE TRIM(LEADING '@' FROM LOWER(handle)) = 'thearchive' AND is_system = true",
      []
    )
    if (!sys) return res.json([])

    const result = await pool.query(
      `SELECT p.*,
         owner.id AS author_id, owner.name AS author_name, owner.handle AS author_handle, owner.avatar AS author_avatar, owner.is_system AS author_is_system,
         ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$2')}, ${commentCountSql('p')},
         ${attachmentJsonSql}
        FROM posts p
        JOIN profiles owner ON owner.id = p.profile_id
        LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p')}
        WHERE p.profile_id = $1 AND p.visibility = 'public'
        GROUP BY p.id, owner.id
        ORDER BY p.created_at ASC`,
      [sys.id, req.user.profileId]
    )
    res.json(result.rows.map(toPost))
  } catch (err) {
    console.error('GET /posts/guide error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// GET /api/posts/explore
router.get('/explore', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        owner.id AS author_id, owner.name AS author_name, owner.handle AS author_handle, owner.avatar AS author_avatar, owner.is_system AS author_is_system,
        ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$1')}, ${commentCountSql('p')},
        ${attachmentJsonSql}
       FROM posts p
       JOIN profiles owner ON owner.id = p.profile_id
       LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p')}
       WHERE p.profile_id != $1 AND p.visibility = 'public'
       GROUP BY p.id, owner.id
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toPost))
  } catch (err) {
    console.error('GET /posts/explore error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        owner.id AS author_id, owner.name AS author_name, owner.handle AS author_handle, owner.avatar AS author_avatar, owner.is_system AS author_is_system,
        ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$2')}, ${commentCountSql('p')},
        ${attachmentJsonSql},
        (SELECT COALESCE(jsonb_agg(t.slug ORDER BY t.slug), '[]'::jsonb)
         FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id) AS tags
       FROM posts p
       JOIN profiles owner ON owner.id = p.profile_id
       LEFT JOIN post_attachments a ON a.post_id = p.id AND a.profile_id = p.profile_id AND ${attachmentVisibleSql('a', 'p').replaceAll('$1', '$2')}
       WHERE p.id = $1 AND ${visibleSql('p').replaceAll('$1', '$2')}
       GROUP BY p.id, owner.id`,
      [req.params.id, req.user.profileId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post não encontrado.' })
    const row = result.rows[0]
    if (row.is_time_capsule && row.unlock_at && new Date(row.unlock_at) > new Date() && !row.opened_at) {
      return res.status(423).json({
        error: 'capsule_locked',
        id: row.id,
        unlockAt: row.unlock_at,
        createdAt: row.created_at,
      })
    }
    res.json(toPost(row))
  } catch (err) {
    console.error('GET /posts/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// POST /api/posts
router.post('/', async (req, res) => {
  const client = await pool.connect()
  try {
    const { content, type, isDiary, isPrivate, visibility, hasAttachments, codeBlock, isArticle, articleTitle, collectionId, tags, linkPreview, isTimeCapsule, unlockAt, projectId, parentMemoryPostId, categoria } = req.body

    const cleanContent = (content || '').trim()
    const cleanCode = typeof codeBlock?.code === 'string' ? codeBlock.code.trimEnd() : ''
    const codeLanguage = codeBlock?.language || null
    const cleanTitle = typeof articleTitle === 'string' ? articleTitle.trim().slice(0, 500) : null
    const cleanVisibility = normalizeVisibility(visibility, isPrivate === true ? 'private' : 'private')

    if (!cleanContent && !cleanCode && hasAttachments !== true) {
      client.release()
      return res.status(400).json({ error: 'Post deve ter texto, código ou anexo.' })
    }
    if (cleanCode && !CODE_LANGUAGES.has(codeLanguage)) {
      client.release()
      return res.status(400).json({ error: 'Linguagem de código inválida.' })
    }
    if (cleanCode.length > MAX_CODE_LENGTH) {
      client.release()
      return res.status(400).json({ error: 'Código deve ter no máximo 50 mil caracteres.' })
    }

    // Validate linkPreview structure
    let cleanLinkPreview = null
    if (linkPreview && typeof linkPreview === 'object' && typeof linkPreview.url === 'string') {
      cleanLinkPreview = {
        url: linkPreview.url.slice(0, 500),
        title: linkPreview.title?.slice(0, 200) || null,
        description: linkPreview.description?.slice(0, 400) || null,
        image: typeof linkPreview.image === 'string' && linkPreview.image.startsWith('http') ? linkPreview.image.slice(0, 500) : null,
        siteName: linkPreview.siteName?.slice(0, 100) || null,
        domain: linkPreview.domain?.slice(0, 100) || null,
      }
    }

    // Duplicate check — text-only posts only; never block when files are attached
    const isTextOnly = hasAttachments !== true
    const hasRealText = cleanContent.length >= 4
    const hasRealCode = Boolean(cleanCode)

    if (isTextOnly && (hasRealText || hasRealCode)) {
      const dupCheck = await pool.query(
        `SELECT id FROM posts
         WHERE profile_id = $1
           AND LOWER(TRIM(content)) = LOWER(TRIM($2))
           AND COALESCE(LOWER(TRIM(code_content)), '') = COALESCE(LOWER(TRIM($3)), '')
           AND NOT EXISTS (SELECT 1 FROM post_attachments WHERE post_id = posts.id)
           AND created_at > NOW() - INTERVAL '30 days'
         LIMIT 1`,
        [req.user.profileId, cleanContent, cleanCode || '']
      )
      if (dupCheck.rows.length > 0) {
        client.release()
        return res.status(409).json({ error: 'Você já guardou um texto muito parecido.' })
      }
    }

    await client.query('BEGIN')

    // Validate collectionId
    let validCollectionId = null
    if (collectionId) {
      const col = await client.query('SELECT id FROM collections WHERE id = $1 AND profile_id = $2', [collectionId, req.user.profileId])
      if (col.rows.length > 0) validCollectionId = collectionId
    }

    // Validate projectId
    let validProjectId = null
    if (projectId) {
      const proj = await client.query('SELECT id FROM projects WHERE id = $1 AND profile_id = $2', [projectId, req.user.profileId])
      if (proj.rows.length > 0) validProjectId = projectId
    }

    // Validate parentMemoryPostId
    let validParentMemoryPostId = null
    if (parentMemoryPostId) {
      const parent = await client.query('SELECT id FROM posts WHERE id = $1 AND profile_id = $2', [parentMemoryPostId, req.user.profileId])
      if (parent.rows.length > 0) validParentMemoryPostId = parentMemoryPostId
    }

    // Validate unlockAt for time capsules — date must be valid and in the future
    let isCapsule = false
    let cleanUnlockAt = null
    if (isTimeCapsule === true && unlockAt) {
      const d = new Date(unlockAt)
      if (!isNaN(d.getTime()) && d > new Date()) {
        isCapsule = true
        cleanUnlockAt = d.toISOString()
      } else {
        // Date is invalid or in the past — reject to avoid capsule with null unlock_at
        await client.query('ROLLBACK')
        client.release()
        return res.status(400).json({ error: 'A data de abertura da cápsula deve ser no futuro.' })
      }
    }

    const VALID_CATEGORIAS = new Set(['pensamento','reflexão','ideia','aprendizado','decisão','observação','memória','citação','meta'])
    const cleanCategoria = typeof categoria === 'string' && VALID_CATEGORIAS.has(categoria) ? categoria : null

    const result = await client.query(
      `INSERT INTO posts (profile_id, content, type, is_diary, is_private, visibility, code_language, code_content, is_article, article_title, collection_id, link_preview, is_time_capsule, unlock_at, project_id, parent_memory_post_id, categoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        req.user.profileId, cleanContent, type || 'pensamento', isDiary === true,
        cleanVisibility === 'private', cleanVisibility,
        cleanCode ? codeLanguage : null, cleanCode || null,
        isArticle === true, cleanTitle || null, validCollectionId,
        cleanLinkPreview ? JSON.stringify(cleanLinkPreview) : null,
        isCapsule ? true : false, cleanUnlockAt, validProjectId,
        validParentMemoryPostId, cleanCategoria,
      ]
    )
    const postId = result.rows[0].id

    // Apply tags
    const tagSlugs = Array.isArray(tags) ? tags.map(s => s.replace(/^#/, '').toLowerCase().trim()).filter(Boolean).slice(0, 10) : []
    for (const slug of tagSlugs) {
      const tag = await client.query(
        `INSERT INTO tags (profile_id, name, slug) VALUES ($1, $2, $3)
         ON CONFLICT (profile_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [req.user.profileId, slug, slug]
      )
      await client.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, tag.rows[0].id])
    }

    await client.query('COMMIT')
    // Notify @mentions after transaction commits (non-blocking)
    const postContent = cleanContent + (cleanTitle ? ` ${cleanTitle}` : '')
    notifyMentions(postContent, req.user.profileId, postId).catch(err => console.error('[mentions] post error:', err.message))
    res.status(201).json({ ...toPost(result.rows[0]), tags: tagSlugs })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('POST /posts error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  } finally {
    client.release()
  }
})

// PATCH /api/posts/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body

    const check = await pool.query(
      `SELECT p.* FROM posts p WHERE p.id = $1 AND ${visibleSql('p').replaceAll('$1', '$2')}`,
      [id, req.user.profileId]
    )
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado.' })
    }

    const post = check.rows[0]
    let result

    if (action === 'react') {
      const reactionType = req.body.reactionType
      if (!REACTIONS.has(reactionType)) return res.status(400).json({ error: 'Reação inválida.' })

      const existing = await pool.query(
        'SELECT id, reaction_type FROM post_reactions WHERE post_id = $1 AND profile_id = $2 AND reaction_type = $3',
        [id, req.user.profileId, reactionType]
      )

      if (existing.rowCount > 0) {
        // Toggle off
        await pool.query('DELETE FROM post_reactions WHERE id = $1', [existing.rows[0].id])
      } else {
        // Primary reactions are mutually exclusive — remove any existing primary reaction first
        if (PRIMARY_REACTIONS.has(reactionType)) {
          await pool.query(
            `DELETE FROM post_reactions WHERE post_id = $1 AND profile_id = $2
             AND reaction_type = ANY($3::text[])`,
            [id, req.user.profileId, [...PRIMARY_REACTIONS]]
          )
        }
        await pool.query(
          'INSERT INTO post_reactions (post_id, profile_id, reaction_type) VALUES ($1, $2, $3)',
          [id, req.user.profileId, reactionType]
        )
        if (reactionType === 'heart') {
          const actor = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
          await notifyPostOwner(post, req.user.profileId, 'like', `${actor.rows[0]?.name || 'Alguém'} curtiu seu post.`)
        }
      }
      const updated = await pool.query(
        `SELECT p.*, ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$2')}, ${commentCountSql('p')}
         FROM posts p WHERE p.id = $1`,
        [id, req.user.profileId]
      )
      return res.json(toPost(updated.rows[0]))
    }

    if (action === 'like') {
      req.body.action = 'react'
      req.body.reactionType = 'heart'
      const existing = await pool.query(
        'SELECT id FROM post_reactions WHERE post_id = $1 AND profile_id = $2 AND reaction_type = $3',
        [id, req.user.profileId, 'heart']
      )
      if (existing.rowCount > 0) {
        await pool.query('DELETE FROM post_reactions WHERE id = $1', [existing.rows[0].id])
      } else {
        await pool.query(
          'INSERT INTO post_reactions (post_id, profile_id, reaction_type) VALUES ($1, $2, $3)',
          [id, req.user.profileId, 'heart']
        )
        const actor = await pool.query('SELECT name FROM profiles WHERE id = $1', [req.user.profileId])
        await notifyPostOwner(post, req.user.profileId, 'like', `${actor.rows[0]?.name || 'Alguém'} curtiu seu post.`)
      }
      const updated = await pool.query(
        `SELECT p.*, ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$2')}, ${commentCountSql('p')}
         FROM posts p WHERE p.id = $1`,
        [id, req.user.profileId]
      )
      return res.json(toPost(updated.rows[0]))
    } else if (action === 'save') {
      const existing = await pool.query(
        'SELECT id FROM post_reactions WHERE post_id = $1 AND profile_id = $2 AND reaction_type = $3',
        [id, req.user.profileId, 'save']
      )
      if (existing.rowCount > 0) {
        await pool.query('DELETE FROM post_reactions WHERE id = $1', [existing.rows[0].id])
      } else {
        await pool.query(
          'INSERT INTO post_reactions (post_id, profile_id, reaction_type) VALUES ($1, $2, $3)',
          [id, req.user.profileId, 'save']
        )
      }
      const updated = await pool.query(
        `SELECT p.*, ${reactionCountsSql('p')}, ${viewerReactionsSql('p', '$2')}, ${commentCountSql('p')}
         FROM posts p WHERE p.id = $1`,
        [id, req.user.profileId]
      )
      return res.json(toPost(updated.rows[0]))
    }

    if (post.profile_id !== req.user.profileId) {
      return res.status(403).json({ error: 'Apenas o proprietário pode alterar este conteúdo.' })
    }

    if (action === 'legacy-like') {
      const newLiked = !post.liked
      const newCount = newLiked ? post.like_count + 1 : post.like_count - 1
      result = await pool.query(
        `UPDATE posts SET liked = $1, like_count = $2, updated_at = now()
         WHERE id = $3 RETURNING *`,
        [newLiked, Math.max(0, newCount), id]
      )
    } else if (action === 'pin') {
      const MAX_PINS = 5
      const newPinned = !post.pinned

      if (newPinned) {
        const pinCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM posts WHERE profile_id = $1 AND pinned = true AND id != $2', [req.user.profileId, id])
        if (pinCount.rows[0].cnt >= MAX_PINS) {
          return res.status(400).json({ error: `Máximo de ${MAX_PINS} entradas fixadas.` })
        }
        const maxOrder = await pool.query('SELECT COALESCE(MAX(pin_order), 0) AS mo FROM posts WHERE profile_id = $1 AND pinned = true', [req.user.profileId])
        result = await pool.query(
          'UPDATE posts SET pinned = true, pin_order = $1, updated_at = now() WHERE id = $2 RETURNING *',
          [maxOrder.rows[0].mo + 1, id]
        )
      } else {
        result = await pool.query(
          'UPDATE posts SET pinned = false, pin_order = 0, updated_at = now() WHERE id = $1 RETURNING *',
          [id]
        )
      }
    } else if (action === 'edit') {
      const newContent = req.body.content
      const newTitle = req.body.articleTitle
      const newVis = req.body.visibility
      const newTags = req.body.tags
      if (!newContent?.trim()) return res.status(400).json({ error: 'Conteúdo não pode ser vazio.' })
      const vis = ['public', 'followers', 'friends', 'private'].includes(newVis) ? newVis : post.visibility
      const client3 = await pool.connect()
      try {
        await client3.query('BEGIN')
        const updated = await client3.query(
          `UPDATE posts SET content = $1, article_title = $2, visibility = $3, updated_at = now()
           WHERE id = $4 RETURNING *`,
          [newContent.trim(), post.is_article ? (newTitle?.trim() || null) : post.article_title, vis, id]
        )
        let finalTags = []
        if (Array.isArray(newTags)) {
          const slugs = newTags.map(s => String(s).replace(/^#/, '').toLowerCase().trim()).filter(Boolean).slice(0, 10)
          await client3.query('DELETE FROM post_tags WHERE post_id = $1', [id])
          for (const slug of slugs) {
            const tag = await client3.query(
              `INSERT INTO tags (profile_id, name, slug) VALUES ($1, $2, $3)
               ON CONFLICT (profile_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
              [req.user.profileId, slug, slug]
            )
            await client3.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tag.rows[0].id])
          }
          finalTags = slugs
        } else {
          const existing = await client3.query(
            `SELECT t.slug FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = $1`,
            [id]
          )
          finalTags = existing.rows.map(r => r.slug)
        }
        await client3.query('COMMIT')
        return res.json({ ...toPost(updated.rows[0]), tags: finalTags })
      } catch (e) {
        await client3.query('ROLLBACK').catch(() => {})
        throw e
      } finally {
        client3.release()
      }
    } else if (action === 'set-tags') {
      const tagSlugs = Array.isArray(req.body.tags) ? req.body.tags.map(s => String(s).replace(/^#/, '').toLowerCase().trim()).filter(Boolean).slice(0, 10) : []
      const client2 = await pool.connect()
      try {
        await client2.query('BEGIN')
        await client2.query('DELETE FROM post_tags WHERE post_id = $1', [id])
        for (const slug of tagSlugs) {
          const tag = await client2.query(
            `INSERT INTO tags (profile_id, name, slug) VALUES ($1, $2, $3)
             ON CONFLICT (profile_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
            [req.user.profileId, slug, slug]
          )
          await client2.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tag.rows[0].id])
        }
        await client2.query('COMMIT')
        return res.json({ id, tags: tagSlugs })
      } catch (e) {
        await client2.query('ROLLBACK').catch(() => {})
        throw e
      } finally {
        client2.release()
      }
    } else {
      return res.status(400).json({ error: 'Ação inválida.' })
    }

    res.json(toPost(result.rows[0]))
  } catch (err) {
    console.error('PATCH /posts/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

// DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const attachments = await pool.query(
      `SELECT storage_path FROM post_attachments
       WHERE post_id = $1 AND profile_id = $2`,
      [id, req.user.profileId]
    )
    const result = await pool.query('DELETE FROM posts WHERE id = $1 AND profile_id = $2', [id, req.user.profileId])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post não encontrado.' })
    }
    await Promise.all(attachments.rows.map(attachment =>
      fs.unlink(path.join(uploadDir, attachment.storage_path)).catch(err => {
        if (err.code !== 'ENOENT') console.error('delete post attachment file error:', err)
      })
    ))
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /posts/:id error:', err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  }
})

module.exports = router
