import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import ComposeBox from './ComposeBox'
import GlobalSearch from './GlobalSearch'
import TabBar from './ui/TabBar'

export default function Layout({ children, profile, posts, searchQuery, onSearch, onLogout, onPost }) {
  const [composeOpen, setComposeOpen] = useState(false)

  useEffect(() => {
    function handler() { setComposeOpen(true) }
    window.addEventListener('open-compose', handler)
    return () => window.removeEventListener('open-compose', handler)
  }, [])

  async function handlePost(draft) {
    await onPost(draft)
    setComposeOpen(false)
  }

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-x-hidden">
      <div className="flex w-full max-w-[1280px] overflow-x-hidden">
        {/* Desktop sidebar */}
        <Sidebar profile={profile} onLogout={onLogout} onCompose={() => setComposeOpen(true)} />

        {/* Main content — pb-24 on mobile clears the fixed TabBar */}
        <main className="flex-1 min-w-0 border-x border-dark-border pb-24 md:pb-0">
          {children}
        </main>

        {/* Desktop right panel */}
        <RightPanel posts={posts} searchQuery={searchQuery} onSearch={onSearch} />
      </div>

      {/* Mobile bottom tab bar */}
      <TabBar onCompose={() => setComposeOpen(true)} />

      <GlobalSearch />

      {/* Compose modal */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-start md:items-center justify-center p-3 pt-16 md:p-6"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink)', margin: 0 }}>
                Nova entrada
              </h2>
              <button
                onClick={() => setComposeOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-3)', color: 'var(--ink-2)' }}
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <ComposeBox profile={profile} onPost={handlePost} autoFocus />
          </div>
        </div>
      )}
    </div>
  )
}
