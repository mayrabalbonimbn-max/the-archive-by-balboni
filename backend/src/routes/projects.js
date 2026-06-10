const express = require('express')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

const VALID_STATUSES = ['ideia', 'construindo', 'ativo', 'pausado', 'concluído']

function toProject(r) {
  return {
    id: r.id,
    profileId: r.profile_id,
    title: r.title,
    slug: r.slug,
    emoji: r.emoji || '🌱',
    description: r.description || '',
    whatItIs: r.what_it_is || '',
    whatItSolves: r.what_it_solves || '',
    features: r.features || [],
    status: r.status,
    githubUrl: r.github_url || null,
    websiteUrl: r.website_url || null,
    coverImage: r.cover_image || null,
    color: r.color || null,
    tags: r.tags || [],
    isFeatured: r.is_featured || false,
    startedAt: r.started_at || null,
    completedAt: r.completed_at || null,
    postCount: Number(r.post_count || 0),
    photoCount: Number(r.photo_count || 0),
    fileCount: Number(r.file_count || 0),
    lastActivityAt: r.last_activity_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function makeSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function cleanTs(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// ─── Projects CRUD ────────────────────────────────────────────────────────────

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*,
        (SELECT COUNT(*)::int FROM posts p WHERE p.project_id = pr.id AND (p.is_time_capsule = false OR p.is_time_capsule IS NULL)) AS post_count,
        (SELECT COUNT(*)::int FROM post_attachments a JOIN posts p ON p.id = a.post_id WHERE p.project_id = pr.id AND a.file_type = 'image') AS photo_count,
        (SELECT COUNT(*)::int FROM post_attachments a JOIN posts p ON p.id = a.post_id WHERE p.project_id = pr.id AND a.file_type != 'image') AS file_count,
        (SELECT MAX(p.created_at) FROM posts p WHERE p.project_id = pr.id) AS last_activity_at
       FROM projects pr WHERE pr.profile_id = $1 ORDER BY pr.is_featured DESC, pr.updated_at DESC`,
      [req.user.profileId]
    )
    res.json(result.rows.map(toProject))
  } catch (err) {
    console.error('GET /projects error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /api/projects/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*,
        (SELECT COUNT(*)::int FROM posts p WHERE p.project_id = pr.id AND (p.is_time_capsule = false OR p.is_time_capsule IS NULL)) AS post_count,
        (SELECT COUNT(*)::int FROM post_attachments a JOIN posts p ON p.id = a.post_id WHERE p.project_id = pr.id AND a.file_type = 'image') AS photo_count,
        (SELECT COUNT(*)::int FROM post_attachments a JOIN posts p ON p.id = a.post_id WHERE p.project_id = pr.id AND a.file_type != 'image') AS file_count,
        (SELECT MAX(p.created_at) FROM posts p WHERE p.project_id = pr.id) AS last_activity_at
       FROM projects pr WHERE pr.profile_id = $1 AND pr.slug = $2`,
      [req.user.profileId, req.params.slug]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Projeto não encontrado.' })
    res.json(toProject(result.rows[0]))
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// GET /api/projects/:slug/posts
router.get('/:slug/posts', async (req, res) => {
  try {
    const proj = await pool.query(
      `SELECT id FROM projects WHERE profile_id = $1 AND slug = $2`,
      [req.user.profileId, req.params.slug]
    )
    if (!proj.rows.length) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const result = await pool.query(
      `SELECT p.id, p.content, p.type, p.is_article, p.article_title, p.created_at,
              p.code_language, p.is_time_capsule,
              (SELECT COUNT(*)::int FROM post_attachments a WHERE a.post_id = p.id AND a.file_type = 'image') AS photo_count
       FROM posts p
       WHERE p.project_id = $1 AND p.profile_id = $2 AND (p.is_time_capsule = false OR p.is_time_capsule IS NULL)
       ORDER BY p.created_at DESC`,
      [proj.rows[0].id, req.user.profileId]
    )
    res.json(result.rows.map(r => ({
      id: r.id,
      content: r.content,
      type: r.type,
      isArticle: r.is_article,
      articleTitle: r.article_title,
      codeLanguage: r.code_language,
      photoCount: Number(r.photo_count || 0),
      createdAt: r.created_at,
    })))
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { title, emoji, description, whatItIs, whatItSolves, features, status, githubUrl, websiteUrl, tags, isFeatured, startedAt, completedAt, color } = req.body
    if (!title || !title.trim()) return res.status(400).json({ error: 'Título é obrigatório.' })

    const cleanTitle = title.trim().slice(0, 200)
    const slug = makeSlug(cleanTitle)
    const cleanStatus = VALID_STATUSES.includes(status) ? status : 'ativo'
    const cleanTags = Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).trim().slice(0, 30)) : []
    const cleanFeatures = Array.isArray(features) ? features.slice(0, 20).map(f => String(f).trim().slice(0, 200)).filter(Boolean) : []

    const result = await pool.query(
      `INSERT INTO projects (profile_id, title, slug, emoji, description, what_it_is, what_it_solves, features, status, github_url, website_url, tags, is_featured, started_at, completed_at, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        req.user.profileId, cleanTitle, slug,
        (emoji || '🌱').slice(0, 10),
        (description || '').slice(0, 2000),
        (whatItIs || '').slice(0, 2000),
        (whatItSolves || '').slice(0, 2000),
        cleanFeatures,
        cleanStatus,
        typeof githubUrl === 'string' ? githubUrl.slice(0, 300) : null,
        typeof websiteUrl === 'string' ? websiteUrl.slice(0, 300) : null,
        cleanTags,
        isFeatured === true,
        cleanTs(startedAt),
        cleanTs(completedAt),
        typeof color === 'string' ? color.slice(0, 30) : null,
      ]
    )
    res.status(201).json(toProject(result.rows[0]))
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um projeto com este nome.' })
    console.error('POST /projects error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// PATCH /api/projects/:slug
router.patch('/:slug', async (req, res) => {
  try {
    const { title, emoji, description, whatItIs, whatItSolves, features, status, githubUrl, websiteUrl, tags, isFeatured, startedAt, completedAt, color } = req.body
    const current = await pool.query(
      `SELECT * FROM projects WHERE profile_id = $1 AND slug = $2`,
      [req.user.profileId, req.params.slug]
    )
    if (!current.rows.length) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const p = current.rows[0]

    const newTitle = title ? title.trim().slice(0, 200) : p.title
    const newSlug = title ? makeSlug(newTitle) : p.slug
    const cleanStatus = status && VALID_STATUSES.includes(status) ? status : p.status
    const cleanTags = Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).trim().slice(0, 30)) : p.tags
    const cleanFeatures = Array.isArray(features) ? features.slice(0, 20).map(f => String(f).trim().slice(0, 200)).filter(Boolean) : p.features

    const result = await pool.query(
      `UPDATE projects
       SET title=$1, slug=$2, emoji=$3, description=$4, what_it_is=$5, what_it_solves=$6, features=$7,
           status=$8, github_url=$9, website_url=$10, tags=$11, is_featured=$12,
           started_at=$13, completed_at=$14, color=$15,
           updated_at=now()
       WHERE id=$16 AND profile_id=$17
       RETURNING *`,
      [
        newTitle, newSlug,
        (emoji !== undefined ? emoji : p.emoji || '🌱').slice(0, 10),
        (description !== undefined ? description : p.description || '').slice(0, 2000),
        (whatItIs !== undefined ? whatItIs : p.what_it_is || '').slice(0, 2000),
        (whatItSolves !== undefined ? whatItSolves : p.what_it_solves || '').slice(0, 2000),
        cleanFeatures,
        cleanStatus,
        githubUrl !== undefined ? (githubUrl || null) : p.github_url,
        websiteUrl !== undefined ? (websiteUrl || null) : p.website_url,
        cleanTags,
        isFeatured !== undefined ? isFeatured === true : p.is_featured,
        startedAt !== undefined ? cleanTs(startedAt) : p.started_at,
        completedAt !== undefined ? cleanTs(completedAt) : p.completed_at,
        color !== undefined ? (color || null) : p.color,
        p.id, req.user.profileId,
      ]
    )
    res.json(toProject(result.rows[0]))
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um projeto com este nome.' })
    console.error('PATCH /projects error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// DELETE /api/projects/:slug
router.delete('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM projects WHERE profile_id = $1 AND slug = $2 RETURNING id`,
      [req.user.profileId, req.params.slug]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Projeto não encontrado.' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// ─── Milestones (MARCOS) ──────────────────────────────────────────────────────

async function getProjectId(slug, profileId) {
  const r = await pool.query(`SELECT id FROM projects WHERE profile_id = $1 AND slug = $2`, [profileId, slug])
  return r.rows[0]?.id || null
}

// GET /api/projects/:slug/milestones
router.get('/:slug/milestones', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const result = await pool.query(
      `SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [projectId]
    )
    res.json(result.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      reachedAt: r.reached_at || null,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
    })))
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/projects/:slug/milestones
router.post('/:slug/milestones', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const { title, description, reachedAt, sortOrder } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Título é obrigatório.' })

    const result = await pool.query(
      `INSERT INTO project_milestones (project_id, profile_id, title, description, reached_at, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        projectId, req.user.profileId,
        title.trim().slice(0, 200),
        (description || '').slice(0, 2000),
        reachedAt ? new Date(reachedAt).toISOString().split('T')[0] : null,
        typeof sortOrder === 'number' ? sortOrder : 0,
      ]
    )
    const r = result.rows[0]
    res.status(201).json({ id: r.id, title: r.title, description: r.description, reachedAt: r.reached_at, sortOrder: r.sort_order, createdAt: r.created_at })
  } catch (err) {
    console.error('POST /milestones error:', err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// PATCH /api/projects/:slug/milestones/:id
router.patch('/:slug/milestones/:id', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const { title, description, reachedAt, sortOrder } = req.body

    const cur = await pool.query(`SELECT * FROM project_milestones WHERE id = $1 AND project_id = $2`, [req.params.id, projectId])
    if (!cur.rows.length) return res.status(404).json({ error: 'Marco não encontrado.' })
    const m = cur.rows[0]

    const result = await pool.query(
      `UPDATE project_milestones SET title=$1, description=$2, reached_at=$3, sort_order=$4 WHERE id=$5 RETURNING *`,
      [
        title !== undefined ? title.trim().slice(0, 200) : m.title,
        description !== undefined ? description.slice(0, 2000) : m.description,
        reachedAt !== undefined ? (reachedAt ? new Date(reachedAt).toISOString().split('T')[0] : null) : m.reached_at,
        sortOrder !== undefined ? sortOrder : m.sort_order,
        req.params.id,
      ]
    )
    const r = result.rows[0]
    res.json({ id: r.id, title: r.title, description: r.description, reachedAt: r.reached_at, sortOrder: r.sort_order, createdAt: r.created_at })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// DELETE /api/projects/:slug/milestones/:id
router.delete('/:slug/milestones/:id', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    await pool.query(`DELETE FROM project_milestones WHERE id = $1 AND project_id = $2`, [req.params.id, projectId])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// ─── Learnings (APRENDIZADOS) ─────────────────────────────────────────────────

// GET /api/projects/:slug/learnings
router.get('/:slug/learnings', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const result = await pool.query(
      `SELECT * FROM project_learnings WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    )
    res.json(result.rows.map(r => ({ id: r.id, content: r.content, createdAt: r.created_at, updatedAt: r.updated_at })))
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/projects/:slug/learnings
router.post('/:slug/learnings', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Conteúdo é obrigatório.' })

    const result = await pool.query(
      `INSERT INTO project_learnings (project_id, profile_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [projectId, req.user.profileId, content.trim().slice(0, 2000)]
    )
    const r = result.rows[0]
    res.status(201).json({ id: r.id, content: r.content, createdAt: r.created_at, updatedAt: r.updated_at })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// PATCH /api/projects/:slug/learnings/:id
router.patch('/:slug/learnings/:id', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'Conteúdo é obrigatório.' })

    const result = await pool.query(
      `UPDATE project_learnings SET content=$1, updated_at=now() WHERE id=$2 AND project_id=$3 RETURNING *`,
      [content.trim().slice(0, 2000), req.params.id, projectId]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Aprendizado não encontrado.' })
    const r = result.rows[0]
    res.json({ id: r.id, content: r.content, createdAt: r.created_at, updatedAt: r.updated_at })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// DELETE /api/projects/:slug/learnings/:id
router.delete('/:slug/learnings/:id', async (req, res) => {
  try {
    const projectId = await getProjectId(req.params.slug, req.user.profileId)
    if (!projectId) return res.status(404).json({ error: 'Projeto não encontrado.' })
    await pool.query(`DELETE FROM project_learnings WHERE id = $1 AND project_id = $2`, [req.params.id, projectId])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

module.exports = router
