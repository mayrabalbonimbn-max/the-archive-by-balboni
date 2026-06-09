import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { formatFullDate, TYPE_CONFIG } from '../utils/helpers'
import PostAttachments from '../components/PostAttachments'
import CodeBlock from '../components/CodeBlock'
import MarkdownRenderer from '../components/MarkdownRenderer'

export default function ArticlePage({ profile, onLike, onSave, onDelete }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-dark-text/60">Artigo não encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-brand-rose text-sm hover:underline">
          Voltar
        </button>
      </div>
    )
  }

  const typeConfig = TYPE_CONFIG[post.type] || TYPE_CONFIG.aleatório
  const displayProfile = post.author || profile
  const isOwner = post.profileId === profile.id

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-dark-muted hover:text-dark-text transition-colors p-1 -ml-1 rounded-full hover:bg-dark-hover"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <span className="text-dark-muted text-sm">Artigo</span>
      </div>

      <article className="max-w-2xl mx-auto px-5 py-8 animate-fade-in">
        {/* Metadata */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className={`pill-badge ${typeConfig.color}`}>{typeConfig.label}</span>
          {post.isDiary && (
            <span className="pill-badge bg-brand-rose/10 text-brand-rose border border-brand-rose/20">Diário</span>
          )}
          <span className="text-dark-muted text-sm">{formatFullDate(post.createdAt)}</span>
        </div>

        {/* Title */}
        {post.articleTitle && (
          <h1 className="font-editorial text-3xl md:text-4xl text-dark-text leading-tight mb-6 tracking-tight">
            {post.articleTitle}
          </h1>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-dark-border/60">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-dark-border/50 shrink-0">
            {displayProfile.avatar ? (
              <img src={displayProfile.avatar} alt={displayProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold text-sm">
                {displayProfile.name?.[0] || 'M'}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-dark-text text-sm">{displayProfile.name}</p>
            <p className="text-dark-muted text-xs">{displayProfile.handle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <MarkdownRenderer content={post.content} />
        </div>

        {post.codeBlock && (
          <div className="mb-8">
            <CodeBlock language={post.codeBlock.language} code={post.codeBlock.code} />
          </div>
        )}

        <PostAttachments attachments={post.attachments} />

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6 mt-6 border-t border-dark-border/60">
          <button
            onClick={() => { onLike(post.id); setPost(p => ({ ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 })) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${post.liked ? 'border-brand-rose bg-brand-rose/10 text-brand-rose' : 'border-dark-border text-dark-muted hover:border-brand-rose hover:text-brand-rose'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {post.likeCount > 0 ? post.likeCount : 'Curtir'}
          </button>
          <button
            onClick={() => { onSave(post.id); setPost(p => ({ ...p, saved: !p.saved })) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${post.saved ? 'border-brand-rose bg-brand-rose/10 text-brand-rose' : 'border-dark-border text-dark-muted hover:border-brand-rose hover:text-brand-rose'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            {post.saved ? 'Salvo' : 'Salvar'}
          </button>
          {isOwner && (
            <button
              onClick={() => { if (window.confirm('Excluir este artigo?')) { onDelete(post.id); navigate(-1) } }}
              className="ml-auto text-dark-muted hover:text-red-400 transition-colors text-sm"
            >
              Excluir
            </button>
          )}
        </div>
      </article>
    </div>
  )
}
