import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'
import GraphPage from './GraphPage'

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'narrativa',     label: 'Narrativa' },
  { id: 'marcos',        label: 'Marcos' },
  { id: 'numeros',       label: 'Números' },
  { id: 'conexoes',      label: 'Conexões' },
  { id: 'retrospectiva', label: 'Retrospectiva' },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────

const MONTHS_LONG  = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = d => `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`
const fmtMonth = d => `${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`

function agoLabel(date) {
  const days   = Math.floor((Date.now() - date.getTime()) / 86400000)
  const years  = Math.floor(days / 365)
  const months = Math.floor(days / 30)
  if (years >= 2)  return `há ${years} anos`
  if (years === 1) return 'há um ano'
  if (months >= 2) return `há ${months} meses`
  if (months === 1) return 'há um mês'
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}

function calcAge(from) {
  const now = new Date()
  let y = now.getFullYear() - from.getFullYear()
  let m = now.getMonth()    - from.getMonth()
  let d = now.getDate()     - from.getDate()
  if (d < 0) { m--; d += 30 }
  if (m < 0) { y--; m += 12 }
  return { years: y, months: m, days: d }
}

function ageStr({ years, months, days }) {
  const p = []
  if (years  > 0) p.push(`${years} ${years  === 1 ? 'ano'  : 'anos'}`)
  if (months > 0) p.push(`${months} ${months === 1 ? 'mês' : 'meses'}`)
  if (years === 0 && months === 0 && days > 0) p.push(`${days} ${days === 1 ? 'dia' : 'dias'}`)
  return p.join(' e ') || 'menos de um dia'
}

function cleanExcerpt(t = '') {
  return t.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/_(.*?)_/g,'$1')
          .replace(/\[\[(.*?)\]\]/g,'$1').replace(/#+\s/g,'').replace(/`[^`]+`/g,'')
          .replace(/#[\p{L}\p{N}_-]+/gu,'').replace(/\s+/g,' ').trim()
}

function trimAt(text, max) {
  if (!text || text.length <= max) return text
  const cut = text.slice(0, max)
  const sp  = cut.lastIndexOf(' ')
  return (sp > max * 0.7 ? cut.slice(0, sp) : cut) + '…'
}

const MILESTONE_EMOJI = {
  first_post:'🌱', first_photo:'📷', first_article:'✍️',
  first_project:'🏗️', first_capsule:'📦', first_reflection:'🧠',
}

const CATEGORIA_PLURAL = {
  pensamento:'pensamentos', reflexão:'reflexões', ideia:'ideias',
  aprendizado:'aprendizados', decisão:'decisões', observação:'observações',
  memória:'memórias', citação:'citações', meta:'metas',
}

// ── Narrative builder (from StoryPage) ────────────────────────────────────────

function buildNarrative({ accountCreatedAt, milestones, insights }) {
  const byType = {}
  for (const m of (milestones || [])) byType[m.type] = m

  const chapters = []
  const fp  = byType.first_post
  const fa  = byType.first_article
  const fph = byType.first_photo
  const fpr = byType.first_project
  const fc  = byType.first_capsule
  const fr  = byType.first_reflection
  const map = insights?.mostActiveProject
  const mfc = insights?.mostFrequentCategory
  const may = insights?.mostActiveYear
  const s   = insights?.summary

  if (accountCreatedAt) {
    const startDate = new Date(accountCreatedAt)
    const ago = agoLabel(startDate)
    const prefix = ago.charAt(0).toUpperCase() + ago.slice(1)
    if (fp?.excerpt) {
      const fpDate  = new Date(fp.date)
      const sameDay = fpDate.toDateString() === startDate.toDateString()
      chapters.push({
        period: fmt(startDate),
        text: sameDay
          ? `${prefix}, você abriu um arquivo. O primeiro registro foi:`
          : `${prefix}, você abriu um arquivo. Alguns dias depois, o primeiro registro:`,
        quote: trimAt(cleanExcerpt(fp.excerpt), 120),
      })
    } else {
      chapters.push({ period: fmt(startDate), text: `${prefix}, você abriu um arquivo. Um lugar para guardar o que importa.` })
    }
  }

  if (mfc?.name && mfc.count >= 3) {
    const label = CATEGORIA_PLURAL[mfc.name] || mfc.name
    chapters.push({
      period: 'O que você escreve',
      text: `Com o tempo, um padrão emergiu. A maioria dos seus registros são ${label}` +
        (mfc.count >= 10 ? ` — ${mfc.count} ao longo de todo o arquivo. O Archive termina por refletir o que você mais pensa.`
                         : `. O Archive termina por refletir o que você mais pensa.`),
    })
  }

  if (fa) {
    const date = new Date(fa.date)
    chapters.push({
      period: fmt(date),
      text: fa.title
        ? `Em ${fmtMonth(date)}, o arquivo recebeu seu primeiro ensaio: "${fa.title}". Um momento de sentar e organizar os pensamentos em algo mais denso.`
        : `Em ${fmtMonth(date)}, você escreveu seu primeiro ensaio.`,
      ...((!fa.title && fa.excerpt) ? { quote: trimAt(cleanExcerpt(fa.excerpt), 120) } : {}),
    })
  }

  if (fpr) {
    const date  = new Date(fpr.date)
    const emoji = fpr.emoji ? `${fpr.emoji} ` : ''
    chapters.push({
      period: fmt(date),
      text: `Em ${fmtMonth(date)} nasceu ${emoji}${fpr.title} — o primeiro projeto registrado no Archive. A ideia de guardar não apenas pensamentos, mas algo que está sendo construído.`,
    })
  }

  if (map && map.postCount >= 5) {
    const emoji = map.emoji ? `${map.emoji} ` : ''
    if (!fpr || map.title !== fpr.title) {
      chapters.push({ period: 'O projeto mais vivo', text: `De todos os projetos, ${emoji}${map.title} é o que mais concentra registros: ${map.postCount} entradas vinculadas ao longo do tempo.` })
    } else if (map.postCount >= 15) {
      chapters.push({ period: 'O projeto mais vivo', text: `${emoji}${map.title} cresceu muito desde o início. Hoje, ${map.postCount} registros estão vinculados a ele.` })
    }
  }

  if (fph) {
    const date = new Date(fph.date)
    chapters.push({ period: fmt(date), text: `Em ${fmtMonth(date)}, a fotografia entrou no arquivo. O olhar treinado para registrar não só o que se pensa, mas o que se vê.` })
  }

  if (fr?.excerpt) {
    const date    = new Date(fr.date)
    const excerpt = trimAt(cleanExcerpt(fr.excerpt), 120)
    if (excerpt) chapters.push({ period: fmt(date), text: `Em ${fmtMonth(date)}, você voltou a uma memória antiga e deixou um registro sobre ela:`, quote: excerpt })
  }

  if (fc) {
    const date = new Date(fc.date)
    chapters.push({ period: fmt(date), text: `Em ${fmtMonth(date)}, você selou uma mensagem para o futuro — uma cápsula do tempo. Um gesto que só faz sentido para quem acredita que o que escreve hoje vai importar amanhã.` })
  }

  if (may && may.count >= 10 && may.year !== new Date().getFullYear()) {
    chapters.push({ period: String(may.year), text: `De todos os períodos, ${may.year} foi o mais intenso: ${may.count} registros em um único ano.` })
  }

  if (s && s.totalPosts > 0) {
    const parts = [`${s.totalPosts} registro${s.totalPosts !== 1 ? 's' : ''}`]
    if (s.totalArticles > 0) parts.push(`${s.totalArticles} ensaio${s.totalArticles !== 1 ? 's' : ''}`)
    if (s.totalPhotos   > 0) parts.push(`${s.totalPhotos} foto${s.totalPhotos !== 1 ? 's' : ''}`)
    if (s.totalCodes    > 0) parts.push(`${s.totalCodes} trecho${s.totalCodes !== 1 ? 's' : ''} de código`)
    const listText = parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(', ') + ' e ' + parts.at(-1)
    chapters.push({ period: 'Hoje', text: `${listText}. O arquivo continua.` })
  }

  return chapters
}

// ── Shared primitive ───────────────────────────────────────────────────────────

function PanelLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.7, animation: 'pagePulse 1.1s ease-in-out infinite' }} />
      <style>{`@keyframes pagePulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.6);opacity:1}}`}</style>
    </div>
  )
}

// ── Tab 1 — Narrativa ─────────────────────────────────────────────────────────

function NarrativaPanel() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/archive/growth').then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const chapters = data ? buildNarrative(data) : []

  if (loading) return <PanelLoader />

  if (chapters.length === 0) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
        A história ainda está sendo escrita.
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
        Faça seus primeiros registros para ver sua narrativa aqui.
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {chapters.map((ch, i) => (
        <div key={i}>
          <div style={{ paddingBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'lowercase', marginBottom: 14 }}>
              {ch.period}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1.9, margin: 0 }}>
              {ch.text}
            </p>
            {ch.quote && (
              <blockquote style={{ margin: '18px 0 0', padding: '2px 0 2px 18px', borderLeft: '2px solid var(--accent)' }}>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.75, margin: 0 }}>
                  "{ch.quote}"
                </p>
              </blockquote>
            )}
          </div>
          {i < chapters.length - 1 && (
            <div style={{ height: 1, background: 'var(--line)', marginBottom: 48, opacity: 0.5 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab 2 — Marcos ────────────────────────────────────────────────────────────

function MarcosPanel() {
  const [growth, setGrowth]           = useState(null)
  const [achievements, setAchievements] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/archive/growth').catch(() => null),
      api.get('/archive/achievements').catch(() => null),
    ]).then(([g, a]) => { setGrowth(g); setAchievements(a) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PanelLoader />

  const milestones = growth?.milestones || []
  const startDate  = growth?.accountCreatedAt ? new Date(growth.accountCreatedAt) : null
  const age        = startDate ? calcAge(startDate) : null

  const timelineNodes = [
    ...(startDate ? [{ type: 'account', label: 'Criou o Archive', date: startDate, emoji: '🗓' }] : []),
    ...milestones.map(m => ({ ...m, date: new Date(m.date), emoji: MILESTONE_EMOJI[m.type] || '⭐' })),
  ]

  const earnedBadges = (achievements?.achievements || []).filter(a => a.earned)
  const total        = achievements?.totalCount  || 0
  const earned       = achievements?.earnedCount || 0
  const pct          = total > 0 ? (earned / total) * 100 : 0

  return (
    <div>
      {/* Anniversary badge */}
      {age && startDate && (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
          borderRadius: 16, padding: '18px 22px', marginBottom: 36,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 36, flexShrink: 0 }}>🎂</div>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', lineHeight: 1.5 }}>
              Você usa o Archive há {ageStr(age)}.
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
              desde {fmt(startDate)}
            </div>
          </div>
        </div>
      )}

      {/* Vertical timeline */}
      {timelineNodes.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 48 }}>
          <div style={{ position: 'absolute', left: 19, top: 20, bottom: 0, width: 1, background: 'var(--line)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timelineNodes.map((node, i) => (
              <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'flex-start', paddingBottom: 28, position: 'relative' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0, zIndex: 1,
                }}>
                  {node.emoji}
                </div>
                <div style={{ paddingLeft: 14, paddingTop: 7 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 3 }}>
                    {node.label}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {fmt(node.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conquistas — folded into this tab */}
      {achievements && (
        <>
          <div style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Conquistas
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{earned}</span> de {total} conquistadas
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>{Math.round(pct)}%</div>
            </div>
            <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Badge grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {(achievements.achievements || []).map(a => (
              <div key={a.id} style={{
                background: 'var(--surface-2)', border: `1px solid ${a.earned ? 'var(--line-strong)' : 'var(--line)'}`,
                borderRadius: 14, padding: '18px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8,
                opacity: a.earned ? 1 : 0.3, filter: a.earned ? 'none' : 'grayscale(100%)',
              }}>
                <div style={{ fontSize: 36, lineHeight: 1 }}>{a.emoji}</div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>{a.title}</div>
                {a.desc && <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>{a.desc}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab 3 — Números ───────────────────────────────────────────────────────────

function BarChart({ data, labelKey, valueKey, height = 100, color = 'rgba(232,108,180,0.7)' }) {
  if (!data?.length) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>sem dados</div>
  )
  const max  = Math.max(...data.map(d => d[valueKey]), 1)
  const barW = Math.max(4, Math.floor((100 / data.length) * 0.7))
  const gap  = Math.max(1, Math.floor((100 / data.length) * 0.3))
  const totalW = data.length * (barW + gap)

  return (
    <svg width="100%" height={height + 24} viewBox={`0 0 ${totalW} ${height + 24}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const val  = d[valueKey]
        const barH = Math.max(val > 0 ? 2 : 0, (val / max) * height)
        const x    = i * (barW + gap)
        const showLabel = data.length <= 14 || i % Math.ceil(data.length / 14) === 0
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barW} height={barH} fill={color} rx={1}>
              <title>{val} registro{val !== 1 ? 's' : ''}</title>
            </rect>
            {showLabel && (
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)" fontFamily="var(--mono)">
                {d[labelKey]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function StatCard({ emoji, value, label }) {
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      borderRadius: 12, padding: '14px 16px', flexShrink: 0, minWidth: 100,
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function NumerosPanel() {
  const [data, setData]     = useState(null)
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/archive/dashboard'),
      api.get('/archive/streak').catch(() => null),
    ]).then(([d, s]) => { setData(d); setStreak(s) }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PanelLoader />

  const s = data?.summary || {}
  const last30 = (data?.last30 || []).map(d => ({ day: new Date(d.day).getDate(), count: d.count }))
  const last12 = (data?.last12 || []).map(d => ({ month: MONTHS_SHORT[new Date(d.month).getMonth()], count: d.count }))

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 32 }}>
        <StatCard emoji="📚" value={s.totalPosts    || 0} label="posts" />
        <StatCard emoji="📷" value={s.totalPhotos   || 0} label="fotos" />
        <StatCard emoji="💻" value={s.totalCodes    || 0} label="códigos" />
        <StatCard emoji="📝" value={s.totalArticles || 0} label="artigos" />
        <StatCard emoji="🔥" value={streak?.streak     || 0} label="streak atual" />
        <StatCard emoji="🏆" value={streak?.bestStreak || 0} label="melhor streak" />
        <StatCard emoji="🌱" value={s.activeProjects || 0} label="projetos ativos" />
        <StatCard emoji="📦" value={s.capsulesWaiting || 0} label="cápsulas" />
      </div>

      {/* Last 30 days */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          Últimos 30 dias
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 16px 8px' }}>
          <BarChart data={last30} labelKey="day" valueKey="count" />
        </div>
      </section>

      {/* Last 12 months */}
      <section>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          Últimos 12 meses
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 16px 8px' }}>
          <BarChart data={last12} labelKey="month" valueKey="count" color="rgba(122,162,247,0.7)" />
        </div>
      </section>
    </div>
  )
}

// ── Tab 4 — Conexões ──────────────────────────────────────────────────────────

function ConexoesPanel() {
  return (
    <div style={{ height: 'calc(100vh - 220px)', minHeight: 400, position: 'relative' }}>
      <GraphPage panel />
    </div>
  )
}

// ── Tab 5 — Retrospectiva ─────────────────────────────────────────────────────

function BigStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
      <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 48, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{label}</div>
    </div>
  )
}

function RetrospectivPanel() {
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [empty,   setEmpty]   = useState(false)

  useEffect(() => {
    setLoading(true)
    setEmpty(false)
    setData(null)
    api.get(`/archive/year-review/${year}`)
      .then(d => { if (!d || d.stats?.total === 0) setEmpty(true); setData(d) })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div>
      {/* Year nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, padding: '0 0 20px', borderBottom: '1px solid var(--line)' }}>
        <button onClick={() => setYear(y => y - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← {year - 1}
        </button>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>Retrospectiva</div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--ink)', textAlign: 'center', letterSpacing: '-0.02em' }}>{year}</div>
          {!loading && data && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 4 }}>
              {data.stats.total} registro{data.stats.total !== 1 ? 's' : ''} · {data.stats.activeDays} dia{data.stats.activeDays !== 1 ? 's' : ''} ativo{data.stats.activeDays !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <button onClick={() => setYear(y => y + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          {year + 1} →
        </button>
      </div>

      {loading ? <PanelLoader /> : empty ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
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
              {[
                [data.stats.total,       'Posts totais'],
                [data.stats.activeDays,  'Dias ativos'],
                [data.stats.photos,      'Fotos'],
                [data.stats.articles,    'Ensaios'],
                [data.stats.codes,       'Códigos'],
                [data.stats.reflections, 'Reflexões'],
              ].map(([val, lbl]) => (
                <div key={lbl} style={{ background: 'var(--bg)' }}>
                  <BigStat value={val} label={lbl} />
                </div>
              ))}
            </div>
          </section>

          {/* Best month */}
          {data.bestMonth && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Melhor mês</div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--ink)' }}>{MONTHS_FULL[data.bestMonth.month - 1]}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{data.bestMonth.count} registro{data.bestMonth.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 40, color: 'var(--accent)', opacity: 0.6 }}>{data.bestMonth.count}</div>
                </div>
                <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (data.bestMonth.count / Math.max(data.stats.total, 1)) * 400)}%`, background: 'var(--accent)', borderRadius: 2 }} />
                </div>
              </div>
            </section>
          )}

          {/* Projects */}
          <section style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Projetos</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: data.topProjects?.length ? 16 : 0 }}>
              <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--ink)' }}>{data.projects.created}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>criados</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: '#10b981' }}>{data.projects.completed}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>concluídos</div>
              </div>
            </div>
            {data.topProjects?.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}>{p.title}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{p.postCount} registro{p.postCount !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>#{i + 1}</div>
              </div>
            ))}
          </section>

          {/* First post */}
          {data.firstPost && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Primeiro registro do ano</div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderLeft: '3px solid var(--accent)', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', marginBottom: 10 }}>
                  {new Date(data.firstPost.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </div>
                {data.firstPost.articleTitle
                  ? <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)' }}>{data.firstPost.articleTitle}</div>
                  : <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>{(data.firstPost.content || '').slice(0, 200)}{data.firstPost.content?.length > 200 ? '…' : ''}</div>
                }
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrajetoriaPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some(t => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'narrativa'

  function setTab(id) {
    setSearchParams({ tab: id }, { replace: true })
  }

  const isConexoes = tab === 'conexoes'

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

      {/* Desktop header */}
      <div className="hidden md:block" style={{ padding: '32px 24px 0' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em', fontWeight: 400 }}>
          Trajetória
        </h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: '0 0 24px', letterSpacing: '0.04em' }}>
          Uma leitura do que você construiu ao longo do tempo.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2, padding: '0 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 'env(safe-area-inset-top, 0px)',
        zIndex: 10, background: 'var(--bg)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 14px',
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={isConexoes ? {} : { maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>
        {tab === 'narrativa'     && <NarrativaPanel />}
        {tab === 'marcos'        && <MarcosPanel />}
        {tab === 'numeros'       && <NumerosPanel />}
        {tab === 'conexoes'      && <ConexoesPanel />}
        {tab === 'retrospectiva' && <RetrospectivPanel />}
      </div>
    </div>
  )
}
