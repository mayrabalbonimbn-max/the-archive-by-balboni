import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function BarChart({ data, labelKey, valueKey, height = 120, accentColor = 'rgba(232,108,180,0.7)' }) {
  if (!data || data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>sem dados</div>
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const barW = Math.max(4, Math.floor((100 / data.length) * 0.7))
  const gap = Math.max(1, Math.floor((100 / data.length) * 0.3))
  const totalW = data.length * (barW + gap)

  return (
    <svg width="100%" height={height + 24} viewBox={`0 0 ${totalW} ${height + 24}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const val = d[valueKey]
        const barH = Math.max(val > 0 ? 2 : 0, (val / max) * height)
        const x = i * (barW + gap)
        const y = height - barH
        const label = d[labelKey]
        const showLabel = data.length <= 14 || i % Math.ceil(data.length / 14) === 0
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={accentColor} rx={1}>
              <title>{val} registro{val !== 1 ? 's' : ''}</title>
            </rect>
            {showLabel && (
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)" fontFamily="var(--mono)">
                {label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function StatCard({ emoji, value, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-2)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0, minWidth: 100,
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/archive/dashboard'),
      api.get('/archive/streak').catch(() => null),
    ]).then(([d, s]) => {
      setData(d)
      setStreak(s)
    }).finally(() => setLoading(false))
  }, [])

  const last30Data = (data?.last30 || []).map(d => ({
    day: new Date(d.day).getDate(),
    count: d.count,
  }))

  const last12Data = (data?.last12 || []).map(d => ({
    month: MONTH_ABBR[new Date(d.month).getMonth()],
    count: d.count,
  }))

  const s = data?.summary || {}

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={18} />
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dashboard</span>
        }
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
            Life Dashboard
          </h1>
          {!loading && s.totalPosts > 0 && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.04em' }}>
              {s.totalPosts} registros · desde {s.firstPost ? new Date(s.firstPost).toLocaleDateString('pt-BR') : '—'}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>carregando…</div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 32 }}>
              <StatCard emoji="📚" value={s.totalPosts || 0} label="posts" />
              <StatCard emoji="📷" value={s.totalPhotos || 0} label="fotos" />
              <StatCard emoji="💻" value={s.totalCodes || 0} label="códigos" />
              <StatCard emoji="📝" value={s.totalArticles || 0} label="artigos" />
              <StatCard emoji="🔥" value={streak?.streak || 0} label="streak atual" />
              <StatCard emoji="🏆" value={streak?.bestStreak || 0} label="melhor streak" />
              <StatCard emoji="🌱" value={s.activeProjects || 0} label="projetos ativos" />
              <StatCard emoji="📦" value={s.capsulesWaiting || 0} label="cápsulas" />
            </div>

            {/* Last 30 days */}
            <section style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Últimos 30 dias
              </div>
              {last30Data.length === 0 ? (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  Nenhum registro no período
                </div>
              ) : (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 16px 8px' }}>
                  <BarChart data={last30Data} labelKey="day" valueKey="count" height={100} />
                </div>
              )}
            </section>

            {/* Last 12 months */}
            <section style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Últimos 12 meses
              </div>
              {last12Data.length === 0 ? (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                  Nenhum dado disponível
                </div>
              ) : (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 16px 8px' }}>
                  <BarChart data={last12Data} labelKey="month" valueKey="count" height={100} accentColor="rgba(122,162,247,0.7)" />
                </div>
              )}
            </section>

            {/* Links */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/stats')} style={{
                padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)',
                fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em',
              }}>
                Estatísticas completas →
              </button>
              <button onClick={() => navigate(`/year-review/${new Date().getFullYear()}`)} style={{
                padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)',
                fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em',
              }}>
                Retrospectiva {new Date().getFullYear()} →
              </button>
              <button onClick={() => navigate('/achievements')} style={{
                padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)',
                fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em',
              }}>
                Conquistas →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
