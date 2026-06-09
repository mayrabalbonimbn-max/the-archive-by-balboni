// Deterministic tone from a seed string
const TONES = ['#E86CB4','#7AA2F7','#9ECE6A','#E0AF68','#BB9AF7','#F7768E','#73DACA','#FF9E64']
function getTone(seed = '') {
  const hash = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TONES[hash % TONES.length]
}

export default function Avatar({
  src,          // blob URL or real image URL — real photo
  name = '',    // display name (for initials + tone)
  size = 38,
  ring = false, // accent ring around the circle
  tone,         // override tone color
}) {
  const resolvedTone = tone ?? getTone(name)
  const initial = name ? name.trim().charAt(0).toUpperCase() : '·'

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: ring
          ? `1.5px solid ${resolvedTone}`
          : '1px solid rgba(255,255,255,0.12)',
        color: resolvedTone,
        fontFamily: 'var(--serif)',
        fontSize: size * 0.4,
        fontStyle: 'italic',
        letterSpacing: '-0.02em',
        fontWeight: 500,
      }}
    >
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial
      }
    </div>
  )
}
