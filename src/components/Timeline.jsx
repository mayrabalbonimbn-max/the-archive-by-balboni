import { useMemo, useState } from 'react'
import PostCard from './PostCard'
import { TYPE_CONFIG } from '../utils/helpers'

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'saved', label: 'Salvos' },
  { id: 'liked', label: 'Apreciados' },
  ...Object.entries(TYPE_CONFIG).map(([id, { label }]) => ({ id, label }))
]

export default function Timeline({ posts, profile, searchQuery, onLike, onSave, onPin, onDelete }) {
  const [activeTab, setActiveTab] = useState('all')

  const filtered = useMemo(() => {
    let list = [...posts]

    // Sort: pinned first, then by date
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    // Tab filter
    if (activeTab === 'saved') list = list.filter(p => p.saved)
    else if (activeTab === 'liked') list = list.filter(p => p.liked)
    else if (activeTab !== 'all') list = list.filter(p => p.type === activeTab)

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p =>
        p.content.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      )
    }

    return list
  }, [posts, activeTab, searchQuery])

  return (
    <div>
      {/* Filter tabs - scrollable */}
      <div className="flex border-b border-dark-border overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`filter-tab whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-dark-muted">
            <div className="w-14 h-14 rounded-full bg-dark-hover flex items-center justify-center mb-5 opacity-60">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="text-[15px] font-medium text-dark-text/40 tracking-tight">Nada aqui ainda</p>
            <p className="text-[13px] text-dark-label mt-1.5">
              {searchQuery ? 'Tente uma busca diferente' : 'Escreva algo para começar'}
            </p>
          </div>
        ) : (
          filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              profile={profile}
              onLike={onLike}
              onSave={onSave}
              onPin={onPin}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
