import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatRelativeTime, formatFullDate, TYPE_CONFIG, CATEGORIA_CONFIG, profileUrl } from '../utils/helpers'
import PostAttachments from './PostAttachments'
import CodeBlock from './CodeBlock'
import LinkPreviewCard from './LinkPreviewCard'
import { api } from '../utils/api'
import Avatar from './ui/Avatar'
import CommentsBox from './CommentsBox'

const HeartIcon = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)

const BookmarkIcon = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>
)

const PinIcon = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z"/>
  </svg>
)

const PinBtnIcon = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
)

const VISIBILITY = {
  private: { label: 'Só você', className: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
  followers: { label: 'Círculo', className: 'bg-blue-400/10 text-blue-300 border-blue-400/20' },
  friends: { label: 'Amigos', className: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
  public: { label: 'Público', className: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
}

function VisibilityPill({ visibility }) {
  const cfg = VISIBILITY[visibility] || VISIBILITY.private
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide ${cfg.className}`}>
      {visibility === 'private' && <LockIcon />}
      {cfg.label}
    </span>
  )
}

function ContentLinks({ text = '' }) {
  const navigate = useNavigate()
  const tags = [...new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map(tag => tag.slice(1)))]
  const links = [...new Set([...text.matchAll(/\[\[([^\]]{1,100})\]\]/g)].map(match => match[1].trim()).filter(Boolean))]
  if (tags.length === 0 && links.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map(tag => (
        <button key={`tag-${tag}`} onClick={() => navigate(`/tags/${tag}`)} className="pill-badge bg-dark-hover border border-dark-border text-dark-muted hover:text-brand-rose">#{tag}</button>
      ))}
      {links.map(link => (
        <button key={`link-${link}`} onClick={() => navigate(`/backlinks/${encodeURIComponent(link)}`)} className="pill-badge bg-brand-rose/10 border border-brand-rose/20 text-brand-rose">[[{link}]]</button>
      ))}
    </div>
  )
}

export default function PostCard({ post, profile, onLike, onSave, onPin, onDelete }) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const displayProfile = post.author || profile
  const isOwner = post.profileId === profile.id
  const reactionCounts = post.reactionCounts || {}
  const viewerReactions = post.viewerReactions || []
  const profilePath = isOwner ? '/profile' : profileUrl(post.author?.handle, post.profileId)

  function handleLike() {
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 350)
    onLike(post.id)
  }

  function handleReaction(type) {
    if (type === 'heart') return handleLike()
    if (type === 'save') return onSave(post.id)
    return onLike(post.id, type)
  }

  function handleDelete() {
    if (confirmDelete) {
      onDelete(post.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const badgeConfig = CATEGORIA_CONFIG[post.categoria] || TYPE_CONFIG[post.type] || TYPE_CONFIG.aleatório

  // Article card variant
  if (post.isArticle) {
    const excerpt = post.content?.slice(0, 180)
    return (
      <article className="border-b border-dark-border/60 px-5 py-5 hover:bg-dark-hover/40 transition-colors duration-150 animate-fade-in">
        {post.pinned && (
          <div className="flex items-center gap-1.5 text-dark-muted/70 text-[11px] mb-2.5 tracking-wide uppercase font-medium">
            <PinIcon filled /><span>Fixado</span>
          </div>
        )}
        <div className="flex gap-3.5">
          <button className="shrink-0 mt-0.5" onClick={() => navigate(profilePath)}>
            <Avatar name={displayProfile.name} src={displayProfile.avatar} profileId={displayProfile.id} size={38} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap mb-2">
              <button onClick={() => navigate(profilePath)} className="font-semibold text-dark-text text-[14px] hover:text-brand-rose transition-colors">{displayProfile.name}</button>
              <span className="text-dark-muted text-[13px]">{displayProfile.handle}</span>
              <span className="text-dark-border">·</span>
              <VisibilityPill visibility={post.visibility} />
              <span className="text-dark-border">·</span>
              <span className="text-dark-muted text-[13px] tabular-nums" title={formatFullDate(post.createdAt)}>
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            <button
              onClick={() => navigate(`/articles/${post.id}`)}
              className="block w-full text-left group"
            >
              <div className="border border-dark-border/60 rounded-2xl p-4 hover:border-dark-muted/50 transition-colors bg-dark-card/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-brand-rose/80 uppercase tracking-widest">Artigo</span>
                </div>
                {post.articleTitle && (
                  <h3 className="font-editorial text-[17px] text-dark-text leading-snug mb-1.5 group-hover:text-brand-rose/90 transition-colors">
                    {post.articleTitle}
                  </h3>
                )}
                {excerpt && (
                  <p className="text-dark-muted text-sm leading-relaxed line-clamp-2">
                    {excerpt}{post.content.length > 180 ? '…' : ''}
                  </p>
                )}
                <div className="mt-3 text-brand-rose text-xs font-medium">Ler artigo →</div>
              </div>
            </button>

            <div className="flex items-center gap-5 mt-3 -ml-0.5">
              <button onClick={() => handleReaction('heart')} className={`post-action-btn ${post.liked ? 'liked' : ''}`} title="Apreciar">
                <span className={likeAnimating ? 'animate-like-pop' : ''}><HeartIcon filled={post.liked} /></span>
                {post.likeCount > 0 && <span className="text-xs font-medium tabular-nums">{post.likeCount}</span>}
              </button>
              <button onClick={() => handleReaction('spark')} className={`post-action-btn ${viewerReactions.includes('spark') ? 'text-brand-violet' : ''}`} title="Interessante">
                <span>✨</span>
                {reactionCounts.spark > 0 && <span className="text-xs font-medium tabular-nums">{reactionCounts.spark}</span>}
              </button>
              <button onClick={() => onSave(post.id)} className={`post-action-btn ${post.saved ? 'saved' : ''}`} title="Quero salvar">
                <BookmarkIcon filled={post.saved} />
                {reactionCounts.save > 0 && <span className="text-xs font-medium tabular-nums">{reactionCounts.save}</span>}
              </button>
              {isOwner && (
                <>
                  <button onClick={() => onPin(post.id)} className={`post-action-btn ${post.pinned ? 'text-amber-400' : ''}`}>
                    <PinBtnIcon filled={post.pinned} />
                  </button>
                  <button onClick={handleDelete} className={`post-action-btn ml-auto ${confirmDelete ? 'text-red-400' : 'hover:text-red-400'}`}>
                    <TrashIcon />
                    {confirmDelete && <span className="text-[11px] font-medium">confirmar?</span>}
                  </button>
                </>
              )}
            </div>
            {!isOwner && (
              <span className="ml-auto text-[11px] text-dark-muted">
                Arquivo conectado
              </span>
            )}
            <CommentsBox postId={post.id} initialCount={post.commentCount} />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="border-b border-dark-border/60 px-5 py-5 hover:bg-dark-hover/40 transition-colors duration-150 animate-fade-in">
      {/* Pinned indicator */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 text-dark-muted/70 text-[11px] mb-2.5 ml-[52px] tracking-wide uppercase font-medium">
          <PinIcon filled />
          <span>Fixado</span>
        </div>
      )}

      <div className="flex gap-3.5">
        {/* Avatar */}
        <button className="shrink-0 mt-0.5" onClick={() => navigate(profilePath)} aria-label="Abrir perfil">
          <Avatar name={displayProfile.name} src={displayProfile.avatar} profileId={displayProfile.id} size={38} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <button onClick={() => navigate(profilePath)} className="font-semibold text-dark-text text-[14px] leading-tight hover:text-brand-rose transition-colors">{displayProfile.name}</button>
            <span className="text-dark-muted text-[13px]">{displayProfile.handle}</span>
            <span className="text-dark-border">·</span>
            <VisibilityPill visibility={post.visibility} />
            <span className="text-dark-border">·</span>
            <span
              className="text-dark-muted text-[13px] hover:text-dark-text/70 transition-colors cursor-default tabular-nums"
              title={formatFullDate(post.createdAt)}
            >
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          {/* Text */}
          <p
            className="post-content mt-1.5 whitespace-pre-wrap break-words cursor-pointer hover:text-dark-text/90 transition-colors"
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            {post.content}
          </p>
          <ContentLinks text={post.content} />

          {/* Link preview */}
          {post.linkPreview && <LinkPreviewCard preview={post.linkPreview} compact />}

          {post.codeBlock && <CodeBlock language={post.codeBlock.language} code={post.codeBlock.code} />}

          <PostAttachments attachments={post.attachments} />

          {/* Type badge + tags */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 animate-badge-in">
            <span className={`pill-badge ${badgeConfig.color}`}>
              {badgeConfig.label}
            </span>
            {post.isDiary && (
              <span className="pill-badge bg-brand-rose/10 text-brand-rose border border-brand-rose/20">
                Diário
              </span>
            )}
            {post.tags?.map(tag => (
              <button
                key={tag}
                onClick={e => { e.stopPropagation(); navigate(`/tags/${tag}`) }}
                className="text-[11px] font-mono text-brand-rose/70 hover:text-brand-rose transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3.5 -ml-0.5">
            {/* Like */}
            <button
              onClick={() => handleReaction('heart')}
              className={`post-action-btn ${post.liked ? 'liked' : ''}`}
              title="Apreciar"
            >
              <span className={`transition-transform duration-200 ${likeAnimating ? 'animate-like-pop' : ''}`}>
                <HeartIcon filled={post.liked} />
              </span>
              {post.likeCount > 0 && (
                <span className={`text-xs font-medium tabular-nums ${post.liked ? 'text-brand-rose' : 'text-dark-label'}`}>
                  {post.likeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleReaction('spark')}
              className={`post-action-btn ${viewerReactions.includes('spark') ? 'text-brand-violet' : ''}`}
              title="Interessante"
            >
              <span>✨</span>
              {reactionCounts.spark > 0 && (
                <span className="text-xs font-medium tabular-nums">{reactionCounts.spark}</span>
              )}
            </button>

            {/* Save */}
            <button
              onClick={() => onSave(post.id)}
              className={`post-action-btn ${post.saved ? 'saved' : ''}`}
              title={post.saved ? 'Remover dos salvos' : 'Quero salvar'}
            >
              <BookmarkIcon filled={post.saved} />
              {reactionCounts.save > 0 && (
                <span className="text-xs font-medium tabular-nums">{reactionCounts.save}</span>
              )}
            </button>

            {/* Pin */}
            {isOwner && (
              <>
                <button
                  onClick={() => onPin(post.id)}
                  className={`post-action-btn ${post.pinned ? 'text-amber-400 hover:text-amber-300' : ''}`}
                  title={post.pinned ? 'Desafixar' : 'Fixar'}
                >
                  <PinBtnIcon filled={post.pinned} />
                </button>

                <button
                  onClick={handleDelete}
                  className={`post-action-btn ml-auto ${confirmDelete ? 'text-red-400 hover:text-red-300' : 'hover:text-red-400'}`}
                  title={confirmDelete ? 'Clique para confirmar' : 'Excluir'}
                >
                  <TrashIcon />
                  {confirmDelete && (
                    <span className="text-[11px] font-medium">confirmar?</span>
                  )}
                </button>
              </>
            )}
            {!isOwner && (
              <span className="ml-auto text-[11px] text-dark-muted">
                Arquivo conectado
              </span>
            )}
          </div>
          <CommentsBox postId={post.id} initialCount={post.commentCount} />
        </div>
      </div>

    </article>
  )
}
