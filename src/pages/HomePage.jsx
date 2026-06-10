import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '../components/ui/AppBar'
import Icon from '../components/ui/Icon'
import SectionLabel from '../components/ui/SectionLabel'
import EntryCard from '../components/ui/EntryCard'
import { api } from '../utils/api'

// ── Conteúdo curado ───────────────────────────────────────────────────────────

const PHRASES = [
  'Os dias passam. O arquivo permanece.',
  'Você está construindo algo que sua versão futura vai encontrar.',
  'O que você guardar hoje pode virar uma memória amanhã.',
  'Cada entrada é uma prova de que você esteve aqui.',
  'O tempo não apaga o que foi registrado com intenção.',
  'Um dia, você vai agradecer por ter guardado isso.',
  'Guardar é um ato de cuidado com o futuro.',
  'O passado não some — ele espera para ser revisitado.',
  'Cada nota pequena é parte de uma história maior.',
  'Daqui a alguns anos, este momento vai parecer muito distante.',
  'Você está aqui. Isso já é suficiente para registrar.',
  'O Archive não é sobre o que você fez. É sobre quem você está se tornando.',
]

const QUESTIONS = [
  'O que você está tentando não esquecer?',
  'O que mudou desde ontem?',
  'O que você aprendeu esta semana?',
  'O que merece ser registrado hoje?',
  'O que sua versão futura deveria saber?',
  'O que te surpreendeu recentemente?',
  'O que você decidiu e ainda não registrou?',
  'Qual pensamento fica voltando para a sua cabeça?',
  'O que você construiu nos últimos dias?',
  'Sobre o que você quer lembrar daqui a um ano?',
  'O que te fez sentir algo hoje?',
  'Qual foi o momento mais importante desta semana?',
  'O que você tem evitado pensar?',
  'Que ideia você teve hoje que vale guardar?',
  'O que está funcionando bem na sua vida agora?',
  'O que ainda está em aberto?',
  'O que te deu energia hoje?',
  'O que você está esperando?',
  'O que você aprendeu sobre si mesma ultimamente?',
  'O que você está criando que ainda não tem nome?',
  'Que conversa ficou com você?',
  'O que você precisa parar de adiar?',
  'O que você quer lembrar desta fase da sua vida?',
  'O que está crescendo devagar, quase imperceptível?',
  'Que pequena vitória você não celebrou ainda?',
  'O que você está descobrindo sobre si mesma?',
  'O que você faria se soubesse que ia funcionar?',
  'O que você viu hoje que merecia uma foto?',
  'Qual foi a coisa mais difícil desta semana?',
  'O que você gostaria que alguém soubesse sobre você agora?',
]

function dayOfYear() {
  const now = new Date()
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str, n = 200) {
  if (!str) return ''
  const s = str.replace(/\n+/g, ' ').trim()
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return '1d'
  if (d < 30) return `${d}d`
  return `${Math.floor(d / 30)}mo`
}

function isActive(p) {
  return ['ativo', 'construindo', 'em-andamento'].includes(p.status)
}

function activityLine(post) {
  if (post.isArticle || post.articleTitle) return 'escreveu um ensaio'
  if (post.type === 'foto' || post.attachments?.some(a => a.fileType?.startsWith('image'))) return 'publicou uma foto'
  if (post.type === 'codigo') return 'registrou um código'
  return 'guardou algo'
}

// ── 1. Hero ───────────────────────────────────────────────────────────────────

function Hero({ profile, posts, projects, capsules, streak }) {
  const h = new Date().getHours()
  const greet = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const first = (profile?.name ?? '').split(' ')[0]

  const dateLine = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase()

  const daysInArchive = streak?.daysInArchive ?? null

  const entryCount     = posts?.length ?? 0
  const activeProjects = (projects ?? []).filter(isActive).length
  const capsuleCount   = (capsules ?? []).filter(c => c.status === 'locked').length
  const currentStreak  = streak?.current ?? 0

  const phrase = PHRASES[dayOfYear() % PHRASES.length]

  const stats = [
    `${entryCount.toLocaleString('pt-BR')} ${entryCount === 1 ? 'registro guardado' : 'registros guardados'}`,
    activeProjects > 0 ? `${activeProjects} ${activeProjects === 1 ? 'projeto em movimento' : 'projetos em movimento'}` : null,
    capsuleCount > 0 ? `${capsuleCount} ${capsuleCount === 1 ? 'cápsula esperando' : 'cápsulas esperando'}` : null,
    currentStreak > 0 ? `${currentStreak} ${currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}` : null,
  ].filter(Boolean)

  return (
    <div style={{ padding: '24px 20px 20px' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', margin: '0 0 16px' }}>
        {dateLine}
      </p>
      <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1.08, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em' }}>
        {greet},<br />
        <span style={{ fontStyle: 'italic' }}>{first}.</span>
      </h1>

      {daysInArchive && (
        <p style={{ margin: '12px 0 4px', fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)' }}>
          Dia <span style={{ color: 'var(--ink-2)' }}>{daysInArchive.toLocaleString('pt-BR')}</span> do seu arquivo.
        </p>
      )}

      <p style={{ margin: '2px 0 20px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
        {stats.join(' · ')}
      </p>

      <p style={{
        margin: 0,
        fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic',
        color: 'var(--ink-2)', lineHeight: 1.6,
        borderLeft: '2px solid var(--line-strong)', paddingLeft: 14,
      }}>
        {phrase}
      </p>
    </div>
  )
}

// ── 2. Pergunta do dia ────────────────────────────────────────────────────────

function PerguntaDoDia() {
  const q = QUESTIONS[dayOfYear() % QUESTIONS.length]
  function open() { window.dispatchEvent(new CustomEvent('open-compose')) }

  return (
    <div style={{ padding: '0 20px 6px' }}>
      <button
        onClick={open}
        style={{
          display: 'block', width: '100%', textAlign: 'left',
          background: 'none', border: '1px solid var(--line)', borderRadius: 16,
          padding: '18px 20px', cursor: 'pointer',
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
      >
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 10px' }}>
          Pergunta para hoje
        </p>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.5 }}>
          {q}
        </p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0, letterSpacing: '0.06em' }}>
          Responder →
        </p>
      </button>
    </div>
  )
}

// ── 3. Cápsula — evento com barra de progresso ────────────────────────────────

function CapsulaSection({ capsules }) {
  const navigate = useNavigate()
  if (capsules === null) return null

  const unlocked = [...capsules].find(c => c.status === 'ready')

  const upcoming = [...capsules]
    .filter(c => c.status === 'locked')
    .sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt))[0]

  function Wrapper({ children }) {
    return (
      <div style={{ padding: '20px 20px 4px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 12px' }}>
          Cápsula
        </p>
        {children}
      </div>
    )
  }

  if (unlocked) {
    return (
      <Wrapper>
        <button
          onClick={() => navigate(`/capsules/${unlocked.id}`)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            width: '100%', textAlign: 'left', cursor: 'pointer',
            background: 'rgba(232,108,180,0.09)',
            border: '1px solid rgba(232,108,180,0.4)',
            borderRadius: 16, padding: '18px 20px',
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>✦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, color: 'var(--accent)', margin: '0 0 6px' }}>
              Uma mensagem sua está esperando
            </p>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-2)', margin: '0 0 10px', lineHeight: 1.55 }}>
              Você a escreveu para este momento.
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', margin: 0, letterSpacing: '0.06em' }}>
              Iniciar a abertura →
            </p>
          </div>
        </button>
      </Wrapper>
    )
  }

  if (upcoming) {
    const days = daysUntil(upcoming.unlockAt)
    const created = new Date(upcoming.createdAt)
    const unlock = new Date(upcoming.unlockAt)
    const totalMs = unlock - created
    const elapsedMs = Date.now() - created
    const progress = Math.min(100, Math.max(2, (elapsedMs / totalMs) * 100))

    const urgent = days <= 1
    const close  = days <= 7
    const near   = days <= 30

    const barColor  = urgent ? 'var(--accent)' : close ? '#f97316' : near ? 'var(--ink-2)' : 'var(--ink-3)'
    const labelColor = urgent ? 'var(--accent)' : close ? '#f97316' : 'var(--ink)'
    const preview   = truncate(upcoming.articleTitle || upcoming.content, 60)

    return (
      <Wrapper>
        <button
          onClick={() => navigate('/capsules')}
          style={{
            display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
            background: urgent ? 'rgba(232,108,180,0.05)' : 'none',
            border: `1px solid ${urgent ? 'rgba(232,108,180,0.3)' : 'var(--line)'}`,
            borderRadius: 16, padding: '18px 20px',
            animation: urgent ? 'capsulePulse 2.5s ease-in-out infinite' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 22, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>🔒</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: labelColor, margin: '0 0 3px' }}>
                Próxima cápsula · {urgent ? 'Abre hoje' : days === 1 ? 'Abre amanhã' : `Abre em ${days} dias`}
              </p>
              {preview && (
                <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preview}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${progress}%`,
              background: barColor,
              transition: 'width .6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>criada</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: barColor }}>
              {days === 0 ? 'hoje' : `${days}d`}
            </span>
          </div>
        </button>
        <style>{`@keyframes capsulePulse { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 0 4px rgba(232,108,180,0.15)} }`}</style>
      </Wrapper>
    )
  }

  // No capsules — CTA
  return (
    <Wrapper>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-compose'))}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'none', border: '1px dashed var(--line-strong)', borderRadius: 16, padding: '16px 20px',
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⏳</span>
        <div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', margin: '0 0 3px' }}>
            Escreva uma cápsula para o seu eu futuro
          </p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
            Uma mensagem que só você poderá abrir →
          </p>
        </div>
      </button>
    </Wrapper>
  )
}

// ── 4. Memória — editorial ────────────────────────────────────────────────────

function MemoriaSection({ memories }) {
  const navigate = useNavigate()
  if (!memories) return null

  const sorted = [...memories].sort((a, b) => {
    const ya = parseInt(a.label?.match(/\d+/)?.[0] ?? '0')
    const yb = parseInt(b.label?.match(/\d+/)?.[0] ?? '0')
    return yb - ya
  })
  const memory = sorted[0] ?? null

  function openCompose() { window.dispatchEvent(new CustomEvent('open-compose')) }

  const DIVIDER = <div style={{ height: 1, background: 'var(--line)', margin: '20px 20px 0' }} />

  if (!memory) {
    return (
      <>
        {DIVIDER}
        <div style={{ padding: '24px 20px 20px' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 16px' }}>
            Memória
          </p>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink-3)', lineHeight: 1.65, margin: '0 0 8px' }}>
            Ainda não há memórias para este dia.
          </p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>
            Daqui a um ano, o que você guardar hoje pode voltar para te encontrar.
          </p>
        </div>
        <div style={{ height: 1, background: 'var(--line)', margin: '0 20px 24px' }} />
      </>
    )
  }

  const text = memory.articleTitle
    ? `${memory.articleTitle} — ${truncate(memory.content, 140)}`
    : truncate(memory.content, 240)

  function goToMemory() {
    if (memory.isArticle || memory.articleTitle) navigate(`/articles/${memory.id}`)
    else navigate(`/posts/${memory.id}`)
  }

  return (
    <>
      {DIVIDER}
      <div style={{ padding: '24px 20px 20px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 16px' }}>
          Neste dia, {memory.label?.toLowerCase()}
        </p>
        <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 18, marginBottom: 18 }}>
          <button
            onClick={goToMemory}
            style={{ display: 'block', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <p style={{ fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.7, margin: '0 0 14px' }}>
              "{text}"
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0, letterSpacing: '0.06em' }}>
              Ver memória →
            </p>
          </button>
        </div>
        <button
          onClick={openCompose}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(232,108,180,0.08)', border: '1px solid rgba(232,108,180,0.25)',
            borderRadius: 10, padding: '9px 16px', cursor: 'pointer',
          }}
        >
          <Icon name="feather" size={14} stroke={1.8} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
            Responder hoje
          </span>
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--line)', margin: '0 20px 24px' }} />
    </>
  )
}

// ── 5b. Graph preview ─────────────────────────────────────────────────────────

function GraphPreviewSection({ graphData }) {
  const navigate = useNavigate()
  if (!graphData) return null

  const { nodes, links } = graphData
  const postCount = nodes.filter(n => n.type === 'post' || n.type === 'article').length
  const hasEnough = postCount >= 1

  // Connection count per node
  const connCount = new Map()
  links.forEach(l => {
    connCount.set(l.source, (connCount.get(l.source) || 0) + 1)
    connCount.set(l.target, (connCount.get(l.target) || 0) + 1)
  })

  // Select top nodes to display
  const topTags  = [...nodes].filter(n => n.type === 'tag')
    .sort((a, b) => (connCount.get(b.id) || 0) - (connCount.get(a.id) || 0)).slice(0, 14)
  const topPosts = [...nodes].filter(n => n.type === 'post' || n.type === 'article')
    .sort((a, b) => (connCount.get(b.id) || 0) - (connCount.get(a.id) || 0)).slice(0, 22)
  const topProjs = [...nodes].filter(n => n.type === 'project').slice(0, 5)

  const displayNodes = [...topTags, ...topProjs, ...topPosts]
  const displayIds   = new Set(displayNodes.map(n => n.id))

  // Only links between displayed nodes
  const displayLinks = links
    .filter(l => displayIds.has(l.source) && displayIds.has(l.target))
    .slice(0, 80)

  // Golden angle placement (sunflower pattern — organic, not concentric rings)
  const GOLDEN = 2.399963 // 137.5° in radians
  const W = 360, H = 230, cx = W / 2, cy = H / 2

  const positioned = displayNodes.map((n, i) => {
    const count = connCount.get(n.id) || 0
    // Tags and projects closer to center (more connected = closer)
    const baseR = n.type === 'tag'     ? 62
                : n.type === 'project' ? 55
                : 95
    const r = Math.max(16, baseR - count * 2)
    // Deterministic angle offset by type
    const offset = n.type === 'tag' ? 0 : n.type === 'project' ? 1.2 : 0.6
    const angle = i * GOLDEN + offset
    return {
      ...n, count,
      x: Math.max(10, Math.min(W - 10, cx + Math.cos(angle) * r)),
      y: Math.max(10, Math.min(H - 10, cy + Math.sin(angle) * r)),
    }
  })

  const posMap = new Map(positioned.map(n => [n.id, n]))

  function nodeR(n) {
    if (n.type === 'tag')     return Math.min(7, 3 + n.count * 0.55)
    if (n.type === 'project') return 5
    return 1.8
  }

  const topTagLabels = topTags.slice(0, 5).map(n => n.label)

  if (!hasEnough) {
    return (
      <div style={{ padding: '0 20px 26px' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 10px' }}>
          Mapa do arquivo
        </p>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-3)', lineHeight: 1.65, margin: 0 }}>
          Suas conexões começam a aparecer conforme você usa tags, projetos e links internos.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '0 0 6px' }}>
          Mapa do arquivo
        </p>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 22, color: '#F2EDE6', fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.1 }}>
          Suas ideias,<br /><span style={{ fontStyle: 'italic' }}>conectadas.</span>
        </p>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#6b6560', margin: 0, letterSpacing: '0.04em' }}>
          {postCount} registros
          {links.length > 0 && <> · {links.length} conexões</>}
          {topTagLabels.length > 0 && (
            <> · <span style={{ color: '#E86CB4' }}>{topTagLabels.join('  ')}</span></>
          )}
          {links.length === 0 && (
            <span style={{ color: '#4a4540' }}> · use #tags para criar conexões</span>
          )}
        </p>
      </div>

      {/* Galaxy visual — clickable, full width */}
      <button
        onClick={() => navigate('/graph')}
        style={{ display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 20px' }}
      >
        <div style={{ borderRadius: 20, overflow: 'hidden', lineHeight: 0, position: 'relative' }}>
          <svg
            width="100%" viewBox={`0 0 ${W} ${H}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <defs>
              <radialGradient id="gpBg" cx="50%" cy="50%" r="65%">
                <stop offset="0%"   stopColor="#160d12" />
                <stop offset="100%" stopColor="#030303" />
              </radialGradient>
              <radialGradient id="gpCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#E86CB4" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#E86CB4" stopOpacity="0" />
              </radialGradient>
              <filter id="gpGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="gpCenterGlow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width={W} height={H} fill="url(#gpBg)" />

            {/* Ambient glow at center */}
            <ellipse cx={cx} cy={cy} rx={90} ry={70} fill="url(#gpCenter)" />

            {/* Connection lines */}
            {displayLinks.map((l, i) => {
              const s = posMap.get(l.source)
              const t = posMap.get(l.target)
              if (!s || !t) return null
              const isTag = s.type === 'tag' || t.type === 'tag'
              return (
                <line key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isTag ? '#E86CB4' : '#4a3f3a'}
                  strokeWidth={isTag ? '0.5' : '0.35'}
                  strokeOpacity={isTag ? '0.22' : '0.12'}
                />
              )
            })}

            {/* Post nodes — tiny light points */}
            {positioned.filter(n => n.type === 'post' || n.type === 'article').map(n => (
              <circle key={n.id} cx={n.x} cy={n.y} r={n.count >= 2 ? 2.5 : 1.8}
                fill={n.type === 'article' ? '#c084fc' : '#4a4540'}
                fillOpacity={n.count >= 2 ? 0.7 : 0.45}
              />
            ))}

            {/* Project nodes */}
            {positioned.filter(n => n.type === 'project').map(n => (
              <circle key={n.id} cx={n.x} cy={n.y} r={5}
                fill="#c084fc" fillOpacity="0.55"
                filter="url(#gpGlow)"
              />
            ))}

            {/* Tag nodes — the stars of the graph */}
            {positioned.filter(n => n.type === 'tag').map(n => {
              const r = nodeR(n)
              const opacity = Math.min(0.95, 0.5 + n.count * 0.06)
              const label = n.label.slice(0, 11)
              const labelBelow = n.y < cy
              return (
                <g key={n.id} filter="url(#gpGlow)">
                  {/* Halo */}
                  <circle cx={n.x} cy={n.y} r={r + 3} fill="#E86CB4" fillOpacity="0.08" />
                  {/* Node */}
                  <circle cx={n.x} cy={n.y} r={r} fill="#E86CB4" fillOpacity={opacity} />
                  {/* Label for bigger nodes */}
                  {n.count >= 2 && (
                    <text
                      x={n.x} y={labelBelow ? n.y + r + 10 : n.y - r - 4}
                      textAnchor="middle" fill="#9b8f89" fontSize="7" fontFamily="monospace"
                    >
                      {label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Center pulse rings */}
            <circle cx={cx} cy={cy} r={22} fill="none" stroke="#E86CB4" strokeWidth="0.5" strokeOpacity="0.12" />
            <circle cx={cx} cy={cy} r={14} fill="none" stroke="#E86CB4" strokeWidth="0.5" strokeOpacity="0.2" />

            {/* Center node */}
            <circle cx={cx} cy={cy} r={11} fill="#E86CB4" filter="url(#gpCenterGlow)" />
            <circle cx={cx} cy={cy} r={11} fill="#E86CB4" />
            <text x={cx} y={cy + 4} textAnchor="middle"
              fill="white" fontSize="8.5" fontFamily="Georgia,serif" fontStyle="italic"
            >
              eu
            </text>

            {/* CTA overlay at bottom */}
            <text x={W - 16} y={H - 12} textAnchor="end"
              fill="#6b6560" fontSize="9.5" fontFamily="monospace" letterSpacing="0.06em"
            >
              Ver o mapa completo →
            </text>
          </svg>
        </div>
      </button>
    </div>
  )
}

// ── 5. Projetos ───────────────────────────────────────────────────────────────

function ProjetosSection({ projects }) {
  const navigate = useNavigate()
  if (!projects) return null

  const active = [...projects]
    .filter(isActive)
    .sort((a, b) => new Date(b.lastActivityAt ?? 0) - new Date(a.lastActivityAt ?? 0))
    .slice(0, 3)

  return (
    <div style={{ padding: '0 20px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: 0 }}>
          Projetos em movimento
        </p>
        {active.length > 0 && (
          <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', padding: 0 }}>
            Ver todos →
          </button>
        )}
      </div>

      {active.length === 0 ? (
        <button
          onClick={() => navigate('/projects')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: '1px dashed var(--line-strong)', borderRadius: 14, padding: '14px 16px' }}
        >
          <span style={{ fontSize: 20 }}>🌱</span>
          <div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', margin: '0 0 2px' }}>Criar primeiro projeto</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>Organize o que você está construindo →</p>
          </div>
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
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

// ── 6. Escrita — Presente ─────────────────────────────────────────────────────

function EscritaSection() {
  function open() { window.dispatchEvent(new CustomEvent('open-compose')) }

  return (
    <div style={{ padding: '0 20px 26px' }}>
      <button
        onClick={open}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: '22px 22px', borderRadius: 18,
          border: '1.5px solid rgba(232,108,180,0.35)',
          background: 'rgba(232,108,180,0.05)',
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
          Uma nota, uma ideia, uma foto, um arquivo
        </p>
      </button>
    </div>
  )
}

// ── 7. Trajetória strip ───────────────────────────────────────────────────────

function TrajetoriaStrip({ streak, projects }) {
  const navigate = useNavigate()
  const current     = streak?.current ?? 0
  const total       = streak?.totalActiveDays ?? 0
  const activeCount = (projects ?? []).filter(isActive).length

  const parts = [
    `${current} ${current === 1 ? 'dia seguido' : 'dias seguidos'}`,
    `${total} ${total === 1 ? 'dia no arquivo' : 'dias no arquivo'}`,
    activeCount > 0 ? `${activeCount} ${activeCount === 1 ? 'projeto ativo' : 'projetos ativos'}` : null,
  ].filter(Boolean)

  return (
    <button
      onClick={() => navigate('/trajetoria')}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '0 20px 28px', padding: '12px 16px', borderRadius: 12,
        border: '1px solid var(--line)', background: 'none',
        cursor: 'pointer', width: 'calc(100% - 40px)',
      }}
    >
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        {parts.map((p, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--line-strong)', margin: '0 8px' }}>·</span>}
            {current > 0 && i === 0
              ? <span><span style={{ color: 'var(--accent)' }}>{current}</span>{` ${current === 1 ? 'dia seguido' : 'dias seguidos'}`}</span>
              : p
            }
          </span>
        ))}
      </span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0, marginLeft: 10 }}>→</span>
    </button>
  )
}

// ── 8. Círculo ────────────────────────────────────────────────────────────────

function CirculoSection({ circlePosts, circleLoading, updatePost }) {
  const navigate = useNavigate()

  return (
    <div>
      <SectionLabel>Seu círculo hoje</SectionLabel>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {circleLoading ? (
          <div style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : circlePosts.length === 0 ? (
          <div style={{ padding: '32px 20px 28px' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.4 }}>
              Seu círculo ainda está começando.
            </p>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', margin: '0 0 20px', lineHeight: 1.6 }}>
              Convide ou encontre pessoas para acompanhar trajetórias próximas da sua.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate('/explore')}
                style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '11px 18px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
              >
                Buscar pessoas
              </button>
              <button
                onClick={() => navigate('/@thearchive')}
                style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 18px', cursor: 'pointer', textAlign: 'left' }}
              >
                Ver @thearchive
              </button>
              <button
                onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/@' + window.__archiveHandle).catch(() => {}) }}
                style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: 4 }}
              >
                Copiar link do meu perfil →
              </button>
            </div>
          </div>
        ) : (
          circlePosts.map(p => (
            <EntryCard
              key={p.id} post={p} showAuthor
              onLike={() => updatePost(p.id, 'react', 'heart')}
              onSave={() => updatePost(p.id, 'save')}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Guia colapsado ────────────────────────────────────────────────────────────

function GuiaCollapsed({ posts }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!posts.length) return null

  return (
    <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Guia do Archive</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{open ? 'Ocultar' : 'Mostrar'}</span>
      </button>
      {open && (
        <div>
          {posts.slice(0, 4).map(p => <EntryCard key={p.id} post={p} showAuthor />)}
          {posts.length > 4 && (
            <div style={{ padding: '12px 20px', textAlign: 'center' }}>
              <button onClick={() => navigate('/explore')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.08em' }}>
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
    <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  const [graphData,     setGraphData]     = useState(null)

  useEffect(() => {
    api.get('/archive/memories').then(d => setMemories(d.slice(0, 6))).catch(() => setMemories([]))
    api.get('/capsules').then(setCapsules).catch(() => setCapsules([]))
    api.get('/projects').then(setProjects).catch(() => setProjects([]))
    api.get('/archive/streak').then(setStreak).catch(() => setStreak({}))
    api.get('/posts/guide').then(setGuidePosts).catch(() => {})
    api.get('/archive/graph').then(setGraphData).catch(() => setGraphData({ nodes: [], links: [] }))
    api.get('/posts/following')
      .then(d => setCirclePosts(d))
      .catch(err => console.error('[HomePage] load following feed failed:', err?.message))
      .finally(() => setCircleLoading(false))
  }, [])

  async function updatePost(id, action, reactionType) {
    try {
      const updated = await api.patch(`/posts/${id}`, reactionType ? { action, reactionType } : { action })
      setCirclePosts(cur => cur.map(p => p.id === id ? { ...updated, attachments: p.attachments, author: p.author } : p))
    } catch (err) {
      console.error('[HomePage] update post failed:', err?.message)
    }
  }

  return (
    <div style={{ animation: 'fadeUp var(--dur-screen) var(--ease-out)', maxWidth: 680, margin: '0 auto' }}>
      {/* Mobile AppBar */}
      <AppBar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', letterSpacing: '-0.01em' }}>The Archive</span>
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


      {/* 1. Hero */}
      <Hero profile={profile} posts={posts} projects={projects} capsules={capsules} streak={streak} />

      {/* 2. Pergunta do dia */}
      <div style={{ padding: '8px 0 20px' }}>
        <PerguntaDoDia />
      </div>

      {/* 3. Cápsula */}
      <CapsulaSection capsules={capsules} />

      {/* 4. Memória */}
      <div style={{ padding: '4px 0' }}>
        <MemoriaSection memories={memories} />
      </div>

      {/* 5. Projetos */}
      <ProjetosSection projects={projects} />

      {/* 5b. Graph preview */}
      <GraphPreviewSection graphData={graphData} />

      {/* 6. Escrita */}
      <EscritaSection />

      {/* 7. Trajetória */}
      <TrajetoriaStrip streak={streak} projects={projects} />

      {/* 8. Círculo */}
      <CirculoSection circlePosts={circlePosts} circleLoading={circleLoading} updatePost={updatePost} />

      {/* Guia — colapsado */}
      <GuiaCollapsed posts={guidePosts} />

      <div style={{ padding: '28px 20px 12px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-3)', margin: '0 0 4px' }}>É isso, hoje.</p>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', margin: 0 }}>Volte amanhã, ou guarde algo agora.</p>
      </div>
    </div>
  )
}
