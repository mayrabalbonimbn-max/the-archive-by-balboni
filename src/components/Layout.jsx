import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import ComposeBox from './ComposeBox'
import GlobalSearch from './GlobalSearch'
import TabBar from './ui/TabBar'

export default function Layout({ children, profile, posts, searchQuery, onSearch, onLogout, onPost }) {
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeOptions, setComposeOptions] = useState({})

  function openCompose(opts = {}) {
    setComposeOptions(opts)
    setComposeOpen(true)
  }

  useEffect(() => {
    function handler(e) { openCompose(e.detail || {}) }
    window.addEventListener('open-compose', handler)
    return () => window.removeEventListener('open-compose', handler)
  }, [])

  async function handlePost(draft) {
    await onPost(draft)
    setComposeOpen(false)
    setComposeOptions({})
  }

  return (
    <div className="min-h-screen bg-black flex justify-center overflow-x-hidden">
      <div className="flex w-full max-w-[1280px] overflow-x-hidden">
        {/* Desktop sidebar */}
        <Sidebar profile={profile} onLogout={onLogout} onCompose={() => openCompose()} />

        {/* Main content — pb-24 on mobile clears the fixed TabBar */}
        <main style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} className="flex-1 min-w-0 border-x border-dark-border pb-24 md:pb-0">
          {children}
        </main>

        {/* Desktop right panel — contextual rail */}
        <RightPanel profile={profile} />
      </div>

      {/* Mobile bottom tab bar */}
      <TabBar onCompose={() => openCompose()} />

      <GlobalSearch />

      {/* Compose sheet — full screen, slides up */}
      {composeOpen && (
        <ComposeBox
          profile={profile}
          onPost={handlePost}
          onClose={() => { setComposeOpen(false); setComposeOptions({}) }}
          initialContent={composeOptions.initialContent}
          parentMemoryPostId={composeOptions.parentMemoryPostId}
        />
      )}
    </div>
  )
}
