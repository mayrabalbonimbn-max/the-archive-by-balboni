import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

function formatDatePT(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function countdownShort(unlockAt) {
  const ms = new Date(unlockAt) - Date.now()
  if (ms <= 0) return 'agora'
  const days = Math.floor(ms / 86400000)
  if (days >= 365) { const y = Math.floor(days / 365); return `${y} ${y === 1 ? 'ano' : 'anos'}` }
  if (days >= 30)  { const m = Math.floor(days / 30);  return `${m} ${m === 1 ? 'mês' : 'meses'}` }
  if (days > 0)    return `${days} ${days === 1 ? 'dia' : 'dias'}`
  const h = Math.floor((ms % 86400000) / 3600000)
  return `${h}h`
}

function durationShort(from, to) {
  const ms = new Date(to) - new Date(from)
  const days = Math.floor(ms / 86400000)
  if (days >= 365) { const y = Math.floor(days / 365); return `${y} ${y === 1 ? 'ano' : 'anos'}` }
  if (days >= 30)  { const m = Math.floor(days / 30);  return `${m} ${m === 1 ? 'mês' : 'meses'}` }
  return `${days} ${days === 1 ? 'dia' : 'dias'}`
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function LockedCard({ capsule, onDelete, deleting }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/capsules/${capsule.id}`)}
      style={{
        padding: '20px 24px', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', position: 'relative', opacity: 0.65,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.65' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.5 }}>⧗</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Abre em {countdownShort(capsule.unlockAt)}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 6 }}>
        Esta mensagem está selada.
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
        Guardada em {formatDatePT(capsule.createdAt)} · abre em {formatDatePT(capsule.unlockAt)}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(capsule.id) }}
        disabled={deleting}
        style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
          opacity: deleting ? 0.2 : 0.4, padding: 8,
        }}
        title="Apagar"
      >✕</button>
    </div>
  )
}

function ReadyCard({ capsule, onDelete, deleting }) {
  const navigate = useNavigate()
  const kept = durationShort(capsule.createdAt, new Date().toISOString())
  return (
    <div
      onClick={() => navigate(`/capsules/${capsule.id}`)}
      style={{
        padding: '22px 24px', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', position: 'relative',
        borderLeft: '3px solid var(--accent)',
        background: 'rgba(232,108,180,0.04)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,108,180,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,108,180,0.04)' }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{
          background: 'var(--accent)', borderRadius: 999, display: 'inline-flex',
          alignItems: 'center', gap: 5, padding: '3px 10px',
        }}>
          <span style={{ fontSize: 9 }}>✦</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Pronta para abrir
          </span>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 8 }}>
        Uma mensagem sua está esperando.
      </div>

      <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.5 }}>
        Guardada por {kept} · toque para iniciar a abertura
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
        Escrita em {formatDatePT(capsule.createdAt)}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(capsule.id) }}
        disabled={deleting}
        style={{
          position: 'absolute', right: 20, top: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
          opacity: deleting ? 0.2 : 0.5, padding: 8,
        }}
        title="Apagar"
      >✕</button>
    </div>
  )
}

function OpenedCard({ capsule, onDelete, deleting }) {
  const navigate = useNavigate()
  const kept = durationShort(capsule.createdAt, capsule.openedAt)
  return (
    <div
      onClick={() => navigate(`/capsules/${capsule.id}`)}
      style={{
        padding: '20px 24px', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', position: 'relative',
        transition: 'opacity 0.15s', opacity: 0.75,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.75' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          ✓ Aberta · {formatDatePT(capsule.openedAt)}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 6 }}>
        {capsule.articleTitle || capsule.preview || 'Sem título'}
        {!capsule.articleTitle && capsule.preview?.length >= 60 && '…'}
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
        Escrita em {formatDatePT(capsule.createdAt)} · guardada por {kept}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(capsule.id) }}
        disabled={deleting}
        style={{
          position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
          opacity: deleting ? 0.2 : 0.35, padding: 8,
        }}
        title="Apagar"
      >✕</button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CapsulesPage() {
  const navigate = useNavigate()
  const [capsules, setCapsules] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    api.get('/capsules')
      .then(setCapsules)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Apagar esta cápsula? Ela será perdida para sempre.')) return
    setDeleting(id)
    try {
      await api.delete(`/capsules/${id}`)
      setCapsules(prev => prev.filter(c => c.id !== id))
    } catch {}
    setDeleting(null)
  }

  const ready  = capsules.filter(c => c.status === 'ready')
  const locked = capsules.filter(c => c.status === 'locked')
  const opened = capsules.filter(c => c.status === 'opened')

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)', minHeight: '100vh' }}>
      <AppBar
        left={
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="back" size={22} />
          </button>
        }
        title="Cápsulas do Tempo"
      />

      <div data-onboarding="capsules-page" style={{ padding: '28px 24px 0' }}>
        <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, color: 'var(--ink)', fontStyle: 'italic' }}>
          Mensagens seladas
        </h2>
        <p style={{ margin: 0, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          {capsules.length > 0
            ? `${capsules.length} ${capsules.length === 1 ? 'cápsula no' : 'cápsulas no'} seu arquivo.`
            : 'Nenhuma cápsula ainda. Escreva algo para o futuro.'
          }
        </p>
      </div>

      <div style={{ margin: '20px 24px', height: 1, background: 'var(--line)' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : capsules.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 40, marginBottom: 16, opacity: 0.2 }}>⧗</div>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
            Quando você guardar uma entrada para o futuro, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div>
          {/* READY — priority */}
          {ready.length > 0 && (
            <div>
              <div style={{ padding: '10px 24px 0' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Prontas para abrir
                </span>
              </div>
              {ready.map(c => (
                <ReadyCard key={c.id} capsule={c} onDelete={handleDelete} deleting={deleting === c.id} />
              ))}
              {(locked.length > 0 || opened.length > 0) && (
                <div style={{ margin: '20px 24px', height: 1, background: 'var(--line)' }} />
              )}
            </div>
          )}

          {/* LOCKED */}
          {locked.length > 0 && (
            <div>
              {ready.length > 0 && (
                <div style={{ padding: '10px 24px 0' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                    Guardadas
                  </span>
                </div>
              )}
              {locked.map(c => (
                <LockedCard key={c.id} capsule={c} onDelete={handleDelete} deleting={deleting === c.id} />
              ))}
            </div>
          )}

          {/* OPENED */}
          {opened.length > 0 && (
            <div>
              {(ready.length > 0 || locked.length > 0) && (
                <div style={{ margin: '20px 24px', height: 1, background: 'var(--line)' }} />
              )}
              <div style={{ padding: '10px 24px 0' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                  Abertas
                </span>
              </div>
              {opened.map(c => (
                <OpenedCard key={c.id} capsule={c} onDelete={handleDelete} deleting={deleting === c.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {capsules.length > 0 && (
        <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
          Guardado por você em outro momento.<br />
          Chegou na hora certa.
        </div>
      )}
    </div>
  )
}
