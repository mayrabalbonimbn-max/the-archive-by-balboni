import { useState, useCallback } from 'react'
import { setUnauthorizedHandler } from '../utils/api'

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp < Date.now() / 1000) return null
    return { profileId: payload.profileId, handle: payload.handle }
  } catch { return null }
}

export function useSession() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('ms_token')
    if (!token) return null
    const parsed = parseToken(token)
    if (!parsed) { localStorage.removeItem('ms_token'); return null }
    return { ...parsed, token }
  })

  const login = useCallback((token) => {
    localStorage.setItem('ms_token', token)
    const parsed = parseToken(token)
    setSession(parsed ? { ...parsed, token } : null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ms_token')
    setSession(null)
  }, [])

  // Register handler so 401 responses auto-logout
  setUnauthorizedHandler(logout)

  return { session, login, logout }
}
