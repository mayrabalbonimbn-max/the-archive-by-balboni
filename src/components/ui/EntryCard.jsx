import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import TypeTag from './TypeTag'
import ReactionRow from './ReactionRow'
import { useAttachmentUrl } from '../../hooks/useAttachmentUrl'
import { attachmentBlob } from '../../utils/api'
import CommentsBox from '../CommentsBox'
import EditPostModal from '../EditPostModal'

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
}

// Real image from authenticated API
function AttachmentImage({ id, hasThumbnail, alt, onClick }) {
  const url = useAttachmentUrl(id, hasThumbnail ? 'thumbnail' : 'view')
  if (!url) {
    return (
      <div style={{
        marginTop: 12, width: '100%', aspectRatio: '16/9',
        borderRadius: 12, background: 'var(--surface-3)',
        animation: 'pulse 1.5s infinite',
      }} />
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      onClick={onClick}
      style={{
        display: 'block', width: '100%', aspectRatio: '16/9',
        objectFit: 'cover', borderRadius: 12, marginTop: 12, cursor: 'pointer',
        border: '1px solid var(--line)',
      }}
    />
  )
}

// Full-res lightbox
function LightboxImage({ id, alt }) {
  const url = useAttachmentUrl(id, 'view')
  return url
    ? <img src={url} alt={alt} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
    : <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--sans)', fontSize: 14 }}>Carregando…</div>
}

async function openPdf(attachment) {
  const win = window.open('', '_blank')
  try {
    const blob = await attachmentBlob(attachment.id, 'view')
    const url = URL.createObjectURL(blob)
    if (win) { win.opener = null; win.location = url }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch { win?.close() }
}

export default function EntryCard({ post, showAuthor = true, onLike, onSave, onDelete, onEdit, hairline = true }) {
  const navigate = useNavigate()
  const [lightboxId, setLightboxId] = useState(null)
  const lightboxOpenedAt = useRef(0)
  const [localPost, setLocalPost] = useState(post)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => { setLocalPost(post) }, [post])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const canEdit = Boolean(onEdit || onDelete)

  const isArticle = localPost.isArticle || localPost.type === 'article'

  // Use correct API field names (fileType, originalName — NOT kind/filename)
  const images = localPost.attachments?.filter(a => a.fileType === 'image') ?? []
  const pdfs   = localPost.attachments?.filter(a => a.fileType === 'pdf') ?? []
  const texts  = localPost.attachments?.filter(a => a.fileType === 'markdown' || a.fileType === 'python' || a.fileType === 'code') ?? []
  const hasCode = !!localPost.codeBlock?.code

  function openDetail(e) {
    if (lightboxId) return
    if (isArticle) navigate(`/articles/${localPost.id}`)
    else navigate(`/posts/${localPost.id}`)
  }

  const author = typeof localPost.author === 'object' ? localPost.author : null
  const authorName = author?.name || null

  return (
    <article
      onClick={openDetail}
      style={{
        padding: '20px 20px',
        cursor: 'pointer',
        borderBottom: hairline ? '1px solid var(--line)' : 'none',
      }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        {showAuthor && authorName && (
          <Avatar name={authorName} src={author?.avatar} profileId={author?.id} size={26} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
          {showAuthor && authorName && (
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{authorName}</span>
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.02em' }}>
            {fmtDate(post.createdAt)}
          </span>
        </div>
        <TypeTag type={localPost.type ?? (isArticle ? 'article' : 'note')} />

        {/* ⋯ menu */}
        {canEdit && (
          <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: '2px 6px', fontSize: 18, lineHeight: 1, borderRadius: 6 }}
            >
              ···
            </button>
            {menuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', right: 0, top: '100%', zIndex: 200,
                  background: 'var(--surface-1)', border: '1px solid var(--line)',
                  borderRadius: 12, overflow: 'hidden', minWidth: 130,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {onEdit && (
                  <button
                    onClick={() => { setMenuOpen(false); setEditOpen(true) }}
                    style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', textAlign: 'left' }}
                  >
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(localPost.id) }}
                    style={{ display: 'block', width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13.5, color: '#f7768e', textAlign: 'left' }}
                  >
                    Apagar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Article title */}
      {isArticle && localPost.articleTitle && (
        <h3 style={{ margin: '0 0 7px', fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.2, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {localPost.articleTitle}
        </h3>
      )}

      {/* Content */}
      {localPost.content && (
        <p style={{
          margin: 0, fontFamily: isArticle ? 'var(--serif)' : 'var(--sans)',
          fontSize: isArticle ? 15.5 : 14.5, lineHeight: 1.6, color: 'var(--ink-2)',
          display: '-webkit-box', WebkitLineClamp: images.length > 0 ? 2 : 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {localPost.content}
        </p>
      )}

      {/* Image attachments — real images via authenticated API */}
      {images.slice(0, 2).map(att => (
        <AttachmentImage
          key={att.id}
          id={att.id}
          hasThumbnail={att.hasThumbnail}
          alt={att.originalName || 'Imagem'}
          onClick={e => { e.stopPropagation(); lightboxOpenedAt.current = Date.now(); setLightboxId(att.id) }}
        />
      ))}

      {/* Code block preview */}
      {hasCode && (
        <div style={{
          marginTop: 12, borderRadius: 10, overflow: 'hidden',
          border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ padding: '8px 13px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            {localPost.codeBlock.language?.toUpperCase() || 'CÓDIGO'}
          </div>
          <pre style={{ margin: 0, padding: '12px 14px', overflow: 'hidden', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)', maxHeight: 100 }}>
            {localPost.codeBlock.code.slice(0, 300)}
          </pre>
        </div>
      )}

      {/* PDF attachments */}
      {pdfs.map(att => (
        <button
          key={att.id}
          onClick={e => { e.stopPropagation(); openPdf(att) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
            marginTop: 12, padding: '11px 13px', borderRadius: 10, cursor: 'pointer',
            border: '1px solid var(--line-strong)', background: 'rgba(247,118,142,0.05)',
          }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: '#F7768E', background: 'rgba(247,118,142,0.15)', padding: '4px 7px', borderRadius: 6 }}>PDF</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {att.originalName || att.title || 'Documento'}
            </div>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>Abrir →</span>
        </button>
      ))}

      {/* Markdown / Python attachments */}
      {texts.map(att => (
        <div
          key={att.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 11,
            marginTop: 12, padding: '11px 13px', borderRadius: 10,
            border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: att.fileType === 'python' ? '#7AA2F7' : att.fileType === 'code' ? '#E5C07B' : '#73DACA', background: att.fileType === 'python' ? 'rgba(122,162,247,0.15)' : att.fileType === 'code' ? 'rgba(229,192,123,0.15)' : 'rgba(115,218,202,0.15)', padding: '4px 7px', borderRadius: 6 }}>
            {att.fileType === 'python' ? 'PY' : att.fileType === 'markdown' ? 'MD' : (att.originalName || '').match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase() || 'FILE'}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {att.originalName || att.title || 'Arquivo'}
          </div>
        </div>
      ))}

      <ReactionRow post={localPost} onLike={onLike} onSave={onSave} onOpen={openDetail} />
      <CommentsBox postId={localPost.id} initialCount={localPost.commentCount} />

      {editOpen && (
        <EditPostModal
          post={localPost}
          onClose={() => setEditOpen(false)}
          onSaved={updated => { setLocalPost(p => ({ ...p, ...updated })); onEdit?.(updated) }}
        />
      )}

      {/* Lightbox */}
      {lightboxId && (
        <div
          onClick={e => { e.stopPropagation(); setLightboxId(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightboxId(null) }}
            style={{ position: 'absolute', top: 'max(16px, calc(env(safe-area-inset-top, 0px) + 8px))', right: 16, color: 'white', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}
          >×</button>
          <LightboxImage id={lightboxId} alt="Imagem" />
        </div>
      )}
    </article>
  )
}
