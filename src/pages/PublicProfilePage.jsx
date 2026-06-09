import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, publicProfileMediaBlob } from '../utils/api'
import { useStoryProfiles } from '../hooks/useStories'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'

function Stat({ n, label, onClick }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: onClick ? 'var(--accent)' : 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function PublicProfilePage({ profile: viewerProfile }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const storyProfiles = useStoryProfiles()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const mediaUrls = useRef({ avatar: null })

  async function load() {
    setLoading(true)
    try {
      const [profileData, postsData, summaryData] = await Promise.all([
        api.get(`/profiles/${id}`),
        api.get(`/profiles/${id}/posts`),
        api.get(`/profiles/${id}/summary`).catch(() => null),
      ])
      // hydrate avatar blob if needed
      const next = { ...profileData }
      if (profileData.hasAvatar && !profileData.avatar) {
        try {
          const blob = await publicProfileMediaBlob(profileData.id, 'avatar')
          if (mediaUrls.current.avatar) URL.revokeObjectURL(mediaUrls.current.avatar)
          mediaUrls.current.avatar = URL.createObjectURL(blob)
          next.avatar = mediaUrls.current.avatar
        } catch {}
      }
      setProfile(next)
      setPosts(postsData)
      setSummary(summaryData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => { Object.values(mediaUrls.current).forEach(u => u && URL.revokeObjectURL(u)) }
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

  async function startConversation() {
    try {
      const conv = await api.post('/conversations', { recipientId: profile.id })
      navigate(`/messages/${conv.id}`)
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ padding: '64px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)' }}>
        Perfil não encontrado.
      </div>
    )
  }

  const isSelf = profile.id === viewerProfile?.id
  const joinedLabel = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : ''
  const daysKept = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000))
    : 0
  const collections = summary?.collections ?? []

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="back" size={22} />
          </button>
        }
        right={
          <button style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more" size={19} />
          </button>
        }
      />

      {/* Identity */}
      <div style={{ padding: '20px 20px 0' }}>
        <Avatar name={profile.name} src={profile.avatar} size={76} ring={!storyProfiles.has(profile.id)} story={storyProfiles.has(profile.id)} />
        <h1 style={{ margin: '16px 0 3px', fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em' }}>
          {profile.name}
        </h1>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)' }}>{profile.handle}</div>
        {profile.title && (
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15.5, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 3 }}>
            {profile.title}
          </div>
        )}
        {profile.bio && (
          <p style={{ margin: '13px 0 0', fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 340 }}>
            {profile.bio}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          {profile.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="pin" size={13} />{profile.location}
            </span>
          )}
          {joinedLabel && <span>Desde {joinedLabel}</span>}
        </div>
      </div>

      {/* Action */}
      {!isSelf && (
        <div style={{ padding: '18px 20px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={toggleFollow}
            disabled={busy}
            style={{
              flex: 1, padding: 12, borderRadius: 13, cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
              border: `1px solid ${profile.isFollowing ? 'var(--line-strong)' : 'transparent'}`,
              background: profile.isFollowing ? 'transparent' : 'var(--accent)',
              color: profile.isFollowing ? 'var(--ink)' : '#fff',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {profile.isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
          <button onClick={startConversation} style={{ width: 48, borderRadius: 13, cursor: 'pointer', border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="comment" size={18} />
          </button>
        </div>
      )}

      {/* Stats card */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', padding: '18px 20px',
        margin: isSelf ? '18px 20px 0' : '0 20px',
        borderRadius: 16, border: '1px solid var(--line)', background: 'rgba(255,255,255,0.015)',
      }}>
        <Stat n={posts.length.toLocaleString('pt-BR')} label="Entradas" />
        <Stat n={collections.length || profile.collectionsCount || 0} label="Coleções" />
        <Stat n={profile.followerCount ?? 0} label="Círculo" onClick={() => navigate(`/friends?view=${profile.id}`)} />
        <Stat n={daysKept.toLocaleString('pt-BR')} label="Dias" />
      </div>

      {/* Collections strip */}
      {collections.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <SectionLabel>Coleções</SectionLabel>
          <div style={{ display: 'flex', gap: 11, overflowX: 'auto', padding: '12px 20px 6px', scrollbarWidth: 'none' }}>
            {collections.map((c, i) => {
              const tone = c.color ?? ['#7AA2F7', '#E86CB4', '#9ECE6A', '#E0AF68'][i % 4]
              return (
                <div key={c.id} style={{ flexShrink: 0, width: 140, cursor: 'pointer' }}>
                  <div style={{
                    height: 92, borderRadius: 13,
                    background: `linear-gradient(150deg, ${tone}55, #0c0c0e)`,
                    border: '1px solid var(--line-strong)',
                    display: 'flex', alignItems: 'flex-end', padding: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{c.emoji ?? '📁'}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>
                    {c.count ?? c.postCount ?? 0} entradas
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div style={{ marginTop: 26 }}>
        <SectionLabel>Recentes</SectionLabel>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {posts.length === 0 ? (
            <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              Nenhuma entrada pública ainda.
            </p>
          ) : (
            posts.map(p => <EntryCard key={p.id} post={p} showAuthor={false} />)
          )}
        </div>
      </div>
    </div>
  )
}
