// Mobile app bar — sticky, clears iOS status bar via safe-area-inset-top.
// Hidden on md+ (desktop sidebar provides navigation there).
export default function AppBar({ left, title, right }) {
  return (
    <div
      className="sticky top-0 z-30 md:hidden"
      style={{ background: 'linear-gradient(#000 78%, rgba(0,0,0,0.96))' }}
    >
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-5 py-3 gap-3 min-h-[52px]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {left}
          </div>
          {title && (
            <div
              className="flex-1 text-center"
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 19,
                color: 'var(--ink)',
                fontStyle: 'italic',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {right}
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--line)' }} />
    </div>
  )
}
