import { useAvatarUrl } from '../../hooks/useAvatarUrl'

// Deterministic tone from a seed string
const TONES = ['#E86CB4','#7AA2F7','#9ECE6A','#E0AF68','#BB9AF7','#F7768E','#73DACA','#FF9E64']
function getTone(seed = '') {
  const hash = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TONES[hash % TONES.length]
}

export default function Avatar({
  src,           // blob URL, http URL, or raw filename from API
  profileId,     // when provided, auto-fetches if src is a raw filename
  name = '',     // display name (for initials + tone)
  size = 38,
  ring = false,  // accent ring around the circle
  tone,          // override tone color
  story = false, // gradient story ring (like Instagram)
  onClick,
}) {
  const resolvedSrc = useAvatarUrl(profileId, src)
  const resolvedTone = tone ?? getTone(name)
  const initial = name ? name.trim().charAt(0).toUpperCase() : '·'

  const inner = (
    <div
      onClick={!story ? onClick : undefined}
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
          : story
            ? 'none'
            : '1px solid rgba(255,255,255,0.12)',
        color: resolvedTone,
        fontFamily: 'var(--serif)',
        fontSize: size * 0.4,
        fontStyle: 'italic',
        letterSpacing: '-0.02em',
        fontWeight: 500,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {resolvedSrc
        ? <img src={resolvedSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial
      }
    </div>
  )

  if (!story) return inner

  const padding = Math.max(2, Math.round(size * 0.035))
  const outerSize = size + padding * 2 + 4

  return (
    <div
      onClick={onClick}
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius: '50%',
        flexShrink: 0,
        padding: padding,
        background: 'linear-gradient(135deg, var(--accent) 0%, #c77dff 100%)',
        cursor: onClick ? 'pointer' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{
        width: size + 4,
        height: size + 4,
        borderRadius: '50%',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.04)',
          color: resolvedTone,
          fontFamily: 'var(--serif)',
          fontSize: size * 0.4,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          fontWeight: 500,
        }}>
          {src
            ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initial
          }
        </div>
      </div>
    </div>
  )
}
