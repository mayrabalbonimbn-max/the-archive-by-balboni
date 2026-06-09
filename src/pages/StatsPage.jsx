import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

function StatCard({ emoji, value, label }) {
  return (
    <div style={{
      padding: '16px 16px 14px', borderRadius: 14,
      border: '1px solid var(--line)', background: 'var(--surface-2)',
    }}>
      {emoji && <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 8 }}>{emoji}</div>}
      <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value ?? 0}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 5, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 13,
      border: '1px solid var(--line)', background: 'var(--surface-2)',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 5 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}

export default function StatsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [streak, setStreak] = useState(null)

  useEffect(() => {
    api.get('/archive/stats').then(setData).catch(() => {})
    api.get('/archive/streak').then(setStreak).catch(() => {})
  }, [])

  const loading = !data && !streak

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
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>
          ESTATÍSTICAS
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1.05, color: 'var(--ink)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          Arquivo em números.
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div style={{ padding: '20px 24px 80px' }}>
          {/* Streak section */}
          {streak && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--ink-3)', marginBottom: 12 }}>
                SEQUÊNCIA
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
                <StatCard emoji="🔥" value={streak.current} label="Dias seguidos" />
                <StatCard emoji="🏆" value={streak.best} label="Melhor" />
                <StatCard emoji="📅" value={streak.totalActiveDays} label="Dias ativos" />
              </div>
            </>
          )}

          {/* Content section */}
          {data && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--ink-3)', marginBottom: 12 }}>
                CONTEÚDO
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
                <StatCard value={data.posts} label="Posts" />
                <StatCard value={data.articles} label="Artigos" />
                <StatCard value={data.codes} label="Códigos" />
                <StatCard value={data.images} label="Imagens" />
                <StatCard value={data.pdfs} label="PDFs" />
                <StatCard value={data.active_days} label="Dias ativos" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow
                  label="Primeira publicação"
                  value={data.first_post
                    ? new Date(data.first_post).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Ainda sem publicações'}
                />
                {data.topCollection && (
                  <InfoRow label="Coleção mais usada" value={data.topCollection.name} />
                )}
                {(data.topTags || []).length > 0 && (
                  <div style={{
                    padding: '14px 16px', borderRadius: 13,
                    border: '1px solid var(--line)', background: 'var(--surface-2)',
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 10 }}>
                      TAGS MAIS USADAS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.topTags.map(item => (
                        <span
                          key={item.tag}
                          style={{
                            fontFamily: 'var(--mono)', fontSize: 11,
                            padding: '4px 10px', borderRadius: 20,
                            border: '1px solid var(--line)', color: 'var(--ink-3)',
                            background: 'var(--surface-3)',
                          }}
                        >
                          #{item.tag} · {item.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
