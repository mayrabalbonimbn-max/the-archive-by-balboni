import { useEffect, useState } from 'react'
import { api } from '../utils/api'

const BASE = import.meta.env.VITE_API_URL || '/api'

async function fetchStoryBlob(id) {
  const token = localStorage.getItem('ms_token') ?? ''
  const res = await fetch(`${BASE}/stories/${id}/media`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return null
  return URL.createObjectURL(await res.blob())
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

function groupByDate(stories) {
  const groups = new Map()
  stories.forEach(s => {
    const key = new Date(s.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  })
  return [...groups.entries()]
}

function textStyle(fontKey) {
  if (fontKey === 'sans')  return { fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13 }
  if (fontKey === 'mono')  return { fontFamily: 'var(--mono)', fontSize: 11 }
  return { fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14 }
}

// ── StoryThumbnail ─────────────────────────────────────────────────────────────

function StoryThumbnail({ story, onClick }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const isExpired = new Date(story.expiresAt) < new Date()

  useEffect(() => {
    if (story.type !== 'photo') return
    let alive = true
    fetchStoryBlob(story.id).then(url => { if (alive && url) setBlobUrl(url) })
    return () => { alive = false }
  }, [story.id])

  return (
    <div
      onClick={onClick}
      style={{ width: '100%', aspectRatio: '9/16', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
    >
      {story.type === 'photo' ? (
        blobUrl
          ? <img src={blobUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin opacity-40" />
            </div>
      ) : (
        <div style={{ width: '100%', height: '100%', background: story.bgColor || '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <p style={{ ...textStyle(story.fontStyle), color: '#fff', textAlign: 'center', margin: 0, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
            {story.content}
          </p>
        </div>
      )}

      {/* Expired badge */}
      {isExpired && (
        <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 5px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>arquivo</span>
        </div>
      )}

      {/* Visibility badge */}
      <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
          {story.visibility === 'private' ? 'só eu' : story.visibility === 'friends' ? 'amigos' : 'público'}
        </span>
      </div>
    </div>
  )
}

// ── FullscreenView ─────────────────────────────────────────────────────────────

function FullscreenView({ story, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null)

  useEffect(() => {
    if (story.type !== 'photo') return
    let alive = true
    fetchStoryBlob(story.id).then(url => { if (alive && url) setBlobUrl(url) })
    return () => { alive = false }
  }, [story.id])

  const fs = story.fontStyle === 'sans'
    ? { fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 28 }
    : story.fontStyle === 'mono'
      ? { fontFamily: 'var(--mono)', fontSize: 20 }
      : { fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 30 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      {story.type === 'text' && <div style={{ position: 'absolute', inset: 0, background: story.bgColor || '#0a0a0a' }} />}
      {story.type === 'photo'
        ? blobUrl
          ? <img src={blobUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }} />
          : <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--sans)', fontSize: 13 }}>Carregando…</div>
        : <p style={{ ...fs, color: '#fff', textAlign: 'center', padding: '0 32px', position: 'relative', zIndex: 1, lineHeight: 1.45 }}>{story.content}</p>
      }
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{ position: 'absolute', top: 'max(20px, calc(env(safe-area-inset-top, 0px) + 14px))', right: 20, zIndex: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ×
      </button>
      <div style={{ position: 'absolute', bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))', left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {new Date(story.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

// ── StoriesArchivePage ─────────────────────────────────────────────────────────

export default function StoriesArchivePage() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    api.get('/stories/archive')
      .then(data => { setStories(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const groups = groupByDate(stories)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 8px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 8 }}>
          ARQUIVO
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 28, color: 'var(--ink)' }}>
          Momentos
        </h1>
        <p style={{ margin: '8px 0 0', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          Registros rápidos do que você viveu. Saem da superfície após 24h, mas nunca saem do seu arquivo.
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && stories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink-3)', margin: '0 0 10px' }}>
              Nenhum momento ainda.
            </p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)', margin: 0 }}>
              Registre seu primeiro momento pelo Arquivo.
            </p>
          </div>
        )}

        {groups.map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', padding: '20px 0 10px', textTransform: 'uppercase' }}>
              {dateLabel}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {items.map(s => (
                <StoryThumbnail key={s.id} story={s} onClick={() => setViewing(s)} />
              ))}
            </div>
          </div>
        ))}

        {!loading && stories.length > 0 && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
            {stories.length} {stories.length === 1 ? 'story guardado' : 'stories guardados'} no seu arquivo.
          </p>
        )}
      </div>

      {viewing && <FullscreenView story={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
