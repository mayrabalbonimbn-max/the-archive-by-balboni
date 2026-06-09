import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import TypeTag from './TypeTag'
import ReactionRow from './ReactionRow'
import { useAttachmentUrl } from '../../hooks/useAttachmentUrl'
import { attachmentBlob } from '../../utils/api'

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

export default function EntryCard({ post, showAuthor = true, onLike, onSave, hairline = true }) {
  const navigate = useNavigate()
  const [lightboxId, setLightboxId] = useState(null)
  const lightboxOpenedAt = useRef(0)

  const isArticle = post.isArticle || post.type === 'article'

  // Use correct API field names (fileType, originalName — NOT kind/filename)
  const images = post.attachments?.filter(a => a.fileType === 'image') ?? []
  const pdfs   = post.attachments?.filter(a => a.fileType === 'pdf') ?? []
  const texts  = post.attachments?.filter(a => a.fileType === 'markdown' || a.fileType === 'python' || a.fileType === 'code') ?? []
  const hasCode = !!post.codeBlock?.code

  function openDetail(e) {
    if (lightboxId) return
    if (isArticle) navigate(`/articles/${post.id}`)
    else navigate(`/posts/${post.id}`)
  }

  const author = typeof post.author === 'object' ? post.author : null
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
          <Avatar name={authorName} src={author?.avatar} size={26} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
          {showAuthor && authorName && (
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{authorName}</span>
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.02em' }}>
            {fmtDate(post.createdAt)}
          </span>
        </div>
        <TypeTag type={post.type ?? (isArticle ? 'article' : 'note')} />
      </div>

      {/* Article title */}
      {isArticle && post.articleTitle && (
        <h3 style={{ margin: '0 0 7px', fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.2, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {post.articleTitle}
        </h3>
      )}

      {/* Content */}
      {post.content && (
        <p style={{
          margin: 0, fontFamily: isArticle ? 'var(--serif)' : 'var(--sans)',
          fontSize: isArticle ? 15.5 : 14.5, lineHeight: 1.6, color: 'var(--ink-2)',
          display: '-webkit-box', WebkitLineClamp: images.length > 0 ? 2 : 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.content}
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
            {post.codeBlock.language?.toUpperCase() || 'CÓDIGO'}
          </div>
          <pre style={{ margin: 0, padding: '12px 14px', overflow: 'hidden', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)', maxHeight: 100 }}>
            {post.codeBlock.code.slice(0, 300)}
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

      <ReactionRow post={post} onLike={onLike} onSave={onSave} onOpen={openDetail} />

      {/* Lightbox */}
      {lightboxId && createPortal(
        <div
          onClick={e => { e.stopPropagation(); if (Date.now() - lightboxOpenedAt.current < 400) return; setLightboxId(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, touchAction: 'none' }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightboxId(null) }}
            style={{ position: 'absolute', top: 16, right: 16, color: 'white', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}
          >×</button>
          <LightboxImage id={lightboxId} alt="Imagem" />
        </div>,
        document.body
      )}
    </article>
  )
}
