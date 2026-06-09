import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

const MILESTONE_EMOJIS = {
  first_post: '🌱',
  first_photo: '📷',
  first_article: '✍️',
  first_project: '🏗️',
  first_capsule: '📦',
  first_reflection: '🧠',
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function calcAge(from) {
  const now = new Date()
  let years = now.getFullYear() - from.getFullYear()
  let months = now.getMonth() - from.getMonth()
  let days = now.getDate() - from.getDate()
  if (days < 0) { months--; days += 30 }
  if (months < 0) { years--; months += 12 }
  return { years, months, days }
}

export default function GrowthPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/archive/growth').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const age = data?.accountCreatedAt ? calcAge(new Date(data.accountCreatedAt)) : null

  function ageStr(a) {
    const parts = []
    if (a.years > 0) parts.push(`${a.years} ano${a.years !== 1 ? 's' : ''}`)
    if (a.months > 0) parts.push(`${a.months} mês${a.months !== 1 ? 'es' : ''}`)
    if (a.days > 0) parts.push(`${a.days} dia${a.days !== 1 ? 's' : ''}`)
    return parts.join(', ')
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={18} />
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Trajetória</span>
        }
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 32, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Sua trajetória.
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>carregando…</div>
        ) : !data || (!data.accountCreatedAt && data.milestones?.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌱</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>Sua história ainda está começando.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Faça seu primeiro registro para ver sua trajetória aqui.</div>
          </div>
        ) : (
          <>
            {/* Anniversary badge */}
            {age && (
              <div style={{
                background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
                borderRadius: 16, padding: '20px 24px', marginBottom: 40,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ fontSize: 40, flexShrink: 0 }}>🎂</div>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink)', lineHeight: 1.5 }}>
                    Você usa o Archive há {ageStr(age)}.
                  </div>
                  {data.accountCreatedAt && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                      desde {formatDateLong(new Date(data.accountCreatedAt))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {data.milestones?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                Nenhum marco ainda. Continue registrando!
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 1, background: 'var(--line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.milestones.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'flex-start', position: 'relative', paddingBottom: 32 }}>
                      {/* Dot */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)',
                        border: '2px solid var(--line-strong)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 18, flexShrink: 0, zIndex: 1,
                      }}>
                        {MILESTONE_EMOJIS[m.type] || '⭐'}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingLeft: 16, paddingTop: 6 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                          {formatDateLong(new Date(m.date))}
                        </div>
                        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink)', marginBottom: 4, lineHeight: 1.4 }}>{m.label}</div>
                        {m.description && (
                          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                            "{m.description}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
