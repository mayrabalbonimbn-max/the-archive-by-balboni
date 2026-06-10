import Avatar from './ui/Avatar'

export default function MentionList({ results, isOpen, onSelect, style }) {
  if (!isOpen || results.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 6px)',
        left: 0,
        right: 0,
        zIndex: 300,
        background: '#111',
        border: '1px solid var(--line-strong)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.7)',
        maxHeight: 260,
        overflowY: 'auto',
        ...style,
      }}
    >
      {results.map(u => {
        const rawHandle = u.handle.replace(/^@/, '')
        const snippet = u.title || u.bio
        return (
          <button
            key={u.id}
            onMouseDown={e => { e.preventDefault(); onSelect(u) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 14px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--line)',
              cursor: 'pointer',
              textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <Avatar name={u.name} src={u.avatar} profileId={u.id} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: 'var(--sans)', fontSize: 13.5,
                  fontWeight: 600, color: 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {u.name}
                </span>
                {u.isFollowing && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9,
                    color: 'var(--accent)', letterSpacing: '0.06em',
                    border: '1px solid var(--accent)', borderRadius: 4,
                    padding: '1px 5px', flexShrink: 0,
                  }}>
                    círculo
                  </span>
                )}
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 11,
                color: 'var(--ink-3)', marginTop: 1,
              }}>
                @{rawHandle}
                {snippet && (
                  <span style={{ color: 'var(--ink-3)', marginLeft: 6, fontFamily: 'var(--sans)', fontSize: 11 }}>
                    · {snippet.length > 40 ? snippet.slice(0, 40) + '…' : snippet}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
