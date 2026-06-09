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
    status: r.status,
    githubUrl: r.github_url || null,
    websiteUrl: r.website_url || null,
    coverImage: r.cover_image || null,
    tags: r.tags || [],
    isFeatured: r.is_featured || false,
    startDate: r.start_date || null,
    endDate: r.end_date || null,
    postCount: Number(r.post_count || 0),
    photoCount: Number(r.photo_count || 0),
    fileCount: Number(r.file_count || 0),
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

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*,
        (SELECT COUNT(*)::int FROM posts p WHERE p.project_id = pr.id AND (p.is_time_capsule = false OR p.is_time_capsule IS NULL)) AS post_count,
        (SELECT COUNT(*)::int FROM post_attachments a JOIN posts p ON p.id = a.post_id WHERE p.project_id = pr.id AND a.file_type = 'image') AS photo_count,
        (SELECT COUNT(*)::int FROM post_attachments a JOIN posts p ON p.id = a.post_id WHERE p.project_id = pr.id AND a.file_type != 'image') AS file_count
       FROM projects pr WHERE pr.profile_id = $1 ORDER BY pr.is_featured DESC, pr.created_at DESC`,
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
      `SELECT * FROM projects WHERE profile_id = $1 AND slug = $2`,
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
              p.code_language, p.is_time_capsule
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
      createdAt: r.created_at,
    })))
  } catch (err) {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { title, emoji, description, status, githubUrl, websiteUrl, tags, isFeatured, startDate, endDate } = req.body
    if (!title || !title.trim()) return res.status(400).json({ error: 'Título é obrigatório.' })

    const cleanTitle = title.trim().slice(0, 200)
    const slug = makeSlug(cleanTitle)
    const cleanStatus = VALID_STATUSES.includes(status) ? status : 'ativo'
    const cleanTags = Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).trim().slice(0, 30)) : []
    const cleanStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null
    const cleanEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null

    const result = await pool.query(
      `INSERT INTO projects (profile_id, title, slug, emoji, description, status, github_url, website_url, tags, is_featured, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.profileId, cleanTitle, slug,
        (emoji || '🌱').slice(0, 10),
        (description || '').slice(0, 2000),
        cleanStatus,
        typeof githubUrl === 'string' ? githubUrl.slice(0, 300) : null,
        typeof websiteUrl === 'string' ? websiteUrl.slice(0, 300) : null,
        cleanTags,
        isFeatured === true,
        cleanStartDate, cleanEndDate,
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
    const { title, emoji, description, status, githubUrl, websiteUrl, tags, isFeatured, startDate, endDate } = req.body
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
    const cleanStartDate = startDate !== undefined ? (startDate ? new Date(startDate).toISOString().split('T')[0] : null) : p.start_date
    const cleanEndDate = endDate !== undefined ? (endDate ? new Date(endDate).toISOString().split('T')[0] : null) : p.end_date

    const result = await pool.query(
      `UPDATE projects
       SET title=$1, slug=$2, emoji=$3, description=$4, status=$5, github_url=$6, website_url=$7, tags=$8, is_featured=$9, start_date=$10, end_date=$11, updated_at=now()
       WHERE id=$12 AND profile_id=$13
       RETURNING *`,
      [
        newTitle, newSlug,
        (emoji !== undefined ? emoji : p.emoji || '🌱').slice(0, 10),
        (description !== undefined ? description : p.description || '').slice(0, 2000),
        cleanStatus,
        githubUrl !== undefined ? (githubUrl || null) : p.github_url,
        websiteUrl !== undefined ? (websiteUrl || null) : p.website_url,
        cleanTags,
        isFeatured !== undefined ? isFeatured === true : p.is_featured,
        cleanStartDate, cleanEndDate,
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

module.exports = router
