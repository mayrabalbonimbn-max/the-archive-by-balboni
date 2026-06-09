import { useNavigate } from 'react-router-dom'
import { formatRelativeTime } from '../utils/helpers'

export default function ArchiveMiniCard({ item, label }) {
  const navigate = useNavigate()
  const title = item.articleTitle || item.content?.slice(0, 90) || item.title || item.originalName || 'Registro'
  const isArticle = item.isArticle || item.itemType === 'article'

  return (
    <button
      onClick={() => item.id && navigate(isArticle ? `/articles/${item.id}` : `/posts/${item.id}`)}
      className="w-full text-left rounded-lg border border-dark-border bg-dark-card px-4 py-3 hover:bg-dark-hover/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-dark-text text-sm font-semibold line-clamp-2">{title}</p>
        {label && <span className="shrink-0 text-[10px] uppercase tracking-wide text-brand-rose">{label}</span>}
      </div>
      <p className="text-dark-muted text-xs mt-2">
        {item.itemType || item.type || item.fileType || 'registro'} · {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
      </p>
    </button>
  )
}
