const express = require('express')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

const PRIVATE_IP_RE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/i
const TIMEOUT_MS = 5000
const MAX_HTML_BYTES = 100_000

function isSafeUrl(raw) {
  try {
    const u = new URL(raw)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    const h = u.hostname
    if (PRIVATE_IP_RE.test(h)) return false
    // Block numeric IPs that might be private
    const parts = h.split('.').map(Number)
    if (parts.length === 4 && parts.every(n => n >= 0 && n <= 255)) {
      const [a, b] = parts
      if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31)) return false
    }
    return true
  } catch { return false }
}

function getMetaContent(html, ...props) {
  for (const prop of props) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']{1,500})["']|` +
      `<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:property|name)=["']${prop}["']`,
      'i'
    )
    const m = html.match(re)
    if (m) return (m[1] || m[2] || '').trim()
  }
  return null
}

function extractPreview(html, url) {
  const title = getMetaContent(html, 'og:title', 'twitter:title')
    || html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim()
    || null

  const description = getMetaContent(html, 'og:description', 'twitter:description', 'description')
  const image = getMetaContent(html, 'og:image', 'twitter:image:src', 'twitter:image')
  const siteName = getMetaContent(html, 'og:site_name')

  let parsed
  try { parsed = new URL(url) } catch { return null }

  return {
    url,
    title: title?.slice(0, 200) || null,
    description: description?.slice(0, 400) || null,
    image: image?.startsWith('http') ? image.slice(0, 500) : null,
    siteName: siteName || null,
    domain: parsed.hostname.replace(/^www\./, ''),
  }
}

// GET /api/link-preview?url=...
router.get('/', async (req, res) => {
  const rawUrl = (req.query.url || '').trim()
  if (!rawUrl) return res.status(400).json({ error: 'URL obrigatória.' })
  if (!isSafeUrl(rawUrl)) return res.status(400).json({ error: 'URL inválida ou não permitida.' })

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TheArchiveBot/1.0 (+link-preview)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
      return res.json({ url: rawUrl, title: null, description: null, image: null, siteName: null, domain: new URL(rawUrl).hostname.replace(/^www\./, '') })
    }

    const reader = response.body.getReader()
    const chunks = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done || total >= MAX_HTML_BYTES) break
      chunks.push(value)
      total += value.length
    }
    reader.cancel().catch(() => {})

    const html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8')
    const preview = extractPreview(html, rawUrl)
    res.json(preview || { url: rawUrl, title: null, description: null, image: null, siteName: null, domain: new URL(rawUrl).hostname.replace(/^www\./, '') })
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'Timeout ao carregar URL.' })
    console.error('link-preview error:', err.message)
    res.status(502).json({ error: 'Não foi possível carregar a prévia.' })
  }
})

module.exports = router
