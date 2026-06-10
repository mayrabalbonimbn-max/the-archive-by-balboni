import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// Inline extension: @handle → <a href="/@handle" class="mention-link">@handle</a>
const mentionExt = {
  name: 'mention',
  level: 'inline',
  start: src => src.indexOf('@'),
  tokenizer(src) {
    const m = /^@([\w]+)/.exec(src)
    if (m) return { type: 'mention', raw: m[0], handle: m[1] }
  },
  renderer(token) {
    return `<a href="/@${token.handle}" class="mention-link" data-handle="${token.handle}">@${token.handle}</a>`
  },
}

marked.use({ extensions: [mentionExt] })

export default function MarkdownRenderer({ content, className = '' }) {
  const navigate = useNavigate()

  const html = useMemo(() => {
    if (!content) return ''
    const raw = marked.parse(content, { breaks: true, gfm: true })
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins', 'mark',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'hr',
        'pre', 'code', 'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'input',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'type', 'checked', 'disabled', 'rel', 'target', 'data-handle'],
      FORCE_BODY: false,
    })
  }, [content])

  if (!html) return null

  function handleClick(e) {
    const link = e.target.closest('a.mention-link')
    if (!link) return
    e.preventDefault()
    const handle = link.dataset.handle
    if (handle) navigate(`/@${handle}`)
  }

  return (
    <div
      className={`prose-archive ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  )
}
