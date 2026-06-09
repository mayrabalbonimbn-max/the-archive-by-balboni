import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { formatFullDate, TYPE_CONFIG, CATEGORIA_CONFIG } from '../utils/helpers'
import PostAttachments from '../components/PostAttachments'
import CodeBlock from '../components/CodeBlock'
import MarkdownRenderer from '../components/MarkdownRenderer'
import LinkPreviewCard, { useLinkPreview, extractFirstUrl } from '../components/LinkPreviewCard'
import Avatar from '../components/ui/Avatar'
import CommentsBox from '../components/CommentsBox'
import { publicProfileMediaBlob } from '../utils/api'

function useAuthorAvatar(authorId, hasAvatar) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!authorId || !hasAvatar) return
    let alive = true
    publicProfileMediaBlob(authorId, 'avatar')
      .then(blob => { if (alive) setSrc(URL.createObjectURL(blob)) })
      .catch(() => {})
    return () => { alive = false }
  }, [authorId, hasAvatar])
  return src
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  )
}

function countdown(unlockAt) {
  const ms = new Date(unlockAt) - Date.now()
  if (ms <= 0) return 'em breve'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  if (days >= 365) { const y = Math.floor(days / 365); return `em ${y} ${y === 1 ? 'ano' : 'anos'}` }
  if (days >= 30)  { const m = Math.floor(days / 30);  return `em ${m} ${m === 1 ? 'mês' : 'meses'}` }
  if (days > 0)    return `em ${days} ${days === 1 ? 'dia' : 'dias'}`
  return `em ${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

export default function PostDetailPage({ profile, onLike, onSave, onDelete }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightCommentId = searchParams.get('comment') || null
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lockedCapsule, setLockedCapsule] = useState(null) // { unlockAt }

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    setLockedCapsule(null)
    setPost(null)
    api.get(`/posts/${id}`)
      .then(setPost)
      .catch(err => {
        if (err.message === 'capsule_locked') {
          setLockedCapsule({ unlockAt: err.data?.unlockAt })
        } else {
          setNotFound(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  // All hooks before any conditional return
  const fallbackUrl = (post && !post.linkPreview) ? extractFirstUrl(post.content || '') : null
  const { preview: livePreview } = useLinkPreview(fallbackUrl)
  const effectivePreview = post?.linkPreview || livePreview

  const isOwner = profile && post?.profileId === profile.id
  const authorHasAvatar = !isOwner && Boolean(post?.author?.avatar) && !post?.author?.avatar.startsWith('blob:')
  const authorAvatarBlob = useAuthorAvatar(post?.author?.id ?? null, authorHasAvatar)
  const avatarSrc = isOwner ? profile?.avatar : authorAvatarBlob

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
      </div>
    )
  }

  if (lockedCapsule) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 36, marginBottom: 24, opacity: 0.25 }}>⧗</div>
        <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 24, color: 'var(--ink)' }}>
          Esta cápsula ainda está guardada.
        </h2>
        {lockedCapsule.unlockAt && (
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-2)' }}>
            Ela abre <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{countdown(lockedCapsule.unlockAt)}</span>.
          </p>
        )}
        {lockedCapsule.unlockAt && (
          <p style={{ margin: '0 0 28px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            {new Date(lockedCapsule.unlockAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        )}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <p className="text-dark-text/60">Entrada não encontrada.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-brand-rose text-sm hover:underline">Voltar</button>
      </div>
    )
  }

  if (post.isArticle) {
    navigate(`/articles/${post.id}`, { replace: true })
    return null
  }

  const badgeConfig = CATEGORIA_CONFIG[post.categoria] || TYPE_CONFIG[post.type] || TYPE_CONFIG.aleatório
  const displayProfile = post.author || profile

  return (
    <div>
      <div style={{ position: 'sticky', top: 'env(safe-area-inset-top, 0px)', zIndex: 10 }} className="bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          style={{ touchAction: 'manipulation' }}
          className="text-dark-muted hover:text-dark-text transition-colors p-1 -ml-1 rounded-full hover:bg-dark-hover"
        >
          <BackIcon />
        </button>
        <span className="text-dark-muted text-sm">Entrada</span>
      </div>

      <article className="max-w-2xl mx-auto px-5 py-8 animate-fade-in">
        {post.openedAt && (() => {
          const diff = Date.now() - new Date(post.createdAt).getTime()
          const days = Math.round(diff / 86400000)
          const years = Math.floor(days / 365)
          const months = Math.floor(days / 30)
          const ago = years >= 1
            ? `${years} ${years === 1 ? 'ano' : 'anos'}`
            : months >= 1
              ? `${months} ${months === 1 ? 'mês' : 'meses'}`
              : `${days} ${days === 1 ? 'dia' : 'dias'}`
          return (
            <div style={{ margin: '0 0 28px', textAlign: 'center' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', marginBottom: 14 }} />
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                Uma mensagem atravessou o tempo para chegar até você.<br />
                <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Escrito por você há {ago}.</span>
              </p>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', marginTop: 14 }} />
            </div>
          )
        })()}

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className={`pill-badge ${badgeConfig.color}`}>{badgeConfig.label}</span>
          {post.isDiary && (
            <span className="pill-badge bg-brand-rose/10 text-brand-rose border border-brand-rose/20">Diário</span>
          )}
          <span className="text-dark-muted text-sm">{formatFullDate(post.createdAt)}</span>
          <span className="text-dark-muted/50 text-xs">
            {post.visibility === 'public' ? 'Público' : post.visibility === 'followers' ? 'Seguidores' : post.visibility === 'friends' ? 'Amigos' : 'Privado'}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-dark-border/60">
          <Avatar name={displayProfile?.name} src={avatarSrc} size={40} />
          <div>
            <p className="font-semibold text-dark-text text-sm">{displayProfile?.name}</p>
            <p className="text-dark-muted text-xs">{displayProfile?.handle}</p>
          </div>
        </div>

        {post.articleTitle && (
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.01em', marginBottom: 16 }}>
            {post.articleTitle}
          </h1>
        )}

        {post.content && (
          <div className="mb-4">
            <MarkdownRenderer content={post.content} />
          </div>
        )}

        {effectivePreview && (
          <div className="mb-6">
            <LinkPreviewCard preview={effectivePreview} />
          </div>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map(tag => (
              <Link key={tag} to={`/tags/${tag}`} style={{ touchAction: 'manipulation' }} className="text-[12px] font-mono text-brand-rose/70 hover:text-brand-rose border border-brand-rose/20 rounded-md px-2 py-0.5 hover:bg-brand-rose/5 transition-colors">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {post.codeBlock && (
          <div className="mb-6">
            <CodeBlock language={post.codeBlock.language} code={post.codeBlock.code} />
          </div>
        )}

        {post.attachments?.length > 0 && (
          <div className="mb-6">
            <PostAttachments attachments={post.attachments} />
          </div>
        )}

        <div className="flex items-center gap-4 pt-6 mt-6 border-t border-dark-border/60">
          <button
            onClick={() => {
              onLike?.(post.id)
              setPost(p => ({ ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }))
            }}
            style={{ touchAction: 'manipulation' }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${post.liked ? 'border-brand-rose bg-brand-rose/10 text-brand-rose' : 'border-dark-border text-dark-muted hover:border-brand-rose hover:text-brand-rose'}`}
          >
            <HeartIcon filled={post.liked} />
            {post.likeCount > 0 ? post.likeCount : 'Curtir'}
          </button>
          <button
            onClick={() => {
              onSave?.(post.id)
              setPost(p => ({ ...p, saved: !p.saved }))
            }}
            style={{ touchAction: 'manipulation' }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${post.saved ? 'border-brand-rose bg-brand-rose/10 text-brand-rose' : 'border-dark-border text-dark-muted hover:border-brand-rose hover:text-brand-rose'}`}
          >
            <BookmarkIcon filled={post.saved} />
            {post.saved ? 'Salvo' : 'Salvar'}
          </button>
          {isOwner && (
            <button
              onClick={() => {
                if (window.confirm('Excluir esta entrada?')) {
                  onDelete?.(post.id)
                  navigate(-1)
                }
              }}
              style={{ touchAction: 'manipulation' }}
              className="ml-auto text-dark-muted hover:text-red-400 transition-colors text-sm"
            >
              Excluir
            </button>
          )}
        </div>

        <CommentsBox postId={post.id} initialCount={post.commentCount} autoOpen={Boolean(highlightCommentId)} highlightId={highlightCommentId} />
      </article>
    </div>
  )
}
