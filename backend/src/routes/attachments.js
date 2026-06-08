const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { attachmentVisibleSql } = require('../utils/social')

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 3

const allowed = {
  '.py': { mimeType: 'text/x-python; charset=utf-8', fileType: 'python' },
  '.md': { mimeType: 'text/markdown; charset=utf-8', fileType: 'markdown' },
  '.pdf': { mimeType: 'application/pdf', fileType: 'pdf' },
  '.jpg': { mimeType: 'image/jpeg', fileType: 'image' },
  '.jpeg': { mimeType: 'image/jpeg', fileType: 'image' },
  '.png': { mimeType: 'image/png', fileType: 'image' },
  '.webp': { mimeType: 'image/webp', fileType: 'image' },
}

function attachmentJson(row) {
  return {
    id: row.id,
    postId: row.post_id,
    originalName: row.original_name,
    title: row.title || null,
    description: row.description || '',
    mimeType: row.mime_type,
    size: Number(row.size),
    fileType: row.file_type,
    visibility: row.visibility,
    createdAt: row.created_at,
  }
}

function safeOriginalName(name) {
  return path.basename(name).replace(/[\r\n"]/g, '_')
}

async function removeUploadedFiles(files = []) {
  await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})))
}

async function hasValidContent(file) {
  const data = await fs.readFile(file.path)
  if (file.fileType === 'pdf') return data.subarray(0, 5).toString() === '%PDF-'
  if (file.fileType === 'python' || file.fileType === 'markdown') return !data.includes(0)
  if (file.canonicalMimeType === 'image/jpeg') return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (file.canonicalMimeType === 'image/png') return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (file.canonicalMimeType === 'image/webp') return data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP'
  return false
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => callback(null, uploadDir))
      .catch(callback)
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase()
    callback(null, `${crypto.randomUUID()}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_ATTACHMENTS },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase()
    const config = allowed[extension]
    if (!config) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
    }
    file.fileType = config.fileType
    file.canonicalMimeType = config.mimeType
    callback(null, true)
  },
})

async function ownedPost(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id FROM posts WHERE id = $1 AND profile_id = $2',
      [req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Post não encontrado.' })
    next()
  } catch (err) {
    next(err)
  }
}

async function ownedAttachment(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.* FROM post_attachments a
       JOIN posts p ON p.id = a.post_id
       WHERE a.id = $1 AND a.profile_id = $2 AND p.profile_id = $2`,
      [req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Anexo não encontrado.' })
    req.attachment = result.rows[0]
    next()
  } catch (err) {
    next(err)
  }
}

async function visibleAttachment(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT a.* FROM post_attachments a
       JOIN posts p ON p.id = a.post_id
       WHERE a.id = $1
         AND ${attachmentVisibleSql('a', 'p').replaceAll('$1', '$2')}`,
      [req.params.id, req.user.profileId]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Anexo não encontrado.' })
    req.attachment = result.rows[0]
    next()
  } catch (err) {
    next(err)
  }
}

router.post('/posts/:id/attachments', requireAuth, ownedPost, (req, res) => {
  upload.array('files', MAX_ATTACHMENTS)(req, res, async err => {
    if (err) {
      await removeUploadedFiles(req.files)
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Cada arquivo deve ter no máximo 10 MB.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Máximo de 3 anexos por post.'
          : 'Tipo de arquivo inválido. Use PY, MD, PDF, JPG, PNG ou WebP.'
      return res.status(400).json({ error: message })
    }

    const files = req.files || []
    if (files.length === 0) return res.status(400).json({ error: 'Selecione ao menos um arquivo.' })

    let client
    try {
      const validFiles = await Promise.all(files.map(hasValidContent))
      if (validFiles.some(valid => !valid)) {
        await removeUploadedFiles(files)
        return res.status(400).json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' })
      }

      client = await pool.connect()
      await client.query('BEGIN')
      await client.query('SELECT id FROM posts WHERE id = $1 FOR UPDATE', [req.params.id])
      const count = await client.query('SELECT count(*)::int AS count FROM post_attachments WHERE post_id = $1', [req.params.id])
      if (count.rows[0].count + files.length > MAX_ATTACHMENTS) {
        await client.query('ROLLBACK')
        await removeUploadedFiles(files)
        return res.status(400).json({ error: 'Máximo de 3 anexos por post.' })
      }

      const attachments = []
      let titles = []
      try {
        titles = JSON.parse(req.body.titles || '[]')
      } catch {
        titles = []
      }
      for (const file of files) {
        const title = typeof titles[attachments.length] === 'string' ? titles[attachments.length].trim().slice(0, 200) : null
        const result = await client.query(
          `INSERT INTO post_attachments
           (post_id, profile_id, original_name, title, stored_name, mime_type, size, file_type, storage_path, visibility)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, (SELECT visibility FROM posts WHERE id = $1)) RETURNING *`,
          [req.params.id, req.user.profileId, safeOriginalName(file.originalname), title || null, file.filename, file.canonicalMimeType, file.size, file.fileType, file.filename]
        )
        attachments.push(attachmentJson(result.rows[0]))
      }
      await client.query('COMMIT')
      res.status(201).json(attachments)
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {})
      await removeUploadedFiles(files)
      console.error('upload attachments error:', error)
      res.status(500).json({ error: 'Não foi possível salvar os anexos.' })
    } finally {
      client?.release()
    }
  })
})

router.get('/posts/:id/attachments', requireAuth, ownedPost, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM post_attachments WHERE post_id = $1 AND profile_id = $2 ORDER BY created_at, id',
      [req.params.id, req.user.profileId]
    )
    res.json(result.rows.map(attachmentJson))
  } catch (err) {
    next(err)
  }
})

router.get('/attachments/:id/download', requireAuth, visibleAttachment, (req, res) => {
  const filePath = path.join(uploadDir, req.attachment.storage_path)
  res.download(filePath, safeOriginalName(req.attachment.original_name), err => {
    if (err && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
  })
})

router.get('/attachments/:id/view', requireAuth, visibleAttachment, (req, res) => {
  const filePath = path.join(uploadDir, req.attachment.storage_path)
  res.type(req.attachment.mime_type)
  res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName(req.attachment.original_name)}"`)
  res.sendFile(filePath, err => {
    if (err && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
  })
})

router.delete('/attachments/:id', requireAuth, ownedAttachment, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM post_attachments WHERE id = $1 AND profile_id = $2', [req.params.id, req.user.profileId])
    await fs.unlink(path.join(uploadDir, req.attachment.storage_path)).catch(err => {
      if (err.code !== 'ENOENT') throw err
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  console.error('attachments error:', err)
  if (res.headersSent) return next(err)
  res.status(500).json({ error: 'Erro interno do servidor.' })
})

module.exports = router
