import { useCallback, useEffect, useState } from 'react'
import { api } from '../utils/api'

export function useFriends() {
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [friendList, requests] = await Promise.all([
      api.get('/friends'),
      api.get('/friends/requests'),
    ])
    setFriends(friendList)
    setIncoming(requests.incoming || [])
    setOutgoing(requests.outgoing || [])
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const sendInvite = useCallback(async (target) => {
    await api.post('/friends/requests', target.handle ? { handle: target.handle } : { receiverId: target.id })
    await refresh()
  }, [refresh])

  const respondInvite = useCallback(async (id, action) => {
    await api.patch(`/friends/requests/${id}`, { action })
    await refresh()
  }, [refresh])

  const removeFriend = useCallback(async (profileId) => {
    await api.delete(`/friends/${profileId}`)
    await refresh()
  }, [refresh])

  const searchPeople = useCallback((q) => api.get(`/friends/search?q=${encodeURIComponent(q)}`), [])

  return { friends, incoming, outgoing, loading, refresh, sendInvite, respondInvite, removeFriend, searchPeople }
}
