import { useMemo, useState } from 'react'
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

const TYPE_FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'article', label: 'Artigos' },
  { id: 'code', label: 'Código' },
  { id: 'diary', label: 'Diário' },
  { id: 'media', label: 'Fotos' },
]

export default function ProfilePage({ profile, posts, onLike, onSave, onDelete }) {
  const navigate = useNavigate()
  const { collections } = useCollections()
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState(null)

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts]
  )

  const pinned = useMemo(() => sorted.filter(p => p.pinned).sort((a, b) => (a.pinOrder || 0) - (b.pinOrder || 0)), [sorted])

  const allTags = useMemo(() => {
    const map = new Map()
    posts.forEach(p => p.tags?.forEach(tag => map.set(tag, (map.get(tag) || 0) + 1)))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
  }, [posts])

  const filtered = useMemo(() => {
    let list = sorted
    if (typeFilter === 'article') list = list.filter(p => p.isArticle)
    else if (typeFilter === 'code') list = list.filter(p => p.codeBlock)
    else if (typeFilter === 'diary') list = list.filter(p => p.isDiary)
    else if (typeFilter === 'media') list = list.filter(p => p.attachments?.some(a => a.fileType === 'image'))
    if (tagFilter) list = list.filter(p => p.tags?.includes(tagFilter))
    return list
  }, [sorted, typeFilter, tagFilter])

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

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <SectionLabel>Fixados</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {pinned.map(p => (
              <EntryCard key={p.id} post={p} showAuthor={false} onLike={() => onLike?.(p.id)} onSave={() => onSave?.(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ marginTop: 26 }}>
        <div style={{ padding: '0 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Type filters */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TYPE_FILTERS.map(f => (
              <button key={f.id} onClick={() => setTypeFilter(f.id)} style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${typeFilter === f.id ? 'var(--accent)' : 'var(--line-strong)'}`,
                background: typeFilter === f.id ? 'rgba(232,108,180,0.12)' : 'transparent',
                color: typeFilter === f.id ? 'var(--accent)' : 'var(--ink-3)',
                fontFamily: 'var(--sans)', fontSize: 12.5, cursor: 'pointer', transition: 'all .15s',
              }}>{f.label}</button>
            ))}
          </div>
          {/* Tag filters */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {tagFilter && (
                <button onClick={() => setTagFilter(null)} style={{
                  flexShrink: 0, padding: '4px 10px', borderRadius: 20,
                  border: '1px solid var(--accent)', background: 'rgba(232,108,180,0.12)',
                  color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                }}>× limpar</button>
              )}
              {allTags.map(tag => (
                <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} style={{
                  flexShrink: 0, padding: '4px 10px', borderRadius: 20,
                  border: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'rgba(232,108,180,0.2)'}`,
                  background: tagFilter === tag ? 'rgba(232,108,180,0.12)' : 'transparent',
                  color: tagFilter === tag ? 'var(--accent)' : 'var(--ink-3)',
                  fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer', transition: 'all .15s',
                }}>#{tag}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--line)' }}>
          {filtered.length === 0 ? (
            <p style={{ padding: '32px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
              {posts.length === 0 ? 'Nenhuma entrada ainda.' : 'Nenhuma entrada para este filtro.'}
            </p>
          ) : (
            filtered.map(p => (
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
