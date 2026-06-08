import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import ArchiveMiniCard from '../components/ArchiveMiniCard'

export default function ArchiveListPage({ kind }) {
  const params = useParams()
  const [data, setData] = useState(null)
  const title = kind === 'tag' ? `#${params.tag}` : `[[${params.title}]]`

  useEffect(() => {
    const path = kind === 'tag' ? `/archive/tags/${encodeURIComponent(params.tag)}` : `/archive/backlinks/${encodeURIComponent(params.title)}`
    api.get(path).then(setData)
  }, [kind, params.tag, params.title])

  const items = Array.isArray(data) ? data : data?.posts

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-dark-muted font-bold">{kind === 'tag' ? 'Tag' : 'Backlink'}</p>
        <h1 className="font-bold text-2xl text-dark-text mt-1">{title}</h1>
      </div>
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
