// screens-archive.jsx — Personal Archive + Memories / Calendar / Collections / Library / Photography
const { useState: useStateA } = React;

const ARCHIVE_SECTIONS = [
  { id: 'overview', label: 'Archive' },
  { id: 'memories', label: 'Memories' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'collections', label: 'Collections' },
  { id: 'library', label: 'Library' },
  { id: 'photography', label: 'Photos' },
];

function ArchiveSubnav({ section, onSelect }) {
  return (
    <div style={{ position: 'sticky', top: 92, zIndex: 20, background: '#000', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 22, overflowX: 'auto', padding: '0 20px', scrollbarWidth: 'none' }}>
        {ARCHIVE_SECTIONS.map(s => {
          const on = s.id === section;
          return (
            <button key={s.id} onClick={() => onSelect(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '13px 0 11px', position: 'relative', whiteSpace: 'nowrap', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: on ? 600 : 500, color: on ? 'var(--ink)' : 'var(--ink-3)' }}>
              {s.label}
              {on && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--accent)', borderRadius: 2 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Overview (the personal archive) ──
function OverviewSection({ nav }) {
  const [filter, setFilter] = useStateA('all');
  const types = [['all', 'Everything'], ['note', 'Notes'], ['article', 'Essays'], ['photo', 'Photos'], ['pdf', 'Documents'], ['code', 'Code']];
  const mine = ENTRIES.filter(e => e.author === 'me');
  const shown = filter === 'all' ? mine : mine.filter(e => e.type === filter);
  return (
    <div>
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar person={ME} size={56} ring />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{ME.name}</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>@{ME.handle} · {ME.stats.entries.toLocaleString('en-US')} entries · {ME.stats.collections} collections</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 20px 16px', scrollbarWidth: 'none' }}>
        {types.map(([id, label]) => <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
      </div>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {shown.map(e => <EntryCard key={e.id} entry={e} showAuthor={false} onOpen={() => nav.openEntry(e)} />)}
      </div>
    </div>
  );
}

// ── Memories ──
function MemoriesSection({ nav }) {
  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ padding: '18px 20px 8px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 10 }}>ON THIS DAY · JUNE 8</div>
        <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 26, lineHeight: 1.15, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em' }}>What you kept,<br /><span style={{ fontStyle: 'italic' }}>on other Junes.</span></h2>
      </div>
      <div style={{ padding: '14px 20px 0' }}>
        {MEMORIES.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', gap: 16, paddingBottom: i === MEMORIES.length - 1 ? 0 : 22 }}>
            <div style={{ flexShrink: 0, width: 46, textAlign: 'right', paddingTop: 2 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--accent)', fontStyle: 'italic' }}>{m.yearsAgo}y</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{m.year}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, position: 'relative', paddingLeft: 18, borderLeft: '1px solid var(--line)', paddingBottom: 4 }}>
              <div style={{ position: 'absolute', left: -4.5, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              {m.type === 'photo' && <PhotoTile photo={{ tone1: m.tone1, tone2: m.tone2 }} style={{ height: 150, marginBottom: 10 }} />}
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', marginBottom: 4 }}>{m.title}</div>
              <p style={{ margin: 0, fontFamily: 'var(--sans)', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{m.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar ──
function CalendarSection({ nav }) {
  const [sel, setSel] = useStateA(8);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const firstDow = 0; // June 1 2026 is a Monday-ish; start grid offset
  const offset = 1; // June 1, 2026 = Monday → after Sun
  const selEntries = ENTRIES.filter(e => new Date(e.date + 'T00:00:00').getDate() === sel).slice(0, 3);
  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--ink)', fontWeight: 400 }}>June <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>2026</span></h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <RoundBtn icon="back" size={34} /><RoundBtn icon="chevron" size={34} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '0 16px' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', padding: '4px 0 8px' }}>{d}</div>)}
        {Array.from({ length: offset }).map((_, i) => <div key={'o' + i} />)}
        {days.map(d => {
          const density = CAL_DENSITY[d] || 0;
          const on = d === sel;
          return (
            <button key={d} onClick={() => setSel(d)} style={{ aspectRatio: '1', border: 'none', cursor: 'pointer', borderRadius: 11, background: on ? 'var(--accent)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0 }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: on ? '#fff' : (density ? 'var(--ink)' : 'var(--ink-3)'), fontWeight: on ? 600 : 400 }}>{d}</span>
              <span style={{ display: 'flex', gap: 2, height: 4 }}>
                {Array.from({ length: density }).map((_, i) => <span key={i} style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: on ? 'rgba(255,255,255,0.85)' : 'var(--accent)' }} />)}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 18, borderTop: '1px solid var(--line)' }}>
        <div style={{ padding: '14px 20px 4px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>JUNE {sel} · {selEntries.length} {selEntries.length === 1 ? 'ENTRY' : 'ENTRIES'}</div>
        {selEntries.length ? selEntries.map(e => <EntryCard key={e.id} entry={e} showAuthor={false} onOpen={() => nav.openEntry(e)} />) : <div style={{ padding: '24px 20px', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-3)' }}>Nothing kept this day. A quiet one.</div>}
      </div>
    </div>
  );
}

// ── Collections ──
function CollectionsSection({ nav }) {
  return (
    <div style={{ padding: '18px 16px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {COLLECTIONS.map(c => (
          <div key={c.id} onClick={() => nav.openCollection && nav.openCollection(c)} style={{ cursor: 'pointer', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.015)' }}>
            <div style={{ height: 88, background: `linear-gradient(150deg, ${c.tone}, #0c0c0e)`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 11 }}>
              {c.pinned && <div style={{ position: 'absolute', top: 10, right: 10, color: 'var(--accent)' }}><Icon name="pin" size={15} /></div>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)' }}>{c.kind.toUpperCase()}</span>
            </div>
            <div style={{ padding: '11px 12px 14px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16.5, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.desc}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 8 }}>{c.count} entries</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Library ──
function LibrarySection({ nav }) {
  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ padding: '16px 20px 12px', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>Books, documents, notes & code — everything readable, kept in one place.</div>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {LIBRARY.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
            <div style={{ width: 38, height: 50, borderRadius: 5, flexShrink: 0, background: `linear-gradient(160deg, ${item.tone}33, #111)`, border: `1px solid ${item.tone}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.tone }}>
              <Icon name={item.kind === 'PDF' ? 'pdf' : item.kind === 'MD' ? 'markdown' : 'code'} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--ink)' }}>{item.title}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1 }}>{item.author}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                <div style={{ flex: 1, maxWidth: 120, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${item.progress * 100}%`, height: '100%', background: 'var(--accent)' }} />
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{item.meta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Photography ──
function PhotographySection({ nav }) {
  return (
    <div style={{ padding: '16px 3px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
        {PHOTOS.map(ph => (
          <PhotoTile key={ph.id} photo={ph} radius={3} style={{ aspectRatio: '1' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 7, opacity: 0, transition: 'opacity .2s', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#fff' }}>{ph.date}</span>
            </div>
          </PhotoTile>
        ))}
      </div>
    </div>
  );
}

function ArchiveScreen({ nav, section, setSection }) {
  const Body = { overview: OverviewSection, memories: MemoriesSection, calendar: CalendarSection, collections: CollectionsSection, library: LibrarySection, photography: PhotographySection }[section] || OverviewSection;
  return (
    <React.Fragment>
      <AppBar
        left={<span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>Your Archive</span>}
        right={<RoundBtn icon="search" onClick={() => nav.go('explore')} />}
      />
      <ArchiveSubnav section={section} onSelect={setSection} />
      <Body nav={nav} />
    </React.Fragment>
  );
}

Object.assign(window, { ArchiveScreen });
