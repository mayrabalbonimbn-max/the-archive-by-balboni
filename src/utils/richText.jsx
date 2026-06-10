import { useNavigate } from 'react-router-dom'

// Splits text into segments: plain text | @mention | #hashtag
function parseSegments(text) {
  const segments = []
  const re = /(@[\w]+)|(#[\p{L}\p{N}_-]+)/gu
  let last = 0
  let match
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: 'text', value: text.slice(last, match.index) })
    if (match[1]) segments.push({ type: 'mention', value: match[1] })
    else if (match[2]) segments.push({ type: 'hashtag', value: match[2] })
    last = re.lastIndex
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  return segments
}

// Renders text with @mentions and #hashtags as clickable spans.
// Preserves all surrounding styles — wrap in any element you want.
export default function RichText({ text, style }) {
  const navigate = useNavigate()
  if (!text) return null
  const segments = parseSegments(text)

  return (
    <span style={style}>
      {segments.map((seg, i) => {
        if (seg.type === 'mention') {
          const handle = seg.value.slice(1)
          return (
            <span
              key={i}
              onClick={e => { e.stopPropagation(); navigate(`/@${handle}`) }}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
            >
              {seg.value}
            </span>
          )
        }
        if (seg.type === 'hashtag') {
          const tag = seg.value.slice(1)
          return (
            <span
              key={i}
              onClick={e => { e.stopPropagation(); navigate(`/tags/${tag}`) }}
              style={{ color: 'var(--ink-3)', cursor: 'pointer' }}
            >
              {seg.value}
            </span>
          )
        }
        // Plain text — preserve line breaks
        return seg.value.split('\n').flatMap((line, li, arr) =>
          li < arr.length - 1 ? [line, <br key={`${i}-${li}`} />] : [line]
        )
      })}
    </span>
  )
}
