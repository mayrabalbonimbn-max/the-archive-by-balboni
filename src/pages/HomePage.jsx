import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import { api } from '../utils/api'
import StoriesBar from '../components/StoriesBar'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return '1d'
  if (d < 30) return `${d}d`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m}mo`
  return `${Math.floor(m / 12)}a`
}

function truncate(str, n = 200) {
  if (!str) return ''
  const s = str.replace(/\n+/g, ' ').trim()
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
}

function activityLine(post) {
  if (post.isArticle || post.articleTitle) return 'escreveu um ensaio'
  if (post.type === 'foto' || post.attachments?.some(a => a.fileType?.startsWith('image'))) return 'publicou uma foto'
  if (post.type === 'codigo') return 'registrou um código'
  return 'guardou algo'
}

// ── 1. Saudação ───────────────────────────────────────────────────────────────

function Saudacao({ profile, posts }) {
  const h = new Date().getHours()
  const greet = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const first = (profile?.name ?? '').split(' ')[0]

  const dateLine = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase()

  const daysKept = profile?.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt)) / 86400000))
    : null

  return (
    <div style={{ padding: '22px 20px 20px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>
        {dateLine}
      </div>
      <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 33, lineHeight: 1.08, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em' }}>
        {greet},<br />
        <span style={{ fontStyle: 'italic' }}>{first}.</span>
      </h1>
      <div style={{ marginTop: 12, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)' }}>
        {daysKept && <>Dia <span style={{ color: 'var(--ink-2)' }}>{daysKept.toLocaleString('pt-BR')}</span> do seu arquivo · </>}
        <span style={{ color: 'var(--ink-2)' }}>{(posts?.length ?? 0).toLocaleString('pt-BR')}</span> entradas guardadas
      </div>
    </div>
  )
}

// ── 2. Cápsula — Futuro ───────────────────────────────────────────────────────

function CapsulaSection({ capsules }) {
  const navigate = useNavigate()

  // Still loading
  if (capsules === null) return null

  const now = Date.now()
  const unlocked = [...capsules]
    .filter(c => new Date(c.unlockAt) <= now)
    .sort((a, b) => new Date(b.unlockAt) - new Date(a.unlockAt))[0]
  const upcoming = [...capsules]
    .filter(c => new Date(c.unlockAt) > now)
    .sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt))[0]

  // Unlocked capsule — highest priority
  if (unlocked) {
    const preview = truncate(unlocked.articleTitle || unlocked.content, 72)
    return (
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>
          Cápsula
        </div>
        <button
          onClick={() => navigate(`/posts/${unlocked.id}`)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'rgba(232,108,180,0.09)',
            border: '1px solid rgba(232,108,180,0.35)',
            borderRadius: 16, padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>🔓</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, color: 'var(--accent)', margin: '0 0 4px' }}>
              Uma cápsula está esperando por você
            </p>
            {preview && (
              <p style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.5 }}>
                "{preview}"
              </p>
            )}
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', margin: 0, letterSpacing: '0.06em' }}>
              Abrir cápsula →
            </p>
          </div>
        </button>
      </div>
    )
  }

  // Upcoming capsule
  if (upcoming) {
    const days = daysUntil(upcoming.unlockAt)
    const preview = truncate(upcoming.articleTitle || upcoming.content, 60)
    return (
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>
          Cápsula
        </div>
        <button
          onClick={() => navigate('/capsules')}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'none', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px',
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>🔒</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px' }}>
              Próxima cápsula · {days === 0 ? 'Abre hoje' : days === 1 ? 'Abre amanhã' : `Abre em ${days} dias`}
            </p>
            {preview && (
              <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview}
              </p>
            )}
          </div>
        </button>
      </div>
    )
  }

  // No capsules
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>
        Cápsula
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-compose'))}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'none', border: '1px dashed var(--line-strong)', borderRadius: 16, padding: '16px 18px',
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>⏳</span>
        <div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', margin: '0 0 2px' }}>
            Escreva uma cápsula para o seu eu futuro
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
            Uma mensagem que só você poderá abrir →
          </p>
        </div>
      </button>
    </div>
  )
}

// ── 3. Memória — Passado ──────────────────────────────────────────────────────

function MemoriaSection({ memories }) {
  const navigate = useNavigate()

  if (!memories) return null

  const sorted = [...memories].sort((a, b) => {
    const ya = parseInt(a.label?.match(/\d+/)?.[0] ?? '0')
    const yb = parseInt(b.label?.match(/\d+/)?.[0] ?? '0')
    return yb - ya
  })
  const memory = sorted[0] ?? null

  const LINE = { height: 1, background: 'var(--line)', margin: '0 0' }

  if (!memory) {
    return (
      <div style={{ padding: '24px 20px' }}>
        <div style={LINE} />
        <div style={{ padding: '22px 0 4px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
            Memória
          </div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>
            Ainda não há memórias para este dia.
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: '8px 0 0' }}>
            Daqui a um ano, o que você guardar hoje pode voltar para te encontrar.
          </p>
        </div>
        <div style={LINE} />
      </div>
    )
  }

  const text = memory.articleTitle
    ? `${memory.articleTitle} — ${truncate(memory.content, 140)}`
    : truncate(memory.content, 200)

  function go() {
    if (memory.isArticle || memory.articleTitle) navigate(`/articles/${memory.id}`)
    else navigate(`/posts/${memory.id}`)
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={LINE} />
      <div style={{ padding: '22px 0 4px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>
          Memória · {memory.label}
        </div>
        <button
          onClick={go}
          style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 16 }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.65, margin: 0 }}>
              "{text}"
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', margin: '12px 0 0', letterSpacing: '0.06em' }}>
              Ver memória →
            </p>
          </div>
        </button>
      </div>
      <div style={LINE} />
    </div>
  )
}

// ── 4. Projetos em movimento ──────────────────────────────────────────────────

function ProjetosSection({ projects }) {
  const navigate = useNavigate()

  if (!projects) return null

  const active = [...projects]
    .filter(p => ['ativo', 'construindo', 'em-andamento'].includes(p.status))
    .sort((a, b) => new Date(b.lastActivityAt ?? 0) - new Date(a.lastActivityAt ?? 0))
    .slice(0, 3)

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Projetos em movimento
        </span>
        {active.length > 0 && (
          <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', padding: 0 }}>
            Ver todos →
          </button>
        )}
      </div>

      {active.length === 0 ? (
        <button
          onClick={() => navigate('/projects')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'none', border: '1px dashed var(--line-strong)', borderRadius: 14, padding: '14px 16px',
          }}
        >
          <span style={{ fontSize: 20 }}>🌱</span>
          <div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', margin: '0 0 2px' }}>Criar primeiro projeto</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>Organize o que você está construindo →</p>
          </div>
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {active.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.slug || p.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{p.emoji ?? '🌱'}</span>
              <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>
                {relativeTime(p.lastActivityAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 5. Escrita — Presente ─────────────────────────────────────────────────────

function EscritaSection() {
  function open() { window.dispatchEvent(new CustomEvent('open-compose')) }

  return (
    <div style={{ padding: '0 20px 28px' }}>
      <button
        onClick={open}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: '22px 22px',
          borderRadius: 18,
          border: '1.5px solid rgba(232,108,180,0.35)',
          background: 'rgba(232,108,180,0.05)',
          boxShadow: '0 0 0 0 transparent',
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,108,180,0.7)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(232,108,180,0.35)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="feather" size={18} stroke={1.8} style={{ color: '#fff' }} />
          </div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', fontStyle: 'italic', margin: 0, lineHeight: 1.2 }}>
            O que você está guardando hoje?
          </p>
        </div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', margin: 0, paddingLeft: 48 }}>
          Uma nota, uma ideia, uma foto, um arquivo — no seu arquivo
        </p>
      </button>
    </div>
  )
}

// ── 6. Trajetória rápida ──────────────────────────────────────────────────────

function TrajetoriaStrip({ streak, projects }) {
  const navigate = useNavigate()
  const current = streak?.current ?? 0
  const total = streak?.totalActiveDays ?? 0
  const activeCount = (projects ?? []).filter(p => ['ativo', 'construindo', 'em-andamento'].includes(p.status)).length

  return (
    <button
      onClick={() => navigate('/trajetoria')}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '0 20px 28px',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: 'none',
        cursor: 'pointer', width: 'calc(100% - 40px)',
      }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: current > 0 ? 'var(--accent)' : 'var(--ink-3)' }}>
          {current} {current === 1 ? 'dia seguido' : 'dias seguidos'}
        </span>
        <span style={{ color: 'var(--line-strong)', fontFamily: 'var(--mono)', fontSize: 11 }}>·</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
          {total} {total === 1 ? 'dia no arquivo' : 'dias no arquivo'}
        </span>
        {activeCount > 0 && (
          <>
            <span style={{ color: 'var(--line-strong)', fontFamily: 'var(--mono)', fontSize: 11 }}>·</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
              {activeCount} {activeCount === 1 ? 'projeto ativo' : 'projetos ativos'}
            </span>
          </>
        )}
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0, marginLeft: 10 }}>→</span>
    </button>
  )
}

// ── 7. Círculo ────────────────────────────────────────────────────────────────

function CirculoSection({ circlePosts, circleLoading }) {
  const navigate = useNavigate()

  return (
    <div>
      <SectionLabel>Seu círculo hoje</SectionLabel>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {circleLoading ? (
          <div style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : circlePosts.length === 0 ? (
          <div style={{ padding: '28px 20px' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)', margin: '0 0 8px' }}>
              Nenhuma atividade do círculo ainda.
            </p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', margin: '0 0 12px' }}>
              Quando alguém do seu círculo guardar algo, vai aparecer aqui.
            </p>
            <button
              onClick={() => navigate('/friends')}
              style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Encontrar pessoas →
            </button>
          </div>
        ) : (
          circlePosts.slice(0, 5).map(p => (
            <EntryCard
              key={p.id}
              post={p}
              showAuthor
              onLike={() => {}}
              onSave={() => {}}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── 8. Feed (do círculo, completo) ────────────────────────────────────────────

function FeedSection({ circlePosts, circleLoading, onLike, onSave }) {
  const navigate = useNavigate()
  if (circleLoading || circlePosts.length <= 5) return null

  return (
    <div>
      <SectionLabel>Do seu círculo hoje</SectionLabel>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {circlePosts.slice(5).map(p => (
          <EntryCard key={p.id} post={p} showAuthor onLike={() => {}} onSave={() => {}} />
        ))}
      </div>
    </div>
  )
}

// ── Guia (colapsado, no fundo) ────────────────────────────────────────────────

function GuiaCollapsed({ posts }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!posts.length) return null

  return (
    <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
          Guia do Archive
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
          {open ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>
      {open && (
        <div>
          {posts.slice(0, 4).map(p => (
            <EntryCard key={p.id} post={p} showAuthor />
          ))}
          {posts.length > 4 && (
            <div style={{ padding: '12px 20px', textAlign: 'center' }}>
              <button
                onClick={() => navigate('/explore')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.08em' }}
              >
                Ver todos os guias →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── NotifBell ─────────────────────────────────────────────────────────────────

function NotifBell({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="bell" size={19} />
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomePage({ posts, profile, onLike, onSave }) {
  const navigate = useNavigate()
  const [memories,      setMemories]      = useState(null)
  const [capsules,      setCapsules]      = useState(null)
  const [projects,      setProjects]      = useState(null)
  const [streak,        setStreak]        = useState(null)
  const [circlePosts,   setCirclePosts]   = useState([])
  const [circleLoading, setCircleLoading] = useState(true)
  const [guidePosts,    setGuidePosts]    = useState([])

  useEffect(() => {
    api.get('/archive/memories').then(d => setMemories(d.slice(0, 6))).catch(() => setMemories([]))
    api.get('/capsules').then(setCapsules).catch(() => setCapsules([]))
    api.get('/projects').then(setProjects).catch(() => setProjects([]))
    api.get('/archive/streak').then(setStreak).catch(() => setStreak({}))
    api.get('/posts/guide').then(setGuidePosts).catch(() => {})
    api.get('/posts/following')
      .then(d => setCirclePosts(d))
      .catch(() => {})
      .finally(() => setCircleLoading(false))
  }, [])

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)', maxWidth: 680, margin: '0 auto' }}>
      {/* Mobile AppBar */}
      <AppBar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              The Archive
            </span>
          </div>
        }
        right={
          <>
            <NotifBell onClick={() => navigate('/notifications')} />
            <button onClick={() => navigate('/explore')} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="search" size={19} />
            </button>
          </>
        }
      />

      {/* Stories */}
      <StoriesBar profile={profile} />

      {/* 1. Saudação */}
      <Saudacao profile={profile} posts={posts} />

      {/* 2. Cápsula — Futuro */}
      <div style={{ padding: '0 0 28px' }}>
        <CapsulaSection capsules={capsules} />
      </div>

      {/* 3. Memória — Passado */}
      <MemoriaSection memories={memories} />

      {/* 4. Projetos */}
      <ProjetosSection projects={projects} />

      {/* 5. Escrita — Presente */}
      <EscritaSection />

      {/* 6. Trajetória rápida */}
      <TrajetoriaStrip streak={streak} projects={projects} />

      {/* 7. Círculo (primeiros 5) */}
      <CirculoSection circlePosts={circlePosts} circleLoading={circleLoading} />

      {/* 8. Feed (resto do círculo) */}
      <FeedSection circlePosts={circlePosts} circleLoading={circleLoading} />

      {/* Guia — colapsado, no fundo */}
      <GuiaCollapsed posts={guidePosts} />

      {/* Footer */}
      <div style={{ padding: '28px 20px 12px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-3)' }}>É isso, hoje.</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>Volte amanhã, ou guarde algo agora.</div>
      </div>
    </div>
  )
}
