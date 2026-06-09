// components.jsx — shared UI for The Archive. Exports to window.
const { useState } = React;

function Avatar({ person, size = 38, ring = false }) {
  const tone = person.tone || person.avatar?.tone || '#E86CB4';
  const initials = person.initials || person.avatar?.initials || '··';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.04)',
      border: ring ? `1.5px solid ${tone}` : '1px solid rgba(255,255,255,0.12)',
      color: tone, fontFamily: 'var(--serif)', fontSize: size * 0.4,
      fontStyle: 'italic', letterSpacing: '-0.02em', fontWeight: 500,
    }}>{initials}</div>
  );
}

function AppBar({ left, title, right, sub }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      paddingTop: 58, background: 'linear-gradient(#000 78%, rgba(0,0,0,0.96))',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 20px 12px', gap: 12, minHeight: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>{left}</div>
        {title && <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic', letterSpacing: '-0.01em' }}>{title}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{right}</div>
      </div>
      <div style={{ height: 1, background: 'var(--line)' }} />
    </div>
  );
}

function RoundBtn({ icon, onClick, active, size = 38, accent = false }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: accent ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
      color: accent ? '#fff' : (active ? 'var(--accent)' : 'var(--ink-2)'),
      transition: 'all .18s ease',
    }}>
      <Icon name={icon} size={size * 0.5} />
    </button>
  );
}

function TabBar({ active, onNav, onCreate }) {
  const tabs = [
    { id: 'today', icon: 'today', label: 'Today' },
    { id: 'archive', icon: 'archive', label: 'Archive' },
    { id: 'create', icon: 'plus', label: '' },
    { id: 'explore', icon: 'explore', label: 'Explore' },
    { id: 'profile', icon: 'profile', label: 'You' },
  ];
  return (
    <div style={{
      flexShrink: 0, paddingBottom: 26, paddingTop: 9,
      background: '#000',
      borderTop: '1px solid var(--line)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', padding: '9px 14px 26px',
    }}>
      {tabs.map(t => {
        if (t.id === 'create') {
          return (
            <button key="create" onClick={onCreate} style={{
              width: 46, height: 46, marginTop: -2, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px -4px var(--accent), 0 0 0 5px color-mix(in srgb, var(--accent) 14%, transparent)',
            }}>
              <Icon name="feather" size={22} stroke={1.8} />
            </button>
          );
        }
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? 'var(--accent)' : 'var(--ink-3)', width: 60,
          }}>
            <Icon name={t.icon} size={23} stroke={on ? 1.9 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, letterSpacing: '0.01em', fontFamily: 'var(--sans)' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ children, active, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
      fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, letterSpacing: '0.01em',
      whiteSpace: 'nowrap', transition: 'all .16s ease',
      border: `1px solid ${active ? 'transparent' : 'var(--line-strong)'}`,
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--ink-2)',
    }}>{children}</button>
  );
}

function PhotoTile({ photo, radius = 14, style = {}, children }) {
  return (
    <div style={{
      position: 'relative', borderRadius: radius, overflow: 'hidden',
      background: `linear-gradient(150deg, ${photo.tone1} 0%, ${photo.tone2} 100%)`,
      border: '1px solid rgba(255,255,255,0.06)', ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 78% 12%, rgba(255,255,255,0.10), transparent 55%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2780%27 height=%2780%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%2780%27 height=%2780%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")' }} />
      {children}
    </div>
  );
}

function FileBadge({ kind, tone }) {
  const map = { PDF: 'pdf', PY: 'code', Python: 'code', MD: 'markdown', Markdown: 'markdown', CODE: 'code' };
  const icon = map[kind] || 'note';
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 9, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-strong)', color: tone || 'var(--ink-2)',
    }}>
      <Icon name={icon} size={20} />
    </div>
  );
}

function SectionLabel({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{children}</div>
      {action && <button onClick={onAction} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>{action}</button>}
    </div>
  );
}

function TypeTag({ type }) {
  const labels = { note: 'Note', article: 'Essay', photo: 'Photograph', pdf: 'Document', code: 'Code', link: 'Link' };
  const icons = { note: 'note', article: 'feather', photo: 'image', pdf: 'pdf', code: 'code', link: 'link' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
      <Icon name={icons[type]} size={13} /> {labels[type]}
    </span>
  );
}

Object.assign(window, { Avatar, AppBar, RoundBtn, TabBar, Chip, PhotoTile, FileBadge, SectionLabel, TypeTag });
