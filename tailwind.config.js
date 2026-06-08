/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#f472b6',
          rose: '#f472b6',
          rosehover: '#fb7ec4',
          violet: '#c084fc',
        },
        dark: {
          bg: '#000000',
          card: '#0d0d0d',
          card2: '#141414',
          border: '#222222',
          hover: '#161616',
          text: '#f0f0f0',
          muted: '#666666',
          label: '#444444',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'like-pop': 'likePop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'badge-in': 'badgeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        likePop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.4)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        badgeIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
