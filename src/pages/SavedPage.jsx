import { useMemo } from 'react'
import PostCard from '../components/PostCard'

export default function SavedPage({ posts, profile, searchQuery, onLike, onSave, onPin, onDelete }) {
  const savedPosts = useMemo(() => {
    let list = posts.filter(p => p.saved)
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.content.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [posts, searchQuery])

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <h1 className="font-bold text-xl text-dark-text">Salvos</h1>
        <p className="text-dark-muted text-sm">{savedPosts.length} posts salvos</p>
      </div>

      {savedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <p className="text-lg font-medium text-dark-text/50">Nada salvo ainda</p>
          <p className="text-sm mt-1">Salve posts usando o ícone de marcador ✨</p>
        </div>
      ) : (
        savedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            profile={profile}
            onLike={onLike}
            onSave={onSave}
            onPin={onPin}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}
