import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

export function useCollections() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCollections = useCallback(async () => {
    const data = await api.get('/collections')
    setCollections(data)
  }, [])

  useEffect(() => {
    fetchCollections().finally(() => setLoading(false))
  }, [fetchCollections])

  const createCollection = useCallback(async ({ name, emoji, color }) => {
    const col = await api.post('/collections', { name, emoji, color })
    setCollections(prev => [...prev, col])
    return col
  }, [])

  const updateCollection = useCallback(async (id, updates) => {
    const col = await api.patch(`/collections/${id}`, updates)
    setCollections(prev => prev.map(c => c.id === id ? col : c))
    return col
  }, [])

  const deleteCollection = useCallback(async (id) => {
    await api.delete(`/collections/${id}`)
    setCollections(prev => prev.filter(c => c.id !== id))
  }, [])

  return { collections, loading, createCollection, updateCollection, deleteCollection, refetch: fetchCollections }
}
