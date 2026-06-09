// Gradient placeholder tile with film-grain overlay.
// Wire a real <img> via the `src` prop when images are available.
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E")`

export default function PhotoTile({
  tone1 = '#2a3140',
  tone2 = '#11141c',
  radius = 14,
  src,             // real image URL — connect when available
  alt = '',
  style = {},
  className = '',
  children,
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: radius,
        overflow: 'hidden',
        background: src ? undefined : `linear-gradient(150deg, ${tone1} 0%, ${tone2} 100%)`,
        border: '1px solid rgba(255,255,255,0.06)',
        ...style,
      }}
    >
      {src
        ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : (
          <>
            {/* radial sheen */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 78% 12%, rgba(255,255,255,0.10), transparent 55%)' }} />
            {/* film grain */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay', backgroundImage: NOISE }} />
          </>
        )
      }
      {children}
    </div>
  )
}
