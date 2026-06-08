import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ComposeBox from '../components/ComposeBox'
import Timeline from '../components/Timeline'
import { api } from '../utils/api'
import { useCollections } from '../hooks/useCollections'

function formatTodayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function HomePage({ posts, profile, searchQuery, onPost, onLike, onSave, onPin, onDelete }) {
  const navigate = useNavigate()
  const [area, setArea] = useState('mine')
  const [remotePosts, setRemotePosts] = useState([])
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [memories, setMemories] = useState([])
  const [todayStats, setTodayStats] = useState(null)
  const { collections } = useCollections()

  const fetchRemotePosts = useCallback(async (nextArea) => {
    setRemoteLoading(true)
    try {
      const path = nextArea === 'explore' ? '/posts/explore' : nextArea === 'friends' ? '/posts/friends' : '/posts/following'
      setRemotePosts(await api.get(path))
    } finally {
      setRemoteLoading(false)
    }
  }, [])

  useEffect(() => {
    if (area !== 'mine') fetchRemotePosts(area)
  }, [area, fetchRemotePosts])

  useEffect(() => {
    api.get('/archive/memories').then(data => setMemories(data.slice(0, 3))).catch(() => {})
    api.get('/archive/today').then(setTodayStats).catch(() => {})
  }, [])

  async function updateFriendPost(id, action, reactionType) {
    const updated = await api.patch(`/posts/${id}`, reactionType ? { action, reactionType } : { action })
    setRemotePosts(current => current.map(post => post.id === id ? { ...updated, attachments: post.attachments, author: post.author } : post))
  }

  const todayCount = todayStats ? (todayStats.posts_today || 0) : null
  const todayImages = todayStats ? (todayStats.images_today || 0) : null
  const todayCodes = todayStats ? (todayStats.codes_today || 0) : null

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-medium capitalize">
          {formatTodayLabel()}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <h1 className="font-editorial text-[22px] text-dark-text leading-tight">Hoje</h1>
          <div className="flex gap-1.5">
            {[
              ['mine', 'Meu espaço'],
              ['following', 'Seguindo'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setArea(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  area === key
                    ? 'bg-brand-rose/15 text-brand-rose border border-brand-rose/30'
                    : 'text-dark-muted hover:text-dark-text border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar — today in numbers */}
        {area === 'mine' && todayStats && (
          <div className="flex gap-4 mt-2.5 pb-0.5">
            {[
              [todayCount, 'entradas'],
              [todayImages, 'fotos'],
              [todayCodes, 'códigos'],
            ].map(([val, label]) => (
              <div key={label} className="flex items-baseline gap-1">
                <span className={`text-[17px] font-bold tabular-nums ${val > 0 ? 'text-brand-rose' : 'text-dark-muted/50'}`}>{val}</span>
                <span className="text-[11px] text-dark-muted">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {area === 'mine' ? (
        <>
          {/* Compose */}
          <ComposeBox profile={profile} onPost={onPost} />

          {/* Memories */}
          {memories.length > 0 && (
            <section className="border-b border-dark-border/60 px-4 py-4 bg-dark-card/20">
              <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-3">Neste dia</p>
              <div className="space-y-2">
                {memories.map(memory => (
                  <div key={memory.id} className="rounded-xl border border-dark-border bg-dark-card px-3 py-2.5">
                    <p className="text-brand-rose text-[11px] font-semibold">{memory.label}</p>
                    <p className="text-dark-text text-sm mt-0.5 line-clamp-2">{memory.articleTitle || memory.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Collections */}
          {collections.length > 0 && (
            <section className="border-b border-dark-border/60 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold">Coleções</p>
                <button onClick={() => navigate('/collections')} className="text-xs text-brand-rose hover:opacity-80 transition-opacity">
                  Ver todas →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {collections.slice(0, 4).map(col => (
                  <button
                    key={col.id}
                    onClick={() => navigate(`/collections/${col.id}`)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-dark-card border border-dark-border hover:bg-dark-hover active:scale-[0.98] transition-all text-left"
                  >
                    <span className="text-xl leading-none shrink-0">{col.emoji || '📂'}</span>
                    <div className="min-w-0">
                      <p className="text-dark-text text-[13px] font-medium truncate leading-tight">{col.name}</p>
                      {col.postCount != null && (
                        <p className="text-dark-muted text-[11px] mt-0.5">{col.postCount} {col.postCount === 1 ? 'entrada' : 'entradas'}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          <Timeline
            posts={posts}
            profile={profile}
            searchQuery={searchQuery || ''}
            onLike={onLike}
            onSave={onSave}
            onPin={onPin}
            onDelete={onDelete}
          />
        </>
      ) : remoteLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
        </div>
      ) : (
        <Timeline
          posts={remotePosts}
          profile={profile}
          searchQuery={searchQuery || ''}
          onLike={(id, reactionType = 'heart') => updateFriendPost(id, 'react', reactionType)}
          onSave={id => updateFriendPost(id, 'save')}
          onPin={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  )
}
