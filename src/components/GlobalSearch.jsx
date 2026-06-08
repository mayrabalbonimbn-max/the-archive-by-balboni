import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null)
      return
    }
    let active = true
    const t = setTimeout(() => {
      api.get(`/archive/search?q=${encodeURIComponent(query.trim())}`).then(data => {
        if (active) setResults(data)
      }).catch(() => active && setResults(null))
    }, 220)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [open, query])

  function go(path) {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  const groups = results ? [
    ['Posts e artigos', results.posts, item => go(item.isArticle ? `/articles/${item.id}` : '/')],
    ['Arquivos', results.files, () => go('/library')],
    ['Coleções', results.collections, item => go(`/collections/${item.id}`)],
    ['Usuários', results.users, item => go(`/profiles/${item.id}`)],
    ['Tags', results.tags, item => go(`/tags/${item.tag}`)],
    ['Backlinks', results.backlinks, item => go(`/backlinks/${encodeURIComponent(item.title)}`)],
  ] : []

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed right-5 bottom-24 md:right-8 md:bottom-24 z-30 rounded-full border border-dark-border bg-black/85 px-3 py-2 text-xs text-dark-muted hover:text-dark-text backdrop-blur">
        Buscar ⌘K
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-3 pt-16 md:p-6" onClick={() => setOpen(false)}>
          <div className="mx-auto w-full max-w-2xl rounded-lg border border-dark-border bg-dark-card shadow-2xl" onClick={event => event.stopPropagation()}>
            <input value={query} onChange={event => setQuery(event.target.value)} autoFocus placeholder="Buscar posts, arquivos, coleções, tags, backlinks e usuários..." className="w-full bg-transparent px-4 py-4 text-dark-text placeholder-dark-muted focus:outline-none border-b border-dark-border" />
            <div className="max-h-[70vh] overflow-auto p-3 space-y-4">
              {!results && <p className="text-dark-muted text-sm px-1">Digite ao menos 2 caracteres.</p>}
              {groups.map(([label, items, action]) => items?.length > 0 && (
                <section key={label}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-2">{label}</p>
                  <div className="space-y-1">
                    {items.map((item, index) => (
                      <button key={`${label}-${item.id || item.tag || item.title}-${index}`} onClick={() => action(item)} className="w-full text-left rounded-md px-3 py-2 hover:bg-dark-hover">
                        <p className="text-dark-text text-sm truncate">{item.articleTitle || item.name || item.title || item.tag && `#${item.tag}` || item.originalName || item.handle || item.content}</p>
                        <p className="text-dark-muted text-xs truncate">{item.handle || item.fileType || item.type || item.content || ''}</p>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
