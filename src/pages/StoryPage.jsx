import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import { api } from '../utils/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// "há 2 anos", "há 8 meses", "há 3 dias"
function agoLabel(date) {
  const diffMs  = Date.now() - date.getTime()
  const days    = Math.floor(diffMs / 86400000)
  const years   = Math.floor(days / 365)
  const months  = Math.floor(days / 30)
  if (years >= 2)  return `há ${years} anos`
  if (years === 1) return 'há um ano'
  if (months >= 2) return `há ${months} meses`
  if (months === 1) return 'há um mês'
  return `há ${days} dias`
}

// Strip markdown noise from excerpts so they read as prose
function cleanExcerpt(text = '') {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/\*(.*?)\*/g, '$1')       // italic
    .replace(/_(.*?)_/g, '$1')         // italic alt
    .replace(/\[\[(.*?)\]\]/g, '$1')   // wiki links
    .replace(/#+\s/g, '')              // headings
    .replace(/`[^`]+`/g, '')          // inline code
    .replace(/#[\p{L}\p{N}_-]+/gu, '') // hashtags
    .replace(/\s+/g, ' ')
    .trim()
}

// Trim at word boundary
function trimAt(text, max) {
  if (!text || text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut) + '…'
}

const CATEGORIA_PLURAL = {
  pensamento:  'pensamentos',
  reflexão:    'reflexões',
  ideia:       'ideias',
  aprendizado: 'aprendizados',
  decisão:     'decisões',
  observação:  'observações',
  memória:     'memórias',
  citação:     'citações',
  meta:        'metas',
}

// ─── Narrative builder ────────────────────────────────────────────────────────
// Each chapter: { period, text, quote? }
// period → mono date label above
// text   → prose paragraph
// quote  → real excerpt in block quote (optional)

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

  // ── 1. O início ──────────────────────────────────────────────────────────────
  if (accountCreatedAt) {
    const startDate = new Date(accountCreatedAt)
    const ago = agoLabel(startDate)

    if (fp?.excerpt) {
      const rawExcerpt = cleanExcerpt(fp.excerpt)
      const excerpt = trimAt(rawExcerpt, 120)
      const fpDate  = new Date(fp.date)
      const sameDay = fpDate.toDateString() === startDate.toDateString()

      chapters.push({
        period: formatDateLong(startDate),
        text: sameDay
          ? `${ago.charAt(0).toUpperCase() + ago.slice(1)}, você abriu um arquivo. O primeiro registro foi:`
          : `${ago.charAt(0).toUpperCase() + ago.slice(1)}, você abriu um arquivo. Alguns dias depois, o primeiro registro:`,
        quote: excerpt,
      })
    } else {
      chapters.push({
        period: formatDateLong(startDate),
        text: `${ago.charAt(0).toUpperCase() + ago.slice(1)}, você abriu um arquivo. Um lugar para guardar o que importa.`,
      })
    }
  }

  // ── 2. Categoria dominante ────────────────────────────────────────────────────
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

  // ── 3. Primeiro artigo ────────────────────────────────────────────────────────
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

  // ── 4. Primeiro projeto ───────────────────────────────────────────────────────
  if (fpr) {
    const date   = new Date(fpr.date)
    const name   = fpr.title
    const emoji  = fpr.emoji ? `${fpr.emoji} ` : ''

    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)} nasceu ${emoji}${name} — o primeiro projeto registrado no Archive. A ideia de guardar não apenas pensamentos, mas algo que está sendo construído.`,
    })
  }

  // ── 5. Projeto mais ativo (se diferente do primeiro e com substância) ─────────
  if (map && map.postCount >= 5) {
    const isDifferentFromFirst = !fpr || map.title !== fpr.title
    const emoji = map.emoji ? `${map.emoji} ` : ''

    if (isDifferentFromFirst) {
      chapters.push({
        period: 'O projeto mais vivo',
        text: `De todos os projetos, ${emoji}${map.title} é o que mais concentra registros: ${map.postCount} entradas vinculadas ao longo do tempo. É onde mais trabalho aparece documentado.`,
      })
    } else if (map.postCount >= 15) {
      chapters.push({
        period: 'O projeto mais vivo',
        text: `${emoji}${map.title} cresceu muito desde o início. Hoje, ${map.postCount} registros estão vinculados a ele.`,
      })
    }
  }

  // ── 6. Primeira foto ──────────────────────────────────────────────────────────
  if (fph) {
    const date = new Date(fph.date)
    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)}, a fotografia entrou no arquivo. O olhar treinado para registrar não só o que se pensa, mas o que se vê.`,
    })
  }

  // ── 7. Primeira reflexão (memory post) ───────────────────────────────────────
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

  // ── 8. Primeira cápsula ───────────────────────────────────────────────────────
  if (fc) {
    const date = new Date(fc.date)
    chapters.push({
      period: formatDateLong(date),
      text: `Em ${formatMonth(date)}, você selou uma mensagem para o futuro — uma cápsula do tempo. Um gesto que só faz sentido para quem acredita que o que escreve hoje vai importar amanhã.`,
    })
  }

  // ── 9. Ano mais ativo (só se não for o ano corrente) ─────────────────────────
  if (may && may.count >= 10 && may.year !== new Date().getFullYear()) {
    chapters.push({
      period: String(may.year),
      text: `De todos os períodos, ${may.year} foi o mais intenso: ${may.count} registros em um único ano. Algo naquele período fez o arquivo crescer mais rápido do que qualquer outro.`,
    })
  }

  // ── 10. Fechamento ────────────────────────────────────────────────────────────
  if (s && s.totalPosts > 0) {
    const parts = []
    parts.push(`${s.totalPosts} registro${s.totalPosts !== 1 ? 's' : ''}`)
    if (s.totalArticles > 0) parts.push(`${s.totalArticles} ensaio${s.totalArticles !== 1 ? 's' : ''}`)
    if (s.totalPhotos   > 0) parts.push(`${s.totalPhotos} foto${s.totalPhotos !== 1 ? 's' : ''}`)
    if (s.totalCodes    > 0) parts.push(`${s.totalCodes} trecho${s.totalCodes !== 1 ? 's' : ''} de código`)

    const listText = parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(', ') + ' e ' + parts.at(-1)

    chapters.push({
      period: 'Hoje',
      text: `${listText}. O arquivo continua.`,
    })
  }

  return chapters
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  const chapters = data ? buildNarrative(data) : []

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
            A sua história
          </span>
        }
      />

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h1 style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 'clamp(24px, 5vw, 38px)', color: 'var(--ink)',
            margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em',
          }}>
            A história do seu arquivo.
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            compondo narrativa…
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginBottom: 8 }}>
              A história ainda está sendo escrita.
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              Faça seus primeiros registros para ver sua narrativa aqui.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {chapters.map((ch, i) => (
              <div key={i}>
                <div style={{ paddingBottom: 52 }}>
                  {/* Period label */}
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
                    letterSpacing: '0.08em', textTransform: 'lowercase', marginBottom: 14,
                  }}>
                    {ch.period}
                  </div>

                  {/* Prose */}
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: 18,
                    color: 'var(--ink)', lineHeight: 1.9, margin: 0,
                  }}>
                    {ch.text}
                  </p>

                  {/* Real excerpt as block quote */}
                  {ch.quote && (
                    <blockquote style={{
                      margin: '20px 0 0 0',
                      padding: '2px 0 2px 18px',
                      borderLeft: '2px solid var(--accent)',
                    }}>
                      <p style={{
                        fontFamily: 'var(--serif)', fontStyle: 'italic',
                        fontSize: 16, color: 'var(--ink-2)',
                        lineHeight: 1.75, margin: 0,
                      }}>
                        "{ch.quote}"
                      </p>
                    </blockquote>
                  )}
                </div>

                {/* Divider between chapters, except last */}
                {i < chapters.length - 1 && (
                  <div style={{
                    height: 1,
                    background: 'var(--line)',
                    marginBottom: 52,
                    opacity: 0.5,
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer nav */}
        {!loading && chapters.length > 0 && (
          <div style={{ marginTop: 48, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/growth')}
              style={{
                padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--ink-3)',
                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
              }}
            >
              Ver trajetória →
            </button>
            <button
              onClick={() => navigate('/achievements')}
              style={{
                padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line)',
                background: 'transparent', color: 'var(--ink-3)',
                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
              }}
            >
              Conquistas →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
