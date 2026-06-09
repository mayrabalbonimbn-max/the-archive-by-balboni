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

      {/* Compose sheet — full screen, slides up */}
      {composeOpen && (
        <ComposeBox profile={profile} onPost={handlePost} onClose={() => setComposeOpen(false)} />
      )}
    </div>
  )
}
