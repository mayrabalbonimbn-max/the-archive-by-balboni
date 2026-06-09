import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'

const STATUS_LABELS = {
  ideia: 'Ideias',
  construindo: 'Em construção',
  ativo: 'Ativos',
  pausado: 'Pausados',
  concluído: 'Concluídos',
}
const STATUS_ORDER = ['ativo', 'construindo', 'ideia', 'pausado', 'concluído']
const STATUS_DOT = {
  ideia: '#6b7280',
  construindo: '#f59e0b',
  ativo: '#10b981',
  pausado: '#6b7280',
  concluído: '#8b5cf6',
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function ProjectCard({ project, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 0', borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'var(--surface-2)', border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, lineHeight: 1,
      }}>
        {project.emoji || '🌱'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[project.status] || '#6b7280', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.title}
          </span>
        </div>

        {project.description && (
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(project.postCount > 0) && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
              {project.postCount} post{project.postCount !== 1 ? 's' : ''}
            </span>
          )}
          {(project.photoCount > 0) && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
              📷 {project.photoCount}
            </span>
          )}
          {(project.fileCount > 0) && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
              📎 {project.fileCount}
            </span>
          )}
          {project.startDate && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
              {fmtDate(project.startDate)}{project.endDate ? ` – ${fmtDate(project.endDate)}` : ''}
            </span>
          )}
        </div>
      </div>

      <Icon name="chevron" size={16} stroke={1.5} style={{ color: 'var(--ink-3)', flexShrink: 0, marginTop: 12 }} />
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null)

  useEffect(() => {
    api.get('/projects').then(setProjects).catch(() => setProjects([]))
  }, [])

  const grouped = projects
    ? STATUS_ORDER.reduce((acc, status) => {
        const items = projects.filter(p => p.status === status)
        if (items.length > 0) acc.push({ status, label: STATUS_LABELS[status], items })
        return acc
      }, [])
    : []

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

      <div style={{ padding: '24px 24px 8px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>
          PROJETOS
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1.05, color: 'var(--ink)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          O que você está construindo.
        </h1>
        {total > 0 && (
          <p style={{ margin: '10px 0 0', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
            {total} {total === 1 ? 'projeto' : 'projetos'}
          </p>
        )}
      </div>

      <div style={{ padding: '0 24px 80px', marginTop: 16, borderTop: '1px solid var(--line)' }}>
        {!projects ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <p style={{ padding: '40px 0', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>
            Nenhum projeto ainda. Crie um no seu Perfil.
          </p>
        ) : (
          grouped.map(({ status, label, items }) => (
            <div key={status} style={{ marginTop: 28 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[status] }} />
                {label.toUpperCase()} · {items.length}
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
