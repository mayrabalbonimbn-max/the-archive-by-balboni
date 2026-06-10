import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import PhotoTile from '../components/ui/PhotoTile'
import EntryCard from '../components/ui/EntryCard'
import { useCollections } from '../hooks/useCollections'
import { api, attachmentBlob } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

// Subsections visible in subnav (not shown on index)
const SUBSECTIONS = [
  { id: 'memories',    label: 'Memórias' },
  { id: 'calendar',   label: 'Calendário' },
  { id: 'collections', label: 'Coleções' },
]

// ── Subnav — shown only inside a subsection ───────────────────────────────────
function Subnav({ active, onSelect }) {
  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#000', borderBottom: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '0 20px', scrollbarWidth: 'none' }}>
        <button
          onClick={() => onSelect('index')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '13px 16px 11px 0', marginRight: 6,
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
            color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <Icon name="back" size={13} /> Arquivo
        </button>
        {SUBSECTIONS.map(s => {
          const on = s.id === active
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '13px 0 11px', marginRight: 22, position: 'relative',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--sans)', fontSize: 14,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--ink)' : 'var(--ink-3)',
              }}
            >
              {s.label}
              {on && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: -1,
                  height: 2, background: 'var(--accent)', borderRadius: 2,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )
}

// ── Desktop page header (only shown on md+) ───────────────────────────────────
function DPageHead({ eyebrow, title, italic, sub }) {
  return (
    <div className="hidden md:block" style={{ marginBottom: 28, paddingTop: 8 }}>
      {eyebrow && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1.05, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em' }}>
        {title}{italic && <span style={{ fontStyle: 'italic' }}> {italic}</span>}
      </h1>
      {sub && (
        <p style={{ margin: '12px 0 0', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-3)', maxWidth: 540 }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ── Index — landing do Arquivo ────────────────────────────────────────────────
const TYPE_FILTERS = [
  { id: 'note',    label: 'Notas',      icon: '📝' },
  { id: 'article', label: 'Ensaios',    icon: '📄' },
  { id: 'photo',   label: 'Fotos',      icon: '🖼' },
  { id: 'pdf',     label: 'Documentos', icon: '📎' },
  { id: 'code',    label: 'Código',     icon: '💻' },
]

function IndexSection({ onSection }) {
  const navigate = useNavigate()
  const [recent, setRecent] = useState(null)
  const [summary, setSummary] = useState(null)
  const { collections } = useCollections()

  useEffect(() => {
    api.get('/posts').then(posts => {
      setRecent(posts.slice(0, 3))
      // Compute type counts for navigation chips
      const counts = {}
      posts.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1 })
      setSummary({ total: posts.length, counts })
    }).catch(() => { setRecent([]); setSummary({ total: 0, counts: {} }) })
  }, [])

  const CARDS = [
    {
      id: 'memories', emoji: '💭', label: 'Memórias',
      sub: 'O que você guardou neste dia, em outros anos',
      action: () => onSection('memories'),
    },
    {
      id: 'calendar', emoji: '🗓', label: 'Calendário',
      sub: 'Navegar por data',
      action: () => onSection('calendar'),
    },
    {
      id: 'photos', emoji: '📷', label: 'Fotografias',
      sub: 'Galeria de imagens',
      action: () => navigate('/photos'),
    },
    {
      id: 'library', emoji: '📎', label: 'Documentos',
      sub: 'PDFs, Markdown e código',
      action: () => navigate('/library'),
    },
    {
      id: 'collections', emoji: '📁', label: 'Coleções',
      sub: collections.length > 0 ? `${collections.length} ${collections.length === 1 ? 'coleção' : 'coleções'}` : 'Curadoria manual',
      action: () => onSection('collections'),
    },
    {
      id: 'capsules', emoji: '📦', label: 'Cápsulas',
      sub: 'Cartas para o futuro',
      action: () => navigate('/capsules'),
    },
    {
      id: 'projects', emoji: '🌱', label: 'Projetos',
      sub: 'Em andamento e concluídos',
      action: () => navigate('/projects'),
    },
    {
      id: 'moments', emoji: '🎬', label: 'Momentos',
      sub: 'Diário em vídeo',
      action: () => navigate('/archive/stories'),
    },
  ]

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 20px' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1 }}>
          Seu <span style={{ fontStyle: 'italic' }}>Arquivo</span>
        </h1>
        <p style={{ margin: '8px 0 0', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          Tudo que você guardou, por caminhos diferentes.
          {summary && summary.total > 0 && (
            <> · <span style={{ color: 'var(--ink-2)' }}>{summary.total}</span> {summary.total === 1 ? 'entrada' : 'entradas'}</>
          )}
        </p>
      </div>

      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
        {CARDS.map(card => (
          <button
            key={card.id}
            onClick={card.action}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 8, padding: '16px 15px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--line)',
              borderRadius: 16, cursor: 'pointer', textAlign: 'left',
              transition: 'border-color .15s, background .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{card.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>
                {card.sub}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Navegar por tipo */}
      <div style={{ marginTop: 28, padding: '0 16px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 10 }}>
          NAVEGAR POR TIPO
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(f => {
            const count = summary?.counts[f.id] ?? 0
            const dest = f.id === 'photo' ? '/photos' : f.id === 'pdf' ? '/library' : '/diary'
            return (
              <button
                key={f.id}
                onClick={() => navigate(dest)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 999,
                  border: '1px solid var(--line)', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13,
                  color: count > 0 ? 'var(--ink-2)' : 'var(--ink-3)',
                }}
              >
                {f.icon} {f.label}
                {count > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Últimos guardados */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
            ÚLTIMOS GUARDADOS
          </div>
          <button
            onClick={() => navigate('/diary')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.04em' }}
          >
            Ver tudo →
          </button>
        </div>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {recent === null ? <Spinner /> : recent.length === 0 ? (
            <p style={{ padding: '24px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              Nenhuma entrada ainda.
            </p>
          ) : (
            recent.map(p => <EntryCard key={p.id} post={p} showAuthor={false} />)
          )}
        </div>
      </div>
    </div>
  )
}

// ── Memories ──────────────────────────────────────────────────────────────────
function MemoriesSection() {
  const [memories, setMemories] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/archive/memories').then(setMemories).catch(() => setMemories([]))
  }, [])

  const today = new Date()
  const todayLabel = today.toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' }).toUpperCase()

  function handleReflect(m) {
    const dateStr = new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const excerpt = (m.articleTitle || m.content || '').slice(0, 200)
    const initialContent = `---\nReflexão sobre uma memória\n\nEm ${dateStr} eu escrevi:\n\n"${excerpt}${excerpt.length >= 200 ? '…' : ''}"\n\nHoje eu penso:\n`
    window.dispatchEvent(new CustomEvent('open-compose', { detail: { initialContent, parentMemoryPostId: m.id } }))
  }

  function handleRevisit(m) {
    navigate(m.isArticle ? `/articles/${m.id}` : `/posts/${m.id}`)
  }

  return (
    <div style={{ paddingTop: 6 }}>
      {/* Desktop header */}
      <div className="hidden md:block" style={{ padding: '0 20px 4px' }}>
        <DPageHead
          eyebrow={`NESTE DIA · ${todayLabel}`}
          title="O que você guardou,"
          italic={`em outros ${today.toLocaleDateString('pt-BR', { month: 'long' })}s.`}
        />
      </div>

      {/* Mobile header */}
      <div className="md:hidden" style={{ padding: '18px 20px 8px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 10 }}>
          NESTE DIA · {todayLabel}
        </div>
        <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1.15, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em' }}>
          O que você guardou,<br />
          <span style={{ fontStyle: 'italic' }}>em outros {today.toLocaleDateString('pt-BR', { month: 'long' })}s.</span>
        </h2>
      </div>

      {!memories ? <Spinner /> : memories.length === 0 ? (
        <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
          Nenhuma memória para este dia ainda.
        </p>
      ) : (
        <div style={{ padding: '14px 20px 0' }}>
          {memories.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 16, paddingBottom: i === memories.length - 1 ? 0 : 28 }}>
              <div style={{ flexShrink: 0, width: 46, textAlign: 'right', paddingTop: 2 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--accent)', fontStyle: 'italic' }}>
                  {m.yearsAgo ?? '?'}a
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                  {m.year}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingLeft: 18, borderLeft: '1px solid var(--line)', paddingBottom: 4 }}>
                <div style={{ position: 'absolute', left: -4.5, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                {/* Label */}
                {m.label && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 6 }}>
                    {m.label.toUpperCase()}
                  </div>
                )}
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>
                  {m.articleTitle ?? m.title ?? ''}
                </div>
                <p style={{ margin: '0 0 12px', fontFamily: 'var(--sans)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                  {(m.content || '').slice(0, 200)}{(m.content || '').length > 200 && '…'}
                </p>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => handleRevisit(m)}
                    style={{
                      padding: '5px 12px', borderRadius: 8,
                      border: '1px solid var(--line)', background: 'transparent',
                      cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12,
                      color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    ↻ Revisitar
                  </button>
                  <button
                    onClick={() => handleReflect(m)}
                    style={{
                      padding: '5px 12px', borderRadius: 8,
                      border: '1px solid rgba(232,108,180,0.35)',
                      background: 'rgba(232,108,180,0.07)',
                      cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12,
                      color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    💭 Refletir
                  </button>
                  {m.reflectionCount > 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
                      {m.reflectionCount} reflexão{m.reflectionCount > 1 ? 'ões' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Calendar ──────────────────────────────────────────────────────────────────
const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function CalendarSection() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [sel, setSel] = useState(now.getDate())
  const [density, setDensity] = useState({})
  const [dayPosts, setDayPosts] = useState(null)

  useEffect(() => {
    api.get(`/archive/calendar/${year}/${month + 1}`)
      .then(data => {
        const map = {}
        if (Array.isArray(data?.posts)) {
          data.posts.forEach(p => {
            const d = new Date(p.createdAt).getDate()
            map[d] = Math.min(3, (map[d] ?? 0) + 1)
          })
        }
        setDensity(map)
        setSel(now.getMonth() === month && now.getFullYear() === year ? now.getDate() : 1)
      })
      .catch(() => setDensity({}))
  }, [year, month])

  useEffect(() => {
    setDayPosts(null)
    api.get(`/archive/calendar/${year}/${month + 1}`)
      .then(data => {
        const posts = (data?.posts ?? []).filter(p => new Date(p.createdAt).getDate() === sel)
        setDayPosts(posts)
      })
      .catch(() => setDayPosts([]))
  }, [year, month, sel])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const monthName = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long' })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em', textTransform: 'capitalize' }}>
          {monthName} <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>{year}</span>
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={16} />
          </button>
          <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '0 16px' }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', padding: '4px 0 8px' }}>
            {d}
          </div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => <div key={'o' + i} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const dots = density[d] ?? 0
          const on = d === sel
          return (
            <button
              key={d}
              onClick={() => setSel(d)}
              style={{
                aspectRatio: '1', border: 'none', cursor: 'pointer', borderRadius: 11,
                background: on ? 'var(--accent)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4, padding: 0,
              }}
            >
              <span style={{
                fontFamily: 'var(--sans)', fontSize: 13.5,
                color: on ? '#fff' : (dots ? 'var(--ink)' : 'var(--ink-3)'),
                fontWeight: on ? 600 : 400,
              }}>{d}</span>
              <span style={{ display: 'flex', gap: 2, height: 4 }}>
                {Array.from({ length: dots }).map((_, i) => (
                  <span key={i} style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: on ? 'rgba(255,255,255,0.85)' : 'var(--accent)' }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 18, borderTop: '1px solid var(--line)' }}>
        <div style={{ padding: '14px 20px 4px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
          {monthName} {sel} · {dayPosts?.length ?? '…'} {(dayPosts?.length ?? 0) === 1 ? 'ENTRADA' : 'ENTRADAS'}
        </div>
        {!dayPosts ? <Spinner /> : dayPosts.length === 0 ? (
          <div style={{ padding: '24px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Nenhuma entrada neste dia. Um dia tranquilo.
          </div>
        ) : (
          dayPosts.map(p => <EntryCard key={p.id} post={p} showAuthor={false} />)
        )}
      </div>
    </div>
  )
}

// ── Collections ───────────────────────────────────────────────────────────────
function NewCollectionModal({ onClose, onCreate, existingNames }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📁')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const EMOJIS = ['📁', '📷', '📔', '💡', '🎨', '📚', '🌱', '🔬', '✍️', '🎵', '🐍', '🎓', '🏃', '⚡']
  const COLORS = ['#E86CB4', '#7AA2F7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
  const [color, setColor] = useState(COLORS[0])

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed) return setError('Nome obrigatório.')
    if (existingNames.includes(trimmed.toLowerCase())) return setError('Essa coleção já existe.')
    setSaving(true)
    try {
      await onCreate({ name: trimmed, emoji, color })
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 540, background: 'var(--surface-2)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', border: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', fontWeight: 400 }}>Nova coleção</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--ink-3)', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 8 }}>EMOJI</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{ width: 36, height: 36, borderRadius: 9, border: `1.5px solid ${emoji === e ? 'var(--accent)' : 'var(--line)'}`, background: emoji === e ? 'rgba(232,108,180,0.1)' : 'transparent', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 8 }}>COR</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: `2.5px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 8 }}>NOME</div>
          <input
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="ex: Leituras de inverno"
            maxLength={100}
            style={{ width: '100%', background: 'var(--surface-3)', border: `1px solid ${error ? '#f7768e' : 'var(--line)'}`, borderRadius: 10, padding: '11px 14px', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
          />
          {error && <p style={{ margin: '6px 0 0', fontFamily: 'var(--mono)', fontSize: 11, color: '#f7768e' }}>{error}</p>}
        </div>

        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: color, fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, color: '#fff', cursor: saving || !name.trim() ? 'default' : 'pointer', opacity: saving || !name.trim() ? 0.5 : 1 }}
        >
          {saving ? 'Criando…' : 'Criar coleção'}
        </button>
      </div>
    </div>
  )
}

function CollectionsSection() {
  const navigate = useNavigate()
  const { collections, loading, createCollection } = useCollections()
  const [showModal, setShowModal] = useState(false)

  if (loading) return <Spinner />

  const existingNames = collections.map(c => c.name.toLowerCase())

  return (
    <div style={{ padding: '18px 16px 0' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Coleções</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
            Entradas reunidas por tema, mesmo que não sejam um projeto.
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            flexShrink: 0, padding: '8px 15px', borderRadius: 10,
            background: 'var(--accent)', border: 'none',
            fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
            color: '#fff', cursor: 'pointer',
          }}
        >
          + Nova
        </button>
      </div>

      {collections.length === 0 ? (
        <div style={{ padding: '40px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📁</div>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', fontWeight: 400 }}>
            Nenhuma coleção ainda.
          </p>
          <p style={{ margin: '0 0 20px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 280, marginInline: 'auto' }}>
            Coleções são curadorias manuais — um lugar para juntar entradas que pertencem ao mesmo tema, mesmo que não sejam um projeto.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 22px', borderRadius: 12, background: 'var(--accent)', border: 'none', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
          >
            Criar primeira coleção
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {collections.map(c => {
            const tone = c.color ?? '#7AA2F7'
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/collections/${c.id}`)}
                style={{
                  cursor: 'pointer', borderRadius: 16, overflow: 'hidden',
                  border: '1px solid var(--line-strong)',
                  background: 'rgba(255,255,255,0.015)',
                }}
              >
                <div style={{
                  height: 80,
                  background: `linear-gradient(150deg, ${tone}50, #0c0c0e)`,
                  display: 'flex', alignItems: 'flex-end', padding: '0 11px 10px',
                }}>
                  <span style={{ fontSize: 22 }}>{c.emoji}</span>
                </div>
                <div style={{ padding: '10px 12px 13px' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 15.5, color: 'var(--ink)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6 }}>
                    {c.postCount ?? 0} {(c.postCount ?? 0) === 1 ? 'entrada' : 'entradas'}
                  </div>
                </div>
              </div>
            )
          })}
          {/* Add button card */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              cursor: 'pointer', borderRadius: 16, overflow: 'hidden',
              border: '1px dashed var(--line-strong)',
              background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 120, gap: 6,
            }}
          >
            <span style={{ fontSize: 22, opacity: 0.3 }}>+</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)' }}>Nova coleção</span>
          </div>
        </div>
      )}

      {showModal && (
        <NewCollectionModal
          onClose={() => setShowModal(false)}
          onCreate={createCollection}
          existingNames={existingNames}
        />
      )}
    </div>
  )
}

// ── Library ───────────────────────────────────────────────────────────────────
const KIND_ICON = { pdf: 'pdf', markdown: 'markdown', python: 'code', code: 'code', image: 'image' }
const KIND_COLOR = { pdf: '#F7768E', markdown: '#7AA2F7', python: '#9ECE6A', code: '#E0AF68', image: '#BB9AF7' }

function LibraryRow({ item, onView }) {
  const tone = KIND_COLOR[item.fileType] ?? '#ABA49A'
  const iconName = KIND_ICON[item.fileType] ?? 'note'
  const title = item.title || item.originalName || item.articleTitle || 'Arquivo'

  return (
    <div
      onClick={() => onView(item)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
    >
      <div style={{
        width: 38, height: 50, borderRadius: 5, flexShrink: 0,
        background: `linear-gradient(160deg, ${tone}33, #111)`,
        border: `1px solid ${tone}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: tone,
      }}>
        <Icon name={iconName} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1 }}>
          {item.fileType?.toUpperCase() ?? 'FILE'}
          {item.size ? ` · ${item.size >= 1048576 ? `${(item.size / 1048576).toFixed(1)} MB` : `${Math.ceil(item.size / 1024)} KB`}` : ''}
        </div>
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>Abrir →</span>
    </div>
  )
}

function LibrarySection() {
  const [files, setFiles] = useState(null)
  const [textModal, setTextModal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/library').then(d => setFiles(Array.isArray(d) ? d : d?.files ?? [])).catch(() => setFiles([]))
  }, [])

  async function handleView(item) {
    setError('')
    const isText = ['markdown', 'python', 'code'].includes(item.fileType)
    const windowRef = item.fileType === 'pdf' ? window.open('', '_blank') : null
    try {
      const blob = await attachmentBlob(item.id)
      if (isText) {
        setTextModal({ item, content: await blob.text() })
        return
      }
      const url = URL.createObjectURL(blob)
      if (windowRef) { windowRef.opener = null; windowRef.location = url }
      else window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      windowRef?.close()
      setError(err.message)
    }
  }

  return (
    <>
      <div style={{ paddingTop: 6 }}>
        <div style={{ padding: '16px 20px 12px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
          Documentos, notas e código — tudo que é legível, num só lugar.
        </div>
        {error && <p style={{ padding: '0 20px 8px', color: '#f7768e', fontFamily: 'var(--mono)', fontSize: 12 }}>{error}</p>}
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {!files ? <Spinner /> : files.length === 0 ? (
            <p style={{ padding: '24px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              Nenhum arquivo ainda.
            </p>
          ) : (
            files.map(f => <LibraryRow key={f.id} item={f} onView={handleView} />)
          )}
        </div>
      </div>

      {textModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setTextModal(null)}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{textModal.item.originalName}</span>
              <button onClick={() => navigator.clipboard.writeText(textModal.content)} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Copiar</button>
              <button onClick={() => setTextModal(null)} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Fechar</button>
            </div>
            <pre style={{ margin: 0, padding: 16, overflow: 'auto', fontFamily: 'var(--mono)', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{textModal.content}</pre>
          </div>
        </div>
      )}
    </>
  )
}

// ── Photography ───────────────────────────────────────────────────────────────
function PhotoCell({ photo, onOpen }) {
  const url = useAttachmentUrl(photo.id, photo.hasThumbnail ? 'thumbnail' : 'view')
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{ aspectRatio: '1', borderRadius: 3, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
      onClick={() => onOpen(photo)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <PhotoTile tone1="#2a3140" tone2="#11141c" style={{ width: '100%', height: '100%' }} radius={3} />
      )}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 7,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
        opacity: hover ? 1 : 0, transition: 'opacity .2s',
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#fff' }}>
          {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : ''}
        </span>
      </div>
    </div>
  )
}

function ArchiveLightbox({ photo, onClose }) {
  const url = useAttachmentUrl(photo.id, 'view')
  const exif = photo.exifData
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 }}
      onClick={onClose}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{ position: 'absolute', top: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))', right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 999, color: '#fff', padding: '8px 14px', fontSize: 13, cursor: 'pointer', touchAction: 'manipulation' }}
      >
        Fechar
      </button>
      {url
        ? <img src={url} alt={photo.title || photo.originalName || ''} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 10, objectFit: 'contain' }} />
        : <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e8697a', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      }
      {exif && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
          {exif.camera && <span style={{ display: 'inline-flex', gap: 4, fontSize: 11, color: '#aaa', background: '#1a1a1a', borderRadius: 4, padding: '2px 8px' }}><span style={{ color: '#555' }}>câmera</span><span>{exif.camera}</span></span>}
          {exif.aperture && <span style={{ display: 'inline-flex', gap: 4, fontSize: 11, color: '#aaa', background: '#1a1a1a', borderRadius: 4, padding: '2px 8px' }}><span style={{ color: '#555' }}>abertura</span><span>{exif.aperture}</span></span>}
          {exif.shutterSpeed && <span style={{ display: 'inline-flex', gap: 4, fontSize: 11, color: '#aaa', background: '#1a1a1a', borderRadius: 4, padding: '2px 8px' }}><span style={{ color: '#555' }}>velocidade</span><span>{exif.shutterSpeed}</span></span>}
          {exif.iso && <span style={{ display: 'inline-flex', gap: 4, fontSize: 11, color: '#aaa', background: '#1a1a1a', borderRadius: 4, padding: '2px 8px' }}><span style={{ color: '#555' }}>ISO</span><span>{exif.iso}</span></span>}
        </div>
      )}
    </div>
  )
}

function PhotographySection() {
  const [photos, setPhotos] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    api.get('/archive/photos').then(setPhotos).catch(() => setPhotos([]))
  }, [])

  return (
    <>
      <div style={{ padding: '16px 3px 0' }}>
        {!photos ? <Spinner /> : photos.length === 0 ? (
          <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Nenhuma fotografia ainda.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            {photos.map(p => <PhotoCell key={p.id} photo={p} onOpen={setOpen} />)}
          </div>
        )}
      </div>
      {open && <ArchiveLightbox photo={open} onClose={() => setOpen(null)} />}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ArchiveHubPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const section = searchParams.get('s') ?? 'index'

  function setSection(s) {
    if (s === 'index') { setSearchParams({}); return }
    setSearchParams({ s })
  }

  const SectionBody = {
    index:       () => <IndexSection onSection={setSection} />,
    memories:    () => <MemoriesSection />,
    calendar:    () => <CalendarSection />,
    collections: () => <CollectionsSection />,
  }[section] ?? (() => <IndexSection onSection={setSection} />)

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>
            Arquivo
          </span>
        }
        right={
          <button
            onClick={() => navigate('/explore')}
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="search" size={19} />
          </button>
        }
      />
      {section !== 'index' && <Subnav active={section} onSelect={setSection} />}
      <SectionBody />
    </div>
  )
}
