const SALT = 'ms_v1_salt_'

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(SALT + password)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password, hash) {
  if (hash === null) return true // no-password profiles
  const candidate = await hashPassword(password)
  return candidate === hash
}
