import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
]

function formatMonth(date) {
  return `${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`
}

function formatDateLong(date) {
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`
}

function agoLabel(date) {
  const days   = Math.floor((Date.now() - date.getTime()) / 86400000)
  const years  = Math.floor(days / 365)
  const months = Math.floor(days / 30)
  if (years >= 2)  return `há ${years} anos`
  if (years === 1) return 'há um ano'
  if (months >= 2) return `há ${months} meses`
  if (months === 1) return 'há um mês'
  return `há ${days} dias`
}

function calcAge(from) {
  const now = new Date()
  let years  = now.getFullYear() - from.getFullYear()
  let months = now.getMonth()    - from.getMonth()
  let days   = now.getDate()     - from.getDate()
  if (days < 0)   { months--; days   += 30 }
  if (months < 0) { years--;  months += 12 }
  return { years, months, days }
}

function ageStr({ years, months, days }) {
  const parts = []
  if (years  > 0) parts.push(`${years} ${years  === 1 ? 'ano'  : 'anos'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`)
  if (years === 0 && months === 0 && days > 0)
    parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`)
  return parts.join(' e ') || 'menos de um dia'
}

// ─── Excerpt helpers ──────────────────────────────────────────────────────────

function cleanExcerpt(text = '') {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[\[(.*?)\]\]/g, '$1')
    .replace(/#+\s/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#[\p{L}\p{N}_-]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function trimAt(text, max) {
  if (!text || text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut) + '…'
}

// ─── Milestone config ─────────────────────────────────────────────────────────

const MILESTONE_EMOJI = {
  first_post:       '🌱',
  first_photo:      '📷',
  first_article:    '✍️',
  first_project:    '🏗️',
  first_capsule:    '📦',
  first_reflection: '🧠',
}

// ─── Narrative builder ────────────────────────────────────────────────────────

const CATEGORIA_PLURAL = {
  pensamento: 'pensamentos', reflexão: 'reflexões', ideia: 'ideias',
  aprendizado: 'aprendizados', decisão: 'decisões', observação: 'observações',
  memória: 'memórias', citação: 'citações', meta: 'metas',
}

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

  // 1 — O início
  if (accountCreatedAt) {
    const startDate = new Date(accountCreatedAt)
    const ago = agoLabel(startDate)
    const prefix = ago.charAt(0).toUpperCase() + ago.slice(1)
    if (fp?.excerpt) {
      const fpDate  = new Date(fp.date)
      const sameDay = fpDate.toDateString() === startDate.toDateString()
      chapters.push({
        period: formatDateLong(startDate),
        text: sameDay
          ? `${prefix}, você abriu um arquivo. O primeiro registro foi:`
          : `${prefix}, você abriu um arquivo. Alguns dias depois, o primeiro registro:`,
        quote: trimAt(cleanExcerpt(fp.excerpt), 120),
      })
    } else {
      chapters.push({
        period: formatDateLong(startDate),
        text: `${prefix}, você abriu um arquivo. Um lugar para guardar o que importa.`,
      })
    }
  }

  // 2 — Categoria dominante
  if (mfc?.name && mfc.count >= 3) {
    const label = CATEGORIA_PLURAL[mfc.name] || mfc.name
    chapters.push({
      period: 'O que você escreve',
      text: `Com o tempo, um padrão emergiu. A maioria dos seus registros são ${label}` +
        (mfc.count >= 10
          ? ` — ${mfc.count} ao longo de todo o arquivo. O Archive termina por refletir o que você mais pensa.`
          : `. O Archive termina por refletir o que você mais pensa.`),
    })
  }

  // 3 — Primeiro artigo
  if (fa) {
    const date = new Date(fa.date)
    if (fa.title) {
      chapters.push({
        period: formatDateLong(date),
        text: `Em ${formatMonth(date)}, o arquivo recebeu seu primeiro ensaio: "${fa.title}". Um momento de sentar e organizar os pensamentos em algo mais denso.`,
      })
    } else {
      const excerpt = fa.excerpt ? trimAt(cleanExcerpt(fa.excerpt), 120) : null
      chapters.push({
        period: formatDateLong(date),
        text: `Em ${formatMonth(date)}, você escreveu seu primeiro ensaio.`,
        ...(excerpt ? { quote: excerpt } : {}),
      })
    }
  }

  // 4 — Primeiro projeto
  if (fpr) {
    const date  = new Date(fpr.date)
    const emoji = fpr.emoji ? `${fpr.emoji} ` : ''
    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)} nasceu ${emoji}${fpr.title} — o primeiro projeto registrado no Archive. A ideia de guardar não apenas pensamentos, mas algo que está sendo construído.`,
    })
  }

  // 5 — Projeto mais ativo
  if (map && map.postCount >= 5) {
    const emoji         = map.emoji ? `${map.emoji} ` : ''
    const isDifferent   = !fpr || map.title !== fpr.title
    if (isDifferent) {
      chapters.push({
        period: 'O projeto mais vivo',
        text: `De todos os projetos, ${emoji}${map.title} é o que mais concentra registros: ${map.postCount} entradas vinculadas ao longo do tempo.`,
      })
    } else if (map.postCount >= 15) {
      chapters.push({
        period: 'O projeto mais vivo',
        text: `${emoji}${map.title} cresceu muito desde o início. Hoje, ${map.postCount} registros estão vinculados a ele.`,
      })
    }
  }

  // 6 — Primeira foto
  if (fph) {
    const date = new Date(fph.date)
    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)}, a fotografia entrou no arquivo. O olhar treinado para registrar não só o que se pensa, mas o que se vê.`,
    })
  }

  // 7 — Primeira reflexão
  if (fr?.excerpt) {
    const date   = new Date(fr.date)
    const excerpt = trimAt(cleanExcerpt(fr.excerpt), 120)
    if (excerpt) {
      chapters.push({
        period: formatDateLong(date),
        text: `Em ${formatMonth(date)}, você voltou a uma memória antiga e deixou um registro sobre ela:`,
        quote: excerpt,
      })
    }
  }

  // 8 — Primeira cápsula
  if (fc) {
    const date = new Date(fc.date)
    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)}, você selou uma mensagem para o futuro — uma cápsula do tempo. Um gesto que só faz sentido para quem acredita que o que escreve hoje vai importar amanhã.`,
    })
  }

  // 9 — Ano mais ativo
  if (may && may.count >= 10 && may.year !== new Date().getFullYear()) {
    chapters.push({
      period: String(may.year),
      text: `De todos os períodos, ${may.year} foi o mais intenso: ${may.count} registros em um único ano.`,
    })
  }

  // 10 — Fechamento
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return (
    <div style={{ margin: '72px 0 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.16em', textTransform: 'uppercase', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

function NarrativeSection({ chapters }) {
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

function TimelineSection({ accountCreatedAt, milestones }) {
  const startDate = accountCreatedAt ? new Date(accountCreatedAt) : null
  const age       = startDate ? calcAge(startDate) : null

  const timelineNodes = [
    ...(startDate ? [{ type: 'account', label: 'Criou o Archive', date: startDate, emoji: '🗓' }] : []),
    ...(milestones || []).map(m => ({ ...m, date: new Date(m.date), emoji: MILESTONE_EMOJI[m.type] || '⭐' })),
  ]

  if (timelineNodes.length === 0) return null

  return (
    <>
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
              desde {formatDateLong(startDate)}
            </div>
          </div>
        </div>
      )}

      {/* Vertical dots */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 19, top: 20, bottom: 0, width: 1, background: 'var(--line)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {timelineNodes.map((node, i) => (
            <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'flex-start', paddingBottom: 28, position: 'relative' }}>
              {/* Dot */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, zIndex: 1,
              }}>
                {node.emoji}
              </div>
              {/* Content */}
              <div style={{ paddingLeft: 14, paddingTop: 7 }}>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 3 }}>
                  {node.label}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {formatDateLong(node.date)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function MarcosSection({ milestones }) {
  const visible = (milestones || []).filter(m => m.title || m.description || m.excerpt)
  if (visible.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
      {visible.map((m, i) => {
        const detail = m.title
          ? `"${m.title}"`
          : m.description
            ? `"${trimAt(cleanExcerpt(m.description), 80)}"`
            : null

        return (
          <div key={i} style={{
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            borderRadius: 12, padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>{MILESTONE_EMOJI[m.type] || '⭐'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {formatDateLong(new Date(m.date))}
            </div>
            {detail && (
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 2 }}>
                {detail}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoryPage() {
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/archive/growth')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chapters   = data ? buildNarrative(data) : []
  const milestones = data?.milestones || []
  const hasMilestones = milestones.length > 0

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <AppBar
        left={
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="back" size={18} />
          </button>
        }
        right={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Minha Trajetória
          </span>
        }
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* ── Cabeçalho ── */}
        <div style={{ marginBottom: 56 }}>
          <h1 style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 'clamp(26px, 5vw, 40px)', color: 'var(--ink)',
            margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            Minha Trajetória
          </h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0, letterSpacing: '0.04em' }}>
            Uma narrativa construída a partir do que você registrou.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            compondo narrativa…
          </div>
        ) : (
          <>
            {/* ── 1. Narrativa ── */}
            <NarrativeSection chapters={chapters} />

            {/* ── 2. Linha do tempo ── */}
            {hasMilestones && (
              <>
                <SectionDivider label="Linha do tempo" />
                <TimelineSection
                  accountCreatedAt={data?.accountCreatedAt}
                  milestones={milestones}
                />
              </>
            )}

            {/* ── 3. Marcos ── */}
            {hasMilestones && (
              <>
                <SectionDivider label="Marcos" />
                <MarcosSection milestones={milestones} />
              </>
            )}

            {/* ── Footer nav ── */}
            {(chapters.length > 0 || hasMilestones) && (
              <div style={{ marginTop: 56, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}
                >
                  Dashboard →
                </button>
                <button
                  onClick={() => navigate('/achievements')}
                  style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer' }}
                >
                  Conquistas →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
