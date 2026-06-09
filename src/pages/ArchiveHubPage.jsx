import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import PhotoTile from '../components/ui/PhotoTile'
import Chip from '../components/ui/Chip'
import EntryCard from '../components/ui/EntryCard'
import { useCollections } from '../hooks/useCollections'
import { useProfile } from '../hooks/useProfile'
import { api } from '../utils/api'
import { useAttachmentUrl } from '../hooks/useAttachmentUrl'

const SECTIONS = [
  { id: 'overview',     label: 'Arquivo' },
  { id: 'memories',     label: 'Memórias' },
  { id: 'calendar',     label: 'Calendário' },
  { id: 'collections',  label: 'Coleções' },
  { id: 'library',      label: 'Biblioteca' },
  { id: 'photography',  label: 'Fotos' },
]

// ── Subnav — mobile only ──────────────────────────────────────────────────────
function Subnav({ active, onSelect }) {
  return (
    <div
      className="md:hidden"
      style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: '#000', borderBottom: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', gap: 22, overflowX: 'auto', padding: '0 20px', scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => {
          const on = s.id === active
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '13px 0 11px', position: 'relative',
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

// ── Overview ──────────────────────────────────────────────────────────────────
const FILTERS = [
  ['all', 'Tudo'],
  ['note', 'Notas'],
  ['article', 'Ensaios'],
  ['photo', 'Fotos'],
  ['pdf', 'Documentos'],
  ['code', 'Código'],
]

function OverviewSection({ profile }) {
  const [posts, setPosts] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/posts').then(setPosts).catch(() => setPosts([]))
  }, [])

  const shown = !posts ? [] : (filter === 'all' ? posts : posts.filter(p => p.type === filter))

  return (
    <div>
      {/* Desktop page header */}
      <div className="hidden md:block" style={{ padding: '0 20px 4px' }}>
        <DPageHead
          title="Seu"
          italic="Arquivo"
          sub="Um registro lento do que você lê, constrói e nota — guardado, não transmitido."
        />
      </div>

      {/* Mobile identity row */}
      <div className="md:hidden" style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={profile?.name} src={profile?.avatar} size={56} ring />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            {profile?.name}
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>
            @{profile?.handle}
            {posts && <> · <span style={{ color: 'var(--ink-2)' }}>{posts.length}</span> entradas</>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 20px 16px', scrollbarWidth: 'none' }}>
        {FILTERS.map(([id, label]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--line)' }}>
        {!posts ? <Spinner /> : shown.length === 0 ? (
          <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Nenhuma entrada aqui ainda.
          </p>
        ) : (
          shown.map(p => <EntryCard key={p.id} post={p} showAuthor={false} />)
        )}
      </div>
    </div>
  )
}

// ── Memories ──────────────────────────────────────────────────────────────────
function MemoriesSection() {
  const [memories, setMemories] = useState(null)

  useEffect(() => {
    api.get('/archive/memories').then(setMemories).catch(() => setMemories([]))
  }, [])

  const today = new Date()
  const todayLabel = today.toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' }).toUpperCase()

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
            <div key={m.id} style={{ display: 'flex', gap: 16, paddingBottom: i === memories.length - 1 ? 0 : 24 }}>
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
                {(m.type === 'photo' || m.photo) && (
                  <PhotoTile tone1={m.tone1 ?? '#2a3140'} tone2={m.tone2 ?? '#11141c'} style={{ height: 150, marginBottom: 10 }} />
                )}
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>
                  {m.articleTitle ?? m.title ?? ''}
                </div>
                <p style={{ margin: 0, fontFamily: 'var(--sans)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
                  {m.body ?? m.content ?? ''}
                </p>
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
function CollectionsSection() {
  const navigate = useNavigate()
  const { collections, loading } = useCollections()

  if (loading) return <Spinner />

  return (
    <div style={{ padding: '18px 16px 0' }}>
      {collections.length === 0 ? (
        <p style={{ padding: '32px 4px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
          Ainda não há coleções.
        </p>
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
                  height: 88,
                  background: `linear-gradient(150deg, ${tone}55, #0c0c0e)`,
                  position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 11,
                }}>
                  {c.pinned && (
                    <div style={{ position: 'absolute', top: 10, right: 10, color: 'var(--accent)' }}>
                      <Icon name="pin" size={15} />
                    </div>
                  )}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 22 }}>{c.emoji}</span>
                </div>
                <div style={{ padding: '11px 12px 14px' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 16.5, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 8 }}>
                    {c.postCount ?? 0} entradas
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Library ───────────────────────────────────────────────────────────────────
const KIND_ICON = { pdf: 'pdf', markdown: 'markdown', python: 'code', code: 'code', image: 'image' }
const KIND_COLOR = { pdf: '#F7768E', markdown: '#7AA2F7', python: '#9ECE6A', code: '#E0AF68', image: '#BB9AF7' }

function LibraryRow({ item }) {
  const tone = KIND_COLOR[item.fileType] ?? '#ABA49A'
  const iconName = KIND_ICON[item.fileType] ?? 'note'
  const title = item.title || item.originalName || item.articleTitle || 'Arquivo'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
          <div style={{ flex: 1, maxWidth: 120, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: '30%', height: '100%', background: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function LibrarySection() {
  const [files, setFiles] = useState(null)

  useEffect(() => {
    api.get('/library').then(d => setFiles(Array.isArray(d) ? d : d?.files ?? [])).catch(() => setFiles([]))
  }, [])

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ padding: '16px 20px 12px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>
        Livros, documentos, notas e código — tudo que é legível, num só lugar.
      </div>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {!files ? <Spinner /> : files.length === 0 ? (
          <p style={{ padding: '24px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Nenhum arquivo na biblioteca ainda.
          </p>
        ) : (
          files.map(f => <LibraryRow key={f.id} item={f} />)
        )}
      </div>
    </div>
  )
}

// ── Photography ───────────────────────────────────────────────────────────────
function PhotoCell({ photo }) {
  const url = useAttachmentUrl(photo.id)
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{ aspectRatio: '1', borderRadius: 3, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
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

function PhotographySection() {
  const [photos, setPhotos] = useState(null)

  useEffect(() => {
    api.get('/archive/photos').then(setPhotos).catch(() => setPhotos([]))
  }, [])

  return (
    <div style={{ padding: '16px 3px 0' }}>
      {!photos ? <Spinner /> : photos.length === 0 ? (
        <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
          Nenhuma fotografia ainda.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
          {photos.map(p => <PhotoCell key={p.id} photo={p} />)}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ArchiveHubPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useProfile()

  const section = searchParams.get('s') ?? 'overview'
  function setSection(s) { setSearchParams({ s }) }

  const SectionBody = {
    overview:    () => <OverviewSection profile={profile} />,
    memories:    () => <MemoriesSection />,
    calendar:    () => <CalendarSection />,
    collections: () => <CollectionsSection />,
    library:     () => <LibrarySection />,
    photography: () => <PhotographySection />,
  }[section] ?? (() => <OverviewSection profile={profile} />)

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>
            Seu Arquivo
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
      <Subnav active={section} onSelect={setSection} />
      <SectionBody />
    </div>
  )
}
