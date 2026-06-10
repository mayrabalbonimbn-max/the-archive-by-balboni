import { useEffect, useRef, useState } from 'react'
import { api } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function videoStreamUrl(id) {
  const token = localStorage.getItem('ms_token') ?? ''
  return `${API_BASE}/attachments/${id}/view?token=${encodeURIComponent(token)}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateGroup(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatSize(size) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`
}

function groupByDate(videos) {
  const groups = new Map()
  videos.forEach(v => {
    const key = formatDateGroup(v.createdAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(v)
  })
  return [...groups.entries()]
}

// ── VideoTile ──────────────────────────────────────────────────────────────────

function VideoTile({ video, onClick }) {
  const videoRef = useRef(null)
  const src = videoStreamUrl(video.id)

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden',
        background: '#0a0a0a', border: '1px solid var(--line)',
        cursor: 'pointer', aspectRatio: '16/9',
      }}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
      />
      {/* Play overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        transition: 'background 0.15s',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21"/></svg>
        </div>
      </div>
      {/* Caption if available */}
      {video.postContent && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
          padding: '20px 10px 8px',
        }}>
          <p style={{
            margin: 0, fontFamily: 'var(--sans)', fontSize: 11,
            color: 'rgba(255,255,255,0.85)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {video.postContent}
          </p>
        </div>
      )}
    </div>
  )
}

// ── FullscreenPlayer ───────────────────────────────────────────────────────────

function FullscreenPlayer({ video, onClose }) {
  const src = videoStreamUrl(video.id)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 14px)) 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
      }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>
          {formatDate(video.createdAt)}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>
      </div>

      {/* Video */}
      <video
        src={src}
        controls
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onClick={e => e.stopPropagation()}
      />

      {/* Bottom caption */}
      {video.postContent && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          padding: '32px 24px max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
        }}
          onClick={e => e.stopPropagation()}
        >
          <p style={{ margin: 0, fontFamily: 'var(--sans)', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
            {video.postContent}
          </p>
          <span style={{ display: 'block', marginTop: 4, fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            {formatSize(video.size)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── StoriesArchivePage (Momentos) ──────────────────────────────────────────────

export default function StoriesArchivePage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/archive/videos')
      .then(data => { setVideos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const groups = groupByDate(videos)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 8 }}>
          ARQUIVO
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 28, color: 'var(--ink)' }}>
          Momentos
        </h1>
        <p style={{ margin: '8px 0 0', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          Vídeos guardados — diário gravado, memórias especiais, registros que merecem mais que uma foto.
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px' }}>
              <rect x="2" y="6" width="14" height="12" rx="2"/>
              <path d="M16 9l6-3v12l-6-3"/>
            </svg>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink-3)', margin: '0 0 10px' }}>
              Nenhum vídeo ainda.
            </p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Grave um diário, um momento especial<br />ou algo que você quer lembrar.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none', border: '1px solid var(--line-strong)',
                borderRadius: 999, padding: '10px 24px', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)',
              }}
            >
              Criar primeiro vídeo →
            </button>
          </div>
        )}

        {groups.map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
              color: 'var(--ink-3)', padding: '20px 0 10px', textTransform: 'uppercase',
            }}>
              {dateLabel}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {items.map(v => (
                <VideoTile key={v.id} video={v} onClick={() => setViewing(v)} />
              ))}
            </div>
          </div>
        ))}

        {!loading && videos.length > 0 && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
            {videos.length} {videos.length === 1 ? 'vídeo guardado' : 'vídeos guardados'} no seu arquivo.
          </p>
        )}
      </div>

      {viewing && <FullscreenPlayer video={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
