import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

function countdown(unlockAt) {
  const ms = new Date(unlockAt) - Date.now()
  if (ms <= 0) return 'Abrindo…'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  if (days >= 365) {
    const y = Math.floor(days / 365)
    return `${y} ${y === 1 ? 'ano' : 'anos'}`
  }
  if (days >= 30) {
    const m = Math.floor(days / 30)
    return `${m} ${m === 1 ? 'mês' : 'meses'}`
  }
  if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function CapsulesPage() {
  const navigate = useNavigate()
  const [capsules, setCapsules] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [locked, setLocked] = useState(null) // capsule being previewed in locked modal

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

      {/* Header editorial */}
      <div data-onboarding="capsules-page" style={{ padding: '28px 24px 0' }}>
        <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, color: 'var(--ink)', fontStyle: 'italic' }}>
          Guardado em segurança
        </h2>
        <p style={{ margin: 0, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          {capsules.length > 0
            ? `${capsules.length} ${capsules.length === 1 ? 'mensagem aguarda' : 'mensagens aguardam'} o momento certo para chegar até você.`
            : 'Nenhuma cápsula esperando. Escreva algo para o seu futuro.'
          }
        </p>
      </div>

      {/* Divider */}
      <div style={{ margin: '20px 24px', height: 1, background: 'var(--line)' }} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : capsules.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 32, marginBottom: 16, opacity: 0.3 }}>⧗</div>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
            Quando você guardar uma entrada para o futuro, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div>
          {capsules.map(capsule => (
            <div
              key={capsule.id}
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => setLocked(capsule)}
            >
              {/* Countdown badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(232,108,180,0.08)', border: '1px solid rgba(232,108,180,0.2)',
                borderRadius: 999, padding: '3px 10px', marginBottom: 10,
              }}>
                <span style={{ fontSize: 10, color: 'var(--accent)' }}>⧗</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.03em' }}>
                  Abre em {countdown(capsule.unlockAt)}
                </span>
              </div>

              {/* Title or preview */}
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 6 }}>
                {capsule.articleTitle || capsule.content?.slice(0, 80) || 'Sem conteúdo'}
                {!capsule.articleTitle && capsule.content?.length > 80 && '…'}
              </div>

              {/* Meta */}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                Guardado em {formatDate(capsule.createdAt)} · abre em {formatDate(capsule.unlockAt)}
              </div>

              {/* Delete */}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(capsule.id) }}
                disabled={deleting === capsule.id}
                style={{
                  position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
                  opacity: deleting === capsule.id ? 0.3 : 0.6,
                  padding: '6px',
                }}
                title="Apagar cápsula"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {capsules.length > 0 && (
        <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
          Escrito por você em outra fase da vida.<br />
          Chegará no momento certo.
        </div>
      )}

      {/* Locked modal */}
      {locked && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setLocked(null)}
        >
          <div
            style={{ background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 20, padding: '36px 28px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--sans)', fontSize: 40, marginBottom: 20, opacity: 0.2 }}>⧗</div>
            <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 22, color: 'var(--ink)' }}>
              Esta cápsula ainda está guardada.
            </h3>
            <p style={{ margin: '0 0 6px', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-2)' }}>
              Ela abre <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{countdown(locked.unlockAt)}</span>.
            </p>
            <p style={{ margin: '0 0 24px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              {formatDate(locked.unlockAt)}
            </p>
            <p style={{ margin: '0 0 24px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              O conteúdo completo será revelado na data escolhida. Até lá, permanece selado.
            </p>
            <button
              onClick={() => setLocked(null)}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid var(--line)', background: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
