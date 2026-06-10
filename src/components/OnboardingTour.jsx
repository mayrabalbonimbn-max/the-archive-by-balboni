import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ── Illustrations ──────────────────────────────────────────────────────────────

function IlloPhilosophy() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="5" fill="var(--accent)" />
      <circle cx="40" cy="40" r="17" stroke="var(--accent)" strokeWidth="1" opacity="0.25" />
      <circle cx="40" cy="40" r="30" stroke="var(--accent)" strokeWidth="0.5" opacity="0.1" />
    </svg>
  )
}

function IlloCompose() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M58 16C48 12 30 22 22 48L24 55L31 52C38 28 52 20 58 16Z" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      <line x1="24" y1="55" x2="19" y2="65" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="60" x2="46" y2="30" stroke="var(--accent)" strokeWidth="0.75" opacity="0.25" strokeLinecap="round" />
      <line x1="30" y1="62" x2="42" y2="62" stroke="var(--accent)" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      <line x1="34" y1="67" x2="52" y2="67" stroke="var(--accent)" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
    </svg>
  )
}

function IlloProjects() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <line x1="16" y1="40" x2="64" y2="40" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
      <circle cx="16" cy="40" r="4" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <circle cx="40" cy="40" r="5" fill="var(--accent)" />
      <circle cx="64" cy="40" r="4" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.35" />
      <line x1="40" y1="22" x2="40" y2="33" stroke="var(--accent)" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <line x1="16" y1="40" x2="16" y2="26" stroke="var(--accent)" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      <line x1="64" y1="40" x2="64" y2="52" stroke="var(--accent)" strokeWidth="1" opacity="0.15" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  )
}

function IlloCapsules() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="16" y="26" width="48" height="34" rx="3" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      <polyline points="16,26 40,46 64,26" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="40" y1="18" x2="40" y2="24" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" strokeDasharray="2 3" />
      <circle cx="40" cy="14" r="3" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.3" />
    </svg>
  )
}

function IlloArchive() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="10" y="12" width="26" height="18" rx="2" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent)" fillOpacity="0.06" />
      <rect x="44" y="12" width="26" height="18" rx="2" stroke="var(--accent)" strokeWidth="1" opacity="0.55" />
      <rect x="10" y="36" width="26" height="18" rx="2" stroke="var(--accent)" strokeWidth="1" opacity="0.55" />
      <rect x="44" y="36" width="26" height="18" rx="2" stroke="var(--accent)" strokeWidth="1" opacity="0.45" />
      <rect x="10" y="60" width="26" height="10" rx="2" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
      <rect x="44" y="60" width="26" height="10" rx="2" stroke="var(--accent)" strokeWidth="1" opacity="0.25" />
      <line x1="13" y1="18" x2="32" y2="18" stroke="var(--accent)" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      <line x1="13" y1="22" x2="26" y2="22" stroke="var(--accent)" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    </svg>
  )
}

function IlloEvolution() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="12" y="52" width="10" height="16" rx="2" fill="var(--accent)" opacity="0.2" />
      <rect x="26" y="44" width="10" height="24" rx="2" fill="var(--accent)" opacity="0.35" />
      <rect x="40" y="32" width="10" height="36" rx="2" fill="var(--accent)" opacity="0.55" />
      <rect x="54" y="20" width="10" height="48" rx="2" fill="var(--accent)" opacity="0.85" />
      <line x1="8" y1="70" x2="72" y2="70" stroke="var(--line-strong)" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

function IlloVideo() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="10" y="22" width="42" height="36" rx="4" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      <path d="M52 35L68 28L68 52L52 45Z" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <circle cx="31" cy="40" r="7" stroke="var(--accent)" strokeWidth="1" opacity="0.35" fill="none" />
      <polygon points="29,37 29,43 35,40" fill="var(--accent)" opacity="0.5" />
    </svg>
  )
}

function IlloStory() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <path d="M40 20C31 18 14 24 12 32L12 62C14 54 31 52 40 56L40 20Z" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      <path d="M40 20C49 18 66 24 68 32L68 62C66 54 49 52 40 56L40 20Z" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      <line x1="40" y1="20" x2="40" y2="56" stroke="var(--accent)" strokeWidth="0.75" opacity="0.4" />
      <line x1="20" y1="38" x2="34" y2="38" stroke="var(--accent)" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <line x1="20" y1="44" x2="34" y2="44" stroke="var(--accent)" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
      <line x1="46" y1="38" x2="60" y2="38" stroke="var(--accent)" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <line x1="46" y1="44" x2="56" y2="44" stroke="var(--accent)" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
    </svg>
  )
}

function IlloBegin() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="5" fill="var(--accent)" />
      <circle cx="40" cy="40" r="12" fill="var(--accent)" opacity="0.12" />
      <line x1="40" y1="14" x2="40" y2="23" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="57" x2="40" y2="66" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="40" x2="23" y2="40" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="57" y1="40" x2="66" y2="40" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="21" x2="27" y2="27" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <line x1="53" y1="53" x2="59" y2="59" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <line x1="59" y1="21" x2="53" y2="27" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <line x1="27" y1="53" x2="21" y2="59" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

// ── Chapter data ───────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    id: 'philosophy',
    Illo: IlloPhilosophy,
    title: 'O Archive não é uma rede social.',
    lines: [
      'Aqui você não disputa atenção.',
      'Você constrói um arquivo da sua vida — e decide com quem compartilha cada pedaço.',
    ],
  },
  {
    id: 'compose',
    Illo: IlloCompose,
    title: 'Registre do jeito que quiser.',
    lines: [
      'Uma nota. Uma fotografia. Um vídeo gravado. Um ensaio. Um trecho de código.',
      'Cada entrada é privada por padrão — você decide se compartilha.',
    ],
  },
  {
    id: 'projects',
    Illo: IlloProjects,
    title: 'Projetos dão contexto.',
    lines: [
      'Agrupe registros sob um projeto e acompanhe sua evolução ao longo do tempo.',
    ],
    examples: ['Python AI Agent', 'The Archive', 'Balboni Creative Direction Lab'],
  },
  {
    id: 'archive',
    Illo: IlloArchive,
    title: 'O Arquivo é o seu índice.',
    lines: [
      'Tudo que você guardar tem um lugar.',
      'Navegue por seção — não por feed cronológico.',
    ],
    tags: ['Memórias', 'Calendário', 'Fotografias', 'Arquivos', 'Coleções', 'Cápsulas', 'Projetos', 'Momentos'],
  },
  {
    id: 'capsules',
    Illo: IlloCapsules,
    title: 'Cápsulas guardam o futuro.',
    lines: [
      'Escreva uma mensagem para daqui a meses ou anos.',
      'Quando o momento chegar, uma cerimônia especial a revela.',
    ],
  },
  {
    id: 'video',
    Illo: IlloVideo,
    title: 'Momentos que merecem ser gravados.',
    lines: [
      'Registre vídeos curtos — um diário falado, uma memória especial, um antes e depois.',
      'Não é para viralizar. É para guardar.',
    ],
  },
  {
    id: 'evolution',
    Illo: IlloEvolution,
    title: 'Sua evolução fica visível.',
    lines: ['Os seus registros, ao longo do tempo, contam uma história que você não teria escrito de outra forma.'],
    tags: ['Trajetória', 'Grafo de conexões', 'Conquistas', 'Revisão anual', 'Estatísticas'],
  },
  {
    id: 'story',
    Illo: IlloStory,
    title: 'Você é o único leitor que importa.',
    lines: [
      'Com o tempo, o Archive se torna a narrativa mais fiel da sua vida criativa.',
      'Guarde com cuidado. Volte quando quiser.',
    ],
  },
  {
    id: 'begin',
    Illo: IlloBegin,
    title: 'Agora comece.',
    lines: [
      'Não existe jeito certo de usar.',
      'Apenas registre aquilo que importa para você.',
    ],
    cta: 'Começar a guardar',
  },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardingTour({ onComplete }) {
  const [idx, setIdx]     = useState(0)
  const [fading, setFading] = useState(false)
  const touchStartX = useRef(null)

  const total  = CHAPTERS.length
  const isLast = idx === total - 1
  const ch     = CHAPTERS[idx]

  function go(n) {
    if (fading || n < 0 || n >= total) return
    setFading(true)
    setTimeout(() => { setIdx(n); setFading(false) }, 200)
  }

  function next() { isLast ? onComplete() : go(idx + 1) }
  function back() { go(idx - 1) }
  function skip() { onComplete() }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Touch swipe (mobile)
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -50) next()
    else if (dx > 50) back()
  }

  const { Illo, title, lines, examples, tags, cta } = ch

  return createPortal(
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--sans)',
        userSelect: 'none',
      }}
    >
      {/* ── Top bar: progress + skip ── */}
      <div style={{
        flexShrink: 0,
        padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 14px)) 24px 0',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ flex: 1, height: 2, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'var(--accent)', borderRadius: 2,
            width: `${((idx + 1) / total) * 100}%`,
            transition: 'width 0.35s ease',
          }} />
        </div>
        <button
          onClick={skip}
          aria-label="Pular apresentação"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em',
            color: 'var(--ink-3)', padding: '4px 0', flexShrink: 0,
          }}
        >
          PULAR
        </button>
      </div>

      {/* ── Content: vertically centered ── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 32px',
        width: '100%', maxWidth: 520, margin: '0 auto',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(10px)' : 'translateY(0)',
        overflowY: 'auto',
      }}>
        {/* Illustration */}
        <div style={{ marginBottom: 28, flexShrink: 0 }}>
          <Illo />
        </div>

        {/* Chapter counter */}
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
          color: 'var(--accent)', marginBottom: 16, opacity: 0.75,
        }}>
          {idx + 1} / {total}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(22px, 6.5vw, 34px)', lineHeight: 1.2,
          color: 'var(--ink)', margin: '0 0 22px',
          letterSpacing: '-0.01em', textAlign: 'center',
        }}>
          {title}
        </h1>

        {/* Body lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              margin: 0,
              fontFamily: 'var(--sans)', fontSize: 15.5, color: 'var(--ink-2)',
              lineHeight: 1.65, textAlign: 'center',
            }}>
              {line}
            </p>
          ))}
        </div>

        {/* Project examples pill list */}
        {examples && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            {examples.map(ex => (
              <span key={ex} style={{
                padding: '6px 16px', borderRadius: 999,
                border: '1px solid var(--line-strong)',
                fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5,
                color: 'var(--ink-2)',
              }}>
                {ex}
              </span>
            ))}
          </div>
        )}

        {/* Feature tag chips */}
        {tags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 8 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                padding: '5px 12px', borderRadius: 999,
                background: 'var(--surface-2)',
                fontFamily: 'var(--mono)', fontSize: 10.5,
                letterSpacing: '0.1em', color: 'var(--ink-2)',
              }}>
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{
        flexShrink: 0,
        padding: '0 32px max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 520, margin: '0 auto', width: '100%',
        gap: 16,
      }}>
        {/* Back */}
        <button
          onClick={back}
          style={{
            background: 'none', border: '1px solid var(--line)',
            borderRadius: 999, padding: '12px 22px', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)',
            opacity: idx === 0 ? 0 : 1,
            pointerEvents: idx === 0 ? 'none' : 'auto',
            transition: 'opacity 0.2s', flexShrink: 0,
          }}
        >
          Voltar
        </button>

        {/* Progress dots (clickable) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
          {CHAPTERS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Capítulo ${i + 1}`}
              style={{
                width: i === idx ? 20 : 6, height: 6, borderRadius: 999,
                background: i <= idx ? 'var(--accent)' : 'var(--line-strong)',
                opacity: i < idx ? 0.4 : 1,
                border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                transition: 'width 0.25s ease, background 0.25s ease, opacity 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Next / CTA */}
        <button
          onClick={next}
          style={{
            background: isLast ? 'var(--accent)' : 'var(--surface-2)',
            border: 'none', borderRadius: 999,
            padding: isLast ? '14px 28px' : '12px 22px',
            cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: isLast ? 15 : 14,
            fontWeight: isLast ? 600 : 500,
            color: isLast ? '#fff' : 'var(--ink)',
            boxShadow: isLast ? '0 6px 20px -6px var(--accent)' : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
            flexShrink: 0,
          }}
        >
          {isLast ? (cta ?? 'Começar a guardar') : 'Próximo'}
        </button>
      </div>
    </div>,
    document.body
  )
}
