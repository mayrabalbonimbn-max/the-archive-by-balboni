// screens-social.jsx — Explore / Search, People / Connections, Profile
const { useState: useStateS } = React;

// ── Explore / Search ──
const THEMES = ['Photography', 'Essays', 'Field notes', 'Code', 'Reading', 'Memory', 'Architecture'];
const PUBLIC_ARCHIVES = [
  { person: 'p6', headline: 'A photographer keeping weather', tone1: '#3a3f3c', tone2: '#191c1a', kept: '2,140 entries · 9 collections' },
  { person: 'p2', headline: 'Three years of one square metre of coast', tone1: '#26303a', tone2: '#11171d', kept: '880 entries · 4 collections' },
  { person: 'p4', headline: 'A bookbinder\u2019s daybook', tone1: '#2d2533', tone2: '#161118', kept: '1,510 entries · 12 collections' },
];

function ExploreScreen({ nav }) {
  const [q, setQ] = useStateS('');
  const ql = q.trim().toLowerCase();
  const peopleHits = ql ? PEOPLE.filter(p => (p.name + p.title + p.note).toLowerCase().includes(ql)) : [];
  const entryHits = ql ? ENTRIES.filter(e => (e.title + e.body + (e.tags || []).join(' ')).toLowerCase().includes(ql)) : [];
  return (
    <React.Fragment>
      <AppBar left={<span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>Explore</span>} />
      <div style={{ padding: '18px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 13, border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.03)' }}>
          <Icon name="search" size={18} style={{ color: 'var(--ink-3)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search archives, entries, people…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 14.5 }} />
          {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0 }}><Icon name="close" size={16} /></button>}
        </div>
      </div>

      {ql ? (
        <div style={{ paddingTop: 12 }}>
          {!peopleHits.length && !entryHits.length && <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-3)' }}>Nothing yet for \u201c{q}\u201d.</div>}
          {peopleHits.length > 0 && <div style={{ marginBottom: 10 }}><SectionLabel>People</SectionLabel>{peopleHits.map(p => <PersonRow key={p.id} person={p} nav={nav} />)}</div>}
          {entryHits.length > 0 && <div><SectionLabel>Entries</SectionLabel><div style={{ borderTop: '1px solid var(--line)' }}>{entryHits.map(e => <EntryCard key={e.id} entry={e} onOpen={() => nav.openEntry(e)} />)}</div></div>}
        </div>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 20px 20px', scrollbarWidth: 'none' }}>
            {THEMES.map((t, i) => <Chip key={t} active={i === 0}>{t}</Chip>)}
          </div>
          <SectionLabel>Public archives, recently opened</SectionLabel>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 20px 26px', scrollbarWidth: 'none' }}>
            {PUBLIC_ARCHIVES.map((a, i) => {
              const p = PEOPLE.find(x => x.id === a.person);
              return (
                <div key={i} onClick={() => nav.openProfile(p)} style={{ flexShrink: 0, width: 256, cursor: 'pointer' }}>
                  <PhotoTile photo={{ tone1: a.tone1, tone2: a.tone2 }} radius={16} style={{ height: 150 }}>
                    <div style={{ position: 'absolute', inset: 0, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.7))' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.2, color: '#fff' }}>{a.headline}</div>
                    </div>
                  </PhotoTile>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                    <Avatar person={p} size={28} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{a.kept}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <SectionLabel action="See all" onAction={() => nav.go('people')}>People keeping things like you</SectionLabel>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {PEOPLE.slice(0, 4).map(p => <PersonRow key={p.id} person={p} nav={nav} />)}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

// ── Person row (shared) ──
function PersonRow({ person, nav }) {
  const [following, setFollowing] = useStateS(person.following);
  return (
    <div onClick={() => nav.openProfile(person)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
      <Avatar person={person} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 16.5, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{person.name}</span>
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>{person.title} · {person.mutual} shared</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 13.5, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>{person.note}</div>
      </div>
      <button onClick={e => { e.stopPropagation(); setFollowing(!following); }} style={{ flexShrink: 0, padding: '7px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600, border: `1px solid ${following ? 'var(--line-strong)' : 'transparent'}`, background: following ? 'transparent' : 'var(--accent)', color: following ? 'var(--ink-2)' : '#fff' }}>{following ? 'Following' : 'Follow'}</button>
    </div>
  );
}

// ── People / Connections ──
function PeopleScreen({ nav }) {
  const [tab, setTab] = useStateS('circle');
  const circle = PEOPLE.filter(p => p.following);
  const suggested = PEOPLE.filter(p => !p.following);
  const list = tab === 'circle' ? circle : suggested;
  return (
    <React.Fragment>
      <AppBar left={<button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }}><Icon name="back" size={22} /></button>} title="People" />
      <div style={{ padding: '18px 20px 6px' }}>
        <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--serif)', fontSize: 25, color: 'var(--ink)', fontWeight: 400 }}>Your <span style={{ fontStyle: 'italic' }}>circle</span></h2>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>{circle.length} people you keep close. No counts, no clout — just company.</div>
      </div>
      <div style={{ display: 'flex', gap: 22, padding: '14px 20px 0', borderBottom: '1px solid var(--line)' }}>
        {[['circle', `Circle · ${circle.length}`], ['suggested', `Suggested · ${suggested.length}`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', position: 'relative', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: tab === id ? 600 : 500, color: tab === id ? 'var(--ink)' : 'var(--ink-3)' }}>
            {label}
            {tab === id && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--accent)' }} />}
          </button>
        ))}
      </div>
      <div>{list.map(p => <PersonRow key={p.id} person={p} nav={nav} />)}</div>
    </React.Fragment>
  );
}

// ── Notices / Notifications (calm, intimate) ──
function noticeText(n) {
  const verbs = {
    react: 'left a heart on',
    comment: 'left a note on',
    collect: 'kept your entry to',
    follow: 'added you to their circle',
    mention: 'mentioned you in',
  };
  return verbs[n.type];
}

function NoticeRow({ n, nav }) {
  const p = n.who ? PEOPLE.find(x => x.id === n.who) : null;
  const target = n.type === 'collect' ? n.coll : n.target;
  if (n.type === 'memory') {
    return (
      <div onClick={() => nav.go('memories')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><Icon name="sparkle" size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink)' }}>{n.title}</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{n.sub}</div>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>{n.time}</span>
      </div>
    );
  }
  return (
    <div onClick={() => p && nav.openProfile(p)} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--line)', cursor: 'pointer', position: 'relative' }}>
      {n.unread && <div style={{ position: 'absolute', left: 8, top: 24, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar person={p} size={40} />
        <div style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <Icon name={{ react: 'heart', comment: 'comment', collect: 'collections', follow: 'people', mention: 'tag' }[n.type]} size={11} fill={n.type === 'react'} stroke={2} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.name}</span> {noticeText(n)}{n.type !== 'follow' && <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink)' }}> {target}</span>}{n.type !== 'follow' ? '.' : '.'}
        </div>
        {n.quote && <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-3)', marginTop: 5, paddingLeft: 11, borderLeft: '1px solid var(--line-strong)' }}>{n.quote}</div>}
        {n.type === 'follow' && <button onClick={e => e.stopPropagation()} style={{ marginTop: 9, padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)' }}>Follow back</button>}
      </div>
      {n.photo ? <PhotoTile photo={n.photo} radius={8} style={{ width: 44, height: 44, flexShrink: 0 }} /> : <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>{n.time}</span>}
    </div>
  );
}

function NoticesScreen({ nav }) {
  const groups = ['Today', 'This week', 'Earlier'];
  return (
    <React.Fragment>
      <AppBar
        left={<button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}><Icon name="back" size={22} /></button>}
        title="Notices"
        right={<button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>Mark read</button>}
      />
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>Word from your circle. Quiet on purpose — no counts, no noise.</div>
      </div>
      {groups.map(g => {
        const items = NOTICES.filter(n => n.group === g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginTop: 14 }}>
            <SectionLabel>{g}</SectionLabel>
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {items.map(n => <NoticeRow key={n.id} n={n} nav={nav} />)}
            </div>
          </div>
        );
      })}
      <div style={{ padding: '26px 20px', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, color: 'var(--ink-3)' }}>You're all caught up.</div>
    </React.Fragment>
  );
}

Object.assign(window, { ExploreScreen, PersonRow, PeopleScreen, NoticesScreen });
