import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCollections } from '../hooks/useCollections'
import { api } from '../utils/api'
import EntryCard from '../components/ui/EntryCard'

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

export default function CollectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { collections, loading: collectionsLoading } = useCollections()
  const [posts, setPosts] = useState(null)

  const collection = collections.find(c => c.id === id)

  useEffect(() => {
    setPosts(null)
    api.get(`/collections/${id}/posts`)
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [id])

  if (collectionsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!collection) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)' }}>Coleção não encontrada.</p>
        <button
          onClick={() => navigate(-1)}
          style={{ marginTop: 12, fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 'env(safe-area-inset-top, 0px)', zIndex: 10,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0, touchAction: 'manipulation' }}
        >
          <BackIcon />
        </button>

        <div
          style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            background: `${collection.color}22`,
            border: `1.5px solid ${collection.color}55`,
          }}
        >
          {collection.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {collection.name}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>
            {posts ? `${posts.length} ${posts.length === 1 ? 'entrada' : 'entradas'}` : '…'}
          </div>
        </div>
      </div>

      {/* Body */}
      {!posts ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: '52px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>{collection.emoji}</div>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', fontWeight: 400 }}>
            {collection.name} ainda está vazia.
          </p>
          <p style={{ margin: '0 0 20px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 300, marginInline: 'auto' }}>
            Ao criar uma entrada, selecione <span style={{ color: 'var(--accent)' }}>{collection.name}</span> no campo Coleção para adicioná-la aqui.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-compose'))}
            style={{
              padding: '10px 22px', borderRadius: 12,
              background: 'var(--accent)', border: 'none',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
            }}
          >
            Escrever entrada
          </button>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {posts.map(post => (
            <EntryCard key={post.id} post={post} showAuthor={false} />
          ))}
        </div>
      )}
    </div>
  )
}
