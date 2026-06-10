import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { api } from '../../utils/api'

const TABS = [
  { to: '/',        end: true,  icon: 'today',   label: 'Hoje' },
  { to: '/archive',             icon: 'archive', label: 'Arquivo' },
  // compose button goes here (rendered inline)
  { to: '/explore',             icon: 'explore', label: 'Explorar' },
  { to: '/profile',             icon: 'profile', label: 'Você' },
]

export default function TabBar({ onCompose }) {
  const [dmUnread, setDmUnread] = useState(0)
  const location = useLocation()

  useEffect(() => {
    // Reset when entering messages
    if (location.pathname.startsWith('/messages')) {
      setDmUnread(0)
      return
    }
    api.get('/conversations')
      .then(convs => setDmUnread(convs.filter(c => c.unread > 0).length))
      .catch(() => {})
  }, [location.pathname])

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black"
      style={{ borderTop: '1px solid var(--line)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-3.5 pt-2 pb-1">
        {/* Hoje, Arquivo */}
        {TABS.slice(0, 2).map(tab => <TabBtn key={tab.to} tab={tab} />)}

        {/* Criar */}
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

        {/* Explorar */}
        <TabBtn tab={TABS[2]} />

        {/* Você — com badge de DMs não lidas */}
        <TabBtn tab={TABS[3]} badge={dmUnread > 0} />
      </div>
    </div>
  )
}

function TabBtn({ tab, badge }) {
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
        textDecoration: 'none',
        position: 'relative',
      })}
    >
      {({ isActive }) => (
        <>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Icon name={tab.icon} size={23} stroke={isActive ? 1.9 : 1.6} />
            {badge && (
              <span style={{
                position: 'absolute', top: -2, right: -4,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)',
                border: '1.5px solid #000',
              }} />
            )}
          </div>
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
