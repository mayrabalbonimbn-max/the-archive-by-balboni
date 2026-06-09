import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useState } from 'react'
import Icon from './ui/Icon'

// ── Mobile drawer icons ───────────────────────────────────────────────────────

const HomeIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const ExploreIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const PencilIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/>
  </svg>
)

const ArchiveIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
)

const UserIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const FriendsIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)

const BellIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)

const SettingsIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

// ── Mobile avatar helper ───────────────────────────────────────────────────────

function MobileAvatar({ profile, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base' }
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden shrink-0`}>
      {profile.avatar ? (
        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full avatar-gradient flex items-center justify-center text-white font-bold">
          {profile.name?.[0] || 'M'}
        </div>
      )}
    </div>
  )
}

// ── Mobile NavLink ────────────────────────────────────────────────────────────

function MobileNavItem({ to, end = false, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className={`transition-colors ${isActive ? 'text-brand-rose' : 'text-dark-muted'}`}>
            <Icon filled={isActive} />
          </span>
          <span className="text-[15px] tracking-[-0.01em]">{label}</span>
          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-rose" />}
        </>
      )}
    </NavLink>
  )
}

function MobileActionItem({ label, Icon, onClick }) {
  return (
    <button onClick={onClick} className="nav-item">
      <span className="text-dark-muted"><Icon /></span>
      <span className="text-[15px] tracking-[-0.01em]">{label}</span>
    </button>
  )
}

// ── Desktop sidebar nav item ──────────────────────────────────────────────────

function DSidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
        textAlign: 'left',
        background: active ? 'rgba(232,108,180,0.12)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--ink-2)',
        fontFamily: 'var(--sans)', fontSize: 14, fontWeight: active ? 600 : 500,
        transition: 'background .15s',
        position: 'relative',
      }}
    >
      <Icon name={icon} size={19} stroke={active ? 1.9 : 1.6} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
      )}
    </button>
  )
}

// ── Desktop avatar ────────────────────────────────────────────────────────────

function DAvatar({ profile, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--line)' }}>
      {profile.avatar ? (
        <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #c084fc, #E86CB4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: size * 0.4, color: '#fff', fontWeight: 600 }}>
            {profile.name?.[0] || 'M'}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Sidebar({ profile, onLogout, onCompose }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const archiveSection = params.get('s') ?? 'overview'

  function close() { setMobileOpen(false) }

  // Active state helpers
  function isToday() { return location.pathname === '/' }
  function isExplore() { return location.pathname === '/explore' }
  function isPeople() { return location.pathname === '/friends' }
  function isNotices() { return location.pathname === '/notifications' }
  function isArchiveSection(s) {
    if (location.pathname !== '/archive') return false
    if (s === 'overview') return archiveSection === 'overview'
    return archiveSection === s
  }
  function isProfile() { return location.pathname === '/profile' }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0"
        style={{ width: 264, background: 'var(--bg)', borderRight: '1px solid var(--line)' }}
      >
        {/* Brand wordmark */}
        <div style={{ padding: '26px 22px 18px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          <button
            onClick={() => navigate('/')}
            style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '-0.01em', lineHeight: 1 }}
          >
            The Archive
          </button>
        </div>

        {/* Keep something button */}
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={onCompose}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 9, padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#fff',
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
              boxShadow: '0 6px 20px -6px var(--accent)',
            }}
          >
            <Icon name="feather" size={18} stroke={1.8} />
            Guardar algo
          </button>
        </div>

        {/* Primary nav */}
        <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <DSidebarItem icon="today"   label="Hoje"     active={isToday()}   onClick={() => navigate('/')} />
          <DSidebarItem icon="explore" label="Explorar" active={isExplore()} onClick={() => navigate('/explore')} />
          <DSidebarItem icon="people"  label="Pessoas"  active={isPeople()}  onClick={() => navigate('/friends')} />
          <DSidebarItem icon="bell"    label="Avisos"   active={isNotices()} onClick={() => navigate('/notifications')} badge />
        </nav>

        {/* YOUR ARCHIVE group */}
        <div style={{ padding: '20px 24px 8px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>
          SEU ARQUIVO
        </div>
        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <DSidebarItem icon="archive"     label="Visão geral" active={isArchiveSection('overview')}    onClick={() => navigate('/archive')} />
          <DSidebarItem icon="sparkle"     label="Memórias"    active={isArchiveSection('memories')}    onClick={() => navigate('/archive?s=memories')} />
          <DSidebarItem icon="calendar"    label="Calendário"  active={isArchiveSection('calendar')}    onClick={() => navigate('/archive?s=calendar')} />
          <DSidebarItem icon="collections" label="Coleções"    active={isArchiveSection('collections')} onClick={() => navigate('/archive?s=collections')} />
          <DSidebarItem icon="library"     label="Biblioteca"  active={isArchiveSection('library')}     onClick={() => navigate('/archive?s=library')} />
          <DSidebarItem icon="photo"       label="Fotografia"  active={isArchiveSection('photos')}      onClick={() => navigate('/archive?s=photos')} />
        </nav>

        <div style={{ flex: 1 }} />

        {/* User chip */}
        <div style={{ margin: 12 }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 12,
              border: `1px solid ${isProfile() ? 'var(--line-strong)' : 'var(--line)'}`,
              cursor: 'pointer',
              background: isProfile() ? 'var(--surface-2)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 11,
            }}
          >
            <DAvatar profile={profile} size={36} />
            <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                {profile.handle}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); navigate('/settings') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, flexShrink: 0 }}
              title="Ajustes"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
          </button>

          {/* Logout — subtle, small */}
          <button
            onClick={onLogout}
            style={{
              width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 10,
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)',
              transition: 'color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="absolute left-0 top-0 h-full w-64 bg-dark-card border-r border-dark-border flex flex-col pt-16">

            <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-border/50 shrink-0">
              <MobileAvatar profile={profile} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-dark-text leading-tight truncate">{profile.name}</p>
                <p className="text-dark-muted text-xs mt-0.5 truncate">{profile.handle}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-0.5 px-3 py-3 shrink-0">
              <MobileNavItem to="/"               end   label="Início"        Icon={HomeIcon}    onClick={close} />
              <MobileNavItem to="/explore"              label="Explorar"      Icon={ExploreIcon} onClick={close} />
              <MobileNavItem to="/archive"              label="Arquivo"       Icon={ArchiveIcon} onClick={close} />
              <MobileNavItem to="/profile"              label="Perfil"        Icon={UserIcon}    onClick={close} />
              <MobileNavItem to="/friends"              label="Conexões"      Icon={FriendsIcon} onClick={close} />
              <MobileNavItem to="/notifications"        label="Notificações"  Icon={BellIcon}    onClick={close} />
              <MobileNavItem to="/settings"             label="Ajustes"       Icon={SettingsIcon} onClick={close} />
            </nav>

            <div className="mt-auto px-3 pb-8 pt-3 border-t border-dark-border/50 shrink-0">
              <button
                onClick={() => { close(); onLogout() }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-hover transition-colors w-full text-dark-muted hover:text-red-400"
              >
                <LogoutIcon />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
