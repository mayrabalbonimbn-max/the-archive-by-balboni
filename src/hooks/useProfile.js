import { useState, useEffect, useCallback, useRef } from 'react'
import { api, profileMediaBlob } from '../utils/api'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const mediaUrls = useRef({ avatar: null, cover: null })

  const hydrateMedia = useCallback(async (rawProfile) => {
    const next = { ...rawProfile }
    const entries = [
      ['avatar', 'avatar', rawProfile.hasAvatar && !rawProfile.avatar],
      ['cover', 'coverImage', rawProfile.hasCoverImage && !rawProfile.coverImage],
    ]

    await Promise.all(entries.map(async ([kind, field, shouldLoad]) => {
      if (mediaUrls.current[kind]) {
        URL.revokeObjectURL(mediaUrls.current[kind])
        mediaUrls.current[kind] = null
      }
      if (!shouldLoad) return
      try {
        const blob = await profileMediaBlob(kind)
        const url = URL.createObjectURL(blob)
        mediaUrls.current[kind] = url
        next[field] = url
      } catch {
        next[field] = null
      }
    }))

    setProfile(next)
    return next
  }, [])

  useEffect(() => {
    api.get('/me')
      .then(hydrateMedia)
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
    return () => {
      Object.values(mediaUrls.current).forEach(url => url && URL.revokeObjectURL(url))
    }
  }, [hydrateMedia])

  const updateProfile = useCallback(async (updates) => {
    const updated = await api.patch('/me', updates)
    return hydrateMedia(updated)
  }, [hydrateMedia])

  const uploadProfileMedia = useCallback(async (kind, file) => {
    const form = new FormData()
    form.append('file', file)
    const updated = await api.upload(`/me/media/${kind}`, form)
    return hydrateMedia(updated)
  }, [hydrateMedia])

  const removeProfileMedia = useCallback(async (kind) => {
    const updated = await api.delete(`/me/media/${kind}`)
    return hydrateMedia(updated)
  }, [hydrateMedia])

  const completeOnboarding = useCallback(async () => {
    setProfile(prev => prev ? { ...prev, onboardingCompleted: true } : prev)
    await api.patch('/me', { onboardingCompleted: true }).catch(() => {})
  }, [])

  const resetOnboarding = useCallback(async () => {
    await api.patch('/me', { onboardingCompleted: false }).catch(() => {})
    setProfile(prev => prev ? { ...prev, onboardingCompleted: false } : prev)
  }, [])

  return { profile, loading, updateProfile, uploadProfileMedia, removeProfileMedia, completeOnboarding, resetOnboarding }
}
