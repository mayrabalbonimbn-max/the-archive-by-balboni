import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

export function usePosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async (q = '') => {
    const path = q ? `/posts?q=${encodeURIComponent(q)}` : '/posts'
    const data = await api.get(path)
    setPosts(data)
  }, [])

  useEffect(() => {
    fetchPosts().finally(() => setLoading(false))
  }, [fetchPosts])

  const addPost = useCallback(async (draft) => {
    const { attachments = [], tags = [], ...postDraft } = draft
    const post = await api.post('/posts', { ...postDraft, tags, hasAttachments: attachments.length > 0 })
    try {
      if (attachments.length > 0) {
        const form = new FormData()
        attachments.forEach(item => form.append('files', item.file || item))
        form.append('titles', JSON.stringify(attachments.map(item => item.title || '')))
        post.attachments = await api.upload(`/posts/${post.id}/attachments`, form)
      }
      setPosts(prev => [post, ...prev])
      return post
    } catch (err) {
      await api.delete(`/posts/${post.id}`).catch(() => {})
      throw err
    }
  }, [])

  const toggleLike = useCallback(async (id, reactionType = 'heart') => {
    // optimistic
    setPosts(prev => prev.map(p =>
      p.id === id && reactionType === 'heart' ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p
    ))
    try {
      const updated = await api.patch(`/posts/${id}`, { action: 'react', reactionType })
      setPosts(prev => prev.map(p => p.id === id ? { ...updated, attachments: p.attachments } : p))
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === id && reactionType === 'heart' ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount + 1 : p.likeCount - 1 } : p
      ))
    }
  }, [])

  const toggleSave = useCallback(async (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
    try {
      const updated = await api.patch(`/posts/${id}`, { action: 'save' })
      setPosts(prev => prev.map(p => p.id === id ? { ...updated, attachments: p.attachments } : p))
    } catch {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
    }
  }, [])

  const togglePin = useCallback(async (id) => {
    // Optimistic: unpin all, toggle target
    setPosts(prev => prev.map(p => {
      if (p.id === id) return { ...p, pinned: !p.pinned }
      return p.pinned ? { ...p, pinned: false } : p
    }))
    try {
      await api.patch(`/posts/${id}`, { action: 'pin' })
      // Re-fetch to get server state (backend unpins others)
      fetchPosts()
    } catch {
      fetchPosts() // revert by refetching
    }
  }, [fetchPosts])

  const deletePost = useCallback(async (id) => {
    setPosts(prev => prev.filter(p => p.id !== id))
    try {
      await api.delete(`/posts/${id}`)
    } catch {
      fetchPosts() // revert
    }
  }, [fetchPosts])

  const importPosts = useCallback(async (newPosts, replace = false) => {
    // Import posts via individual API calls
    if (replace) setPosts([])
    for (const p of newPosts) {
      try {
        await api.post('/posts', {
          content: p.content,
          type: p.type,
          isDiary: p.isDiary,
          isPrivate: p.isPrivate,
          codeBlock: p.codeBlock || null,
        })
      } catch {}
    }
    await fetchPosts()
  }, [fetchPosts])

  return { posts, loading, addPost, toggleLike, toggleSave, togglePin, deletePost, importPosts, fetchPosts }
}
