// AppBar uses position:fixed (not sticky) to bypass the overflow-x:hidden stacking
// context in Layout which breaks sticky on iOS Safari. A spacer div (md:hidden) pushes
// content below the bar; safe-area height is already handled by <main> paddingTop in Layout.
export default function AppBar({ left, title, right }) {
  return (
    <>
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'linear-gradient(#000 78%, rgba(0,0,0,0.96))',
        }}
      >
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
        <div style={{ height: 1, background: 'var(--line)' }} />
      </div>

      <div
        className="md:hidden"
        style={{ height: 53, flexShrink: 0 }}
        aria-hidden="true"
      />
    </>
  )
}
