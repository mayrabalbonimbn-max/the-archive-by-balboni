const express = require('express')
const path = require('path')
const fs = require('fs/promises')
const fsSync = require('fs')
const pool = require('../db')
const requireAuth = require('../middleware/auth')

let archiver
try { archiver = require('archiver') } catch { archiver = null }

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/-+$/, '') || 'sem-titulo'
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function postToMarkdown(p) {
  const lines = []
  const typeLabel = p.is_article ? 'Artigo' : p.is_time_capsule ? 'Cápsula do Tempo' : (p.type || 'Nota')
  const title = p.article_title || (p.is_time_capsule ? 'Cápsula do Tempo' : null)
  if (title) lines.push(`# ${title}\n`)
  lines.push(`**Data:** ${fmtDate(p.created_at)}  `)
  lines.push(`**Tipo:** ${typeLabel}  `)
  if (p.categoria) lines.push(`**Categoria:** ${p.categoria}  `)
  if (Array.isArray(p.tags) && p.tags.length) lines.push(`**Tags:** ${p.tags.map(t => `#${t}`).join(' ')}  `)
  if (p.attachments?.length) {
    const media = p.attachments.map(a => `  - ${a.original_name} (${a.file_type})`).join('\n')
    lines.push(`**Mídias:**\n${media}  `)
  }
  lines.push('\n---\n')
  if (p.content) lines.push(p.content)
  if (p.code_content) lines.push(`\n\`\`\`${p.code_language || ''}\n${p.code_content}\n\`\`\``)
  return lines.join('\n')
}

router.get('/export',
  (req, res, next) => {
    if (req.query.token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${req.query.token}`
    }
    next()
  },
  requireAuth,
  async (req, res) => {
    const format = (req.query.format || 'json').toLowerCase()
    const profileId = req.user.profileId

    try {
      const [profileR, postsR, attachmentsR, projectsR, collectionsR, commentsR] = await Promise.all([
        pool.query(
          'SELECT id, name, handle, bio, created_at FROM profiles WHERE id = $1',
          [profileId]
        ),
        pool.query(`
          SELECT p.id, p.content, p.type, p.is_diary, p.is_private, p.visibility,
                 p.is_article, p.article_title, p.collection_id, p.project_id,
                 p.is_time_capsule, p.unlock_at, p.opened_at, p.categoria,
                 p.code_language, p.code_content, p.pinned, p.created_at, p.updated_at,
                 COALESCE(
                   (SELECT jsonb_agg(t.slug ORDER BY t.slug)
                    FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id),
                   '[]'::jsonb
                 ) AS tags
          FROM posts p
          WHERE p.profile_id = $1
          ORDER BY p.created_at DESC
        `, [profileId]),
        pool.query(
          'SELECT id, post_id, original_name, mime_type, size, file_type, storage_path, created_at FROM post_attachments WHERE profile_id = $1',
          [profileId]
        ),
        pool.query(
          'SELECT id, title, slug, description, status, emoji, color, tags, github_url, website_url, started_at, completed_at, created_at, updated_at FROM projects WHERE profile_id = $1 ORDER BY created_at DESC',
          [profileId]
        ),
        pool.query(
          'SELECT id, name, description, emoji, color, created_at FROM collections WHERE profile_id = $1 ORDER BY created_at DESC',
          [profileId]
        ),
        pool.query(`
          SELECT c.id, c.post_id, c.content, c.created_at, LEFT(p.content, 120) AS post_excerpt
          FROM comments c
          JOIN posts p ON p.id = c.post_id
          WHERE c.author_id = $1
          ORDER BY c.created_at DESC
        `, [profileId]),
      ])

      const profile = profileR.rows[0]
      const allPosts = postsR.rows
      const attachments = attachmentsR.rows
      const projects = projectsR.rows
      const collections = collectionsR.rows
      const comments = commentsR.rows

      const attByPost = {}
      for (const a of attachments) {
        if (!attByPost[a.post_id]) attByPost[a.post_id] = []
        attByPost[a.post_id].push(a)
      }

      const enrich = p => ({ ...p, attachments: attByPost[p.id] || [] })
      const posts = allPosts.filter(p => !p.is_article && !p.is_time_capsule).map(enrich)
      const articles = allPosts.filter(p => p.is_article).map(enrich)
      const capsules = allPosts.filter(p => p.is_time_capsule).map(enrich)

      const dateStr = new Date().toISOString().slice(0, 10)
      const exportedAt = new Date().toISOString()

      const fullExport = {
        exportedAt,
        version: '1.0',
        profile: {
          name: profile.name,
          handle: profile.handle,
          bio: profile.bio,
          memberSince: profile.created_at,
        },
        stats: {
          posts: posts.length,
          articles: articles.length,
          capsules: capsules.length,
          projects: projects.length,
          collections: collections.length,
          comments: comments.length,
          attachments: attachments.length,
        },
        posts,
        articles,
        capsules,
        projects,
        collections,
        comments,
      }

      // ── JSON ─────────────────────────────────────────────────────────────────
      if (format === 'json') {
        res.setHeader('Content-Disposition', `attachment; filename="arquivo-${dateStr}.json"`)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        return res.json(fullExport)
      }

      // ── MARKDOWN ─────────────────────────────────────────────────────────────
      if (format === 'markdown') {
        const parts = []
        parts.push(`# Arquivo · ${profile.name}`)
        parts.push(`\n> Exportado em ${fmtDate(exportedAt)} · ${allPosts.length} entradas · ${projects.length} projetos\n`)

        if (posts.length) {
          parts.push(`\n---\n\n## 📝 Entradas (${posts.length})\n`)
          for (const p of posts) parts.push(`\n${postToMarkdown(p)}\n\n---`)
        }

        if (articles.length) {
          parts.push(`\n---\n\n## 📄 Artigos (${articles.length})\n`)
          for (const p of articles) parts.push(`\n${postToMarkdown(p)}\n\n---`)
        }

        if (capsules.length) {
          parts.push(`\n---\n\n## ⧗ Cápsulas do Tempo (${capsules.length})\n`)
          for (const p of capsules) {
            const lines = [`### ${fmtDate(p.created_at)}`]
            if (p.opened_at) lines.push(`**Aberta em:** ${fmtDate(p.opened_at)}`)
            else lines.push(`**Abre em:** ${fmtDate(p.unlock_at)}\n\n*(conteúdo selado)*`)
            if (p.opened_at && p.content) { lines.push('\n---\n'); lines.push(p.content) }
            parts.push(`\n${lines.join('\n')}\n\n---`)
          }
        }

        if (projects.length) {
          parts.push(`\n---\n\n## 🚀 Projetos (${projects.length})\n`)
          for (const p of projects) {
            const lines = [`### ${p.emoji || ''} ${p.title}`.trim()]
            lines.push(`**Status:** ${p.status || '—'}`)
            if (p.description) { lines.push(''); lines.push(p.description) }
            parts.push(`\n${lines.join('\n')}\n\n---`)
          }
        }

        if (collections.length) {
          parts.push(`\n---\n\n## 🗂 Coleções (${collections.length})\n`)
          for (const c of collections) {
            const lines = [`### ${c.emoji || ''} ${c.name}`.trim()]
            if (c.description) lines.push(c.description)
            parts.push(`\n${lines.join('\n')}\n\n---`)
          }
        }

        if (comments.length) {
          parts.push(`\n---\n\n## 💬 Comentários (${comments.length})\n`)
          for (const c of comments) {
            parts.push(`\n**${fmtDate(c.created_at)}** — sobre: *"${(c.post_excerpt || '').replace(/\n/g, ' ')}…"*\n\n${c.content}\n\n---`)
          }
        }

        const md = parts.join('\n')
        res.setHeader('Content-Disposition', `attachment; filename="arquivo-${dateStr}.md"`)
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        return res.send(md)
      }

      // ── ZIP ──────────────────────────────────────────────────────────────────
      if (format === 'zip') {
        if (!archiver) {
          return res.status(501).json({ error: 'Exportação ZIP indisponível no servidor. Use JSON ou Markdown.' })
        }

        res.setHeader('Content-Disposition', `attachment; filename="arquivo-${dateStr}.zip"`)
        res.setHeader('Content-Type', 'application/zip')

        const archive = archiver('zip', { zlib: { level: 6 } })
        archive.on('error', err => {
          console.error('archiver error:', err)
          if (!res.headersSent) res.status(500).end()
        })
        archive.pipe(res)

        archive.append(
          `# Arquivo · ${profile.name}\nExportado em ${exportedAt}\n\n## Estrutura\n- dados.json — exportação completa\n- entradas/ — notas e pensamentos\n- artigos/ — artigos e ensaios\n- capsulas/ — cápsulas do tempo\n- projetos/ — seus projetos\n- colecoes/ — suas coleções\n- comentarios.md — seus comentários\n- midias/ — fotos, áudios e vídeos\n`,
          { name: 'leiame.md' }
        )

        archive.append(JSON.stringify(fullExport, null, 2), { name: 'dados.json' })

        for (const p of posts) {
          const date = (p.created_at || '').slice(0, 10)
          const slug = slugify(p.content?.slice(0, 40))
          archive.append(postToMarkdown(p), { name: `entradas/${date}-${slug}.md` })
        }

        for (const p of articles) {
          const date = (p.created_at || '').slice(0, 10)
          const slug = slugify(p.article_title || p.content?.slice(0, 40))
          archive.append(postToMarkdown(p), { name: `artigos/${date}-${slug}.md` })
        }

        for (const p of capsules) {
          const date = (p.created_at || '').slice(0, 10)
          const lines = [`# Cápsula do Tempo\n\n**Criada em:** ${fmtDate(p.created_at)}`]
          if (p.opened_at) {
            lines.push(`**Aberta em:** ${fmtDate(p.opened_at)}`)
            if (p.content) { lines.push('\n---\n'); lines.push(p.content) }
          } else {
            lines.push(`**Abre em:** ${fmtDate(p.unlock_at)}\n\n*(conteúdo selado)*`)
          }
          archive.append(lines.join('\n'), { name: `capsulas/${date}.md` })
        }

        for (const p of projects) {
          const slug = slugify(p.title)
          const lines = [`# ${p.emoji || ''} ${p.title}`.trim(), `\n**Status:** ${p.status || '—'}`]
          if (p.description) lines.push(`\n${p.description}`)
          if (p.github_url) lines.push(`\n**GitHub:** ${p.github_url}`)
          if (p.website_url) lines.push(`\n**Website:** ${p.website_url}`)
          archive.append(lines.join('\n'), { name: `projetos/${slug}.md` })
        }

        for (const c of collections) {
          const slug = slugify(c.name)
          const lines = [`# ${c.emoji || ''} ${c.name}`.trim()]
          if (c.description) lines.push(`\n${c.description}`)
          archive.append(lines.join('\n'), { name: `colecoes/${slug}.md` })
        }

        if (comments.length) {
          const commentsMd = comments.map(c =>
            `**${fmtDate(c.created_at)}** — sobre: *"${(c.post_excerpt || '').replace(/\n/g, ' ')}…"*\n\n${c.content}`
          ).join('\n\n---\n\n')
          archive.append(`# Comentários\n\n${commentsMd}`, { name: 'comentarios.md' })
        }

        for (const att of attachments) {
          if (!att.storage_path) continue
          const filePath = path.join(uploadDir, att.storage_path)
          try {
            await fs.access(filePath)
            archive.file(filePath, { name: `midias/${att.post_id}/${att.original_name}` })
          } catch {
            // file missing on disk — skip silently
          }
        }

        await archive.finalize()
        return
      }

      res.status(400).json({ error: 'Formato inválido. Use: json, markdown ou zip.' })
    } catch (err) {
      console.error('export error:', err)
      if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar exportação.' })
    }
  }
)

module.exports = router
