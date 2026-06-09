import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useMemo } from 'react'

// Safe markdown renderer — strips script/iframe, preserves everything else
export default function MarkdownRenderer({ content, className = '' }) {
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
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'type', 'checked', 'disabled', 'rel', 'target'],
      FORCE_BODY: false,
    })
  }, [content])

  if (!html) return null

  return (
    <div
      className={`prose-archive ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
