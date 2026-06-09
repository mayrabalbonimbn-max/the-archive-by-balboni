// desktop-app.jsx — desktop shell, rail, modals, nav, mount.
const { useState: useStateDA, useEffect: useEffectDA } = React;

/* ---------------- Sidebar ---------------- */
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 12px', borderRadius: 10,
      border: 'none', cursor: 'pointer', textAlign: 'left',
      background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: active ? 600 : 500,
      transition: 'background .15s',
    }}>
      <Icon name={icon} size={19} stroke={active ? 1.9 : 1.6} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
    </button>
  );
}

function Sidebar({ view, nav }) {
  const primary = [['today', 'today', 'Today'], ['explore', 'explore', 'Explore'], ['people', 'people', 'People'], ['notices', 'bell', 'Notices']];
  const archive = [['archive', 'archive', 'Overview'], ['memories', 'sparkle', 'Memories'], ['calendar', 'calendar', 'Calendar'], ['collections', 'collections', 'Collections'], ['library', 'library', 'Library'], ['photography', 'photo', 'Photography']];
  return (
    <aside style={{ width: 264, flexShrink: 0, height: '100vh', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '26px 22px 18px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>The Archive</span>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <button onClick={nav.create} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 6px 20px -6px var(--accent)' }}>
          <Icon name="feather" size={18} stroke={1.8} />Keep something
        </button>
      </div>
      <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {primary.map(([v, ic, l]) => <NavItem key={v} icon={ic} label={l} active={view === v} onClick={() => nav.go(v)} badge={v === 'notices'} />)}
      </nav>
      <div style={{ padding: '20px 24px 8px', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>YOUR ARCHIVE</div>
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {archive.map(([v, ic, l]) => <NavItem key={v} icon={ic} label={l} active={view === v} onClick={() => nav.go(v)} />)}
      </nav>
      <div style={{ flex: 1 }} />
      <button onClick={() => nav.go('profileSelf')} style={{ margin: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', cursor: 'pointer', background: view === 'profileSelf' ? 'var(--surface-2)' : 'transparent', display: 'flex', alignItems: 'center', gap: 11 }}>
        <Avatar person={ME} size={36} ring />
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{ME.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>@{ME.handle}</div>
        </div>
      </button>
    </aside>
  );
}

/* ---------------- Right rail ---------------- */
function RailCard({ title, action, onAction, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{title}</div>
        {action && <button onClick={onAction} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{action}</button>}
      </div>
      {children}
    </div>
  );
}

function TodayRail({ nav }) {
  return (
    <div>
      <RailCard title="On this day" action="See all" onAction={() => nav.go('memories')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MEMORIES.map(m => (
            <div key={m.id} onClick={() => nav.go('memories')} style={{ cursor: 'pointer' }}>
              {m.type === 'photo'
                ? <PhotoTile photo={{ tone1: m.tone1, tone2: m.tone2 }} radius={12} style={{ height: 96 }}><div style={{ position: 'absolute', left: 11, bottom: 9, fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--accent)' }}>{m.yearsAgo} {m.yearsAgo === 1 ? 'YEAR' : 'YEARS'} AGO</div></PhotoTile>
                : <div style={{ borderRadius: 12, border: '1px solid var(--line-strong)', background: 'var(--surface-1)', padding: 12 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6 }}>{m.yearsAgo} {m.yearsAgo === 1 ? 'YEAR' : 'YEARS'} AGO</div><div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.4, color: 'var(--ink-2)' }}>{m.body}</div></div>}
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-2)', marginTop: 6 }}>{m.title}</div>
            </div>
          ))}
        </div>
      </RailCard>
      <RailCard title="Latest notices" action="Open" onAction={() => nav.go('notices')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {NOTICES.slice(0, 3).map(n => {
            const p = n.who ? PEOPLE.find(x => x.id === n.who) : null;
            return (
              <div key={n.id} onClick={() => p ? nav.openProfile(p) : nav.go('notices')} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'center' }}>
                {p ? <Avatar person={p} size={30} /> : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="sparkle" size={15} /></div>}
                <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink-3)' }}>{p ? <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{p.name.split(' ')[0]} </span> : ''}{n.type === 'react' ? 'left a heart' : n.type === 'comment' ? 'left a note' : n.type === 'collect' ? 'saved your entry' : n.type === 'follow' ? 'joined your circle' : n.type === 'mention' ? 'mentioned you' : 'A memory resurfaced'}</div>
              </div>
            );
          })}
        </div>
      </RailCard>
    </div>
  );
}

function ArchiveRail({ nav }) {
  return (
    <div>
      <RailCard title="About this archive">
        <p style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)' }}>{ME.bio}</p>
        <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
          {[[ME.stats.entries.toLocaleString('en-US'), 'Entries'], [ME.stats.collections, 'Collections'], [ME.stats.daysKept.toLocaleString('en-US'), 'Days']].map(([n, l]) => (
            <div key={l}><div style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)' }}>{n}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 2 }}>{l}</div></div>
          ))}
        </div>
      </RailCard>
      <RailCard title="Collections" action="All" onAction={() => nav.go('collections')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {COLLECTIONS.slice(0, 5).map(c => (
            <button key={c.id} onClick={() => nav.go('collections')} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 4px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `linear-gradient(150deg, ${c.tone}, #0c0c0e)`, border: '1px solid var(--line)' }} />
              <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)' }}>{c.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{c.count}</span>
            </button>
          ))}
        </div>
      </RailCard>
    </div>
  );
}

/* ---------------- Entry modal ---------------- */
const D_COMMENTS = [
  { id: 'c1', who: 'p4', text: 'This is the one I keep coming back to. Filed it in my own archive too.', time: '2h' },
  { id: 'c2', who: 'p1', text: 'The last line. Yes.', time: '5h' },
];
function DEntryModal({ entry, nav }) {
  const a = authorOf(entry);
  const [liked, setLiked] = useStateDA(false);
  return (
    <div onClick={nav.closeEntry} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, animation: 'dFade .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '88vh', background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'dPop .24s var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: entry.author !== 'me' ? 'pointer' : 'default' }} onClick={() => entry.author !== 'me' && nav.openProfile(a)}>
            <Avatar person={a} size={34} /><div><div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{a.name}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{fmtDate(entry.date)}{entry.time ? ' · ' + entry.time : ''}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><RoundBtn icon="bookmark" /><button onClick={nav.closeEntry} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={18} /></button></div>
        </div>
        <div style={{ overflowY: 'auto', padding: '24px 30px 30px' }}>
          <div style={{ marginBottom: 14 }}><TypeTag type={entry.type} /></div>
          <h1 style={{ margin: '0 0 18px', fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1.15, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.015em' }}>{entry.title}</h1>
          {entry.type === 'photo' && <PhotoTile photo={entry.photo} radius={14} style={{ aspectRatio: '16/10', marginBottom: 18 }}><div style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{entry.photo.label}</div></PhotoTile>}
          {entry.type === 'code' && <div style={{ marginBottom: 18 }}><CodePreview entry={entry} /></div>}
          {entry.type === 'pdf' && <div style={{ marginBottom: 18 }}><FileRow entry={entry} /></div>}
          <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 17.5, lineHeight: 1.75, color: 'var(--ink-2)' }}>{entry.body}</p>
          {entry.type === 'article' && <p style={{ margin: '18px 0 0', fontFamily: 'var(--serif)', fontSize: 17.5, lineHeight: 1.75, color: 'var(--ink-2)' }}>The shelf does not judge what it holds. It keeps the half-formed beside the finished, the embarrassing beside the proud. Over years this becomes a kind of self-portrait you did not pose for — truer, maybe, than the one you would have chosen.</p>}
          {entry.tags && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22, alignItems: 'center' }}>{entry.tags.map(t => <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent)' }}>#{t}</span>)}{entry.collection && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="collections" size={13} />{entry.collection}</span>}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <button onClick={() => setLiked(!liked)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--accent)' : 'var(--ink-2)' }}><Icon name="heart" size={20} fill={liked} stroke={1.7} /><span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{entry.reactions + (liked ? 1 : 0)}</span></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--ink-2)' }}><Icon name="comment" size={20} stroke={1.7} /><span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{entry.comments}</span></div>
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 16 }}>NOTES IN THE MARGIN</div>
            {D_COMMENTS.map(c => { const p = PEOPLE.find(x => x.id === c.who); return (
              <div key={c.id} style={{ display: 'flex', gap: 11, marginBottom: 18 }}><Avatar person={p} size={30} /><div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{c.time}</span></div><p style={{ margin: '4px 0 0', fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', fontStyle: 'italic' }}>{c.text}</p></div></div>
            ); })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <Avatar person={ME} size={30} />
              <input placeholder="Leave a note…" style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 999, padding: '10px 16px', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 14 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Create modal ---------------- */
const D_CREATE_TYPES = [['note', 'Note', 'note'], ['article', 'Essay', 'feather'], ['photo', 'Photo', 'image'], ['pdf', 'Document', 'pdf'], ['markdown', 'Markdown', 'markdown'], ['code', 'Code', 'code']];
function DCreateModal({ nav }) {
  const [type, setType] = useStateDA('note');
  const [coll, setColl] = useStateDA('Field Notes');
  const [privacy, setPrivacy] = useStateDA('circle');
  const isFile = ['photo', 'pdf', 'markdown', 'code'].includes(type);
  return (
    <div onClick={nav.closeCreate} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 32px 32px', animation: 'dFade .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '86vh', background: 'var(--bg)', border: '1px solid var(--line-strong)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'dPop .24s var(--ease-out)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink)' }}>Keep something</span>
          <div style={{ display: 'flex', gap: 10 }}><button onClick={nav.closeCreate} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)' }}>Cancel</button><button onClick={nav.closeCreate} style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, color: '#fff', padding: '8px 18px', borderRadius: 999 }}>Save</button></div>
        </div>
        <div style={{ overflowY: 'auto', padding: '18px 22px 22px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {D_CREATE_TYPES.map(([id, label, ic]) => { const on = id === type; return <button key={id} onClick={() => setType(id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${on ? 'transparent' : 'var(--line-strong)'}`, background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}><Icon name={ic} size={17} />{label}</button>; })}
          </div>
          {isFile && <div style={{ marginBottom: 18, padding: '34px 20px', borderRadius: 16, border: '1.5px dashed var(--line-strong)', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}><div style={{ width: 50, height: 50, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="upload" size={23} /></div><div style={{ fontFamily: 'var(--serif)', fontSize: 16.5, fontStyle: 'italic', color: 'var(--ink)' }}>Drop your {type === 'photo' ? 'photo' : type === 'pdf' ? 'PDF' : type === 'markdown' ? 'Markdown' : 'code'} here</div><div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>or click to browse</div></div>}
          <input placeholder="Title" style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.01em', marginBottom: 12 }} />
          <textarea placeholder={type === 'article' ? 'Begin writing…' : type === 'code' ? '# paste or describe your code…' : 'Write what you want to remember…'} rows={isFile ? 4 : 7} style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--ink-2)', fontFamily: type === 'code' ? 'var(--mono)' : 'var(--sans)', fontSize: 15, lineHeight: 1.65 }} />
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>COLLECTION</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>{COLLECTIONS.slice(0, 5).map(c => <Chip key={c.id} active={coll === c.name} onClick={() => setColl(c.name)}>{c.name}</Chip>)}<Chip>+ New</Chip></div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>WHO CAN SEE THIS</div>
            <div style={{ display: 'flex', borderRadius: 12, border: '1px solid var(--line-strong)', overflow: 'hidden', maxWidth: 320 }}>{[['private', 'Private'], ['circle', 'Circle'], ['public', 'Public']].map(([id, l]) => <button key={id} onClick={() => setPrivacy(id)} style={{ flex: 1, padding: '10px', cursor: 'pointer', border: 'none', background: privacy === id ? 'var(--accent)' : 'transparent', color: privacy === id ? '#fff' : 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>{l}</button>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
const RAIL_VIEWS = { today: TodayRail, archive: ArchiveRail, memories: ArchiveRail, calendar: ArchiveRail, collections: ArchiveRail, library: ArchiveRail, photography: ArchiveRail };
const REUSED = { memories: 'MemoriesSection', calendar: 'CalendarSection', collections: 'CollectionsSection', library: 'LibrarySection', photography: 'PhotographySection' };

function DApp() {
  const [view, setView] = useStateDA('today');
  const [person, setPerson] = useStateDA(null);
  const [prev, setPrev] = useStateDA('today');
  const [entry, setEntry] = useStateDA(null);
  const [createOpen, setCreateOpen] = useStateDA(false);
  const mainRef = React.useRef(null);

  useEffectDA(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [view, person]);

  const nav = {
    go: (v) => { setPerson(null); setView(v); },
    openEntry: (e) => setEntry(e),
    closeEntry: () => setEntry(null),
    openProfile: (p) => { setPrev(view); setPerson(p); setView('profilePerson'); setEntry(null); },
    openCollection: () => { setPerson(null); setView('collections'); },
    create: () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
    back: () => { setPerson(null); setView(prev); },
  };

  let body, sidebarView = view;
  if (view === 'today') body = <DTodayBody nav={nav} />;
  else if (view === 'archive') body = <DArchiveBody nav={nav} />;
  else if (view === 'explore') body = <DExploreBody nav={nav} />;
  else if (view === 'people') body = <DPeopleBody nav={nav} />;
  else if (view === 'notices') body = <DNoticesBody nav={nav} />;
  else if (view === 'profileSelf') body = <DProfileBody nav={nav} isSelf />;
  else if (view === 'profilePerson') { body = <DProfileBody nav={nav} person={person} />; sidebarView = ''; }
  else if (REUSED[view]) { const C = window[REUSED[view]]; body = <C nav={nav} />; }

  const Rail = RAIL_VIEWS[view];
  const isReused = !!REUSED[view];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar view={sidebarView} nav={nav} />
      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {view === 'profilePerson' && (
          <div style={{ position: 'sticky', top: 0, zIndex: 5, padding: '16px 40px 14px', background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
            <button onClick={nav.back} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 14 }}><Icon name="back" size={18} />Back</button>
          </div>
        )}
        <div style={{ maxWidth: Rail ? 1140 : 880, margin: '0 auto', padding: isReused ? '40px 24px' : '48px 40px', display: 'flex', gap: 48, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>{body}</div>
          {Rail && <aside style={{ width: 300, flexShrink: 0 }}><Rail nav={nav} /></aside>}
        </div>
      </main>
      {entry && <DEntryModal entry={entry} nav={nav} />}
      {createOpen && <DCreateModal nav={nav} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DApp />);
