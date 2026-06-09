import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

const MONTHS_PT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

function formatDateLong(date) {
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`
}

function formatMonth(date) {
  return `${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`
}

function buildNarrative(growth, stats) {
  const chapters = []
  if (growth?.accountCreatedAt) {
    const date = new Date(growth.accountCreatedAt)
    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)} você começou seu arquivo. Um espaço só seu para registrar e construir.`,
    })
  }
  for (const m of (growth?.milestones || [])) {
    const date = new Date(m.date)
    if (m.type === 'first_post') {
      chapters.push({
        period: formatDateLong(date),
        text: `Seu primeiro registro${m.description ? `: "${m.description.slice(0, 80)}"` : '.'}`,
      })
    } else if (m.type === 'first_project') {
      chapters.push({
        period: formatDateLong(date),
        text: 'O primeiro projeto nasceu — e com ele, a vontade de construir algo maior.',
      })
    } else if (m.type === 'first_article') {
      chapters.push({
        period: formatDateLong(date),
        text: 'O primeiro ensaio: um momento de organizar os pensamentos em algo mais denso.',
      })
    } else if (m.type === 'first_photo') {
      chapters.push({
        period: formatDateLong(date),
        text: 'A primeira foto arquivada — o olhar treinado para guardar o que importa.',
      })
    } else if (m.type === 'first_reflection') {
      chapters.push({
        period: formatDateLong(date),
        text: 'A primeira reflexão sobre uma memória: você começou a conversar com o passado.',
      })
    } else if (m.type === 'first_capsule') {
      chapters.push({
        period: formatDateLong(date),
        text: 'A primeira cápsula do tempo — uma carta para o futuro de si mesmo.',
      })
    }
  }
  if (stats?.totalPosts > 0) {
    chapters.push({
      period: 'Hoje',
      text: `Até agora, ${stats.totalPosts} registro${stats.totalPosts !== 1 ? 's' : ''}, ${stats.totalArticles} ensaio${stats.totalArticles !== 1 ? 's' : ''}, ${stats.totalPhotos} foto${stats.totalPhotos !== 1 ? 's' : ''}. O arquivo cresce.`,
    })
  }
  return chapters
}

export default function StoryPage() {
  const navigate = useNavigate()
  const [growth, setGrowth] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/archive/growth').catch(() => null),
      api.get('/archive/dashboard').catch(() => null),
    ]).then(([g, d]) => {
      setGrowth(g)
      setStats(d?.summary || null)
    }).finally(() => setLoading(false))
  }, [])

  const chapters = (growth || stats) ? buildNarrative(growth, stats) : []

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={18} />
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>A sua história</span>
        }
      />

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '32px 24px 100px' }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 'clamp(24px, 5vw, 38px)', color: 'var(--ink)', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            A história do seu arquivo.
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>compondo narrativa…</div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>A história ainda está sendo escrita.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Faça seus primeiros registros para ver sua narrativa aqui.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {chapters.map((ch, i) => (
              <div key={i}>
                <div style={{ paddingBottom: 48 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', marginBottom: 14, textTransform: 'lowercase' }}>
                    {ch.period}
                  </div>
                  <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1.9, margin: 0 }}>
                    {ch.text}
                  </p>
                </div>
                {i < chapters.length - 1 && (
                  <div style={{ height: 1, background: 'var(--line)', marginBottom: 48, opacity: 0.5 }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer links */}
        {!loading && chapters.length > 0 && (
          <div style={{ marginTop: 48, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/growth')} style={{
              padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)',
              fontSize: 11, cursor: 'pointer',
            }}>Ver trajetória →</button>
            <button onClick={() => navigate('/achievements')} style={{
              padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)',
              fontSize: 11, cursor: 'pointer',
            }}>Conquistas →</button>
          </div>
        )}
      </div>
    </div>
  )
}
