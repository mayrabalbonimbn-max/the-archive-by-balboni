import { useMemo, useState } from 'react'
import PostCard from '../components/PostCard'
import ComposeBox from '../components/ComposeBox'
import { formatRelativeTime, TYPE_CONFIG } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'

function formatJoinDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function ProfilePage({ profile, posts, onPost, onLike, onSave, onPin, onDelete }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('posts')

  const allPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts]
  )
  const regularPosts = allPosts.filter(p => !p.isArticle)
  const articlePosts = allPosts.filter(p => p.isArticle)
  const pinnedPost = posts.find(p => p.pinned)

  const postCount = posts.length
  const likedCount = posts.filter(p => p.liked).length
  const savedCount = posts.filter(p => p.saved).length
  const articleCount = articlePosts.length

  const displayPosts = tab === 'artigos' ? articlePosts : regularPosts

  return (
    <div>
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-dark-muted hover:text-dark-text transition-colors p-1 -ml-1 rounded-full hover:bg-dark-hover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-xl text-dark-text">{profile.name}</h1>
          <p className="text-dark-muted text-sm">{postCount} posts</p>
        </div>
      </div>

      {/* Cover image / gradient */}
      <div className="h-36 md:h-52 w-full overflow-hidden relative">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: profile.headerColor || 'linear-gradient(135deg, #8b5cf6, #1d9bf0)' }} />
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-black">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold text-3xl">
                {profile.name?.[0] || 'M'}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="absolute right-0 top-2 border border-dark-border text-dark-text px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-dark-hover transition-colors"
          >
            Editar perfil
          </button>
        </div>

        {/* Info */}
        <div className="mb-4">
          <h2 className="font-bold text-xl text-dark-text">{profile.name}</h2>
          <p className="text-dark-muted">{profile.handle}</p>
          {profile.bio && <p className="text-dark-text mt-2 text-[15px] leading-relaxed">{profile.bio}</p>}

          {/* Interests */}
          {profile.interests && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.interests.split(',').map(i => i.trim()).filter(Boolean).map(interest => (
                <span
                  key={interest}
                  className="pill-badge bg-dark-hover border border-dark-border text-dark-muted text-[11px]"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Join date */}
          {profile.createdAt && (
            <p className="text-dark-muted text-xs mt-3 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Jardim criado em {formatJoinDate(profile.createdAt)}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <div>
            <span className="font-bold text-dark-text">{postCount}</span>
            <span className="text-dark-muted ml-1">Posts</span>
          </div>
          <div>
            <span className="font-bold text-dark-text">{articleCount}</span>
            <span className="text-dark-muted ml-1">Artigos</span>
          </div>
          <div>
            <span className="font-bold text-dark-text">{profile.followerCount || 0}</span>
            <span className="text-dark-muted ml-1">Seguidores</span>
          </div>
          <div>
            <span className="font-bold text-dark-text">{profile.followingCount || 0}</span>
            <span className="text-dark-muted ml-1">Seguindo</span>
          </div>
          <div>
            <span className="font-bold text-dark-text">{likedCount}</span>
            <span className="text-dark-muted ml-1">Curtidos</span>
          </div>
          <div>
            <span className="font-bold text-dark-text">{savedCount}</span>
            <span className="text-dark-muted ml-1">Salvos</span>
          </div>
        </div>
      </div>

      <div className="border-t border-dark-border/60">
        <ComposeBox profile={profile} onPost={onPost} />
      </div>

      {/* Pinned post */}
      {pinnedPost && tab === 'posts' && (
        <div className="mx-4 mb-4 border border-yellow-500/30 rounded-2xl overflow-hidden bg-yellow-500/5">
          <div className="flex items-center gap-2 px-4 py-2 text-yellow-500/70 text-xs font-medium border-b border-yellow-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z"/>
            </svg>
            Post fixado
          </div>
          <PostCard post={pinnedPost} profile={profile} onLike={onLike} onSave={onSave} onPin={onPin} onDelete={onDelete} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-dark-border flex">
        {['posts', 'artigos'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`filter-tab flex-1 text-center capitalize ${tab === t ? 'active' : ''}`}
          >
            {t === 'artigos' ? `Artigos${articleCount > 0 ? ` (${articleCount})` : ''}` : 'Posts'}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {displayPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
          <p className="text-dark-text/50">Nenhum {tab === 'artigos' ? 'artigo' : 'post'} ainda</p>
          <p className="text-sm mt-1">
            {tab === 'artigos' ? 'Use o modo "Artigo" ao criar um post ✍️' : 'Comece a escrever na página inicial ✨'}
          </p>
        </div>
      ) : (
        displayPosts.map(post => (
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
  )
}
