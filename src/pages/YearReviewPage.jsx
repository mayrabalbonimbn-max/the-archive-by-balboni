import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function BigStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 48, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{label}</div>
    </div>
  )
}

export default function YearReviewPage() {
  const navigate = useNavigate()
  const { year } = useParams()
  const yearNum = parseInt(year, 10)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    setLoading(true)
    setEmpty(false)
    api.get(`/archive/year-review/${year}`).then(d => {
      if (!d || d.stats?.total === 0) setEmpty(true)
      setData(d)
    }).catch(() => setEmpty(true)).finally(() => setLoading(false))
  }, [year])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <style>{`@media print { .no-print { display: none !important } }`}</style>

      <div className="no-print">
        <AppBar
          left={
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="back" size={18} />
            </button>
          }
          right={
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => navigate(`/year-review/${yearNum - 1}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>← {yearNum - 1}</button>
              <button onClick={() => navigate(`/year-review/${yearNum + 1}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>{yearNum + 1} →</button>
              <button onClick={() => window.print()} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 10px' }}>imprimir</button>
            </div>
          }
        />
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 80px' }}>
        {/* Cover */}
        <div style={{ position: 'relative', padding: '40px 0 32px', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(80px, 20vw, 140px)', color: 'rgba(255,255,255,0.04)', lineHeight: 1, position: 'absolute', top: 0, left: -10, userSelect: 'none', pointerEvents: 'none' }}>
            {year}
          </div>
          <div style={{ position: 'relative', paddingTop: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Retrospectiva</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--ink)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{year}</h1>
            {!loading && data && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                {data.stats.total} registro{data.stats.total !== 1 ? 's' : ''} · {data.stats.activeDays} dia{data.stats.activeDays !== 1 ? 's' : ''} ativo{data.stats.activeDays !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--line)', marginBottom: 32 }} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>carregando…</div>
        ) : empty ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🌱</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>Nenhum registro em {year}.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Comece a escrever agora para ter sua retrospectiva aqui.</div>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Em números</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg)' }}><BigStat value={data.stats.total} label="Posts totais" /></div>
                <div style={{ background: 'var(--bg)' }}><BigStat value={data.stats.activeDays} label="Dias ativos" /></div>
                <div style={{ background: 'var(--bg)' }}><BigStat value={data.stats.photos} label="Fotos" /></div>
                <div style={{ background: 'var(--bg)' }}><BigStat value={data.stats.articles} label="Ensaios" /></div>
                <div style={{ background: 'var(--bg)' }}><BigStat value={data.stats.codes} label="Códigos" /></div>
                <div style={{ background: 'var(--bg)' }}><BigStat value={data.stats.reflections} label="Reflexões" /></div>
              </div>
            </section>

            {/* Best month */}
            {data.bestMonth && (
              <section style={{ marginBottom: 40 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Melhor mês</div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--ink)' }}>{MONTHS_PT[data.bestMonth.month - 1]}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{data.bestMonth.count} registro{data.bestMonth.count !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 40, color: 'var(--accent)', opacity: 0.6 }}>{data.bestMonth.count}</div>
                  </div>
                  {/* Mini bar */}
                  <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (data.bestMonth.count / Math.max(data.stats.total, 1)) * 100 * 4)}%`, background: 'var(--accent)', borderRadius: 2 }} />
                  </div>
                </div>
              </section>
            )}

            {/* Projects */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Projetos</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: data.topProjects?.length > 0 ? 16 : 0 }}>
                <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--ink)' }}>{data.projects.created}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>criados</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: '#10b981' }}>{data.projects.completed}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>concluídos</div>
                </div>
              </div>
              {data.topProjects?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.topProjects.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10 }}>
                      <span style={{ fontSize: 20 }}>{p.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}>{p.title}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{p.postCount} registro{p.postCount !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>#{i + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* First post */}
            {data.firstPost && (
              <section style={{ marginBottom: 40 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Primeiro registro do ano</div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)', borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', marginBottom: 10 }}>
                    {new Date(data.firstPost.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </div>
                  {data.firstPost.articleTitle ? (
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)' }}>{data.firstPost.articleTitle}</div>
                  ) : (
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>
                      {(data.firstPost.content || '').slice(0, 200)}{data.firstPost.content?.length > 200 ? '…' : ''}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
