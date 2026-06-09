import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Chip from '../components/ui/Chip'
import SectionLabel from '../components/ui/SectionLabel'
import PhotoTile from '../components/ui/PhotoTile'
import Avatar from '../components/ui/Avatar'
import PersonRow from '../components/ui/PersonRow'
import EntryCard from '../components/ui/EntryCard'
import { api } from '../utils/api'

const THEMES = [
  'Fotografia', 'Ensaios', 'Notas de campo', 'Código', 'Leitura', 'Memória', 'Arquitetura',
]

// Tones for public archive cards — deterministic by index
const CARD_TONES = [
  ['#3a3f3c', '#191c1a'],
  ['#26303a', '#11171d'],
  ['#2d2533', '#161118'],
]

// ── SearchField ───────────────────────────────────────────────────────────────
function SearchField({ value, onChange, inputRef }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 13, border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.03)' }}>
      <Icon name="search" size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Arquivos, entradas, pessoas…"
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 14.5,
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0, display: 'flex' }}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}

// ── PublicArchiveCard ─────────────────────────────────────────────────────────
function PublicArchiveCard({ user, idx }) {
  const navigate = useNavigate()
  const [tone1, tone2] = CARD_TONES[idx % CARD_TONES.length]
  const headline = user.bio?.slice(0, 60) || `${user.name}'s archive`

  return (
    <div
      onClick={() => navigate(`/profiles/${user.id}`)}
      style={{ flexShrink: 0, width: 256, cursor: 'pointer' }}
    >
      <PhotoTile tone1={tone1} tone2={tone2} radius={16} style={{ height: 150 }}>
        <div style={{
          position: 'absolute', inset: 0, padding: 15,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.7))',
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.2, color: '#fff' }}>
            {headline}
          </div>
        </div>
      </PhotoTile>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
        <Avatar name={user.name} src={user.avatar} profileId={user.id} size={28} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{user.handle}</div>
        </div>
      </div>
    </div>
  )
}

// ── DefaultState ──────────────────────────────────────────────────────────────
function DefaultState({ suggested }) {
  const navigate = useNavigate()
  const [activeTheme, setActiveTheme] = useState(0)

  return (
    <>
      {/* Theme chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 20px 20px', scrollbarWidth: 'none' }}>
        {THEMES.map((t, i) => (
          <Chip key={t} active={activeTheme === i} onClick={() => setActiveTheme(i)}>{t}</Chip>
        ))}
      </div>

      {/* Public archives */}
      {suggested.length > 0 && (
        <>
          <SectionLabel>Arquivos públicos, abertos recentemente</SectionLabel>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '12px 20px 26px', scrollbarWidth: 'none' }}>
            {suggested.slice(0, 5).map((u, i) => (
              <PublicArchiveCard key={u.id} user={u} idx={i} />
            ))}
          </div>
        </>
      )}

      {/* People */}
      <SectionLabel action="Ver tudo" onAction={() => navigate('/friends')}>
        Pessoas guardando coisas como você
      </SectionLabel>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {suggested.slice(0, 4).map(u => (
          <PersonRow key={u.id} person={u} />
        ))}
        {suggested.length === 0 && (
          <p style={{ padding: '24px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Ninguém sugerido ainda.
          </p>
        )}
      </div>
    </>
  )
}

// ── SearchResults ─────────────────────────────────────────────────────────────
function SearchResults({ q, results, loading }) {
  const people = results?.users ?? []
  const entries = [...(results?.posts ?? []), ...(results?.articles ?? [])]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!people.length && !entries.length) {
    return (
      <div style={{ padding: '56px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)' }}>
        Nada ainda para "{q}".
      </div>
    )
  }

  return (
    <>
      {people.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <SectionLabel>Pessoas</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {people.map(u => <PersonRow key={u.id} person={u} />)}
          </div>
        </div>
      )}
      {entries.length > 0 && (
        <div>
          <SectionLabel>Entradas</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {entries.map(p => <EntryCard key={p.id} post={p} showAuthor />)}
          </div>
        </div>
      )}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suggested, setSuggested] = useState([])
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Load suggested people for default state
  useEffect(() => {
    api.get('/users/suggested').then(setSuggested).catch(() => {
      // Fallback: load all users and filter non-following
      api.get('/search?q=').then(d => setSuggested(d?.users ?? [])).catch(() => {})
    })
  }, [])

  // Live search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults(null); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/search?q=${encodeURIComponent(q.trim())}`)
        setResults(data)
      } catch {
        setResults({ users: [], posts: [], articles: [] })
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(debounceRef.current)
  }, [q])

  const searching = q.trim().length >= 2

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>
            Explorar
          </span>
        }
      />

      <div style={{ padding: '18px 20px 8px' }}>
        <SearchField value={q} onChange={setQ} inputRef={inputRef} />
      </div>

      {searching
        ? <SearchResults q={q.trim()} results={results} loading={loading} />
        : <DefaultState suggested={suggested} />
      }
    </div>
  )
}
