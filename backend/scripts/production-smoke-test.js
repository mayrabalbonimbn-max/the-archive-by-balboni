const fs = require('fs/promises')
const os = require('os')
const path = require('path')
const pool = require('../src/db')
require('dotenv').config()

const baseUrl = process.env.SMOKE_BASE_URL || 'https://social.balbonilab.com/api'
const suffix = Date.now().toString(36)
const password = `Smoke-${suffix}-Pass!`
const handles = [`@archive_smoke_a_${suffix}`, `@archive_smoke_b_${suffix}`]
const profileIds = []

async function request(route, { token, method = 'GET', body, form, expected = 200 } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  if (body) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  })
  if (response.status !== expected) {
    const text = await response.text()
    throw new Error(`${method} ${route}: expected ${expected}, got ${response.status}: ${text}`)
  }
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.arrayBuffer()
}

async function upload(token, route, name, type, content) {
  const form = new FormData()
  form.append('files', new Blob([content], { type }), name)
  return request(route, { token, method: 'POST', form, expected: 201 })
}

async function cleanup() {
  if (profileIds.length === 0) return
  const result = await pool.query(
    `SELECT storage_path FROM post_attachments WHERE profile_id = ANY($1::uuid[])
     UNION ALL
     SELECT avatar FROM profiles WHERE id = ANY($1::uuid[]) AND avatar ~ '^[a-f0-9-]{36}\\.'
     UNION ALL
     SELECT cover_image FROM profiles WHERE id = ANY($1::uuid[]) AND cover_image ~ '^[a-f0-9-]{36}\\.'`,
    [profileIds]
  )
  await pool.query('DELETE FROM profiles WHERE id = ANY($1::uuid[])', [profileIds])
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'storage', 'uploads')
  await Promise.all(result.rows.map(row => fs.unlink(path.join(uploadDir, row.storage_path)).catch(() => {})))
  await pool.end()
}

async function main() {
  const first = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Archive Smoke A', handle: handles[0], password },
    expected: 201,
  })
  const second = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Archive Smoke B', handle: handles[1], password },
    expected: 201,
  })
  profileIds.push(first.profile.id, second.profile.id)

  const login = await request('/auth/login', {
    method: 'POST', body: { handle: handles[0], password }, expected: 200,
  })
  const tokenA = login.token
  const tokenB = second.token

  const profile = await request('/me', {
    token: tokenA, method: 'PATCH', body: { interests: 'deploy, arquivo, testes' }, expected: 200,
  })
  if (!profile.interests.includes('deploy')) throw new Error('interests were not saved')

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n0sAAAAASUVORK5CYII=', 'base64')
  for (const kind of ['avatar', 'cover']) {
    const form = new FormData()
    form.append('file', new Blob([png], { type: 'image/png' }), `${kind}.png`)
    await request(`/me/media/${kind}`, { token: tokenA, method: 'POST', form })
    await request(`/me/media/${kind}`, { token: tokenA })
    await request(`/me/media/${kind}`, { expected: 401 })
  }

  const collection = await request('/collections', {
    token: tokenA, method: 'POST', body: { name: 'Smoke Collection', emoji: 'T', color: '#6366f1' }, expected: 201,
  })
  const textPost = await request('/posts', {
    token: tokenA, method: 'POST', body: { content: 'Smoke text post' }, expected: 201,
  })
  await request('/posts', {
    token: tokenA, method: 'POST', body: { content: 'Smoke code post', codeBlock: { language: 'python', code: 'print(1)' } }, expected: 201,
  })
  const article = await request('/posts', {
    token: tokenA,
    method: 'POST',
    body: { content: 'Smoke long article', isArticle: true, articleTitle: 'Smoke Article', collectionId: collection.id },
    expected: 201,
  })
  await request(`/posts/${article.id}`, { token: tokenA })

  const imagePost = await request('/posts', {
    token: tokenA, method: 'POST', body: { content: 'Image', hasAttachments: true }, expected: 201,
  })
  const imageAttachment = (await upload(tokenA, `/posts/${imagePost.id}/attachments`, 'smoke.png', 'image/png', png))[0]

  const fixtures = [
    ['smoke.py', 'text/x-python', 'print("archive")\n'],
    ['smoke.md', 'text/markdown', '# Archive\n'],
    ['smoke.pdf', 'application/pdf', '%PDF-1.4\n%%EOF\n'],
  ]
  for (const [name, type, content] of fixtures) {
    const post = await request('/posts', {
      token: tokenA, method: 'POST', body: { content: name, hasAttachments: true }, expected: 201,
    })
    await upload(tokenA, `/posts/${post.id}/attachments`, name, type, content)
  }

  const library = await request('/library?type=all', { token: tokenA })
  if (!fixtures.every(([name]) => library.some(file => file.originalName === name))) {
    throw new Error('library did not return every uploaded fixture')
  }
  await request(`/attachments/${imageAttachment.id}/view`, { token: tokenA })
  await request(`/attachments/${imageAttachment.id}/download`, { token: tokenA })
  await request(`/attachments/${imageAttachment.id}/view`, { token: tokenB, expected: 404 })
  await request(`/posts/${textPost.id}`, { token: tokenB, expected: 404 })
  const collectionsB = await request('/collections', { token: tokenB })
  const libraryB = await request('/library', { token: tokenB })
  if (collectionsB.length || libraryB.length) throw new Error('profile isolation failed')

  console.log(JSON.stringify({ ok: true, checks: 20, handles }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(cleanup)
