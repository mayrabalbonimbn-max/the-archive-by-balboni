import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_GROUPS = [
  { status: 'ativo',      emoji: '⚙️', label: 'Em andamento' },
  { status: 'construindo',emoji: '⚙️', label: 'Em construção' },
  { status: 'ideia',      emoji: '🌱', label: 'Ideias' },
  { status: 'pausado',    emoji: '⏸️', label: 'Pausados' },
  { status: 'concluído',  emoji: '✅', label: 'Concluídos' },
]
const STATUS_DOT = {
  ideia: '#6b7280', construindo: '#f59e0b', ativo: '#10b981',
  pausado: '#6b7280', concluído: '#8b5cf6',
}
const FILTERS = [
  { id: 'all',         label: 'Todos' },
  { id: 'active',      label: 'Ativos' },
  { id: 'completed',   label: 'Concluídos' },
  { id: 'fotografia',  label: 'Fotografia' },
  { id: 'programacao', label: 'Programação' },
]

const PHOTO_TAGS = new Set(['fotografia', 'foto', 'photos', 'photography'])
const CODE_TAGS  = new Set(['programação', 'programacao', 'código', 'codigo', 'dev', 'software', 'web', 'app'])

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function fmtAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`
  if (days < 365) return `${Math.floor(days / 30)}m atrás`
  return `${Math.floor(days / 365)}a atrás`
}

function applyFilter(projects, filter) {
  switch (filter) {
    case 'active':      return projects.filter(p => p.status === 'ativo' || p.status === 'construindo')
    case 'completed':   return projects.filter(p => p.status === 'concluído')
    case 'fotografia':  return projects.filter(p => (p.tags || []).some(t => PHOTO_TAGS.has(t.toLowerCase())))
    case 'programacao': return projects.filter(p => (p.tags || []).some(t => CODE_TAGS.has(t.toLowerCase())))
    default:            return projects
  }
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }) {
  const accent = project.color || 'var(--accent)'

  return (
    <div
      onClick={onClick}
      style={{
        padding: '18px 0', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start',
      }}
    >
      {/* Emoji icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: 'var(--surface-2)', border: `1px solid var(--line)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, lineHeight: 1,
      }}>
        {project.emoji || '🌱'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[project.status] || '#6b7280', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, fontWeight: 400, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {project.title}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p style={{ margin: '0 0 7px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
            {project.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {project.startedAt && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
              {fmtDate(project.startedAt)}{project.completedAt ? ` → ${fmtDate(project.completedAt)}` : ''}
            </span>
          )}
          {project.postCount > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
              {project.postCount} post{project.postCount !== 1 ? 's' : ''}
            </span>
          )}
          {project.photoCount > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>📷 {project.photoCount}</span>
          )}
          {project.fileCount > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>📎 {project.fileCount}</span>
          )}
          {project.lastActivityAt && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 'auto' }}>
              {fmtAgo(project.lastActivityAt)}
            </span>
          )}
        </div>

        {/* Links + Tags */}
        {(project.githubUrl || project.websiteUrl || project.tags?.length > 0) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
            {project.githubUrl && (
              <span onClick={e => { e.stopPropagation(); window.open(project.githubUrl, '_blank', 'noopener') }}
                style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)', color: 'var(--ink-3)', cursor: 'pointer' }}>
                GitHub
              </span>
            )}
            {project.websiteUrl && (
              <span onClick={e => { e.stopPropagation(); window.open(project.websiteUrl, '_blank', 'noopener') }}
                style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--line)', color: 'var(--ink-3)', cursor: 'pointer' }}>
                Site
              </span>
            )}
            {(project.tags || []).map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Icon name="chevron" size={16} stroke={1.5} style={{ color: 'var(--ink-3)', flexShrink: 0, marginTop: 14 }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/projects').then(setProjects).catch(() => setProjects([]))
  }, [])

  const visible = projects ? applyFilter(projects, filter) : []

  const grouped = STATUS_GROUPS.reduce((acc, g) => {
    const items = visible.filter(p => p.status === g.status)
    if (items.length > 0) acc.push({ ...g, items })
    return acc
  }, [])

  const total = projects?.length ?? 0

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)' }}>
      <AppBar
        left={
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="back" size={22} />
          </button>
        }
      />

      {/* Header */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 12 }}>
          PROJETOS
        </div>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1.05, color: 'var(--ink)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          O que você está construindo.
        </h1>
        {total > 0 && (
          <p style={{ margin: '6px 0 0', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            {total} {total === 1 ? 'projeto' : 'projetos'}
          </p>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, padding: '16px 24px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${filter === f.id ? 'var(--accent)' : 'var(--line)'}`,
              background: filter === f.id ? 'rgba(232,108,180,0.1)' : 'transparent',
              cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5,
              color: filter === f.id ? 'var(--accent)' : 'var(--ink-3)',
              whiteSpace: 'nowrap', transition: 'all .15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 24px 80px', borderTop: '1px solid var(--line)' }}>
        {!projects ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <p style={{ padding: '40px 0', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            {filter === 'all' ? 'Nenhum projeto ainda. Crie um no seu Perfil.' : 'Nenhum projeto neste filtro.'}
          </p>
        ) : (
          grouped.map(({ status, emoji, label, items }) => (
            <div key={status} style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                <span style={{ fontSize: 13 }}>{emoji}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
                  {label.toUpperCase()} · {items.length}
                </span>
              </div>
              {items.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/projects/${p.slug || p.id}`, { state: { from: '/projects' } })}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
