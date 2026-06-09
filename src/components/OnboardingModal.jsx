import { useState } from 'react'

const SLIDES = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
        <line x1="14" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="30" x2="22" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    headline: 'Um lugar só seu.',
    sub: 'O Archive é seu espaço para guardar pensamentos, fotos, arquivos, códigos e memórias — e conversar com pessoas próximas.',
    detail: null,
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    headline: 'Guardar algo.',
    sub: 'Escolha o tipo de entrada de acordo com o que você quer registrar.',
    detail: [
      { label: 'Nota',       desc: 'um pensamento breve' },
      { label: 'Ensaio',     desc: 'escrita mais longa' },
      { label: 'Foto',       desc: 'um momento visual' },
      { label: 'Documento',  desc: 'PDF' },
      { label: 'Código',     desc: 'trecho de código' },
      { label: 'Arquivo',    desc: 'script, markdown, etc.' },
      { label: 'Cápsula',    desc: 'mensagem para o futuro' },
    ],
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2"/>
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
        <circle cx="24" cy="24" r="2" fill="currentColor"/>
      </svg>
    ),
    headline: 'Você decide quem vê.',
    sub: 'Cada entrada tem um nível de privacidade. Você escolhe na hora de salvar.',
    detail: [
      { label: 'Privado',  desc: 'só você vê' },
      { label: 'Círculo',  desc: 'pessoas que você segue' },
      { label: 'Público',  desc: 'qualquer usuário do Archive' },
    ],
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="16" cy="20" r="6" stroke="currentColor" strokeWidth="2"/>
        <circle cx="32" cy="20" r="6" stroke="currentColor" strokeWidth="2"/>
        <path d="M4 38c0-6.627 5.373-12 12-12h16c6.627 0 12 5.373 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    headline: 'Pessoas próximas.',
    sub: 'Você pode seguir pessoas, adicionar amigos e interagir com as entradas delas.',
    detail: [
      { label: 'Seguir',     desc: 'acompanhar o que alguém publica' },
      { label: 'Amizade',    desc: 'acesso mútuo ao Círculo' },
      { label: 'Comentar',   desc: 'responder entradas' },
      { label: '@mencionar', desc: 'chamar alguém numa entrada' },
    ],
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="3" stroke="currentColor" strokeWidth="2"/>
        <line x1="8" y1="18" x2="40" y2="18" stroke="currentColor" strokeWidth="2"/>
        <line x1="20" y1="8" x2="20" y2="18" stroke="currentColor" strokeWidth="2"/>
        <line x1="28" y1="8" x2="28" y2="18" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    headline: 'Tudo tem seu lugar.',
    sub: 'O Archive organiza o que você guarda para facilitar revisitar.',
    detail: [
      { label: 'Fotografias',  desc: 'suas fotos em um só lugar' },
      { label: 'Biblioteca',   desc: 'arquivos e documentos' },
      { label: 'Tags',         desc: 'para organizar por tema' },
      { label: 'Memórias',     desc: 'o que você guardou nessa data em outros anos' },
      { label: 'Calendário',   desc: 'navegue pelo seu passado por data' },
    ],
  },
]

export default function OnboardingModal({ onComplete }) {
  const [idx, setIdx] = useState(0)
  const slide = SLIDES[idx]
  const isLast = idx === SLIDES.length - 1

  function next() {
    if (isLast) { onComplete(); return }
    setIdx(i => i + 1)
  }
  function prev() { if (idx > 0) setIdx(i => i - 1) }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--sans)',
    }}>
      {/* Top bar: dots + skip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(20px, calc(env(safe-area-inset-top, 0px) + 14px)) 24px 0',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 99,
              background: i === idx ? 'var(--accent)' : 'var(--line-strong)',
              transition: 'width .3s ease, background .3s ease',
            }} />
          ))}
        </div>
        <button
          onClick={onComplete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.05em', padding: '4px 0' }}
        >
          PULAR
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 32px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {/* Icon */}
        <div style={{ color: 'var(--accent)', marginBottom: 28, opacity: 0.85 }}>
          {slide.icon}
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(28px, 8vw, 40px)', lineHeight: 1.15,
          color: 'var(--ink)', margin: '0 0 16px', letterSpacing: '-0.01em',
        }}>
          {slide.headline}
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 15.5, color: 'var(--ink-2)',
          lineHeight: 1.65, margin: '0 0 28px',
        }}>
          {slide.sub}
        </p>

        {/* Detail list */}
        {slide.detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slide.detail.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5,
                  color: 'var(--accent)', minWidth: 100, flexShrink: 0,
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5,
                }}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        padding: '0 32px max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        maxWidth: 480, margin: '0 auto', width: '100%',
      }}>
        {/* Back */}
        <button
          onClick={prev}
          style={{
            background: 'none', border: '1px solid var(--line-strong)',
            borderRadius: 999, padding: '12px 22px', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)',
            opacity: idx === 0 ? 0 : 1, pointerEvents: idx === 0 ? 'none' : 'auto',
            transition: 'opacity .2s',
          }}
        >
          Voltar
        </button>

        {/* Next / Começar */}
        <button
          onClick={next}
          style={{
            flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 999,
            padding: '14px 28px', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, color: '#fff',
            letterSpacing: '0.01em',
          }}
        >
          {isLast ? 'Começar' : 'Próximo'}
        </button>
      </div>
    </div>
  )
}
