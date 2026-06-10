import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDatePT(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDuration(from, to) {
  const ms = new Date(to) - new Date(from)
  const totalDays = Math.floor(ms / 86400000)
  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)
  const days = totalDays % 30
  const parts = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`)
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`)
  return parts.join(', ')
}

function countdownParts(unlockAt) {
  const ms = new Date(unlockAt) - Date.now()
  if (ms <= 0) return null
  const totalDays = Math.floor(ms / 86400000)
  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)
  const days = totalDays % 30
  const hours = Math.floor((ms % 86400000) / 3600000)
  const parts = []
  if (years > 0) parts.push(`${years}a`)
  if (months > 0) parts.push(`${months}m`)
  if (totalDays > 0) parts.push(`${days}d`)
  else parts.push(`${hours}h`)
  return parts
}

// ── Keyframes (injected once) ─────────────────────────────────────────────────

const STYLES = `
  @keyframes capsuleSealBreak {
    0%   { transform: scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 24px rgba(232,108,180,0.5)); }
    30%  { transform: scale(1.5) rotate(-12deg); opacity: 0.7; }
    60%  { transform: scale(0.8) rotate(20deg); opacity: 0.3; }
    100% { transform: scale(0) rotate(30deg); opacity: 0; }
  }
  @keyframes capsuleEnvelopeGlow {
    0%, 100% { filter: drop-shadow(0 0 12px rgba(232,108,180,0.25)); }
    50%       { filter: drop-shadow(0 0 30px rgba(232,108,180,0.55)); }
  }
  @keyframes capsuleContentReveal {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes capsuleFlash {
    0%   { opacity: 0; }
    30%  { opacity: 0.12; }
    100% { opacity: 0; }
  }
  @keyframes capsuleSpinner {
    to { transform: rotate(360deg); }
  }
  @keyframes capsuleLockedPulse {
    0%, 100% { opacity: 0.15; }
    50%       { opacity: 0.25; }
  }
`

// ── Sub-views ─────────────────────────────────────────────────────────────────

function Meta({ label, value, accent }) {
  return (
    <div style={{ marginBottom: 14, textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontFamily: accent ? 'var(--serif)' : 'var(--mono)', fontStyle: accent ? 'italic' : 'normal', fontSize: accent ? 20 : 14, color: accent ? 'var(--ink)' : 'var(--ink-2)', margin: 0 }}>
        {value}
      </p>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px 0' }}>
      <div style={{ width: 60, height: 1, background: 'var(--line)' }} />
      <span style={{ margin: '0 12px', color: 'var(--ink-3)', fontSize: 10 }}>✦</span>
      <div style={{ width: 60, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

// ── LOCKED view ───────────────────────────────────────────────────────────────

function LockedView({ capsule }) {
  const parts = countdownParts(capsule.unlockAt)
  return (
    <div style={{ textAlign: 'center', animation: 'capsuleContentReveal 0.6s ease-out both' }}>
      <div style={{ fontSize: 64, marginBottom: 24, animation: 'capsuleLockedPulse 3s ease-in-out infinite' }}>
        ⧗
      </div>

      <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 24, color: 'var(--ink)', margin: '0 0 8px', lineHeight: 1.3 }}>
        Esta mensagem está guardada.
      </h1>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)', margin: '0 0 32px', lineHeight: 1.6 }}>
        Você a selou para chegar no momento certo.
      </p>

      <Divider />

      <Meta label="Escrita em" value={formatDatePT(capsule.createdAt)} />

      {parts && (
        <div style={{ margin: '20px 0 8px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>
            Abre em
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 10 }}>
            {parts.map((p, i) => (
              <div key={i} style={{
                background: 'rgba(232,108,180,0.06)', border: '1px solid rgba(232,108,180,0.15)',
                borderRadius: 10, padding: '12px 16px', minWidth: 56, textAlign: 'center',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--ink-2)' }}>{p}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 8 }}>
            {formatDatePT(capsule.unlockAt)}
          </p>
        </div>
      )}

      <Divider />

      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.75, maxWidth: 280, margin: '0 auto' }}>
        "O conteúdo desta cápsula permanece selado.<br />
        Volte em {formatDatePT(capsule.unlockAt)} para abri-la."
      </p>
    </div>
  )
}

// ── READY view ────────────────────────────────────────────────────────────────

function ReadyView({ capsule, onOpen, opening }) {
  const kept = formatDuration(capsule.createdAt, new Date().toISOString())
  return (
    <div style={{ textAlign: 'center', animation: 'capsuleContentReveal 0.6s ease-out both' }}>
      <div style={{
        fontSize: 64, marginBottom: 24,
        animation: opening ? 'capsuleSealBreak 1s ease-in-out forwards' : 'capsuleEnvelopeGlow 2.5s ease-in-out infinite',
      }}>
        ✉
      </div>

      <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 26, color: 'var(--ink)', margin: '0 0 8px', lineHeight: 1.35 }}>
        Uma mensagem sua<br />está esperando por você.
      </h1>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)', margin: '0 0 32px', lineHeight: 1.6 }}>
        Você a escreveu para este exato momento.
      </p>

      <Divider />

      <Meta label="Escrita em" value={formatDatePT(capsule.createdAt)} />
      <Meta label="Guardada por" value={kept} accent />

      <Divider />

      <button
        onClick={onOpen}
        disabled={opening}
        style={{
          width: '100%', maxWidth: 320, height: 56, borderRadius: 14,
          background: opening ? 'rgba(232,108,180,0.3)' : 'var(--accent)',
          border: 'none', cursor: opening ? 'default' : 'pointer',
          fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 600, color: '#fff',
          letterSpacing: '0.02em',
          boxShadow: opening ? 'none' : '0 8px 32px -8px rgba(232,108,180,0.5)',
          transition: 'all 0.3s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          margin: '0 auto',
        }}
      >
        {opening ? (
          <>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'capsuleSpinner 0.7s linear infinite' }} />
            Abrindo…
          </>
        ) : (
          'Abrir a cápsula →'
        )}
      </button>

      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', marginTop: 14 }}>
        Esta ação é permanente e não pode ser desfeita.
      </p>
    </div>
  )
}

// ── Media players ─────────────────────────────────────────────────────────────

function AudioPlayer({ attachment }) {
  const token = localStorage.getItem('ms_token')
  const src = `${API_BASE}/attachments/${attachment.id}/view?token=${encodeURIComponent(token)}`
  return (
    <div style={{
      padding: '20px', borderRadius: 16, background: 'rgba(232,108,180,0.06)',
      border: '1px solid rgba(232,108,180,0.15)', marginBottom: 28,
      animation: 'capsuleContentReveal 0.7s ease-out 0.2s both',
    }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 12px', textAlign: 'center' }}>
        🎙 Memória de voz
      </p>
      <audio controls src={src} style={{ width: '100%', colorScheme: 'dark' }} />
    </div>
  )
}

function VideoPlayer({ attachment }) {
  const token = localStorage.getItem('ms_token')
  const src = `${API_BASE}/attachments/${attachment.id}/view?token=${encodeURIComponent(token)}`
  return (
    <div style={{ marginBottom: 28, animation: 'capsuleContentReveal 0.7s ease-out 0.2s both' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 12px', textAlign: 'center' }}>
        🎬 Memória em vídeo
      </p>
      <video
        controls
        src={src}
        style={{ width: '100%', maxWidth: 480, borderRadius: 12, display: 'block', margin: '0 auto', background: '#000' }}
      />
    </div>
  )
}

// ── OPENED view ───────────────────────────────────────────────────────────────

function OpenedView({ capsule, fresh, attachments }) {
  const kept = formatDuration(capsule.createdAt, capsule.openedAt || new Date().toISOString())
  const paragraphs = (capsule.content || '').split(/\n{2,}/).filter(Boolean)
  const audioAttachment = attachments.find(a => a.fileType === 'audio')
  const videoAttachment = attachments.find(a => a.fileType === 'video')
  const hasMedia = Boolean(audioAttachment || videoAttachment)

  return (
    <div>
      {/* Flash when just opened */}
      {fresh && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(232,108,180,0.08)',
          animation: 'capsuleFlash 1.2s ease-out forwards', pointerEvents: 'none', zIndex: 10,
        }} />
      )}

      {/* Header metadata */}
      <div style={{
        textAlign: 'center', marginBottom: 32,
        animation: 'capsuleContentReveal 0.6s ease-out both',
      }}>
        <div style={{ fontSize: 32, marginBottom: 16, color: 'var(--accent)', opacity: 0.7 }}>✦</div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            ['Escrita em', formatDatePT(capsule.createdAt)],
            ['Aberta em', formatDatePT(capsule.openedAt)],
            ['Guardada por', kept],
          ].map(([label, value]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 3px' }}>{label}</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Audio or video player */}
      {audioAttachment && <AudioPlayer attachment={audioAttachment} />}
      {videoAttachment && <VideoPlayer attachment={videoAttachment} />}

      {/* Title */}
      {capsule.articleTitle && (
        <h1 style={{
          fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 28, color: 'var(--ink)',
          lineHeight: 1.3, margin: '0 0 28px', textAlign: 'center',
          animation: 'capsuleContentReveal 0.7s ease-out 0.2s both',
        }}>
          {capsule.articleTitle}
        </h1>
      )}

      {/* Content paragraphs — staggered reveal */}
      {(paragraphs.length > 0 || capsule.content) && (
        <div style={{ textAlign: 'left' }}>
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              style={{
                fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.85,
                color: 'var(--ink)', margin: '0 0 20px',
                animation: 'capsuleContentReveal 0.7s ease-out both',
                animationDelay: `${0.3 + idx * 0.25}s`,
              }}
            >
              {para}
            </p>
          ))}
          {paragraphs.length === 0 && capsule.content && (
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.85, color: 'var(--ink)', margin: 0,
              animation: 'capsuleContentReveal 0.7s ease-out 0.3s both',
            }}>
              {capsule.content}
            </p>
          )}
        </div>
      )}

      {(paragraphs.length > 0 || capsule.content || hasMedia) && <Divider />}

      <p style={{
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)',
        textAlign: 'center', lineHeight: 1.7,
        animation: `capsuleContentReveal 0.7s ease-out ${0.3 + Math.max(paragraphs.length, 1) * 0.25 + 0.3}s both`,
      }}>
        Uma mensagem da Mayra do passado,<br />
        guardada para este exato momento.
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CapsulePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [capsule, setCapsule] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | locked | ready | opening | opened
  const [fresh, setFresh] = useState(false) // true immediately after opening ceremony
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    api.get(`/capsules/${id}`)
      .then(data => {
        setCapsule(data)
        setPhase(data.status)
        if (data.status === 'opened') {
          api.get(`/posts/${data.id}/attachments`).then(setAttachments).catch(() => {})
        }
      })
      .catch(() => navigate('/capsules', { replace: true }))
  }, [id, navigate])

  const handleOpen = useCallback(async () => {
    setPhase('opening')
    try {
      const opened = await api.patch(`/capsules/${id}/open`)
      setCapsule(prev => ({ ...prev, ...opened }))
      // Give the seal-break animation time to finish (1s) before revealing
      await new Promise(r => setTimeout(r, 1100))
      // Fetch attachments now that it's opened
      api.get(`/posts/${id}/attachments`).then(setAttachments).catch(() => {})
      setFresh(true)
      setPhase('opened')
      // Remove fresh flag after flash animation
      setTimeout(() => setFresh(false), 2000)
    } catch {
      setPhase('ready')
    }
  }, [id])

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Apagar esta cápsula permanentemente?')) return
    try {
      await api.delete(`/capsules/${id}`)
      navigate('/capsules', { replace: true })
    } catch {}
  }, [id, navigate])

  return (
    <div style={{ minHeight: '100dvh', background: '#030303', position: 'relative' }}>
      <style>{STYLES}</style>

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'linear-gradient(to bottom, #030303 60%, transparent)',
      }}>
        <button
          onClick={() => navigate('/capsules')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em' }}
        >
          ← Cápsulas
        </button>

        {capsule && phase !== 'loading' && (
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', opacity: 0.5 }}
            title="Apagar cápsula"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main content — vertically centered */}
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px',
        maxWidth: 500, margin: '0 auto',
      }}>
        {phase === 'loading' && (
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'capsuleSpinner 0.7s linear infinite' }} />
        )}

        {phase === 'locked' && capsule && <LockedView capsule={capsule} />}

        {(phase === 'ready' || phase === 'opening') && capsule && (
          <ReadyView capsule={capsule} onOpen={handleOpen} opening={phase === 'opening'} />
        )}

        {phase === 'opened' && capsule && <OpenedView capsule={capsule} fresh={fresh} attachments={attachments} />}
      </div>
    </div>
  )
}
