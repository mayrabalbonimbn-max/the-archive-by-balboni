import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import PhotoTile from './PhotoTile'
import FileBadge from './FileBadge'
import TypeTag from './TypeTag'
import ReactionRow from './ReactionRow'
import Icon from './Icon'

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
}

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function CodePreview({ post }) {
  const file = post.attachments?.find(a => a.kind === 'code' || a.filename?.endsWith('.py'))
  const lang = post.codeBlock?.language ?? 'code'
  return (
    <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderBottom: '1px solid var(--line)' }}>
        <FileBadge kind="code" tone="#E0AF68" />
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink)' }}>{file?.filename ?? `snippet.${lang === 'python' ? 'py' : lang}`}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{lang}</div>
        </div>
      </div>
      {post.codeBlock?.code && (
        <pre style={{ margin: 0, padding: '13px 15px', overflow: 'auto', fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>
          {post.codeBlock.code.slice(0, 400)}
        </pre>
      )}
    </div>
  )
}

function FilePreview({ attachment }) {
  const isPdf = attachment.kind === 'pdf' || attachment.filename?.endsWith('.pdf')
  const tone = isPdf ? '#F7768E' : '#E0AF68'
  const kind = isPdf ? 'PDF' : attachment.filename?.split('.').pop()?.toUpperCase() ?? 'FILE'
  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)' }}>
      <FileBadge kind={kind} tone={tone} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.filename}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{kind} · {attachment.title || 'arquivo'}</div>
      </div>
    </div>
  )
}

export default function EntryCard({ post, showAuthor = true, onLike, onSave, hairline = true }) {
  const navigate = useNavigate()
  const author = post.author
  const isArticle = post.isArticle || post.type === 'article'
  const imageAttachments = post.attachments?.filter(a => a.kind === 'image') ?? []
  const pdfAttachments = post.attachments?.filter(a => a.kind === 'pdf' || a.filename?.endsWith('.pdf')) ?? []
  const hasCode = !!post.codeBlock?.code

  function openDetail() {
    if (isArticle) navigate(`/articles/${post.id}`)
  }

  const authorName = typeof author === 'object' ? author?.name : null

  return (
    <article
      onClick={openDetail}
      style={{
        padding: '20px 20px',
        cursor: isArticle ? 'pointer' : 'default',
        borderBottom: hairline ? '1px solid var(--line)' : 'none',
      }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        {showAuthor && authorName && (
          <Avatar name={authorName} src={author?.avatar} size={26} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flexWrap: 'wrap', flex: 1 }}>
          {showAuthor && authorName && (
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{authorName}</span>
          )}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.02em' }}>
            {fmtDate(post.createdAt)}{post.time ? ' · ' + post.time : ''}
          </span>
        </div>
        <TypeTag type={post.type ?? (isArticle ? 'article' : 'note')} />
      </div>

      {/* Title */}
      {(isArticle && post.articleTitle) && (
        <h3 style={{ margin: '0 0 7px', fontFamily: 'var(--serif)', fontSize: 21, lineHeight: 1.2, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {post.articleTitle}
        </h3>
      )}

      {/* Body */}
      {post.content && (
        <p style={{
          margin: 0,
          fontFamily: isArticle ? 'var(--serif)' : 'var(--sans)',
          fontSize: isArticle ? 15.5 : 14.5,
          lineHeight: 1.6,
          color: 'var(--ink-2)',
          display: '-webkit-box',
          WebkitLineClamp: imageAttachments.length > 0 ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.content}
        </p>
      )}

      {/* Photo attachment (first image) */}
      {imageAttachments[0] && (
        <PhotoTile
          tone1="#2a3140" tone2="#11141c"
          style={{ marginTop: 13, aspectRatio: '4/3' }}
        >
          {imageAttachments[0].title && (
            <div style={{ position: 'absolute', left: 12, bottom: 11, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)' }}>
              {imageAttachments[0].title}
            </div>
          )}
        </PhotoTile>
      )}

      {/* Code block */}
      {hasCode && <CodePreview post={post} />}

      {/* PDF / file */}
      {pdfAttachments[0] && <FilePreview attachment={pdfAttachments[0]} />}

      {/* Article read time */}
      {isArticle && (
        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          <Icon name="clock" size={13} /> leitura
        </div>
      )}

      <ReactionRow
        post={post}
        onLike={onLike}
        onSave={onSave}
        onOpen={openDetail}
      />
    </article>
  )
}
