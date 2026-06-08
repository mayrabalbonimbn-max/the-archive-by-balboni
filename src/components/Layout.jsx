import { useState } from 'react'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import ComposeBox from './ComposeBox'
import GlobalSearch from './GlobalSearch'

export default function Layout({ children, profile, posts, searchQuery, onSearch, onLogout, onPost }) {
  const [composeOpen, setComposeOpen] = useState(false)

  async function handlePost(draft) {
    await onPost(draft)
    setComposeOpen(false)
  }

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-x-hidden">
      <div className="flex w-full max-w-[1280px] overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar profile={profile} onLogout={onLogout} onCompose={() => setComposeOpen(true)} />

        {/* Main content */}
        <main className="flex-1 min-w-0 border-x border-dark-border mt-14 md:mt-0">
          {children}
        </main>

        {/* Right panel */}
        <RightPanel
          posts={posts}
          searchQuery={searchQuery}
          onSearch={onSearch}
        />
      </div>

      <button
        onClick={() => setComposeOpen(true)}
        className="fixed right-5 bottom-5 md:right-8 md:bottom-8 z-30 w-14 h-14 rounded-full bg-brand-rose text-white shadow-[0_10px_35px_rgba(244,114,182,0.35)] hover:bg-pink-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Nova entrada"
        title="Nova entrada"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/>
        </svg>
      </button>
      <GlobalSearch />

      {composeOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-start md:items-center justify-center p-3 pt-16 md:p-6" onClick={() => setComposeOpen(false)}>
          <div className="relative w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-dark-border/60">
              <h2 className="font-bold text-dark-text">Nova entrada</h2>
              <button onClick={() => setComposeOpen(false)} className="w-8 h-8 rounded-full text-dark-muted hover:text-dark-text hover:bg-dark-hover flex items-center justify-center" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <ComposeBox profile={profile} onPost={handlePost} autoFocus />
          </div>
        </div>
      )}
    </div>
  )
}
