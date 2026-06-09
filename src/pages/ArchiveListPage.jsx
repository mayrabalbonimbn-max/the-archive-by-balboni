import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import ArchiveMiniCard from '../components/ArchiveMiniCard'

export default function ArchiveListPage({ kind }) {
  const params = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [allTags, setAllTags] = useState([])

  const tag = params.tag
  const title = kind === 'tag' ? `#${tag}` : `[[${params.title}]]`

  useEffect(() => {
    const path = kind === 'tag'
      ? `/archive/tags/${encodeURIComponent(tag)}`
      : `/archive/backlinks/${encodeURIComponent(params.title)}`
    api.get(path).then(setData)

    if (kind === 'tag') {
      api.get('/archive/tags').then(setAllTags).catch(() => {})
    }
  }, [kind, tag, params.title])

  const items = Array.isArray(data) ? data : data?.posts

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-dark-muted text-xs hover:text-dark-text mb-2 flex items-center gap-1"
        >
          ← Voltar
        </button>
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">{kind === 'tag' ? 'Tag' : 'Backlink'}</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">{title}</h1>
        {items && (
          <p className="text-dark-muted text-xs mt-1">{items.length} {items.length === 1 ? 'entrada' : 'entradas'}</p>
        )}
      </div>

      {/* Other tags strip */}
      {kind === 'tag' && allTags.length > 1 && (
        <div className="px-4 py-3 border-b border-dark-border/40 flex gap-2 overflow-x-auto scrollbar-hide">
          {allTags.filter(t => t.slug !== tag).slice(0, 12).map(t => (
            <button
              key={t.slug}
              onClick={() => navigate(`/tags/${t.slug}`)}
              className="shrink-0 text-[11px] font-mono text-dark-muted/70 hover:text-brand-rose border border-dark-border/60 hover:border-brand-rose/40 rounded-full px-3 py-1 transition-colors"
            >
              #{t.slug}
              {t.count > 0 && <span className="ml-1 opacity-50">{t.count}</span>}
            </button>
          ))}
        </div>
      )}

      {!items ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-dark-muted text-sm">Nenhum conteúdo relacionado.</div>
      ) : (
        <div className="p-4 space-y-3">{items.map(item => <ArchiveMiniCard key={item.id} item={item} />)}</div>
      )}
    </div>
  )
}
