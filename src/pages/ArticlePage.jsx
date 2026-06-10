import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, publicProfileMediaBlob } from '../utils/api'
import { formatFullDate, TYPE_CONFIG } from '../utils/helpers'
import PostAttachments from '../components/PostAttachments'
import CodeBlock from '../components/CodeBlock'
import MarkdownRenderer from '../components/MarkdownRenderer'
import CommentsBox from '../components/CommentsBox'
import EditPostModal from '../components/EditPostModal'
import Avatar from '../components/ui/Avatar'

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

export default function ArticlePage({ profile, onLike, onSave, onDelete }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = post?.profileId === profile?.id
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

  if (notFound || !post) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.3 }}>📄</div>
        <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink-2)', marginBottom: 8 }}>
          Artigo não encontrado.
        </p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 24 }}>
          Pode ter sido excluído ou o link está incorreto.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  const typeConfig = TYPE_CONFIG[post.type] || TYPE_CONFIG.aleatório
  const displayProfile = post.author || profile

  return (
    <div>
      {/* Sticky top bar */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line)', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, touchAction: 'manipulation' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.articleTitle || 'Artigo'}
        </span>
        {isOwner && (
          <button
            onClick={() => setEditing(true)}
            style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 7, cursor: 'pointer', padding: '5px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', touchAction: 'manipulation' }}
          >
            Editar
          </button>
        )}
      </div>

      <article style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Capsule banner */}
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
            <div style={{ margin: '0 0 32px', textAlign: 'center' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', marginBottom: 14 }} />
              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                Uma mensagem atravessou o tempo para chegar até você.<br />
                <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Escrito por você há {ago}.</span>
              </p>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', marginTop: 14 }} />
            </div>
          )
        })()}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span className={`pill-badge ${typeConfig.color}`}>{typeConfig.label}</span>
          {post.isDiary && (
            <span className="pill-badge bg-brand-rose/10 text-brand-rose border border-brand-rose/20">Diário</span>
          )}
          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>{formatFullDate(post.createdAt)}</span>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>· editado</span>
          )}
        </div>

        {/* Title */}
        {post.articleTitle && (
          <h1 style={{ margin: '0 0 28px', fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {post.articleTitle}
          </h1>
        )}

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--line)' }}>
          <Avatar name={displayProfile?.name} src={avatarSrc} size={38} />
          <div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{displayProfile?.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{displayProfile?.handle}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 32 }}>
          <MarkdownRenderer content={post.content} />
        </div>

        {post.codeBlock && (
          <div style={{ marginBottom: 32 }}>
            <CodeBlock language={post.codeBlock.language} code={post.codeBlock.code} />
          </div>
        )}

        <PostAttachments attachments={post.attachments} />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '24px 0' }}>
            {post.tags.map(tag => (
              <span
                key={tag}
                style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent)', background: 'rgba(232,108,180,0.08)', border: '1px solid rgba(232,108,180,0.2)', borderRadius: 6, padding: '3px 9px' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
          <button
            onClick={() => { onLike?.(post.id); setPost(p => ({ ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 })) }}
            style={{ touchAction: 'manipulation' }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${post.liked ? 'border-brand-rose bg-brand-rose/10 text-brand-rose' : 'border-dark-border text-dark-muted hover:border-brand-rose hover:text-brand-rose'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {post.likeCount > 0 ? post.likeCount : 'Curtir'}
          </button>
          <button
            onClick={() => { onSave?.(post.id); setPost(p => ({ ...p, saved: !p.saved })) }}
            style={{ touchAction: 'manipulation' }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium ${post.saved ? 'border-brand-rose bg-brand-rose/10 text-brand-rose' : 'border-dark-border text-dark-muted hover:border-brand-rose hover:text-brand-rose'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            {post.saved ? 'Salvo' : 'Salvar'}
          </button>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={() => setEditing(true)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', touchAction: 'manipulation' }}
              >
                Editar
              </button>
              <button
                onClick={() => { if (window.confirm('Excluir este artigo?')) { onDelete?.(post.id); navigate(-1) } }}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.25)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: '#f87171', touchAction: 'manipulation' }}
              >
                Excluir
              </button>
            </div>
          )}
        </div>

        {/* Comments */}
        <CommentsBox postId={post.id} initialCount={post.commentCount} autoOpen={false} />
      </article>

      {editing && (
        <EditPostModal
          post={post}
          onClose={() => setEditing(false)}
          onSaved={updated => setPost(p => ({ ...p, ...updated }))}
        />
      )}
    </div>
  )
}
