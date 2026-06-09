import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'
import { api } from '../../utils/api'

// Primary reactions — mutually exclusive
export const PRIMARY_REACTIONS = [
  { type: 'heart',      emoji: '❤️',  label: 'Gostei' },
  { type: 'inspirador', emoji: '✨',  label: 'Inspirador' },
  { type: 'aprendizado',emoji: '📚',  label: 'Aprendizado' },
  { type: 'codigo',     emoji: '💻',  label: 'Código' },
  { type: 'fotografia', emoji: '📷',  label: 'Fotografia' },
]

const PRIMARY_TYPES = new Set(PRIMARY_REACTIONS.map(r => r.type))

export default function ReactionRow({ post, onReact, onSave, onOpen, compact = false }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return
    function handler(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [pickerOpen])

  const reactionCounts = post?.reactionCounts || {}
  const viewerReactions = post?.viewerReactions || []
  const saved = post?.saved ?? false
  const commentCount = post?.commentCount ?? 0

  // Current primary reaction this viewer selected
  const myPrimary = PRIMARY_REACTIONS.find(r => viewerReactions.includes(r.type)) || null

  // Total primary reaction count (all types)
  const totalPrimary = PRIMARY_REACTIONS.reduce((sum, r) => sum + (reactionCounts[r.type] || 0), 0)

  function handlePickerSelect(reactionType) {
    setPickerOpen(false)
    onReact?.(reactionType)
  }

  function handlePrimaryClick(e) {
    e.stopPropagation()
    if (myPrimary) {
      // Toggle off current reaction
      onReact?.(myPrimary.type)
    } else {
      // Open picker
      setPickerOpen(p => !p)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 12 : 18, marginTop: 14, position: 'relative' }}>
      {/* Primary reaction button */}
      <div style={{ position: 'relative' }} ref={pickerRef}>
        <button
          onClick={handlePrimaryClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            color: myPrimary ? 'var(--accent)' : 'var(--ink-3)',
            transition: 'color .15s',
          }}
        >
          <span style={{ fontSize: compact ? 15 : 17, lineHeight: 1 }}>
            {myPrimary ? myPrimary.emoji : '❤️'}
          </span>
          {totalPrimary > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: myPrimary ? 'var(--accent)' : 'var(--ink-3)' }}>
              {totalPrimary}
            </span>
          )}
        </button>

        {/* Reaction picker */}
        {pickerOpen && (
          <div
            style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
              background: 'var(--bg)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '8px 10px',
              display: 'flex', gap: 4, zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {PRIMARY_REACTIONS.map(r => {
              const count = reactionCounts[r.type] || 0
              const active = viewerReactions.includes(r.type)
              return (
                <button
                  key={r.type}
                  onClick={() => handlePickerSelect(r.type)}
                  title={r.label}
                  style={{
                    background: active ? 'rgba(232,108,180,0.12)' : 'transparent',
                    border: active ? '1px solid var(--accent)' : '1px solid transparent',
                    borderRadius: 10, padding: '6px 9px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    transition: 'background .12s',
                  }}
                >
                  <span style={{ fontSize: 19, lineHeight: 1 }}>{r.emoji}</span>
                  {count > 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: active ? 'var(--accent)' : 'var(--ink-3)' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Comment */}
      <button
        onClick={e => { e.stopPropagation(); onOpen?.() }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--ink-3)',
        }}
      >
        <Icon name="comment" size={18} stroke={1.7} />
        {commentCount > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{commentCount}</span>
        )}
      </button>

      <div style={{ flex: 1 }} />

      {/* Bookmark */}
      <button
        onClick={e => { e.stopPropagation(); onSave?.() }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: saved ? 'var(--accent)' : 'var(--ink-3)',
          transition: 'color .15s',
        }}
      >
        <Icon name="bookmark" size={18} fill={saved} stroke={1.7} />
      </button>
    </div>
  )
}
