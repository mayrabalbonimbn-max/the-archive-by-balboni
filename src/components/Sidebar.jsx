import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// ── Ícones ───────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ profile, size = 'md' }) {
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

// NavLink com estado ativo automático — único componente para todos os itens de nav
function NavItem({ to, end = false, label, Icon, onClick }) {
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

// Botão sem rota (ex: Criar)
function ActionItem({ label, Icon, onClick }) {
  return (
    <button onClick={onClick} className="nav-item">
      <span className="text-dark-muted"><Icon /></span>
      <span className="text-[15px] tracking-[-0.01em]">{label}</span>
    </button>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function Sidebar({ profile, onLogout, onCompose }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  function close() { setMobileOpen(false) }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col items-start h-screen sticky top-0 py-6 px-4 w-[220px] xl:w-[256px] shrink-0 border-r border-dark-border/50 overflow-y-auto">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 ml-1 flex items-center gap-3 group shrink-0"
        >
          <img
            src="/icons/icon-192.png"
            alt="The Archive by Balboni"
            className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:opacity-85 transition-opacity"
          />
          <span className="font-editorial text-[20px] xl:text-[22px] text-dark-text leading-none tracking-tight">
            The Archive
          </span>
        </button>

        {/* Nav principal — 8 itens */}
        <nav className="flex flex-col gap-0.5 w-full">
          <NavItem to="/" end label="Início"       Icon={HomeIcon} />
          <NavItem to="/explore"      label="Explorar"    Icon={ExploreIcon} />
          <ActionItem                 label="Criar"        Icon={PencilIcon} onClick={onCompose} />
          <NavItem to="/archive"      label="Arquivo"     Icon={ArchiveIcon} />
          <NavItem to="/profile"      label="Perfil"      Icon={UserIcon} />
          <NavItem to="/friends"      label="Conexões"    Icon={FriendsIcon} />
          <NavItem to="/notifications" label="Notificações" Icon={BellIcon} />
          <NavItem to="/settings"     label="Ajustes"     Icon={SettingsIcon} />
        </nav>

        {/* Rodapé — avatar + sair */}
        <div className="mt-auto w-full space-y-1 shrink-0">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-hover cursor-pointer transition-all duration-200 w-full"
          >
            <Avatar profile={profile} size="md" />
            <div className="min-w-0 text-left">
              <p className="font-semibold text-sm text-dark-text truncate leading-tight">{profile.name}</p>
              <p className="text-dark-muted text-xs truncate mt-0.5">{profile.handle}</p>
            </div>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-hover transition-all duration-200 w-full text-dark-label hover:text-red-400"
            title="Sair"
          >
            <span className="shrink-0 flex items-center justify-center w-10 h-10"><LogoutIcon /></span>
            <span className="text-[14px] font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-dark-border/60 flex items-center justify-between px-4 py-3">
        <button onClick={() => setMobileOpen(v => !v)} aria-label="Abrir menu">
          <Avatar profile={profile} size="sm" />
        </button>
        <button
          onClick={() => navigate('/')}
          className="font-editorial text-[18px] text-dark-text tracking-tight hover:text-brand-rose transition-colors"
        >
          The Archive
        </button>
        <div className="w-8" />
      </div>

      {/* ── Mobile drawer — 6 itens exatos ──────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="absolute left-0 top-0 h-full w-64 bg-dark-card border-r border-dark-border flex flex-col pt-16">

            {/* Profile header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-border/50 shrink-0">
              <Avatar profile={profile} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-dark-text leading-tight truncate">{profile.name}</p>
                <p className="text-dark-muted text-xs mt-0.5 truncate">{profile.handle}</p>
              </div>
            </div>

            {/* 6 itens — sem rolagem */}
            <nav className="flex flex-col gap-0.5 px-3 py-3 shrink-0">
              <NavItem to="/"               end   label="Início"        Icon={HomeIcon}    onClick={close} />
              <NavItem to="/explore"              label="Explorar"      Icon={ExploreIcon} onClick={close} />
              <NavItem to="/archive"              label="Arquivo"       Icon={ArchiveIcon} onClick={close} />
              <NavItem to="/profile"              label="Perfil"        Icon={UserIcon}    onClick={close} />
              <NavItem to="/friends"              label="Conexões"      Icon={FriendsIcon} onClick={close} />
              <NavItem to="/notifications"        label="Notificações"  Icon={BellIcon}    onClick={close} />
              <NavItem to="/settings"             label="Ajustes"       Icon={SettingsIcon} onClick={close} />
            </nav>

            {/* Sair */}
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
