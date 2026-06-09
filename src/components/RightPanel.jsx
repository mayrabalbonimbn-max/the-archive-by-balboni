import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import Icon from './ui/Icon'

// ── Rail card wrapper ─────────────────────────────────────────────────────────

function RailCard({ title, action, onAction, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          {title}
        </div>
        {action && (
          <button
            onClick={onAction}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Today rail: "On this day" + latest notices ────────────────────────────────

function TodayRail({ profile }) {
  const navigate = useNavigate()
  const [memories, setMemories] = useState([])
  const [notices, setNotices] = useState([])

  useEffect(() => {
    const now = new Date()
    api.get(`/archive/calendar/${now.getFullYear()}/${now.getMonth() + 1}`)
      .then(data => {
        // filter out today, keep older entries as "memories"
        const today = now.getDate()
        const older = (data.entries || []).filter(e => new Date(e.createdAt).getDate() !== today)
        setMemories(older.slice(0, 2))
      })
      .catch(() => {})
    api.get('/notifications')
      .then(data => setNotices((data || []).slice(0, 3)))
      .catch(() => {})
  }, [])

  return (
    <div>
      <RailCard title="Neste dia" action="Ver tudo" onAction={() => navigate('/archive?s=memories')}>
        {memories.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            Nada guardado neste dia em outros anos.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {memories.map(m => {
              const yearsAgo = new Date().getFullYear() - new Date(m.createdAt).getFullYear()
              return (
                <div
                  key={m.id}
                  onClick={() => navigate('/archive?s=memories')}
                  style={{ cursor: 'pointer', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'var(--surface-1)', padding: '11px 13px' }}
                >
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6 }}>
                    {yearsAgo} {yearsAgo === 1 ? 'ANO ATRÁS' : 'ANOS ATRÁS'}
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.4, color: 'var(--ink-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {m.title || m.content || 'Entrada guardada'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </RailCard>

      <RailCard title="Últimos avisos" action="Abrir" onAction={() => navigate('/notifications')}>
        {notices.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            Nenhum aviso recente.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {notices.map(n => {
              const isMemory = n.type === 'memory'
              return (
                <div
                  key={n.id}
                  onClick={() => navigate('/notifications')}
                  style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'center' }}
                >
                  {isMemory ? (
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'rgba(232,108,180,0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="sparkle" size={15} />
                    </div>
                  ) : (
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '1px solid var(--line)', background: 'linear-gradient(135deg,#c084fc,#E86CB4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 12, color: '#fff' }}>
                        {(n.actor?.name ?? '?')[0]}
                      </span>
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink-3)', minWidth: 0, flex: 1 }}>
                    {!isMemory && <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{(n.actor?.name ?? '').split(' ')[0]} </span>}
                    {n.type === 'react' || n.type === 'like' ? 'apreciou sua entrada'
                      : n.type === 'comment' ? 'deixou uma nota'
                      : n.type === 'collect' ? 'guardou sua entrada'
                      : n.type === 'follow' ? 'entrou no seu círculo'
                      : n.type === 'mention' ? 'te mencionou'
                      : 'Uma memória ressurgiu'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </RailCard>
    </div>
  )
}

// ── Archive rail: bio + stats + collections ───────────────────────────────────

function ArchiveRail({ profile }) {
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [postsCount, setPostsCount] = useState(null)

  useEffect(() => {
    api.get('/collections').then(setCollections).catch(() => {})
    api.get('/posts').then(posts => setPostsCount(posts?.length ?? 0)).catch(() => {})
  }, [])

  const daysKept = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000))
    : null

  return (
    <div>
      <RailCard title="Sobre este arquivo">
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
      </RailCard>

      <RailCard title="Coleções" action="Ver todas" onAction={() => navigate('/archive?s=collections')}>
        {collections.length === 0 ? (
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            Nenhuma coleção ainda.
          </p>
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
      </RailCard>
    </div>
  )
}

// ── Main right panel ──────────────────────────────────────────────────────────

export default function RightPanel({ profile }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const archiveSection = params.get('s')

  const isToday = location.pathname === '/'
  const isArchive = location.pathname === '/archive'

  // Show rail only on Today and Archive family
  const showRail = isToday || isArchive

  if (!showRail) return null

  return (
    <aside
      className="hidden lg:block shrink-0 sticky top-0 h-screen overflow-y-auto scrollbar-hide"
      style={{ width: 300, padding: '48px 8px 48px 24px' }}
    >
      {isToday && <TodayRail profile={profile} />}
      {isArchive && <ArchiveRail profile={profile} />}
    </aside>
  )
}
