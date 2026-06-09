import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const TABS = [
  { to: '/',        end: true,  icon: 'today',   label: 'Hoje' },
  { to: '/archive',             icon: 'archive', label: 'Arquivo' },
  { to: '/explore',             icon: 'explore', label: 'Explorar' },
]

const MORE_ITEMS = [
  { to: '/profile',         icon: 'profile',      label: 'Perfil' },
  { to: '/messages',        icon: 'comment',      label: 'Mensagens' },
  { to: '/notifications',   icon: 'bell',         label: 'Avisos' },
  { to: '/friends',         icon: 'people',       label: 'Pessoas' },
  { to: '/capsules',        icon: 'clock',        label: 'Cápsulas' },
  { to: '/archive/stories', icon: 'stories',      label: 'Stories' },
  { to: '/memories',        icon: 'sparkle',      label: 'Memórias' },
  { to: '/calendar',        icon: 'calendar',     label: 'Calendário' },
  { to: '/collections',     icon: 'collections',  label: 'Coleções' },
  { to: '/library',         icon: 'library',      label: 'Arquivos' },
  { to: '/photos',          icon: 'photo',        label: 'Fotografias' },
  { to: '/stats',           icon: 'explore',      label: 'Stats' },
  { to: '/settings',        icon: 'settings',     label: 'Ajustes' },
]

export default function TabBar({ onCompose }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  function goTo(to) {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* Bottom tab bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black"
        style={{ borderTop: '1px solid var(--line)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-3.5 pt-2 pb-1">
          {TABS.slice(0, 2).map(tab => <TabBtn key={tab.to} tab={tab} />)}

          <button
            onClick={onCompose}
            className="flex flex-col items-center justify-center -mt-1"
            aria-label="Nova entrada"
          >
            <div
              className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-white"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 6px 20px -4px var(--accent), 0 0 0 5px rgba(232,108,180,0.14)',
              }}
            >
              <Icon name="feather" size={22} stroke={1.8} />
            </div>
          </button>

          {TABS.slice(2).map(tab => <TabBtn key={tab.to} tab={tab} />)}

          {/* Mais */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-[3px] px-1.5 py-1"
            style={{ color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', width: 60 }}
          >
            <Icon name="more" size={23} stroke={1.6} />
            <span style={{ fontSize: 10.5, fontFamily: 'var(--sans)', fontWeight: 500, letterSpacing: '0.01em' }}>
              Mais
            </span>
          </button>
        </div>
      </div>

      {/* "Mais" bottom sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" style={{ pointerEvents: 'auto' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              background: 'var(--bg)',
              borderTop: '1px solid var(--line)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'env(safe-area-inset-bottom, 12px)',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line-strong)' }} />
            </div>

            <div style={{ padding: '4px 20px 16px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
              MAIS OPÇÕES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '0 12px 16px' }}>
              {MORE_ITEMS.map(item => (
                <MoreBtn key={item.to} item={item} onNavigate={goTo} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TabBtn({ tab }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className="flex flex-col items-center gap-[3px] px-1.5 py-1"
      style={({ isActive }) => ({
        color: isActive ? 'var(--accent)' : 'var(--ink-3)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: 60,
      })}
    >
      {({ isActive }) => (
        <>
          <Icon name={tab.icon} size={23} stroke={isActive ? 1.9 : 1.6} />
          <span style={{
            fontSize: 10.5,
            fontFamily: 'var(--sans)',
            fontWeight: isActive ? 600 : 500,
            letterSpacing: '0.01em',
          }}>
            {tab.label}
          </span>
        </>
      )}
    </NavLink>
  )
}

function MoreBtn({ item, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(item.to)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '14px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: 'var(--surface-2)', color: 'var(--ink-2)',
        fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 500,
        transition: 'background 0.15s',
      }}
    >
      <Icon name={item.icon} size={22} stroke={1.6} />
      <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
    </button>
  )
}
