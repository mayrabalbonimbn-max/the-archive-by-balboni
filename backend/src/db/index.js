const { Pool } = require('pg')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

pool.initialize = async function initialize() {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = await fs.readFile(schemaPath, 'utf8')
  await pool.query(schema)
}

pool.ensureAuthSchema = async function ensureAuthSchema() {
  await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT')
}

pool.migrateLegacyImages = async function migrateLegacyImages() {
  const column = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'image_data'`
  )
  if (column.rowCount === 0) return

  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })
  const legacy = await pool.query(
    `SELECT id, profile_id, image_data FROM posts
     WHERE image_data IS NOT NULL AND image_data != ''`
  )

  const mimeExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }

  for (const post of legacy.rows) {
    const match = post.image_data.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s)
    if (!match) continue
    const mimeType = match[1]
    const extension = mimeExtensions[mimeType]
    const storedName = `${crypto.randomUUID()}${extension}`
    const storagePath = path.join(uploadDir, storedName)
    const data = Buffer.from(match[2], 'base64')
    await fs.writeFile(storagePath, data, { flag: 'wx' })
    await pool.query(
      `INSERT INTO post_attachments
       (post_id, profile_id, original_name, stored_name, mime_type, size, file_type, storage_path)
       VALUES ($1, $2, $3, $4, $5, $6, 'image', $7)`,
      [post.id, post.profile_id, `imagem-legada${extension}`, storedName, mimeType, data.length, storedName]
    )
  }

  await pool.query('ALTER TABLE posts DROP COLUMN image_data')
}

pool.migrateLegacyProfileImages = async function migrateLegacyProfileImages() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads')
  const profiles = await pool.query(
    `SELECT id, avatar, cover_image FROM profiles
     WHERE avatar LIKE 'data:image/%;base64,%'
        OR cover_image LIKE 'data:image/%;base64,%'`
  )
  if (profiles.rowCount === 0) return

  await fs.mkdir(uploadDir, { recursive: true })
  const mimeExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }

  for (const profile of profiles.rows) {
    for (const column of ['avatar', 'cover_image']) {
      const value = profile[column]
      if (!value) continue
      const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s)
      if (!match) continue
      const storedName = `${crypto.randomUUID()}${mimeExtensions[match[1]]}`
      await fs.writeFile(path.join(uploadDir, storedName), Buffer.from(match[2], 'base64'), { flag: 'wx' })
      await pool.query(`UPDATE profiles SET ${column} = $1 WHERE id = $2`, [storedName, profile.id])
    }
  }
}

module.exports = pool
