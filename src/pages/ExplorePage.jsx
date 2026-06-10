import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import SectionLabel from '../components/ui/SectionLabel'
import PhotoTile from '../components/ui/PhotoTile'
import Avatar from '../components/ui/Avatar'
import PersonRow from '../components/ui/PersonRow'
import VerifiedBadge from '../components/ui/VerifiedBadge'
import { api } from '../utils/api'
import { profileUrl } from '../utils/helpers'

// ── Static feature cards for "Comece por aqui" ───────────────────────────────
const FEATURES = [
  { emoji: '✍️', label: 'Escrever uma nota',   action: 'compose' },
  { emoji: '⌛', label: 'Cápsulas',             path: '/capsules' },
  { emoji: '🔗', label: 'Graph',               path: '/graph' },
  { emoji: '📁', label: 'Coleções',            path: '/archive?s=collections' },
  { emoji: '💭', label: 'Memórias',            path: '/archive?s=memories' },
  { emoji: '📸', label: 'Fotos',               path: '/photos' },
  { emoji: '📖', label: 'Trajetória',           path: '/trajetoria' },
  { emoji: '🗂️', label: 'Seu Arquivo',         path: '/archive' },
]

// Tones for public archive cards — deterministic by index
const CARD_TONES = [
  ['#3a3f3c', '#191c1a'],
  ['#26303a', '#11171d'],
  ['#2d2533', '#161118'],
  ['#33302a', '#191611'],
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
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 14.5 }}
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

// ── "Comece por aqui" — always rendered, no API dependency ───────────────────
function StartHereSection() {
  const navigate = useNavigate()

  function handleFeature(f) {
    if (f.action === 'compose') {
      window.dispatchEvent(new CustomEvent('open-compose'))
    } else {
      navigate(f.path)
    }
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <SectionLabel>Comece por aqui</SectionLabel>
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '10px 20px 22px', scrollbarWidth: 'none' }}>
        {FEATURES.map(f => (
          <button
            key={f.label}
            onClick={() => handleFeature(f)}
            style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 10, padding: '13px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--line)',
              borderRadius: 14, cursor: 'pointer', minWidth: 120,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{f.emoji}</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.3 }}>
              {f.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── GuideCard — card for @thearchive posts ───────────────────────────────────
function GuideCard({ post }) {
  const navigate = useNavigate()
  const lines = post.content?.split('\n') ?? []
  const title = lines[0] || ''
  const body = lines.slice(2).join(' ').trim().slice(0, 90) || ''

  return (
    <div
      onClick={() => navigate(`/posts/${post.id}`)}
      style={{
        flexShrink: 0, width: 210, cursor: 'pointer', textAlign: 'left',
        background: 'rgba(255,255,255,0.025)', borderRadius: 14,
        border: '1px solid var(--line)', padding: '14px 15px',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}
    >
      <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.35, color: 'var(--ink)', fontStyle: 'italic', flex: 1 }}>
        {title}
      </div>
      {body && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          {body}…
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); navigate(profileUrl('@thearchive')) }}
        style={{ marginTop: 2, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        @thearchive
        <VerifiedBadge size={11} />
      </button>
    </div>
  )
}

// ── Archive posts section — with fallback ─────────────────────────────────────
function ArchivePostsSection({ guidePosts, loading }) {
  const navigate = useNavigate()

  return (
    <div style={{ marginBottom: 8 }}>
      <SectionLabel
        action="Ver perfil"
        onAction={() => navigate(profileUrl('@thearchive'))}
      >
        Do Archive
      </SectionLabel>

      {loading ? (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flexShrink: 0, width: 210, height: 100, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }} />
            ))}
          </div>
        </div>
      ) : guidePosts.length > 0 ? (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '10px 20px 24px', scrollbarWidth: 'none' }}>
          {guidePosts.map(p => <GuideCard key={p.id} post={p} />)}
        </div>
      ) : (
        // Fallback: @thearchive profile card
        <div style={{ margin: '8px 20px 24px', padding: '16px', borderRadius: 14, border: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,108,180,0.15)', border: '1px solid rgba(232,108,180,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              🗄️
            </div>
            <div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                The Archive
                <VerifiedBadge size={12} />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>@thearchive</div>
            </div>
          </div>
          <p style={{ margin: '0 0 12px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            Guias, dicas e formas de usar o Archive — publicado pela própria plataforma.
          </p>
          <button
            onClick={() => navigate(profileUrl('@thearchive'))}
            style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(232,108,180,0.12)', border: '1px solid rgba(232,108,180,0.25)', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--accent)', cursor: 'pointer' }}
          >
            Ver perfil →
          </button>
        </div>
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
      onClick={() => navigate(profileUrl(user.handle, user.id))}
      style={{ flexShrink: 0, width: 248, cursor: 'pointer' }}
    >
      <PhotoTile tone1={tone1} tone2={tone2} radius={16} style={{ height: 144 }}>
        <div style={{
          position: 'absolute', inset: 0, padding: 14,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.72))',
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.25, color: '#fff', fontStyle: 'italic' }}>
            {headline}
          </div>
        </div>
      </PhotoTile>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
        <Avatar name={user.name} src={user.avatar} profileId={user.id} size={27} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            {user.postCount} {user.postCount === 1 ? 'entrada' : 'entradas'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── People section — with smart empty state ───────────────────────────────────
function PeopleSection({ people, navigate }) {
  if (people.length === 0) {
    return (
      <div>
        <SectionLabel>Pessoas no Archive</SectionLabel>
        <div style={{
          margin: '4px 20px 32px',
          padding: '24px 20px',
          borderRadius: 16,
          border: '1px solid var(--line)',
          background: 'rgba(255,255,255,0.015)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🌱</div>
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', fontWeight: 400, fontStyle: 'italic' }}>
            A comunidade ainda está crescendo.
          </p>
          <p style={{ margin: '0 0 16px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 280, marginInline: 'auto' }}>
            Enquanto isso, explore os guias do Archive e descubra novas formas de registrar a sua trajetória.
          </p>
          <button
            onClick={() => navigate(profileUrl('@thearchive'))}
            style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(232,108,180,0.1)', border: '1px solid rgba(232,108,180,0.25)', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}
          >
            Ver @thearchive →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel action="Ver tudo" onAction={() => navigate('/friends')}>
        Pessoas guardando coisas como você
      </SectionLabel>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {people.slice(0, 5).map(u => <PersonRow key={u.id} person={u} />)}
      </div>
    </div>
  )
}

// ── DefaultState ──────────────────────────────────────────────────────────────
function DefaultState({ suggested, guidePosts, guideLoading }) {
  const navigate = useNavigate()

  const realPeople = suggested.filter(u => !u.verified)

  return (
    <>
      {/* 1. Comece por aqui — always */}
      <StartHereSection />

      {/* 2. Do Archive — guide posts */}
      <ArchivePostsSection guidePosts={guidePosts} loading={guideLoading} />

      {/* 3. Public archives — only if people exist */}
      {realPeople.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Arquivos públicos</SectionLabel>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '10px 20px 26px', scrollbarWidth: 'none' }}>
            {realPeople.slice(0, 6).map((u, i) => (
              <PublicArchiveCard key={u.id} user={u} idx={i} />
            ))}
          </div>
        </div>
      )}

      {/* 4. People */}
      <PeopleSection people={realPeople} navigate={navigate} />
    </>
  )
}

// ── Search result components ──────────────────────────────────────────────────
const MARK_STYLE = `
  .hl-snippet mark {
    background: rgba(232,108,180,0.18);
    color: var(--accent);
    border-radius: 2px;
    padding: 0 2px;
    font-style: inherit;
  }
`

function Snippet({ html, style }) {
  if (!html) return null
  return (
    <span
      className="hl-snippet"
      style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function PostResult({ post, navigate }) {
  const date = new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const label = post.isArticle ? 'Artigo' : (post.type || 'Nota')
  const path = post.isArticle ? `/articles/${post.id}` : `/posts/${post.id}`

  return (
    <div
      onClick={() => navigate(path)}
      style={{ padding: '13px 20px', cursor: 'pointer', borderBottom: '1px solid var(--line)' }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{date}</span>
        <span style={{ color: 'var(--ink-3)', opacity: 0.4, fontSize: 10 }}>·</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      {post.articleTitle && (
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', fontStyle: 'italic', marginBottom: 4, lineHeight: 1.35 }}>
          {post.articleTitle}
        </div>
      )}
      {post.headline
        ? <Snippet html={post.headline} />
        : <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{(post.content || '').slice(0, 120)}{post.content?.length > 120 ? '…' : ''}</span>
      }
    </div>
  )
}

function ProjectResult({ project, navigate }) {
  return (
    <div
      onClick={() => navigate(`/projects/${project.slug || project.id}`)}
      style={{ padding: '13px 20px', cursor: 'pointer', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{project.emoji || '🚀'}</span>
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{project.title}</div>
        {project.headline
          ? <Snippet html={project.headline} />
          : project.description
            ? <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)' }}>{project.description.slice(0, 100)}</span>
            : null
        }
      </div>
    </div>
  )
}

function CollectionResult({ collection, navigate }) {
  return (
    <div
      onClick={() => navigate(`/collections/${collection.id}`)}
      style={{ padding: '13px 20px', cursor: 'pointer', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{collection.emoji || '🗂️'}</span>
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{collection.name}</div>
        {collection.headline
          ? <Snippet html={collection.headline} />
          : collection.description
            ? <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)' }}>{collection.description.slice(0, 100)}</span>
            : null
        }
      </div>
    </div>
  )
}

// ── SearchResults ─────────────────────────────────────────────────────────────
function SearchResults({ q, results, loading }) {
  const navigate = useNavigate()
  const people  = results?.users ?? []
  const posts   = results?.posts ?? []
  const articles = results?.articles ?? []
  const projects = results?.projects ?? []
  const collections = results?.collections ?? []
  const totalEntries = posts.length + articles.length
  const hasAny = people.length || totalEntries || projects.length || collections.length

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!hasAny) {
    return (
      <div style={{ padding: '56px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)' }}>
        Nada ainda para "{q}".
      </div>
    )
  }

  return (
    <>
      <style>{MARK_STYLE}</style>

      {people.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Pessoas</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {people.map(u => <PersonRow key={u.id} person={u} />)}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Entradas ({posts.length})</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {posts.map(p => <PostResult key={p.id} post={p} navigate={navigate} />)}
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Artigos ({articles.length})</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {articles.map(p => <PostResult key={p.id} post={p} navigate={navigate} />)}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Projetos ({projects.length})</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {projects.map(p => <ProjectResult key={p.id} project={p} navigate={navigate} />)}
          </div>
        </div>
      )}

      {collections.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Coleções ({collections.length})</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {collections.map(c => <CollectionResult key={c.id} collection={c} navigate={navigate} />)}
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
  const [searchLoading, setSearchLoading] = useState(false)
  const [suggested, setSuggested] = useState([])
  const [guidePosts, setGuidePosts] = useState([])
  const [guideLoading, setGuideLoading] = useState(true)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setGuideLoading(true)
    api.get('/posts/guide')
      .then(setGuidePosts)
      .catch(() => setGuidePosts([]))
      .finally(() => setGuideLoading(false))

    api.get('/users/suggested')
      .then(setSuggested)
      .catch(() => setSuggested([]))
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults(null); return }
    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/search?q=${encodeURIComponent(q.trim())}`)
        setResults(data)
      } catch {
        setResults({ users: [], posts: [], articles: [] })
      } finally {
        setSearchLoading(false)
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
        ? <SearchResults q={q.trim()} results={results} loading={searchLoading} />
        : <DefaultState suggested={suggested} guidePosts={guidePosts} guideLoading={guideLoading} />
      }
    </div>
  )
}
