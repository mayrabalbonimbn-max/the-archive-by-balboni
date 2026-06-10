const BASE = import.meta.env.VITE_API_URL || '/api'

let _onUnauthorized = null

export function setUnauthorizedHandler(fn) { _onUnauthorized = fn }

function getToken() { return localStorage.getItem('ms_token') }

async function readResponse(res) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()

  const text = await res.text()
  return text ? { error: text } : {}
}

async function authFetch(path, body) {
  const res = await fetch(`${BASE}/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await readResponse(res)
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
  return data
}

export async function apiFetch(path, options = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  Object.assign(headers, options.headers)

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    _onUnauthorized?.()
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (res.status === 204) return null
  const data = await readResponse(res)
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export async function attachmentBlob(id, disposition = 'view') {
  const token = getToken()
  const res = await fetch(`${BASE}/attachments/${id}/${disposition}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) _onUnauthorized?.()
  if (!res.ok) {
    const data = await readResponse(res)
    throw new Error(data.error || `Erro ${res.status}`)
  }
  return res.blob()
}

export async function profileMediaBlob(kind) {
  const token = getToken()
  const res = await fetch(`${BASE}/me/media/${kind}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) _onUnauthorized?.()
  if (!res.ok) throw new Error(`Erro ${res.status}`)
  return res.blob()
}

export async function publicProfileMediaBlob(profileId, kind) {
  const token = getToken()
  const res = await fetch(`${BASE}/profiles/${profileId}/media/${kind}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) _onUnauthorized?.()
  if (!res.ok) throw new Error(`Erro ${res.status}`)
  return res.blob()
}

export async function getSignupMode() {
  try {
    const res = await fetch(`${BASE}/auth/signup-mode`)
    if (!res.ok) return { mode: 'open' }
    return res.json()
  } catch {
    return { mode: 'open' }
  }
}

export const authApi = {
  login:         (credentials) => authFetch('/login', credentials),
  register:      (profile)     => authFetch('/register', profile),
  resetPassword: (data)        => authFetch('/reset-password', data),
}

export const api = {
  get:    (path)       => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body) => apiFetch(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
  upload: (path, form) => apiFetch(path, { method: 'POST', body: form }),
}

// Tags
export function getTags() { return apiFetch('/tags') }
export function createTag(name) { return apiFetch('/tags', { method: 'POST', body: JSON.stringify({ name }) }) }
export function setPostTags(postId, tags, names = {}) { return apiFetch(`/tags/post/${postId}`, { method: 'PUT', body: JSON.stringify({ tags, names }) }) }

export async function getPushVapidKey() {
  return apiFetch('/push/vapid-public-key')
}

export async function subscribePush(subscription) {
  return apiFetch('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) })
}

export async function unsubscribePush(endpoint) {
  return apiFetch('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) })
}

export async function sendTestPush() {
  return apiFetch('/push/test', { method: 'POST' })
}
