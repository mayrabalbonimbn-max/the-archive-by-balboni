import { useEffect, useState } from 'react'
import { api } from '../utils/api'

// Returns a Set of profileIds that have active stories visible to the current user
let cache = null
let cacheTime = 0
const CACHE_TTL = 60_000

export function useStoryProfiles() {
  const [profileIds, setProfileIds] = useState(() => cache ?? new Set())

  useEffect(() => {
    const now = Date.now()
    if (cache && now - cacheTime < CACHE_TTL) {
      setProfileIds(cache)
      return
    }
    api.get('/stories').then(stories => {
      const ids = new Set(stories.map(s => s.profileId))
      cache = ids
      cacheTime = Date.now()
      setProfileIds(ids)
    }).catch(() => {})
  }, [])

  return profileIds
}
