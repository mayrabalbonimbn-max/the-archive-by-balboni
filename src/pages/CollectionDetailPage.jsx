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

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
    </svg>
  )
}

function DeleteModal({ collection, onConfirm, onCancel, busy }) {
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg)', borderRadius: '20px 20px 0 0',
          padding: '28px 24px calc(28px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--line)',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 14, textAlign: 'center' }}>{collection.emoji}</div>
        <h2 style={{ margin: '0 0 10px', fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', fontWeight: 400, textAlign: 'center' }}>
          Excluir esta coleção?
        </h2>
        <p style={{ margin: '0 0 24px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, textAlign: 'center' }}>
          Os posts dentro dela <strong style={{ color: 'var(--ink-2)' }}>não serão apagados</strong>.
          Apenas a coleção <em>{collection.name}</em> será removida.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '14px', borderRadius: 13, border: 'none', cursor: busy ? 'default' : 'pointer',
              background: '#f7768e', color: '#fff',
              fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? 'Excluindo…' : 'Excluir coleção'}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '14px', borderRadius: 13, border: '1px solid var(--line)', cursor: 'pointer',
              background: 'transparent', color: 'var(--ink-2)',
              fontFamily: 'var(--sans)', fontSize: 15,
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CollectionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { collections, loading: collectionsLoading, deleteCollection } = useCollections()
  const [posts, setPosts] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const collection = collections.find(c => c.id === id)

  useEffect(() => {
    setPosts(null)
    api.get(`/collections/${id}/posts`)
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCollection(id)
      navigate('/collections', { replace: true })
    } catch {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

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

        {/* More menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: '4px', display: 'flex', alignItems: 'center', touchAction: 'manipulation' }}
          >
            <MoreIcon />
          </button>

          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{
                position: 'absolute', top: '100%', right: 0, zIndex: 50,
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '4px', minWidth: 180,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <button
                  onClick={() => { setShowMenu(false); setShowConfirm(true) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    borderRadius: 8, color: '#f7768e',
                    fontFamily: 'var(--sans)', fontSize: 14, textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(247,118,142,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  Excluir coleção
                </button>
              </div>
            </>
          )}
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

      {showConfirm && (
        <DeleteModal
          collection={collection}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          busy={deleting}
        />
      )}
    </div>
  )
}
