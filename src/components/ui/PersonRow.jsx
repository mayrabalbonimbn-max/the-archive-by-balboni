import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { api } from '../../utils/api'

export default function PersonRow({ person, hairline = true, storyProfiles }) {
  const navigate = useNavigate()
  const [following, setFollowing] = useState(person.isFollowing ?? person.following ?? false)
  const [busy, setBusy] = useState(false)

  async function toggle(e) {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (following) await api.delete(`/follows/${person.id}`)
      else await api.post(`/follows/${person.id}`, {})
      setFollowing(f => !f)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={() => navigate(person.handle ? `/@${person.handle}` : `/profiles/${person.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 13, padding: '14px 20px',
        borderBottom: hairline ? '1px solid var(--line)' : 'none',
        cursor: 'pointer',
      }}
    >
      <Avatar name={person.name} src={person.avatar} profileId={person.id} size={44} story={storyProfiles?.has(person.id)} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 16.5, color: 'var(--ink)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.name}
        </span>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>
          {person.handle}
          {person.title && <> · {person.title}</>}
        </div>
        {person.bio && (
          <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {person.bio}
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        disabled={busy}
        style={{
          flexShrink: 0, padding: '7px 15px', borderRadius: 999, cursor: 'pointer',
          fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${following ? 'var(--line-strong)' : 'transparent'}`,
          background: following ? 'transparent' : 'var(--accent)',
          color: following ? 'var(--ink-2)' : '#fff',
          opacity: busy ? 0.5 : 1,
          transition: 'all .16s ease',
        }}
      >
        {following ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  )
}
