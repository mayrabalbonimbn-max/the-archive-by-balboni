/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Design tokens (canonical) ──────────────────────────
        accent:        '#E86CB4',
        'accent-press':'#d4549f',
        ink:           '#F2EDE6',
        'ink-2':       '#ABA49A',
        'ink-3':       '#6C665E',
        // hairlines — no opacity modifiers (rgba values)
        line:          'rgba(255,255,255,0.08)',
        'line-strong': 'rgba(255,255,255,0.15)',
        // surfaces — no opacity modifiers
        'surface-1':   'rgba(255,255,255,0.015)',
        'surface-2':   'rgba(255,255,255,0.03)',
        'surface-3':   'rgba(255,255,255,0.05)',

        // ── Legacy aliases (existing components keep working) ──
        brand: {
          blue:      '#E86CB4',
          rose:      '#E86CB4',   // updated: was #f472b6
          rosehover: '#d4549f',   // updated: was #fb7ec4
          violet:    '#c084fc',
        },
        dark: {
          bg:     '#000000',
          card:   '#0a0a0a',      // near-black surface
          card2:  '#0d0d0d',
          border: '#1a1a1a',      // soft border (hex → supports opacity modifiers)
          hover:  '#0f0f0f',      // almost-black hover
          text:   '#F2EDE6',      // warm off-white (was cool #f0f0f0)
          muted:  '#ABA49A',      // ink-2: readable warm gray (was #666666)
          label:  '#6C665E',      // ink-3: meta/captions (was #444444)
        },
      },

      fontFamily: {
        sans:  ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'Times New Roman', 'serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'monospace'],
      },

      animation: {
        'fade-in':   'fadeIn .15s ease-out',
        'fade-up':   'fadeUp .34s cubic-bezier(.22,1,.36,1)',
        'push-in':   'pushIn .3s cubic-bezier(.22,1,.36,1)',
        'sheet-up':  'sheetUp .32s cubic-bezier(.22,1,.36,1)',
        'slide-up':  'slideUp .25s ease-out',
        'like-pop':  'likePop .35s cubic-bezier(0.34,1.56,0.64,1)',
        'badge-in':  'badgeIn .2s ease-out',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0', transform: 'translateY(4px)' },  '100%': { opacity: '1', transform: 'none' } },
        fadeUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' },  '100%': { opacity: '1', transform: 'none' } },
        pushIn:   { '0%': { opacity: '.4', transform: 'translateX(26px)' },'100%': { opacity: '1', transform: 'none' } },
        sheetUp:  { '0%': { transform: 'translateY(100%)' },               '100%': { transform: 'none' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
        likePop:  { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.4)' }, '70%': { transform: 'scale(0.95)' }, '100%': { transform: 'scale(1)' } },
        badgeIn:  { '0%': { opacity: '0', transform: 'scale(0.85)' },      '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
