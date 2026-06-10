import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import { useCollections } from '../hooks/useCollections'
import { api } from '../utils/api'

function useStreak() {
  const [streak, setStreak] = useState(null)
  useEffect(() => {
    api.get('/archive/streak').then(setStreak).catch(() => {})
  }, [])
  return streak
}

function useProfileStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api.get('/me/stats').then(setStats).catch(() => {})
  }, [])
  return stats
}

function fmtMonth(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function fmtDay(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function FichaRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--ink-2)', fontStyle: 'italic', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function NumRow({ n, label }) {
  if (!n) return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', lineHeight: 1, minWidth: '3ch', textAlign: 'right', letterSpacing: '-0.02em' }}>
        {Number(n).toLocaleString('pt-BR')}
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
        {label}
      </span>
    </div>
  )
}

function EditorialFicha({ profile, stats }) {
  const hasNumbers = stats && (stats.totalMemories > 0 || stats.daysWriting > 0 || stats.openedCapsules > 0 || stats.activeProjects > 0)
  const topTags = stats?.topTags?.slice(0, 3).map(t => `#${t.tag}`).join(' ')

  return (
    <div style={{
      margin: '0 20px',
      padding: '16px 18px',
      borderRadius: 14,
      border: '1px solid rgba(242,237,230,0.08)',
      background: 'rgba(242,237,230,0.015)',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-3)', marginBottom: 12, textTransform: 'uppercase' }}>
        Ficha
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: hasNumbers ? 14 : 0, paddingBottom: hasNumbers ? 14 : 0, borderBottom: hasNumbers ? '1px solid rgba(242,237,230,0.06)' : 'none' }}>
        <FichaRow label="Arquivando desde" value={fmtMonth(profile.createdAt)} />
        <FichaRow label="Primeira entrada" value={fmtDay(stats?.firstEntryAt)} />
        <FichaRow label="Tema recorrente" value={stats?.mostFrequentCategory?.name} />
        <FichaRow label="Projeto mais vivo" value={stats?.mostActiveProject ? `${stats.mostActiveProject.emoji || ''} ${stats.mostActiveProject.title}`.trim() : ''} />
        <FichaRow label="Tags principais" value={topTags} />
      </div>

      {hasNumbers && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NumRow n={stats.totalMemories} label="registros guardados" />
          <NumRow n={stats.daysWriting} label="dias escrevendo" />
          <NumRow n={stats.openedCapsules || undefined} label="cápsulas abertas" />
          <NumRow n={stats.activeProjects || undefined} label="projetos em curso" />
        </div>
      )}
    </div>
  )
}

const STATUS_COLORS = {
  ideia: '#6b7280', construindo: '#f59e0b', ativo: '#10b981',
  pausado: '#6b7280', concluído: '#8b5cf6',
}

function CopyLinkButton({ handle }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    const url = `${window.location.origin}/${handle.startsWith('@') ? handle : '@' + handle}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }
  return (
    <button
      onClick={copy}
      title={`Copiar link do perfil`}
      style={{
        padding: '12px 14px', borderRadius: 13, cursor: 'pointer',
        fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em',
        border: '1px solid var(--line-strong)', background: copied ? 'var(--accent-soft)' : 'transparent',
        color: copied ? 'var(--accent)' : 'var(--ink-3)',
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        transition: 'all 0.15s',
      }}
    >
      <Icon name={copied ? 'check' : 'link'} size={15} />
      {copied ? 'Copiado' : 'Link'}
    </button>
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
  const streak = useStreak()
  const stats = useProfileStats()
  const [projects, setProjects] = useState([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ emoji: '🌱', title: '', description: '', status: 'ativo', githubUrl: '', websiteUrl: '', tags: '', startedAt: '', completedAt: '' })
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
        {profile.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            <Icon name="pin" size={13} />{profile.location}
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ padding: '18px 20px 20px', display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate('/settings')}
          style={{
            flex: 1, padding: 12, borderRadius: 13, cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Icon name="edit" size={17} /> Editar
        </button>
        <CopyLinkButton handle={profile.handle} />
      </div>

      {/* Editorial ficha */}
      <EditorialFicha profile={profile} stats={stats} />

      {/* Streak — shown only when active */}
      {streak && streak.current > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 0' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🔥</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>
            {streak.current} dias seguidos
          </span>
          {streak.best > streak.current && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>
              · melhor: {streak.best}
            </span>
          )}
        </div>
      )}

      {/* Mobile shortcuts — hidden on desktop (sidebar covers these) */}
      <div className="md:hidden" style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 10 }}>
          SEU ESPAÇO
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { to: '/projects',    emoji: '🌱', label: 'Projetos' },
            { to: '/trajetoria',  emoji: '📖', label: 'Trajetória' },
            { to: '/messages',    emoji: '💬', label: 'Mensagens' },
            { to: '/capsules',    emoji: '📦', label: 'Cápsulas' },
            { to: '/settings',    emoji: '⚙️', label: 'Ajustes' },
          ].map(({ to, emoji, label }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 13,
                border: '1px solid var(--line)', background: 'var(--surface-2)',
                cursor: 'pointer', color: 'var(--ink-3)',
                fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
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
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            {/* Status */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Status</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['ideia','construindo','ativo','pausado','concluído'].map(s => (
                  <button key={s} onClick={() => setNewProject(p => ({ ...p, status: s }))} style={{
                    padding: '4px 12px', borderRadius: 20, border: `1px solid ${newProject.status === s ? 'var(--accent)' : 'var(--line)'}`,
                    background: newProject.status === s ? 'rgba(232,108,180,0.12)' : 'transparent',
                    color: newProject.status === s ? 'var(--accent)' : 'var(--ink-3)',
                    fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                  }}>{s}</button>
                ))}
              </div>
            </div>
            {/* GitHub + Website */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <input
                value={newProject.githubUrl}
                onChange={e => setNewProject(p => ({ ...p, githubUrl: e.target.value }))}
                placeholder="GitHub URL"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 10px', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)' }}
              />
              <input
                value={newProject.websiteUrl}
                onChange={e => setNewProject(p => ({ ...p, websiteUrl: e.target.value }))}
                placeholder="Website URL"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 10px', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)' }}
              />
            </div>
            {/* Tags */}
            <input
              value={newProject.tags}
              onChange={e => setNewProject(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags: fotografia, ios, swift"
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 10px', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)', marginBottom: 12 }}
            />
            {/* Start date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Início</div>
                <input
                  type="date"
                  value={newProject.startedAt}
                  onChange={e => setNewProject(p => ({ ...p, startedAt: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)' }}
                />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Conclusão</div>
                <input
                  type="date"
                  value={newProject.completedAt}
                  onChange={e => setNewProject(p => ({ ...p, completedAt: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)' }}
                />
              </div>
            </div>
            <button
              onClick={async () => {
                if (!newProject.title.trim()) return
                setCreating(true)
                try {
                  const payload = {
                    ...newProject,
                    tags: newProject.tags ? newProject.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                    startedAt: newProject.startedAt || undefined,
                    completedAt: newProject.completedAt || undefined,
                    githubUrl: newProject.githubUrl || undefined,
                    websiteUrl: newProject.websiteUrl || undefined,
                  }
                  const proj = await api.post('/projects', payload)
                  setProjects(prev => [proj, ...prev])
                  setShowNewProject(false)
                  setNewProject({ emoji: '🌱', title: '', description: '', status: 'ativo', githubUrl: '', websiteUrl: '', tags: '', startedAt: '', completedAt: '' })
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
