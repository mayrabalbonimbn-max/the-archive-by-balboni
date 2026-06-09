import { useState } from 'react'
import Icon from './Icon'

export default function ReactionRow({ post, onLike, onSave, onOpen, compact = false }) {
  const [likeAnim, setLikeAnim] = useState(false)

  function handleLike(e) {
    e.stopPropagation()
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 350)
    onLike?.()
  }

  const liked = post?.liked ?? false
  const saved = post?.saved ?? false
  const likeCount = (post?.likeCount ?? post?.reactions ?? 0)
  const commentCount = post?.commentCount ?? post?.comments ?? 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
      {/* Heart */}
      <button
        onClick={handleLike}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          color: liked ? 'var(--accent)' : 'var(--ink-3)',
          transition: 'color .15s',
        }}
      >
        <span className={likeAnim ? 'animate-like-pop' : ''} style={{ display: 'flex' }}>
          <Icon name="heart" size={18} fill={liked} stroke={1.7} />
        </span>
        {likeCount > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'inherit' }}>{likeCount}</span>
        )}
      </button>

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
