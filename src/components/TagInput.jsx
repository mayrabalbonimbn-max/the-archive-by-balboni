import { useState, useRef, useEffect } from 'react'

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9À-ɏ_-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

// value: string[] of slugs
// onChange: (newSlugs: string[]) => void
// suggestions: [{ name, slug }]
export default function TagInput({ value = [], onChange, suggestions = [], placeholder = 'Adicionar tag…' }) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const filtered = input.length >= 1
    ? suggestions.filter(s => s.slug.includes(slugify(input)) && !value.includes(s.slug)).slice(0, 8)
    : suggestions.filter(s => !value.includes(s.slug)).slice(0, 8)

  function addTag(slug) {
    const s = slugify(slug)
    if (!s || value.includes(s) || value.length >= 10) return
    onChange([...value, s])
    setInput('')
  }

  function removeTag(slug) {
    onChange(value.filter(t => t !== slug))
  }

  function onKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && input.trim()) {
      e.preventDefault()
      addTag(input.trim())
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          minHeight: 36, padding: '6px 10px', borderRadius: 10,
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--line-strong)'}`,
          background: 'var(--surface-2)', cursor: 'text', transition: 'border-color .15s',
        }}
      >
        {value.map(slug => (
          <span key={slug} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.05em',
            color: 'var(--accent)', background: 'rgba(232,108,180,0.1)',
            border: '1px solid rgba(232,108,180,0.25)',
            borderRadius: 6, padding: '2px 7px',
          }}>
            #{slug}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(slug) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', lineHeight: 1, padding: 0, marginLeft: 1, fontSize: 13 }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value.replace(/[,\s]/g, ''))}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (input.trim()) addTag(input.trim()) }}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{
            flex: 1, minWidth: 80, background: 'none', border: 'none', outline: 'none',
            fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)',
            padding: 0, lineHeight: 1.4,
          }}
        />
      </div>

      {focused && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface-1)', border: '1px solid var(--line-strong)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', overflow: 'hidden', marginTop: 4,
        }}>
          {filtered.map(s => (
            <button
              key={s.slug}
              type="button"
              onMouseDown={e => { e.preventDefault(); addTag(s.slug) }}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <span style={{ color: 'var(--accent)' }}>#{s.slug}</span>
              {s.count > 0 && <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{s.count}</span>}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-3)', marginTop: 5, paddingLeft: 2 }}>
        Enter, vírgula ou espaço para confirmar · máx. 10 tags
      </div>
    </div>
  )
}
