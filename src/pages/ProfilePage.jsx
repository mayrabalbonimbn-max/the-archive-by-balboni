import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import { useCollections } from '../hooks/useCollections'

function Stat({ n, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function ProfilePage({ profile, posts, onLike, onSave, onDelete }) {
  const navigate = useNavigate()
  const { collections } = useCollections()

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts]
  )

  const daysKept = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000))
    : 0

  const joinedLabel = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>Você</span>
        }
        right={
          <button
            onClick={() => navigate('/settings')}
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="more" size={19} />
          </button>
        }
      />

      {/* Identity */}
      <div style={{ padding: '20px 20px 0' }}>
        <Avatar name={profile.name} src={profile.avatar} size={76} ring />
        <h1 style={{ margin: '16px 0 3px', fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em' }}>
          {profile.name}
        </h1>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)' }}>@{profile.handle}</div>
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
      <div style={{ padding: '18px 20px 20px' }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '100%', padding: 12, borderRadius: 13, cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Icon name="edit" size={17} /> Editar seu arquivo
        </button>
      </div>

      {/* Stats card */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', padding: '18px 20px',
        margin: '0 20px', borderRadius: 16,
        border: '1px solid var(--line)', background: 'rgba(255,255,255,0.015)',
      }}>
        <Stat n={posts.length.toLocaleString('pt-BR')} label="Entradas" />
        <Stat n={collections.length} label="Coleções" />
        <Stat n={profile.followerCount ?? 0} label="Círculo" />
        <Stat n={daysKept.toLocaleString('pt-BR')} label="Dias" />
      </div>

      {/* Collections strip */}
      {collections.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <SectionLabel action="Ver tudo" onAction={() => navigate('/archive?s=collections')}>
            Suas coleções
          </SectionLabel>
          <div style={{ display: 'flex', gap: 11, overflowX: 'auto', padding: '12px 20px 6px', scrollbarWidth: 'none' }}>
            {collections.map(c => {
              const tone = c.color ?? '#7AA2F7'
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/collections/${c.id}`)}
                  style={{ flexShrink: 0, width: 140, cursor: 'pointer' }}
                >
                  <div style={{
                    height: 92, borderRadius: 13,
                    background: `linear-gradient(150deg, ${tone}55, #0c0c0e)`,
                    border: '1px solid var(--line-strong)',
                    display: 'flex', alignItems: 'flex-end', padding: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>
                    {c.postCount ?? 0} entradas
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
          {sorted.length === 0 ? (
            <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              Nenhuma entrada ainda.
            </p>
          ) : (
            sorted.map(p => (
              <EntryCard
                key={p.id}
                post={p}
                showAuthor={false}
                onLike={() => onLike?.(p.id)}
                onSave={() => onSave?.(p.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
