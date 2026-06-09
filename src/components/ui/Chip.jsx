export default function Chip({ children, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '7px 14px',
        borderRadius: 999,
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        transition: 'all .16s ease',
        border: `1px solid ${active ? 'transparent' : 'var(--line-strong)'}`,
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--ink-2)',
      }}
    >
      {children}
    </button>
  )
}
