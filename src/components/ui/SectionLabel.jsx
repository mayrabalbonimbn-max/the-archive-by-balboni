export default function SectionLabel({ children, action, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginBottom: 12,
    }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--ink-3)',
      }}>
        {children}
      </span>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12.5,
            color: 'var(--accent)', fontWeight: 500,
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}
