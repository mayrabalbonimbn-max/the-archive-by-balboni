import { useCallback, useEffect, useState } from 'react'
import ComposeBox from '../components/ComposeBox'
import Timeline from '../components/Timeline'
import { api } from '../utils/api'

export default function HomePage({ posts, profile, searchQuery, onPost, onLike, onSave, onPin, onDelete }) {
  const [area, setArea] = useState('mine')
  const [remotePosts, setRemotePosts] = useState([])
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [memories, setMemories] = useState([])

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
  }, [])

  async function updateFriendPost(id, action, reactionType) {
    const updated = await api.patch(`/posts/${id}`, reactionType ? { action, reactionType } : { action })
    setRemotePosts(current => current.map(post => post.id === id ? { ...updated, attachments: post.attachments, author: post.author } : post))
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3">
        <h1 className="font-bold text-xl text-dark-text mb-3">Início</h1>
        <div className="grid grid-cols-3 rounded-lg border border-dark-border overflow-hidden">
          {[
            ['mine', 'Meu Arquivo'],
            ['following', 'Seguindo'],
            ['explore', 'Explorar'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setArea(key)}
              className={`py-2 text-sm font-medium transition-colors ${area === key ? 'bg-dark-hover text-dark-text' : 'text-dark-muted hover:text-dark-text'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {area === 'mine' ? (
        <>
          <ComposeBox profile={profile} onPost={onPost} />
          {memories.length > 0 && (
            <section className="border-b border-dark-border/60 px-4 py-4 bg-dark-card/20">
              <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-3">Neste dia</p>
              <div className="space-y-2">
                {memories.map(memory => (
                  <div key={memory.id} className="rounded-lg border border-dark-border bg-dark-card px-3 py-2">
                    <p className="text-brand-rose text-[11px] font-semibold">{memory.label}</p>
                    <p className="text-dark-text text-sm mt-1 line-clamp-2">{memory.articleTitle || memory.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
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
