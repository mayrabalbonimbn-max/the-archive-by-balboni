// screens-today.jsx — Home / Today. Exports TodayScreen to window.
const { useState: useStateT } = React;

function Masthead() {
  const now = new Date('2026-06-08T08:00:00');
  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const hour = now.getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div style={{ padding: '22px 20px 18px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>{dateLine}</div>
      <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 33, lineHeight: 1.08, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em' }}>
        {greet},<br /><span style={{ fontStyle: 'italic' }}>{ME.name.split(' ')[0]}.</span>
      </h1>
      <div style={{ marginTop: 14, fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-3)' }}>
        Day <span style={{ color: 'var(--ink-2)' }}>{ME.stats.daysKept.toLocaleString('en-US')}</span> of your archive · <span style={{ color: 'var(--ink-2)' }}>{ME.stats.entries.toLocaleString('en-US')}</span> entries kept
      </div>
    </div>
  );
}

function TodayPrompt({ onCreate }) {
  return (
    <button onClick={onCreate} style={{
      margin: '0 20px 26px', width: 'calc(100% - 40px)', textAlign: 'left', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 14, padding: '15px 17px', borderRadius: 16,
      border: '1px solid var(--line-strong)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff' }}>
        <Icon name="feather" size={20} stroke={1.8} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 16.5, color: 'var(--ink)', fontStyle: 'italic' }}>What are you keeping today?</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>A note, a photo, a file — to your archive</div>
      </div>
      <div style={{ flex: 1 }} />
      <Icon name="plus" size={20} style={{ color: 'var(--ink-3)' }} />
    </button>
  );
}

function MemoryStrip({ onOpenMemories }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel action="See all" onAction={onOpenMemories}>On this day</SectionLabel>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
        {MEMORIES.map(m => (
          <div key={m.id} onClick={onOpenMemories} style={{ flexShrink: 0, width: 168, cursor: 'pointer' }}>
            {m.type === 'photo' ? (
              <PhotoTile photo={{ tone1: m.tone1, tone2: m.tone2 }} radius={14} style={{ height: 116 }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.55))' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)' }}>{m.yearsAgo} {m.yearsAgo === 1 ? 'YEAR' : 'YEARS'} AGO</div>
                </div>
              </PhotoTile>
            ) : (
              <div style={{ height: 116, borderRadius: 14, border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)', padding: 13, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent)' }}>{m.yearsAgo} {m.yearsAgo === 1 ? 'YEAR' : 'YEARS'} AGO</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.35, color: 'var(--ink-2)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.body}</div>
              </div>
            )}
            <div style={{ marginTop: 8, fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.title}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{m.year}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodayScreen({ nav }) {
  const todays = ENTRIES.filter(e => ['e1', 'e6', 'e2', 'e7'].includes(e.id));
  return (
    <React.Fragment>
      <AppBar
        left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', letterSpacing: '-0.01em' }}>The Archive</span>
        </div>}
        right={<React.Fragment>
          <button onClick={() => nav.go('notices')} style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={19} />
            <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid #000' }} />
          </button>
          <RoundBtn icon="search" onClick={() => nav.go('explore')} />
        </React.Fragment>}
      />
      <Masthead />
      <TodayPrompt onCreate={nav.create} />
      <MemoryStrip onOpenMemories={() => nav.go('memories')} />
      <SectionLabel>From your circle today</SectionLabel>
      <div>
        {todays.map(e => <EntryCard key={e.id} entry={e} onOpen={() => nav.openEntry(e)} />)}
      </div>
      <div style={{ padding: '26px 20px 8px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink-3)' }}>That is today.</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>Come back tomorrow, or keep something now.</div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { TodayScreen });
