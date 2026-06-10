import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, publicProfileMediaBlob } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import VerifiedBadge from '../components/ui/VerifiedBadge'

function Stat({ n, label, onClick }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: onClick ? 'var(--accent)' : 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function hasSection(profile, id) {
  const sections = profile?.publicSections
  if (!Array.isArray(sections) || sections.length === 0) return true
  return sections.includes(id)
}

export default function PublicProfilePage({ profile: viewerProfile }) {
  const { id, username } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dmBusy, setDmBusy] = useState(false)
  const [dmError, setDmError] = useState('')
  const mediaUrls = useRef({ avatar: null })

  async function load() {
    setLoading(true)
    try {
      let profileData
      let profileId

      if (username) {
        // Route: /@:username — resolve by handle
        const handle = username.replace(/^@/, '')
        profileData = await api.get(`/profiles/username/${handle}`)
        profileId = profileData.id
      } else {
        // Route: /profiles/:id — resolve by UUID
        profileId = id
        profileData = await api.get(`/profiles/${profileId}`)
      }

      const [postsData, summaryData] = await Promise.all([
        api.get(`/profiles/${profileId}/posts`),
        api.get(`/profiles/${profileId}/summary`).catch(() => null),
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
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => { Object.values(mediaUrls.current).forEach(u => u && URL.revokeObjectURL(u)) }
  }, [id, username])

  useEffect(() => {
    if (profile?.handle) document.title = `The Archive — @${profile.handle}`
    return () => { document.title = 'The Archive' }
  }, [profile?.handle])

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
    if (dmBusy) return
    setDmBusy(true)
    setDmError('')
    try {
      const conv = await api.post('/conversations', { recipientId: profile.id })
      navigate(`/messages/${conv.id}`)
    } catch (err) {
      setDmError(err.message || 'Não foi possível abrir a conversa')
    } finally {
      setDmBusy(false)
    }
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
  const publicProjects = (summary?.projects ?? []).filter(p => p.status !== 'arquivado')
  const recentArticles = summary?.recentArticles ?? []
  const recentPhotos = summary?.recentPhotos ?? []
  const tags = summary?.tags ?? []

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

      {/* Public archive hero */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          border: '1px solid var(--line)',
          borderRadius: 18,
          background: 'linear-gradient(180deg, rgba(232,108,180,0.08), rgba(255,255,255,0.015))',
          padding: 18,
        }}>
        <Avatar name={profile.name} src={profile.avatar} size={76} />
        <h1 style={{ margin: '16px 0 3px', fontFamily: 'var(--serif)', fontSize: 30, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
          {profile.name}
          {profile.verified && <VerifiedBadge size={22} />}
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
        {profile.publicIntro && (
          <p style={{ margin: '14px 0 0', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.65, color: 'var(--ink)' }}>
            {profile.publicIntro}
          </p>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
            {tags.slice(0, 6).map(t => (
              <span key={t.tag} style={{ padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(232,108,180,0.25)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 10.5 }}>
                #{t.tag}
              </span>
            ))}
          </div>
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
      </div>

      {/* Action */}
      {isSelf ? (
        <div style={{ padding: '18px 20px 20px' }}>
          <button
            onClick={() => navigate('/settings')}
            style={{ width: '100%', padding: 12, borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)' }}
          >
            Editar vitrine pública
          </button>
        </div>
      ) : (
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
          <button
            onClick={startConversation}
            disabled={dmBusy}
            style={{ width: 48, borderRadius: 13, cursor: dmBusy ? 'default' : 'pointer', border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: dmBusy ? 0.5 : 1, transition: 'opacity 0.15s' }}
          >
            {dmBusy
              ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--ink-3)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
              : <Icon name="comment" size={18} />
            }
          </button>
        </div>
      )}

      {dmError && (
        <div style={{ padding: '0 20px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: '#f7768e' }}>
          {dmError}
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
      {hasSection(profile, 'collections') && collections.length > 0 && (
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

      {/* Projects strip */}
      {hasSection(profile, 'projects') && publicProjects.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <SectionLabel>Construindo</SectionLabel>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '10px 20px 6px', scrollbarWidth: 'none' }}>
            {publicProjects.map(proj => {
              const statusColor = proj.status === 'ativo' || proj.status === 'construindo' ? 'var(--accent)' : 'var(--ink-3)'
              return (
                <div
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.slug}`)}
                  style={{ flexShrink: 0, width: 150, cursor: 'pointer', border: '1px solid var(--line)', borderRadius: 12, padding: '13px 14px', background: 'rgba(255,255,255,0.02)' }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{proj.emoji || '🌱'}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {proj.name}
                  </div>
                  {proj.description && (
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {proj.description}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>
                    {proj.status || 'ativo'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {hasSection(profile, 'photos') && recentPhotos.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <SectionLabel>Fotografias</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '10px 20px 6px' }}>
            {recentPhotos.slice(0, 6).map(photo => (
              <button
                key={photo.id}
                onClick={() => navigate(`/posts/${photo.postId}`)}
                style={{ aspectRatio: '1 / 1', borderRadius: 11, border: '1px solid var(--line)', background: 'linear-gradient(135deg, rgba(232,108,180,0.18), rgba(255,255,255,0.04))', color: 'var(--ink-2)', cursor: 'pointer', overflow: 'hidden', padding: 8, textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, display: 'flex', alignItems: 'flex-end' }}
              >
                {photo.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSection(profile, 'articles') && recentArticles.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <SectionLabel>Ensaios</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {recentArticles.map(p => <EntryCard key={p.id} post={p} showAuthor={false} />)}
          </div>
        </div>
      )}

      {hasSection(profile, 'trajectory') && (
        <div style={{ margin: '26px 20px 0', border: '1px solid var(--line)', borderRadius: 15, padding: 16, background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', fontStyle: 'italic', marginBottom: 6 }}>
            Trajetória arquivada
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            {profile.name.split(' ')[0]} guarda projetos, registros e marcos há {daysKept.toLocaleString('pt-BR')} dias.
          </div>
        </div>
      )}

      {/* Recent entries */}
      {hasSection(profile, 'entries') && <div style={{ marginTop: 26 }}>
        <SectionLabel>Entradas recentes</SectionLabel>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {posts.length === 0 ? (
            <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              Nenhuma entrada pública ainda.
            </p>
          ) : (
            posts.map(p => <EntryCard key={p.id} post={p} showAuthor={false} />)
          )}
        </div>
      </div>}
    </div>
  )
}
