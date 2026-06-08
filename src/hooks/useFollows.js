import { useCallback, useEffect, useState } from 'react'
import { api } from '../utils/api'

export function useFollows() {
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [followersData, followingData] = await Promise.all([
      api.get('/follows/followers'),
      api.get('/follows/following'),
    ])
    setFollowers(followersData)
    setFollowing(followingData)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const follow = useCallback(async (id) => {
    await api.post(`/follows/${id}`, {})
    await refresh()
  }, [refresh])

  const unfollow = useCallback(async (id) => {
    await api.delete(`/follows/${id}`)
    await refresh()
  }, [refresh])

  const searchPeople = useCallback((q) => api.get(`/follows/search?q=${encodeURIComponent(q)}`), [])

  return { followers, following, loading, refresh, follow, unfollow, searchPeople }
}
