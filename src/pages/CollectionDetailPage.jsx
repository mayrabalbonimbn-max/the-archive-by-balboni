import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCollections } from '../hooks/useCollections'
import PostCard from '../components/PostCard'

export default function CollectionDetailPage({ posts, profile, onLike, onSave, onPin, onDelete }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { collections, loading } = useCollections()

  const collection = collections.find(c => c.id === id)
  const collectionPosts = useMemo(
    () => posts.filter(p => p.collectionId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts, id]
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-dark-text/60">Coleção não encontrada.</p>
        <button onClick={() => navigate('/collections')} className="mt-3 text-brand-rose text-sm hover:underline">
          Voltar para coleções
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/collections')}
          className="text-dark-muted hover:text-dark-text transition-colors p-1 -ml-1 rounded-full hover:bg-dark-hover"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: collection.color + '22', border: `1.5px solid ${collection.color}44` }}
        >
          {collection.emoji}
        </div>
        <div>
          <h1 className="font-bold text-lg text-dark-text leading-tight">{collection.name}</h1>
          <p className="text-dark-muted text-xs">{collectionPosts.length} posts</p>
        </div>
      </div>

      {collectionPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="text-4xl mb-3">{collection.emoji}</div>
          <p className="text-dark-text/60 font-medium">Nenhum post nessa coleção</p>
          <p className="text-dark-muted text-sm mt-1">
            Ao criar um post, selecione "{collection.name}" para adicioná-lo aqui.
          </p>
        </div>
      ) : (
        collectionPosts.map(post => (
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
