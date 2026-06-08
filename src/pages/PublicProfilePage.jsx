import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, publicProfileMediaBlob } from '../utils/api'
import PostCard from '../components/PostCard'
import ArchiveMiniCard from '../components/ArchiveMiniCard'

function formatJoinDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function PublicProfilePage({ profile: viewerProfile, onLike, onSave, onPin, onDelete }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const mediaUrls = useRef({ avatar: null, cover: null })

  async function hydrateMedia(raw) {
    const next = { ...raw }
    await Promise.all([
      raw.hasAvatar && !raw.avatar
        ? publicProfileMediaBlob(raw.id, 'avatar')
            .then(blob => {
              if (mediaUrls.current.avatar) URL.revokeObjectURL(mediaUrls.current.avatar)
              mediaUrls.current.avatar = URL.createObjectURL(blob)
              next.avatar = mediaUrls.current.avatar
            })
            .catch(() => {})
        : null,
      raw.hasCoverImage && !raw.coverImage
        ? publicProfileMediaBlob(raw.id, 'cover')
            .then(blob => {
              if (mediaUrls.current.cover) URL.revokeObjectURL(mediaUrls.current.cover)
              mediaUrls.current.cover = URL.createObjectURL(blob)
              next.coverImage = mediaUrls.current.cover
            })
            .catch(() => {})
        : null,
    ])
    return next
  }

  async function load() {
    setLoading(true)
    try {
      const [profileData, postsData, summaryData] = await Promise.all([
        api.get(`/profiles/${id}`),
        api.get(`/profiles/${id}/posts`),
        api.get(`/profiles/${id}/summary`),
      ])
      const hydrated = await hydrateMedia(profileData)
      setProfile(hydrated)
      setPosts(postsData)
      setSummary(summaryData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => {
      Object.values(mediaUrls.current).forEach(url => url && URL.revokeObjectURL(url))
    }
  }, [id])

  async function toggleFollow() {
    if (!profile || busy) return
    setBusy(true)
    try {
      if (profile.isFollowing) await api.delete(`/follows/${profile.id}`)
      else await api.post(`/follows/${profile.id}`, {})
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-brand-rose border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return <div className="py-16 text-center text-dark-muted">Perfil não encontrado.</div>
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-dark-muted hover:text-dark-text transition-colors p-1 -ml-1 rounded-full hover:bg-dark-hover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-xl text-dark-text">{profile.name}</h1>
          <p className="text-dark-muted text-sm">{posts.length} posts visíveis</p>
        </div>
      </div>

      <div className="h-36 md:h-52 w-full overflow-hidden relative">
        {profile.coverImage ? (
          <img
            src={profile.coverImage}
            alt="capa"
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling?.removeAttribute('style') }}
          />
        ) : null}
        <div
          className="w-full h-full"
          style={{ background: profile.headerColor || 'linear-gradient(135deg, #8b5cf6, #1d9bf0)', display: profile.coverImage ? 'none' : undefined }}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="relative -mt-12 mb-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-black">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling?.removeAttribute('style') }}
              />
            ) : null}
            <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold text-3xl" style={{ display: profile.avatar ? 'none' : undefined }}>
              {profile.name?.[0] || '@'}
            </div>
          </div>
          {profile.id !== viewerProfile.id && (
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`absolute right-0 top-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${profile.isFollowing ? 'border border-dark-border text-dark-text hover:bg-dark-hover' : 'bg-brand-rose text-white hover:bg-brand-rosehover'}`}
            >
              {profile.isFollowing ? 'Deixar de seguir' : 'Seguir'}
            </button>
          )}
        </div>

        <h2 className="font-bold text-xl text-dark-text">{profile.name}</h2>
        <p className="text-dark-muted">{profile.handle}</p>
        {profile.bio && <p className="text-dark-text mt-2 text-[15px] leading-relaxed">{profile.bio}</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mt-4">
          <div><span className="font-bold text-dark-text">{profile.followerCount || 0}</span><span className="text-dark-muted ml-1">Seguidores</span></div>
          <div><span className="font-bold text-dark-text">{profile.followingCount || 0}</span><span className="text-dark-muted ml-1">Seguindo</span></div>
          <div><span className="font-bold text-dark-text">{profile.friendCount || 0}</span><span className="text-dark-muted ml-1">Amigos</span></div>
        </div>
        {profile.createdAt && <p className="text-dark-muted text-xs mt-3">No arquivo desde {formatJoinDate(profile.createdAt)}</p>}
      </div>

      {summary && (
        <div className="border-t border-dark-border/60 px-4 py-5 space-y-5">
          {(summary.collections?.length > 0 || summary.tags?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.collections?.length > 0 && (
                <section>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-2">Coleções frequentes</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.collections.map(collection => (
                      <button key={collection.id} onClick={() => navigate(`/collections/${collection.id}`)} className="rounded-full border border-dark-border bg-dark-card px-3 py-1 text-xs text-dark-text hover:bg-dark-hover">
                        {collection.name} <span className="text-dark-muted">{collection.count}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {summary.tags?.length > 0 && (
                <section>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-2">Tags mais usadas</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.tags.map(item => (
                      <button key={item.tag} onClick={() => navigate(`/tags/${item.tag}`)} className="rounded-full border border-dark-border bg-dark-card px-3 py-1 text-xs text-dark-text hover:bg-dark-hover">
                        #{item.tag} <span className="text-dark-muted">{item.count}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {summary.recentPhotos?.length > 0 && (
            <section>
              <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-2">Fotografias recentes</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {summary.recentPhotos.map(photo => (
                  <img key={photo.id} src={`/api/attachments/${photo.id}/view`} alt={photo.title || photo.originalName} className="aspect-square w-full rounded-md object-cover border border-dark-border bg-dark-card" />
                ))}
              </div>
            </section>
          )}

          {(summary.recentArticles?.length > 0 || summary.recentActivity?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {summary.recentArticles?.length > 0 && (
                <section>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-2">Artigos recentes</p>
                  <div className="space-y-2">{summary.recentArticles.map(item => <ArchiveMiniCard key={item.id} item={item} />)}</div>
                </section>
              )}
              {summary.recentActivity?.length > 0 && (
                <section>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-dark-muted font-bold mb-2">Atividade recente</p>
                  <div className="space-y-2">{summary.recentActivity.map(item => <ArchiveMiniCard key={item.id} item={item} />)}</div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-dark-border/60">
        {posts.length === 0 ? (
          <div className="py-16 text-center text-dark-muted text-sm">Nenhum post visível para você.</div>
        ) : posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            profile={viewerProfile}
            onLike={onLike}
            onSave={onSave}
            onPin={onPin}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
