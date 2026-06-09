import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'

// ── Step definitions ───────────────────────────────────────────────────────────
// route: where to navigate before showing this step (null = stay put)
// target: CSS selector for the spotlight element (null = centered card)

const STEPS = [
  {
    id: 'welcome',
    route: '/',
    target: null,
    title: 'Bem-vinda ao The Archive.',
    parts: [
      { kind: 'text', text: 'O Archive nasceu para pessoas que criam.' },
      { kind: 'text', text: 'Fotógrafos, desenvolvedores, artistas, escritores, estudantes e curiosos.' },
      { kind: 'emph', text: 'Aqui não existem algoritmos agressivos. O objetivo é simples: guardar aquilo que importa.' },
    ],
  },
  {
    id: 'compose',
    route: '/',
    target: '[data-onboarding="compose-btn"]',
    title: 'Tudo começa aqui.',
    parts: [
      { kind: 'haiku', lines: ['Uma ideia.', 'Uma fotografia.', 'Um código.', 'Uma memória.'] },
      { kind: 'text', text: 'Tudo entra no Archive pelo mesmo botão.' },
      { kind: 'emph', text: 'Você não está publicando para um algoritmo. Está registrando algo para o seu futuro.' },
    ],
  },
  {
    id: 'archive',
    route: '/archive',
    target: '[data-onboarding="archive-section"]',
    title: 'Sua biblioteca pessoal.',
    parts: [
      { kind: 'text', text: 'Esta é a seção SEU ARQUIVO — o coração do sistema.' },
      { kind: 'text', text: 'Aqui tudo se organiza automaticamente por área:' },
      { kind: 'bullets', items: ['Memórias', 'Calendário', 'Coleções', 'Arquivos', 'Fotografia', 'Stories'] },
    ],
  },
  {
    id: 'photos',
    route: '/archive',
    target: '[data-onboarding="photo-nav"]',
    title: 'Pensado para fotógrafos.',
    parts: [
      { kind: 'emph', text: 'Fotografias não são apenas imagens. São momentos.' },
      { kind: 'text', text: 'O Archive preserva foto original, câmera, lente e metadados EXIF completos.' },
      { kind: 'text', text: 'Seu trabalho permanece organizado e pesquisável ao longo do tempo.' },
    ],
  },
  {
    id: 'code',
    route: '/',
    target: '[data-onboarding="compose-btn"]',
    title: 'Código também é memória.',
    parts: [
      { kind: 'text', text: 'Publique snippets, estudos e projetos técnicos.' },
      { kind: 'text', text: 'O Sandbox permite executar código diretamente no Archive:' },
      { kind: 'bullets', items: ['Python', 'JavaScript', 'HTML'] },
      { kind: 'text', text: 'Ideal para documentar sua jornada de aprendizado.' },
    ],
  },
  {
    id: 'capsules',
    route: '/capsules',
    target: '[data-onboarding="capsules-page"]',
    title: 'Escreva para seu futuro.',
    parts: [
      { kind: 'emph', text: 'Algumas mensagens precisam esperar.' },
      { kind: 'text', text: 'Você pode criar cápsulas que serão abertas:' },
      { kind: 'bullets', items: ['Daqui 1 mês', 'Daqui 1 ano', 'Em qualquer data escolhida'] },
      { kind: 'text', text: 'Até lá, permanecem guardadas e seladas.' },
    ],
  },
  {
    id: 'profile',
    route: '/profile',
    target: '[data-onboarding="profile-chip"]',
    title: 'Mais que um perfil.',
    parts: [
      { kind: 'text', text: 'Seu perfil é uma mistura de:' },
      { kind: 'bullets', items: ['Diário', 'Portfólio', 'Biblioteca', 'Histórico de projetos'] },
      { kind: 'emph', text: 'Ele mostra não apenas quem você é. Mas aquilo que você construiu ao longo do tempo.' },
    ],
  },
  {
    id: 'calendar',
    route: '/archive',
    target: '[data-onboarding="calendar-nav"]',
    title: 'Navegue pela sua história.',
    parts: [
      { kind: 'text', text: 'Cada dia em que você registrou algo permanece marcado.' },
      { kind: 'haiku', lines: ['Volte para qualquer data.', 'Veja quem você era.', 'Veja o que estava construindo.'] },
    ],
  },
  {
    id: 'memories',
    route: '/archive',
    target: '[data-onboarding="memories-nav"]',
    title: 'O passado continua vivo.',
    parts: [
      { kind: 'text', text: 'O Archive relembra momentos importantes quando eles voltam a acontecer.' },
      { kind: 'text', text: 'Você pode revisitar pensamentos, projetos e fotografias anos depois.' },
      { kind: 'emph', text: 'Não para gerar nostalgia. Mas para perceber sua evolução.' },
    ],
  },
  {
    id: 'home',
    route: '/',
    target: null,
    title: 'Seu canto da internet.',
    parts: [
      { kind: 'text', text: 'O Archive não foi criado para manter você online.' },
      { kind: 'emph', text: 'Foi criado para garantir que aquilo que importa não se perca.' },
      { kind: 'haiku', lines: ['Quando quiser registrar algo,', 'este lugar estará aqui.', 'Sempre.'] },
    ],
  },
]

// ── Spotlight SVG overlay ──────────────────────────────────────────────────────

const PAD = 12
const RADIUS = 14

function SpotlightOverlay({ rect, transitioning }) {
  return (
    <svg
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 9100,
        transition: 'opacity 0.2s ease',
        opacity: transitioning ? 0.6 : 1,
      }}
    >
      <defs>
        <mask id="tour-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {rect && (
            <rect
              x={rect.x - PAD}
              y={rect.y - PAD}
              width={rect.w + PAD * 2}
              height={rect.h + PAD * 2}
              rx={RADIUS}
              fill="black"
            />
          )}
        </mask>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tour-mask)" />
      {rect && !transitioning && (
        <>
          <rect
            x={rect.x - PAD}
            y={rect.y - PAD}
            width={rect.w + PAD * 2}
            height={rect.h + PAD * 2}
            rx={RADIUS}
            fill="none"
            stroke="var(--accent, #e86cb4)"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <rect
            x={rect.x - PAD - 5}
            y={rect.y - PAD - 5}
            width={rect.w + PAD * 2 + 10}
            height={rect.h + PAD * 2 + 10}
            rx={RADIUS + 4}
            fill="none"
            stroke="var(--accent, #e86cb4)"
            strokeWidth="1"
            strokeOpacity="0.18"
          />
        </>
      )}
    </svg>
  )
}

// ── Card positioning ────────────────────────────────────────────────────────────

const CARD_W = 390
const CARD_H_ESTIMATE = 310

function computeCardStyle(rect, isMobile) {
  if (isMobile || !rect) {
    return {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? 'calc(100% - 32px)' : CARD_W,
      maxWidth: CARD_W,
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const gap = 22

  const spaceRight = vw - (rect.x + rect.w)
  const spaceLeft = rect.x
  const targetCY = rect.y + rect.h / 2

  let x
  if (spaceRight >= CARD_W + gap + 32) {
    x = rect.x + rect.w + PAD + gap
  } else if (spaceLeft >= CARD_W + gap + 32) {
    x = rect.x - PAD - gap - CARD_W
  } else {
    x = (vw - CARD_W) / 2
  }

  let y = targetCY - CARD_H_ESTIMATE / 2
  y = Math.max(24, Math.min(y, vh - CARD_H_ESTIMATE - 24))

  return { position: 'fixed', left: x, top: y, width: CARD_W }
}

// ── Body part renderer ─────────────────────────────────────────────────────────

function BodyPart({ part }) {
  if (part.kind === 'text') {
    return (
      <p style={{ margin: '0 0 10px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>
        {part.text}
      </p>
    )
  }
  if (part.kind === 'emph') {
    return (
      <p style={{ margin: '0 0 10px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.55 }}>
        {part.text}
      </p>
    )
  }
  if (part.kind === 'haiku') {
    return (
      <div style={{ margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {part.lines.map((line, i) => (
          <span key={i} style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink)', lineHeight: 1.55, display: 'block' }}>
            {line}
          </span>
        ))}
      </div>
    )
  }
  if (part.kind === 'bullets') {
    return (
      <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {part.items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    )
  }
  return null
}

// ── Tour card ─────────────────────────────────────────────────────────────────

function TourCard({ step, stepIdx, total, rect, isMobile, onBack, onNext, onSkip, isLast, transitioning }) {
  const cardStyle = computeCardStyle(rect, isMobile)
  const isFirst = stepIdx === 0

  return (
    <div
      style={{
        ...cardStyle,
        zIndex: 9200,
        background: 'var(--bg)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
        pointerEvents: transitioning ? 'none' : 'auto',
      }}
    >
      {/* Top accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, var(--accent) 0%, transparent 100%)' }} />

      <div style={{ padding: '22px 24px 20px' }}>
        {/* Step counter + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
            {stepIdx + 1} / {total}
          </span>
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', padding: '2px 0', opacity: 0.7 }}
          >
            PULAR TOUR
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'var(--line)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((stepIdx + 1) / total) * 100}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.35s ease',
          }} />
        </div>

        {/* Title */}
        <h2 style={{
          margin: '0 0 14px',
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(20px, 5vw, 26px)',
          color: 'var(--ink)',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          {step.title}
        </h2>

        {/* Body */}
        <div style={{ marginBottom: 20 }}>
          {step.parts.map((part, i) => <BodyPart key={i} part={part} />)}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onBack}
            disabled={isFirst}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid var(--line)',
              background: 'transparent', cursor: isFirst ? 'default' : 'pointer',
              fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)',
              opacity: isFirst ? 0 : 1,
              transition: 'opacity 0.15s',
              flexShrink: 0,
            }}
          >
            Voltar
          </button>

          {/* Progress dots */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIdx ? 18 : 5,
                  height: 5,
                  borderRadius: 99,
                  background: i === stepIdx ? 'var(--accent)' : 'var(--line-strong)',
                  transition: 'width 0.25s ease, background 0.25s ease',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            style={{
              padding: isLast ? '10px 22px' : '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: isLast ? 'var(--accent)' : 'var(--surface-2)',
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              fontSize: 13,
              fontWeight: isLast ? 600 : 500,
              color: isLast ? '#fff' : 'var(--ink)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {isLast ? 'Entrar no Archive' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingTour({ onComplete }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const roRef = useRef(null)
  const findTimerRef = useRef(null)

  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  // Find element with retries (needed after navigation)
  const findAndSetRect = useCallback((selector) => {
    clearInterval(findTimerRef.current)
    if (!selector || isMobile) { setRect(null); return }

    let attempts = 0
    findTimerRef.current = setInterval(() => {
      const el = document.querySelector(selector)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ x: r.left, y: r.top, w: r.width, h: r.height })
        clearInterval(findTimerRef.current)
      } else if (++attempts >= 15) {
        setRect(null)
        clearInterval(findTimerRef.current)
      }
    }, 80)
  }, [isMobile])

  useEffect(() => {
    findAndSetRect(step.target)
    return () => clearInterval(findTimerRef.current)
  }, [step.target, stepIdx, findAndSetRect])

  // ResizeObserver on target element
  useEffect(() => {
    roRef.current?.disconnect()
    if (!step.target || isMobile) return
    const el = document.querySelector(step.target)
    if (!el) return
    roRef.current = new ResizeObserver(() => findAndSetRect(step.target))
    roRef.current.observe(el)
    return () => roRef.current?.disconnect()
  }, [step.target, isMobile, findAndSetRect])

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setRect(null)
      else findAndSetRect(step.target)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [step.target, findAndSetRect])

  function changeStep(newIdx) {
    const nextStep = STEPS[newIdx]
    setTransitioning(true)
    setRect(null)
    clearInterval(findTimerRef.current)

    const needsNav = nextStep.route && location.pathname !== nextStep.route.split('?')[0]
    const navDelay = needsNav ? 320 : 160

    if (needsNav) navigate(nextStep.route)
    else if (nextStep.route && nextStep.route !== location.pathname + location.search) {
      navigate(nextStep.route)
    }

    setTimeout(() => {
      setStepIdx(newIdx)
      setTransitioning(false)
    }, navDelay)
  }

  function next() {
    if (isLast) { onComplete(); return }
    changeStep(stepIdx + 1)
  }

  function back() {
    if (stepIdx > 0) changeStep(stepIdx - 1)
  }

  function skip() { onComplete() }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepIdx, isLast])

  const displayRect = !transitioning && !isMobile ? rect : null

  return createPortal(
    <>
      {/* Click blocker */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9099, cursor: 'default' }} />

      <SpotlightOverlay rect={displayRect} transitioning={transitioning} />

      <TourCard
        step={step}
        stepIdx={stepIdx}
        total={STEPS.length}
        rect={displayRect}
        isMobile={isMobile}
        onBack={back}
        onNext={next}
        onSkip={skip}
        isLast={isLast}
        transitioning={transitioning}
      />
    </>,
    document.body
  )
}
