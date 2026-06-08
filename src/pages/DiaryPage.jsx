import { useMemo } from 'react'
import PostCard from '../components/PostCard'

export default function DiaryPage({ posts, profile, searchQuery, onLike, onSave, onPin, onDelete }) {
  const diaryPosts = useMemo(() => {
    let list = posts.filter(p => p.isDiary)
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => p.content.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [posts, searchQuery])

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <h1 className="font-bold text-xl text-dark-text">Diário</h1>
        <p className="text-dark-muted text-sm">{diaryPosts.length} entradas</p>
      </div>

      {diaryPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
          </svg>
          <p className="text-lg font-medium text-dark-text/50">Diário vazio</p>
          <p className="text-sm mt-1">Marque um post como "Diário" ao publicar ✨</p>
        </div>
      ) : (
        diaryPosts.map(post => (
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
