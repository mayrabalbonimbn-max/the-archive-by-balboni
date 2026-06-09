import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import { useCollections } from '../hooks/useCollections'
import { useStoryProfiles } from '../hooks/useStories'
import { api } from '../utils/api'

function useStreak() {
  const [streak, setStreak] = useState(null)
  useEffect(() => {
    api.get('/archive/streak').then(setStreak).catch(() => {})
  }, [])
  return streak
}

const STATUS_COLORS = {
  ideia: '#6b7280', construindo: '#f59e0b', ativo: '#10b981',
  pausado: '#6b7280', concluído: '#8b5cf6',
}

function Stat({ n, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: onClick ? 'var(--accent)' : 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
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
  const storyProfiles = useStoryProfiles()
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState(null)
  const streak = useStreak()
  const [projects, setProjects] = useState([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ emoji: '🌱', title: '', description: '', status: 'ativo' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.get('/projects').then(setProjects).catch(() => {})
  }, [])

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
    ? Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000) + 1
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
        <Stat n={profile.followerCount ?? 0} label="Círculo" onClick={() => navigate('/friends')} />
        <Stat n={daysKept.toLocaleString('pt-BR')} label="Dias" />
      </div>

      {/* Streak row */}
      {streak && (streak.current > 0 || streak.best > 0) && (
        <div style={{
          display: 'flex', gap: 10, padding: '14px 20px 0',
        }}>
          {streak.current > 0 && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 13,
              border: '1px solid var(--line)', background: 'var(--surface-2)',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>🔥</span>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>
                  {streak.current} {streak.current === 1 ? 'dia' : 'dias'}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', marginTop: 2 }}>
                  SEQUÊNCIA
                </div>
              </div>
            </div>
          )}
          {streak.best > 0 && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 13,
              border: '1px solid var(--line)', background: 'var(--surface-2)',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>🏆</span>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>
                  {streak.best} {streak.best === 1 ? 'dia' : 'dias'}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', marginTop: 2 }}>
                  MELHOR
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile shortcuts — hidden on desktop (sidebar covers these) */}
      <div className="md:hidden" style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 10 }}>
          ATALHOS
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { to: '/messages',      icon: 'comment',  label: 'Mensagens' },
            { to: '/notifications', icon: 'bell',     label: 'Avisos' },
            { to: '/friends',       icon: 'people',   label: 'Pessoas' },
            { to: '/capsules',      icon: 'clock',    label: 'Cápsulas' },
            { to: '/settings',      icon: 'settings', label: 'Ajustes' },
          ].map(({ to, icon, label }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                flex: 1, padding: '10px 4px', borderRadius: 12,
                border: '1px solid var(--line)', background: 'var(--surface-2)',
                cursor: 'pointer', color: 'var(--ink-3)',
                fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 500,
              }}
            >
              <Icon name={icon} size={19} stroke={1.5} />
              <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{label}</span>
            </button>
          ))}
        </div>
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

      {/* Projects */}
      {(projects.length > 0 || true) && (
        <div style={{ marginTop: 28 }}>
          <SectionLabel
            action="+ Novo projeto"
            onAction={() => setShowNewProject(true)}
          >
            Projetos
          </SectionLabel>

          {projects.length === 0 ? (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                Registre seus projetos — do diário ao portfólio.
              </p>
            </div>
          ) : (
            <div style={{ padding: '8px 20px 4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {projects.filter(p => p.isFeatured).concat(projects.filter(p => !p.isFeatured)).slice(0, 6).map(proj => {
                const color = STATUS_COLORS[proj.status] || '#6b7280'
                return (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.slug}`, { state: { from: '/profile' } })}
                    style={{
                      padding: '14px', borderRadius: 14,
                      border: '1px solid var(--line)', background: 'var(--surface-2)',
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {proj.isFeatured && (
                      <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.1em' }}>★</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{proj.emoji}</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                        {proj.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {projects.length > 6 && (
            <div style={{ padding: '6px 20px 0' }}>
              <button
                onClick={() => navigate('/projects')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.05em' }}
              >
                Ver todos ({projects.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* New project modal */}
      {showNewProject && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', border: '1px solid var(--line)', width: '100%', maxWidth: 500, padding: '24px 24px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)' }}>Novo Projeto</span>
              <button onClick={() => setShowNewProject(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                value={newProject.emoji}
                onChange={e => setNewProject(p => ({ ...p, emoji: e.target.value }))}
                style={{ width: 56, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px', fontFamily: 'var(--sans)', fontSize: 20, color: 'var(--ink)' }}
              />
              <input
                value={newProject.title}
                onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                placeholder="Nome do projeto"
                style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}
              />
            </div>
            <textarea
              value={newProject.description}
              onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
              placeholder="Descrição breve (opcional)"
              rows={2}
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', resize: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <button
              onClick={async () => {
                if (!newProject.title.trim()) return
                setCreating(true)
                try {
                  const proj = await api.post('/projects', newProject)
                  setProjects(prev => [proj, ...prev])
                  setShowNewProject(false)
                  setNewProject({ emoji: '🌱', title: '', description: '', status: 'ativo' })
                } catch {}
                setCreating(false)
              }}
              disabled={creating || !newProject.title.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'var(--accent)', cursor: creating ? 'default' : 'pointer',
                fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: '#fff',
                opacity: creating || !newProject.title.trim() ? 0.5 : 1,
              }}
            >
              {creating ? 'Criando…' : 'Criar projeto'}
            </button>
          </div>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <SectionLabel>Fixados</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {pinned.map(p => (
              <EntryCard key={p.id} post={p} showAuthor={false} onLike={() => onLike?.(p.id)} onSave={() => onSave?.(p.id)} onDelete={() => onDelete?.(p.id)} onEdit={() => {}} />
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
                onDelete={() => onDelete?.(p.id)}
                onEdit={() => {}}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
