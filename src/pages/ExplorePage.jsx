import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

const TABS = ['Tudo', 'Pessoas', 'Posts', 'Artigos']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function UserCard({ user, onFollowChange }) {
  const navigate = useNavigate()
  const [following, setFollowing] = useState(user.isFollowing)
  const [busy, setBusy] = useState(false)

  async function toggle(e) {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (following) await api.delete(`/follows/${user.id}`)
      else await api.post(`/follows/${user.id}`, {})
      setFollowing(f => !f)
      onFollowChange?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={() => navigate(`/profiles/${user.id}`)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-dark-hover cursor-pointer transition-colors border-b border-dark-border/40 last:border-0"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 avatar-gradient flex items-center justify-center text-white font-bold text-base">
        {user.name?.[0] || '@'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-dark-text text-sm leading-tight truncate">{user.name}</p>
        <p className="text-dark-muted text-xs truncate">{user.handle}</p>
        {user.bio && <p className="text-dark-label text-xs mt-0.5 truncate">{user.bio}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
          following
            ? 'border border-dark-border text-dark-text hover:bg-dark-hover'
            : 'bg-brand-rose text-white hover:opacity-90'
        }`}
      >
        {following ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  )
}

function PostRow({ post }) {
  const navigate = useNavigate()

  function open() {
    if (post.isArticle) navigate(`/articles/${post.id}`)
    else navigate(`/profiles/${post.author.id}`)
  }

  return (
    <div
      onClick={open}
      className="px-4 py-3 hover:bg-dark-hover cursor-pointer transition-colors border-b border-dark-border/40 last:border-0"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 avatar-gradient flex items-center justify-center text-white font-bold text-xs">
          {post.author.name?.[0] || '@'}
        </div>
        <span className="text-dark-text text-xs font-semibold">{post.author.name}</span>
        <span className="text-dark-muted text-xs">{post.author.handle}</span>
        <span className="text-dark-label text-xs ml-auto shrink-0">{formatDate(post.createdAt)}</span>
      </div>
      {post.isArticle && post.articleTitle && (
        <p className="font-semibold text-dark-text text-sm leading-snug mb-0.5">{post.articleTitle}</p>
      )}
      <p className="text-dark-label text-sm leading-relaxed line-clamp-2">{post.content}</p>
    </div>
  )
}

function EmptyState({ query, tab }) {
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-14 h-14 rounded-full border border-dark-border flex items-center justify-center mb-4 text-dark-muted">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <p className="text-dark-text font-semibold text-base">Explorar</p>
        <p className="text-dark-muted text-sm mt-1">Busque por pessoas, posts, artigos ou tags.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-dark-muted text-sm">Nenhum resultado para <span className="text-dark-text">"{query}"</span> em {tab.toLowerCase()}.</p>
    </div>
  )
}

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('Tudo')
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/search?q=${encodeURIComponent(query.trim())}`)
        setResults(data)
      } catch {
        setResults({ users: [], posts: [], articles: [] })
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const users = results?.users ?? []
  const posts = results?.posts ?? []
  const articles = results?.articles ?? []
  const total = users.length + posts.length + articles.length

  const tabCounts = {
    Tudo: total,
    Pessoas: users.length,
    Posts: posts.length,
    Artigos: articles.length,
  }

  function renderResults() {
    if (!results && !loading) return <EmptyState query={query} tab={tab} />
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
        </div>
      )
    }
    if (total === 0) return <EmptyState query={query} tab={tab} />

    const showUsers = tab === 'Tudo' || tab === 'Pessoas'
    const showPosts = tab === 'Tudo' || tab === 'Posts'
    const showArticles = tab === 'Tudo' || tab === 'Artigos'

    return (
      <div>
        {showUsers && users.length > 0 && (
          <section>
            {tab === 'Tudo' && (
              <p className="px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold border-b border-dark-border/40">
                Pessoas
              </p>
            )}
            {users.map(u => <UserCard key={u.id} user={u} />)}
          </section>
        )}

        {showPosts && posts.length > 0 && (
          <section>
            {tab === 'Tudo' && (
              <p className="px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold border-b border-dark-border/40 border-t border-t-dark-border/20 mt-2">
                Posts
              </p>
            )}
            {posts.map(p => <PostRow key={p.id} post={p} />)}
          </section>
        )}

        {showArticles && articles.length > 0 && (
          <section>
            {tab === 'Tudo' && (
              <p className="px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold border-b border-dark-border/40 border-t border-t-dark-border/20 mt-2">
                Artigos
              </p>
            )}
            {articles.map(a => <PostRow key={a.id} post={a} />)}
          </section>
        )}

        {tab !== 'Tudo' && tabCounts[tab] === 0 && (
          <EmptyState query={query} tab={tab} />
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header com busca */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-dark-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-xl px-3 py-2.5 focus-within:border-brand-rose transition-colors">
            <svg className="shrink-0 text-dark-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar pessoas, posts, tags..."
              className="flex-1 bg-transparent text-dark-text placeholder-dark-muted text-[15px] focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-dark-muted hover:text-dark-text transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {results && (
          <div className="flex border-t border-dark-border/40 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`filter-tab whitespace-nowrap flex-1 min-w-0 ${tab === t ? 'active' : ''}`}
              >
                {t}
                {tabCounts[t] > 0 && (
                  <span className="ml-1.5 text-[10px] text-dark-muted">({tabCounts[t]})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {renderResults()}
    </div>
  )
}
