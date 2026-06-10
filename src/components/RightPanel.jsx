import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import Icon from './ui/Icon'

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
}

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function isActive(p) {
  return ['ativo', 'construindo', 'em-andamento'].includes(p.status)
}

// ── Row component ─────────────────────────────────────────────────────────────

function Row({ icon, label, value, sub, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        width: '100%', background: 'none', border: 'none',
        padding: '10px 0', cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left', borderBottom: '1px solid var(--line)',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = '0.75' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      <span style={{ fontSize: 17, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 3px' }}>
          {label}
        </p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: accent ? 'var(--accent)' : 'var(--ink)', fontWeight: accent ? 600 : 400, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </p>
        {sub && (
          <p style={{ fontFamily: 'var(--serif)', fontSize: 12.5, fontStyle: 'italic', color: 'var(--ink-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  )
}

// ── Today rail ────────────────────────────────────────────────────────────────

function TodayRail({ profile }) {
  const navigate = useNavigate()
  const [capsules,  setCapsules]  = useState(null)
  const [streak,    setStreak]    = useState(null)
  const [projects,  setProjects]  = useState(null)
  const [memories,  setMemories]  = useState(null)
  const [notices,   setNotices]   = useState([])

  useEffect(() => {
    api.get('/capsules').then(setCapsules).catch(() => setCapsules([]))
    api.get('/archive/streak').then(setStreak).catch(() => setStreak({}))
    api.get('/projects').then(setProjects).catch(() => setProjects([]))
    api.get('/archive/memories').then(d => setMemories(d ?? [])).catch(() => setMemories([]))
    api.get('/notifications').then(d => setNotices((d ?? []).slice(0, 3))).catch(() => {})
  }, [])

  const now = Date.now()

  const nextCapsule = capsules
    ? [...capsules].filter(c => c.status === 'locked').sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt))[0]
    : null
  const unlockedCapsule = capsules
    ? [...capsules].find(c => c.status === 'ready')
    : null

  const current    = streak?.current ?? 0
  const totalDays  = streak?.totalActiveDays ?? 0

  const activeProject = projects
    ? [...projects].filter(isActive).sort((a, b) => new Date(b.lastActivityAt ?? 0) - new Date(a.lastActivityAt ?? 0))[0]
    : null

  const latestMemory = memories
    ? [...memories].sort((a, b) => {
        const ya = parseInt(a.label?.match(/\d+/)?.[0] ?? '0')
        const yb = parseInt(b.label?.match(/\d+/)?.[0] ?? '0')
        return yb - ya
      })[0]
    : null

  return (
    <div>
      {/* Header */}
      <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 4px' }}>
        Próximos momentos
      </p>

      <div style={{ borderTop: '1px solid var(--line)', marginBottom: 24 }}>
        {/* Cápsula aberta */}
        {unlockedCapsule && (
          <Row
            icon="✦"
            label="Cápsula pronta"
            value="Uma mensagem aguarda você"
            sub="Toque para iniciar a abertura"
            accent
            onClick={() => navigate(`/capsules/${unlockedCapsule.id}`)}
          />
        )}

        {/* Próxima cápsula */}
        {nextCapsule && (() => {
          const days = daysUntil(nextCapsule.unlockAt)
          const urgent = days <= 7
          return (
            <Row
              icon="🔒"
              label="Próxima cápsula"
              value={days === 0 ? 'Abre hoje' : days === 1 ? 'Abre amanhã' : `Abre em ${days} dias`}
              sub={`"${(nextCapsule.articleTitle || nextCapsule.content || '').slice(0, 50)}"`}
              accent={urgent}
              onClick={() => navigate('/capsules')}
            />
          )
        })()}

        {/* Sem cápsulas */}
        {capsules !== null && !nextCapsule && !unlockedCapsule && (
          <Row
            icon="⏳"
            label="Cápsula"
            value="Nenhuma cápsula ainda"
            sub="Escreva uma mensagem para o futuro"
            onClick={() => window.dispatchEvent(new CustomEvent('open-compose'))}
          />
        )}

        {/* Sequência */}
        <Row
          icon="🔥"
          label="Sequência"
          value={current > 0
            ? `${current} ${current === 1 ? 'dia seguido' : 'dias seguidos'}`
            : 'Sem sequência ativa'}
          sub={totalDays > 0 ? `${totalDays} dias no arquivo no total` : undefined}
          accent={current >= 7}
          onClick={() => navigate('/trajetoria')}
        />

        {/* Projeto mais ativo */}
        {activeProject ? (
          <Row
            icon={activeProject.emoji ?? '🌱'}
            label="Projeto em movimento"
            value={activeProject.title}
            sub={daysSince(activeProject.lastActivityAt) === 0
              ? 'Atividade hoje'
              : `Última atividade há ${daysSince(activeProject.lastActivityAt)}d`}
            onClick={() => navigate(`/projects/${activeProject.slug || activeProject.id}`)}
          />
        ) : projects !== null && (
          <Row
            icon="🌱"
            label="Projetos"
            value="Nenhum projeto ativo"
            onClick={() => navigate('/projects')}
          />
        )}

        {/* Memória recente */}
        {latestMemory ? (
          <Row
            icon="💭"
            label={`Memória · ${latestMemory.label?.toLowerCase() ?? ''}`}
            value={latestMemory.articleTitle || '(sem título)'}
            sub={`"${(latestMemory.content || '').replace(/\n/g, ' ').trim().slice(0, 60)}"`}
            onClick={() => latestMemory.articleTitle
              ? navigate(`/articles/${latestMemory.id}`)
              : navigate(`/posts/${latestMemory.id}`)
            }
          />
        ) : memories !== null && memories.length === 0 && (
          <Row
            icon="💭"
            label="Memória"
            value="Nenhuma memória para hoje"
            sub="Volte quando tiver um ano de arquivo"
          />
        )}
      </div>

      {/* Últimos avisos */}
      {notices.length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 4px' }}>
            Últimos avisos
          </p>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {notices.map(n => {
              const isMemory = n.type === 'memory'
              const text = n.type === 'react' || n.type === 'like' ? 'apreciou sua entrada'
                : n.type === 'comment' ? 'deixou uma nota'
                : n.type === 'collect' ? 'guardou sua entrada'
                : n.type === 'follow' ? 'entrou no seu círculo'
                : n.type === 'mention' ? 'te mencionou'
                : 'Uma memória ressurgiu'

              return (
                <button
                  key={n.id}
                  onClick={() => navigate('/notifications')}
                  style={{ display: 'flex', gap: 10, width: '100%', background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--line)', alignItems: 'center' }}
                >
                  {isMemory ? (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'rgba(232,108,180,0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="sparkle" size={13} />
                    </div>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#c084fc,#E86CB4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#fff' }}>
                        {(n.actor?.name ?? '?')[0]}
                      </span>
                    </div>
                  )}
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink-3)', flex: 1 }}>
                    {!isMemory && <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{(n.actor?.name ?? '').split(' ')[0]} </span>}
                    {text}
                  </span>
                </button>
              )
            })}
          </div>
          <button
            onClick={() => navigate('/notifications')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', padding: '10px 0', letterSpacing: '0.06em' }}
          >
            Ver todos os avisos →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Archive rail (unchanged) ──────────────────────────────────────────────────

function ArchiveRail({ profile }) {
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [postsCount,  setPostsCount]  = useState(null)

  useEffect(() => {
    api.get('/collections').then(setCollections).catch(() => {})
    api.get('/posts').then(posts => setPostsCount(posts?.length ?? 0)).catch(() => {})
  }, [])

  const daysKept = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000))
    : null

  return (
    <div>
      <div style={{ marginBottom: 26 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 14px' }}>
          Sobre este arquivo
        </p>
        {profile.bio && (
          <p style={{ margin: '0 0 16px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            {profile.bio}
          </p>
        )}
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            [postsCount ?? '…', 'Entradas'],
            [collections.length, 'Coleções'],
            [daysKept ? daysKept.toLocaleString('pt-BR') : '…', 'Dias'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: 0 }}>Coleções</p>
          <button onClick={() => navigate('/archive?s=collections')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Ver todas</button>
        </div>
        {collections.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Nenhuma coleção ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {collections.slice(0, 5).map(c => (
              <button
                key={c.id}
                onClick={() => navigate('/archive?s=collections')}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 4px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: c.color ? `linear-gradient(150deg, ${c.color}, #0c0c0e)` : 'linear-gradient(150deg, #c084fc, #0c0c0e)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  {c.emoji || ''}
                </div>
                <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', flexShrink: 0 }}>{c.count ?? ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RightPanel({ profile }) {
  const location = useLocation()
  const params   = new URLSearchParams(location.search)

  const isToday   = location.pathname === '/'
  const isArchive = location.pathname === '/archive'

  if (!isToday && !isArchive) return null

  return (
    <aside
      className="hidden lg:block shrink-0 sticky top-0 h-screen overflow-y-auto scrollbar-hide"
      style={{ width: 300, padding: '48px 8px 48px 24px' }}
    >
      {isToday   && <TodayRail profile={profile} />}
      {isArchive && <ArchiveRail profile={profile} />}
    </aside>
  )
}
