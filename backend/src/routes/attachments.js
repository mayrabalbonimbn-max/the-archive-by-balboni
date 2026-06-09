const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const pool = require('../db')
const requireAuth = require('../middleware/auth')
const { attachmentVisibleSql } = require('../utils/social')

let sharp
try { sharp = require('sharp') } catch { sharp = null }

let exifr
try { exifr = require('exifr') } catch { exifr = null }

const router = express.Router()
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')
const MAX_IMAGE_SIZE = 25 * 1024 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 3

const THUMB_WIDTH = 480
const OPT_WIDTH = 1600
const THUMB_QUALITY = 80
const OPT_QUALITY = 85

const allowed = {
  '.py':       { mimeType: 'text/x-python; charset=utf-8',   fileType: 'python' },
  '.md':       { mimeType: 'text/markdown; charset=utf-8',    fileType: 'markdown' },
  '.markdown': { mimeType: 'text/markdown; charset=utf-8',    fileType: 'markdown' },
  '.pdf':      { mimeType: 'application/pdf',                 fileType: 'pdf' },
  '.jpg':      { mimeType: 'image/jpeg',                      fileType: 'image' },
  '.jpeg':     { mimeType: 'image/jpeg',                      fileType: 'image' },
  '.png':      { mimeType: 'image/png',                       fileType: 'image' },
  '.webp':     { mimeType: 'image/webp',                      fileType: 'image' },
  '.js':       { mimeType: 'text/javascript; charset=utf-8',  fileType: 'code' },
  '.jsx':      { mimeType: 'text/javascript; charset=utf-8',  fileType: 'code' },
  '.ts':       { mimeType: 'text/typescript; charset=utf-8',  fileType: 'code' },
  '.tsx':      { mimeType: 'text/typescript; charset=utf-8',  fileType: 'code' },
  '.html':     { mimeType: 'text/html; charset=utf-8',        fileType: 'code' },
  '.css':      { mimeType: 'text/css; charset=utf-8',         fileType: 'code' },
  '.json':     { mimeType: 'application/json; charset=utf-8', fileType: 'code' },
  '.sql':      { mimeType: 'text/plain; charset=utf-8',       fileType: 'code' },
  '.sh':       { mimeType: 'text/plain; charset=utf-8',       fileType: 'code' },
  '.bash':     { mimeType: 'text/plain; charset=utf-8',       fileType: 'code' },
  '.txt':      { mimeType: 'text/plain; charset=utf-8',       fileType: 'code' },
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
    exifData: row.exif_data || null,
    hasThumbnail: !!row.thumbnail_path,
    hasOptimized: !!row.optimized_path,
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
  if (file.fileType === 'python' || file.fileType === 'markdown' || file.fileType === 'code') return !data.includes(0)
  if (file.canonicalMimeType === 'image/jpeg') return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  if (file.canonicalMimeType === 'image/png') return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (file.canonicalMimeType === 'image/webp') return data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP'
  return false
}

async function extractExif(filePath) {
  if (!exifr) return null
  try {
    const raw = await exifr.parse(filePath, {
      pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'ISOSpeedRatings', 'DateTimeOriginal', 'CreateDate'],
      gps: false,
    })
    if (!raw || Object.keys(raw).length === 0) return null

    const exif = {}
    const make = raw.Make?.trim() || ''
    const model = raw.Model?.trim() || ''
    if (model) exif.camera = make && !model.toLowerCase().startsWith(make.toLowerCase()) ? `${make} ${model}` : model
    if (raw.LensModel?.trim()) exif.lens = raw.LensModel.trim()
    if (raw.FocalLength) exif.focalLength = `${Math.round(raw.FocalLength)}mm`
    if (raw.FNumber) exif.aperture = `f/${raw.FNumber}`
    if (raw.ExposureTime) {
      const et = raw.ExposureTime
      exif.shutterSpeed = et < 1 ? `1/${Math.round(1 / et)}s` : `${et}s`
    }
    const iso = raw.ISO || raw.ISOSpeedRatings
    if (iso) exif.iso = Number(iso)
    const date = raw.DateTimeOriginal || raw.CreateDate
    if (date instanceof Date && !isNaN(date)) {
      exif.dateTaken = date.toISOString().split('T')[0]
    }
    return Object.keys(exif).length > 0 ? exif : null
  } catch {
    return null
  }
}

async function processImage(file) {
  if (!sharp || file.fileType !== 'image') return { thumbPath: null, optPath: null, exifData: null }

  const baseName = path.basename(file.filename, path.extname(file.filename))
  const thumbFilename = `${baseName}_thumb.webp`
  const optFilename = `${baseName}_opt.webp`
  const thumbDest = path.join(uploadDir, thumbFilename)
  const optDest = path.join(uploadDir, optFilename)
  const srcPath = path.join(uploadDir, file.filename)

  const [exifData] = await Promise.all([
    extractExif(srcPath).catch(() => null),
  ])

  try {
    const img = sharp(srcPath).rotate()

    await Promise.all([
      img.clone()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbDest),
      img.clone()
        .resize({ width: OPT_WIDTH, withoutEnlargement: true })
        .webp({ quality: OPT_QUALITY })
        .toFile(optDest),
    ])

    return { thumbPath: thumbFilename, optPath: optFilename, optMime: 'image/webp', exifData }
  } catch (err) {
    console.error('processImage error:', err.message)
    await fs.unlink(thumbDest).catch(() => {})
    await fs.unlink(optDest).catch(() => {})
    return { thumbPath: null, optPath: null, exifData }
  }
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
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_ATTACHMENTS },
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
        ? 'Arquivo muito grande. Imagens: máx. 25 MB. PDFs e scripts: máx. 10 MB.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Máximo de 3 anexos por post.'
          : 'Tipo de arquivo inválido. Use PDF, imagens (JPG, PNG, WebP), Markdown (MD), Python (PY) ou código (JS, TS, HTML, CSS, JSON, SQL, SH, TXT).'
      return res.status(400).json({ error: message })
    }

    const files = req.files || []
    if (files.length === 0) return res.status(400).json({ error: 'Selecione ao menos um arquivo.' })

    const oversized = files.filter(f => f.fileType !== 'image' && f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      await removeUploadedFiles(files)
      return res.status(400).json({ error: 'PDFs e scripts: máximo 10 MB cada.' })
    }

    let client
    try {
      const validFiles = await Promise.all(files.map(hasValidContent))
      if (validFiles.some(valid => !valid)) {
        await removeUploadedFiles(files)
        return res.status(400).json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' })
      }

      // Process images: generate thumbnail + optimized WebP, extract EXIF
      const processed = await Promise.all(files.map(processImage))

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
      try { titles = JSON.parse(req.body.titles || '[]') } catch { titles = [] }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const proc = processed[i]
        const title = typeof titles[i] === 'string' ? titles[i].trim().slice(0, 200) : null
        const result = await client.query(
          `INSERT INTO post_attachments
           (post_id, profile_id, original_name, title, stored_name, mime_type, size, file_type, storage_path,
            thumbnail_path, optimized_path, optimized_mime, exif_data, visibility)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            (SELECT visibility FROM posts WHERE id = $1)) RETURNING *`,
          [
            req.params.id, req.user.profileId,
            safeOriginalName(file.originalname), title || null,
            file.filename, file.canonicalMimeType, file.size, file.fileType, file.filename,
            proc.thumbPath || null, proc.optPath || null, proc.optMime || null,
            proc.exifData ? JSON.stringify(proc.exifData) : null,
          ]
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

// View: serve optimized WebP if available, else original
router.get('/attachments/:id/view', requireAuth, visibleAttachment, (req, res) => {
  const a = req.attachment
  const filePath = a.optimized_path
    ? path.join(uploadDir, a.optimized_path)
    : path.join(uploadDir, a.storage_path)
  const mimeType = a.optimized_path ? (a.optimized_mime || 'image/webp') : a.mime_type
  res.type(mimeType)
  res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName(a.original_name)}"`)
  res.sendFile(filePath, err => {
    if (!err) return
    // Fall back to original if optimized missing on disk
    if (a.optimized_path) {
      res.type(a.mime_type)
      res.sendFile(path.join(uploadDir, a.storage_path), e => {
        if (e && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
      })
    } else if (!res.headersSent) {
      res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
    }
  })
})

// Thumbnail: serve small WebP thumbnail if available, else view endpoint redirect
router.get('/attachments/:id/thumbnail', requireAuth, visibleAttachment, (req, res) => {
  const a = req.attachment
  if (!a.thumbnail_path) {
    // No thumbnail — serve optimized or original
    const filePath = a.optimized_path
      ? path.join(uploadDir, a.optimized_path)
      : path.join(uploadDir, a.storage_path)
    const mimeType = a.optimized_path ? (a.optimized_mime || 'image/webp') : a.mime_type
    res.type(mimeType)
    return res.sendFile(filePath, err => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
    })
  }
  res.type('image/webp')
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.sendFile(path.join(uploadDir, a.thumbnail_path), err => {
    if (!err) return
    res.sendFile(path.join(uploadDir, a.storage_path), e => {
      if (e && !res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado no storage.' })
    })
  })
})

router.delete('/attachments/:id', requireAuth, ownedAttachment, async (req, res, next) => {
  try {
    const a = req.attachment
    await pool.query('DELETE FROM post_attachments WHERE id = $1 AND profile_id = $2', [a.id, req.user.profileId])
    await Promise.all([
      fs.unlink(path.join(uploadDir, a.storage_path)).catch(e => { if (e.code !== 'ENOENT') console.error(e) }),
      a.thumbnail_path ? fs.unlink(path.join(uploadDir, a.thumbnail_path)).catch(() => {}) : null,
      a.optimized_path ? fs.unlink(path.join(uploadDir, a.optimized_path)).catch(() => {}) : null,
    ])
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
