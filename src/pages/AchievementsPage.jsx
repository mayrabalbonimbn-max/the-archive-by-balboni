import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

function Badge({ achievement }) {
  const { emoji, title, desc, earned } = achievement
  return (
    <div style={{
      background: 'var(--surface-2)', border: `1px solid ${earned ? 'var(--line-strong)' : 'var(--line)'}`,
      borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', gap: 8,
      opacity: earned ? 1 : 0.3,
      filter: earned ? 'none' : 'grayscale(100%)',
      transition: 'opacity 0.2s',
    }}>
      <div style={{ fontSize: 36, lineHeight: 1 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>{title}</div>
      {desc && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>{desc}</div>}
    </div>
  )
}

export default function AchievementsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/archive/achievements').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const earned = data?.earnedCount || 0
  const total = data?.totalCount || 0
  const pct = total > 0 ? (earned / total) * 100 : 0

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={18} />
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Conquistas</span>
        }
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Conquistas
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>carregando…</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Não foi possível carregar conquistas.</div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{earned}</span> de {total} conquistadas
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>{Math.round(pct)}%</div>
              </div>
              <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Badges grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              {data.achievements.map(a => (
                <Badge key={a.id} achievement={a} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
