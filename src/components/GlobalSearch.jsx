import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

// Strip ts_headline markers (<<< and >>>) but keep the surrounding text
function cleanExcerpt(text) {
  if (!text) return ''
  return text.replace(/<<<|>>>/g, '').replace(/\s+/g, ' ').trim()
}

function HighlightExcerpt({ text }) {
  if (!text) return null
  // Split on markers to highlight matched words
  const parts = text.split(/(<<<.*?>>>)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('<<<') && part.endsWith('>>>')) {
          return <mark key={i} style={{ background: 'var(--accent)', color: '#000', borderRadius: 2, padding: '0 2px' }}>{part.slice(3, -3)}</mark>
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

const GROUP_ICONS = {
  'Posts e artigos': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  'Arquivos': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  'Coleções': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  'Usuários': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'Tags': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  'Backlinks': (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
}

export default function GlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) { inputRef.current?.blur(); return }
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    let active = true
    const t = setTimeout(() => {
      api.get(`/archive/search?q=${encodeURIComponent(query.trim())}`).then(data => {
        if (active) { setResults(data); setLoading(false) }
      }).catch(() => { if (active) { setResults(null); setLoading(false) } })
    }, 220)
    return () => { active = false; clearTimeout(t) }
  }, [open, query])

  function close() { setOpen(false); setQuery('') }

  function go(path) { close(); navigate(path) }

  const totalResults = results
    ? (results.posts?.length || 0) + (results.files?.length || 0) + (results.collections?.length || 0) +
      (results.users?.length || 0) + (results.tags?.length || 0) + (results.backlinks?.length || 0)
    : 0

  const groups = results ? [
    {
      label: 'Posts e artigos',
      items: results.posts,
      action: item => go(item.isArticle ? `/articles/${item.id}` : `/posts/${item.id}`),
      title: item => item.articleTitle || item.content?.slice(0, 80),
      sub: item => item.excerpt ? <HighlightExcerpt text={item.excerpt} /> : null,
    },
    {
      label: 'Arquivos',
      items: results.files,
      action: () => go('/library'),
      title: item => item.title || item.originalName,
      sub: item => item.fileType || item.originalName,
    },
    {
      label: 'Coleções',
      items: results.collections,
      action: item => go(`/collections/${item.id}`),
      title: item => item.name,
      sub: () => null,
    },
    {
      label: 'Usuários',
      items: results.users,
      action: item => go(`/profiles/${item.id}`),
      title: item => item.name,
      sub: item => `@${item.handle}`,
    },
    {
      label: 'Tags',
      items: results.tags,
      action: item => go(`/tags/${item.tag}`),
      title: item => `#${item.tag}`,
      sub: () => null,
    },
    {
      label: 'Backlinks',
      items: results.backlinks,
      action: item => go(`/backlinks/${encodeURIComponent(item.title)}`),
      title: item => `[[${item.title}]]`,
      sub: () => null,
    },
  ] : []

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-24 md:right-8 md:bottom-24 z-30 rounded-full border border-dark-border bg-black/85 px-3 py-2 text-xs text-dark-muted hover:text-dark-text backdrop-blur"
      >
        Buscar ⌘K
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-3 pt-14 md:p-6 md:pt-16"
          onClick={close}
        >
          <div
            className="mx-auto w-full max-w-xl rounded-xl border border-dark-border bg-dark-card shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 border-b border-dark-border">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-muted shrink-0">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar no arquivo…"
                className="flex-1 bg-transparent py-4 text-dark-text placeholder-dark-muted/60 focus:outline-none text-[15px]"
              />
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-dark-muted border-t-transparent animate-spin shrink-0" />
              )}
              <kbd className="shrink-0 text-[10px] text-dark-muted/50 border border-dark-border/60 rounded px-1.5 py-0.5 font-mono">esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[65vh] overflow-auto">
              {!results && !loading && (
                <p className="text-dark-muted/60 text-sm px-5 py-5">
                  {query.trim().length < 2 ? 'Digite ao menos 2 caracteres.' : ''}
                </p>
              )}

              {results && totalResults === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-dark-muted/60 text-sm">Nenhum resultado para <span className="text-dark-text/80">"{query}"</span></p>
                </div>
              )}

              {groups.map(({ label, items, action, title, sub }) =>
                items?.length > 0 ? (
                  <section key={label} className="py-3">
                    <div className="flex items-center gap-1.5 px-4 mb-1.5 text-dark-muted/60">
                      {GROUP_ICONS[label]}
                      <span className="text-[10px] uppercase tracking-[0.15em] font-semibold">{label}</span>
                    </div>
                    <div>
                      {items.map((item, index) => {
                        const titleText = title(item)
                        const subContent = sub(item)
                        return (
                          <button
                            key={`${label}-${item.id || item.tag || item.title}-${index}`}
                            onClick={() => action(item)}
                            className="w-full text-left px-4 py-2.5 hover:bg-dark-hover transition-colors group"
                          >
                            <p className="text-dark-text text-[13px] truncate leading-snug">{titleText}</p>
                            {subContent && (
                              <p className="text-dark-muted/70 text-[11px] mt-0.5 line-clamp-1 leading-relaxed font-mono">
                                {subContent}
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ) : null
              )}

              {results && totalResults > 0 && (
                <div className="px-4 py-3 border-t border-dark-border/40">
                  <p className="text-dark-muted/40 text-[10px]">{totalResults} resultado{totalResults !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
