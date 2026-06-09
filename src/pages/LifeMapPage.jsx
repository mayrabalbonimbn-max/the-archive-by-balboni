import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function intensity(count, max) {
  if (!count || !max) return 0
  return Math.ceil((count / max) * 4)
}

const INTENSITY_BG = [
  'rgba(255,255,255,0.03)',
  'rgba(232,108,180,0.12)',
  'rgba(232,108,180,0.25)',
  'rgba(232,108,180,0.45)',
  'rgba(232,108,180,0.7)',
]

function MonthRow({ m, maxPosts, expanded, onToggle }) {
  const lvl = intensity(m.postCount, maxPosts)
  const navigate = useNavigate()

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
          textAlign: 'left',
        }}
      >
        {/* Heat bar */}
        <div style={{
          width: 5, height: 36, borderRadius: 3,
          background: INTENSITY_BG[lvl],
          flexShrink: 0,
          border: lvl > 0 ? '1px solid rgba(232,108,180,0.2)' : '1px solid var(--line)',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
            {PT_MONTHS[m.month - 1]}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            {m.postCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{m.postCount} posts</span>}
            {m.photoCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>📷 {m.photoCount}</span>}
            {m.articleCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>✍️ {m.articleCount}</span>}
            {m.codeCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>💻 {m.codeCount}</span>}
            {m.projectCount > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--accent)', opacity: 0.8 }}>🌱 {m.projectCount} proj</span>}
          </div>
        </div>

        <Icon
          name="chevronDown"
          size={16}
          stroke={1.5}
          style={{
            color: 'var(--ink-3)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {expanded && (
        <button
          onClick={() => navigate(`/calendar?y=${m.year}&m=${m.month}`)}
          style={{
            display: 'block', width: '100%', marginBottom: 8,
            padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--line)', background: 'var(--surface-2)',
            cursor: 'pointer', textAlign: 'left',
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)',
          }}
        >
          Ver {PT_MONTHS[m.month - 1]} {m.year} no calendário →
        </button>
      )}
    </div>
  )
}

function YearBlock({ yearData, maxPosts }) {
  const [open, setOpen] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState(new Set())

  const totalPosts = yearData.months.reduce((s, m) => s + m.postCount, 0)
  const totalPhotos = yearData.months.reduce((s, m) => s + m.photoCount, 0)

  function toggleMonth(key) {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Year header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
          borderBottom: open ? '1px solid var(--line)' : 'none',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: 'var(--serif)', fontSize: 28, fontStyle: 'italic',
          color: open ? 'var(--ink)' : 'var(--ink-2)',
          fontWeight: 400, letterSpacing: '-0.02em', minWidth: 70,
          transition: 'color .15s',
        }}>
          {yearData.year}
        </span>
        <div style={{ flex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            {totalPosts} posts
          </span>
          {totalPhotos > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              📷 {totalPhotos}
            </span>
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            {yearData.months.length} meses ativos
          </span>
        </div>
        <Icon
          name="chevronDown"
          size={18}
          stroke={1.5}
          style={{
            color: 'var(--ink-3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div style={{ paddingLeft: 14, paddingTop: 6, paddingBottom: 8 }}>
          {yearData.months.map(m => {
            const key = `${m.year}-${m.month}`
            return (
              <MonthRow
                key={key}
                m={m}
                maxPosts={maxPosts}
                expanded={expandedMonths.has(key)}
                onToggle={() => toggleMonth(key)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LifeMapPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/archive/life-map').then(setData).catch(() => setData([]))
  }, [])

  const maxPosts = data
    ? Math.max(1, ...data.flatMap(y => y.months.map(m => m.postCount)))
    : 1

  const totalPosts = data ? data.flatMap(y => y.months).reduce((s, m) => s + m.postCount, 0) : 0
  const totalYears = data ? data.length : 0

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={22} />
          </button>
        }
      />

      <div style={{ padding: '24px 24px 8px' }}>
        {/* Desktop header hidden on mobile (AppBar handles mobile) */}
        <div className="hidden md:block" style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>
            MAPA DA VIDA
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1.05, color: 'var(--ink)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
            Sua linha do tempo.
          </h1>
          {totalPosts > 0 && (
            <p style={{ margin: '12px 0 0', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)' }}>
              {totalPosts} registros ao longo de {totalYears} {totalYears === 1 ? 'ano' : 'anos'}.
            </p>
          )}
        </div>

        {/* Mobile header */}
        <div className="md:hidden" style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 8 }}>
            MAPA DA VIDA
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 26, fontStyle: 'italic', color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em' }}>
            Sua linha do tempo.
          </h1>
        </div>
      </div>

      <div style={{ padding: '0 24px 80px', borderTop: '1px solid var(--line)' }}>
        {!data ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <p style={{ padding: '40px 0', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Nenhum registro ainda. Comece a guardar algo.
          </p>
        ) : (
          data.map(yearData => (
            <YearBlock key={yearData.year} yearData={yearData} maxPosts={maxPosts} />
          ))
        )}
      </div>
    </div>
  )
}
