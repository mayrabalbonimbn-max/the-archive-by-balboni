// desktop-screens.jsx — desktop screen bodies for The Archive. Exports to window.
const { useState: useStateD } = React;

/* ---------- shared desktop bits ---------- */
function DPageHead({ eyebrow, title, italic, sub, action }) {
  return (
    <div style={{ marginBottom: 26 }}>
      {eyebrow && <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: '0.16em', color: 'var(--accent)', marginBottom: 14 }}>{eyebrow}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1.05, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          {title}{italic && <span style={{ fontStyle: 'italic' }}> {italic}</span>}
        </h1>
        {action}
      </div>
      {sub && <p style={{ margin: '12px 0 0', fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink-3)', maxWidth: 540 }}>{sub}</p>}
    </div>
  );
}

function DPersonRow({ person, nav, wide }) {
  const [following, setFollowing] = useStateD(person.following);
  return (
    <div onClick={() => nav.openProfile(person)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
      <Avatar person={person} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{person.name}</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>{person.title} · {person.mutual} shared</div>
        {wide && <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>{person.note}</div>}
      </div>
      <button onClick={e => { e.stopPropagation(); setFollowing(!following); }} style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, border: `1px solid ${following ? 'var(--line-strong)' : 'transparent'}`, background: following ? 'transparent' : 'var(--accent)', color: following ? 'var(--ink-2)' : '#fff' }}>{following ? 'Following' : 'Follow'}</button>
    </div>
  );
}

/* ---------- Today ---------- */
function DTodayBody({ nav }) {
  const now = new Date('2026-06-08T08:00:00');
  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const todays = ENTRIES.filter(e => ['e1', 'e6', 'e2', 'e3', 'e7'].includes(e.id));
  return (
    <div>
      <DPageHead eyebrow={dateLine} title="Good morning," italic={ME.name.split(' ')[0] + '.'} />
      <div style={{ marginTop: 4, marginBottom: 30, fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-3)' }}>
        Day <span style={{ color: 'var(--ink-2)' }}>{ME.stats.daysKept.toLocaleString('en-US')}</span> of your archive · <span style={{ color: 'var(--ink-2)' }}>{ME.stats.entries.toLocaleString('en-US')}</span> entries kept
      </div>
      <button onClick={nav.create} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16, border: '1px solid var(--line-strong)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)', marginBottom: 34 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff' }}><Icon name="feather" size={21} stroke={1.8} /></div>
        <div><div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink)', whiteSpace: 'nowrap' }}>What are you keeping today?</div><div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>A note, a photo, a file — to your archive</div></div>
        <div style={{ flex: 1 }} /><Icon name="plus" size={22} style={{ color: 'var(--ink-3)' }} />
      </button>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>From your circle today</div>
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {todays.map(e => <EntryCard key={e.id} entry={e} onOpen={() => nav.openEntry(e)} />)}
      </div>
    </div>
  );
}

/* ---------- Personal Archive (overview) ---------- */
function DArchiveBody({ nav }) {
  const [filter, setFilter] = useStateD('all');
  const types = [['all', 'Everything'], ['note', 'Notes'], ['article', 'Essays'], ['photo', 'Photos'], ['pdf', 'Documents'], ['code', 'Code']];
  const mine = ENTRIES.filter(e => e.author === 'me');
  const shown = filter === 'all' ? mine : mine.filter(e => e.type === filter);
  return (
    <div>
      <DPageHead title="Your" italic="Archive" sub="A slow record of what you read, build, and notice — kept, not broadcast." />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {types.map(([id, label]) => <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
      </div>
      <div style={{ borderTop: '1px solid var(--line)', marginTop: 14 }}>
        {shown.map(e => <EntryCard key={e.id} entry={e} showAuthor={false} onOpen={() => nav.openEntry(e)} />)}
      </div>
    </div>
  );
}

/* ---------- Explore ---------- */
const D_THEMES = ['Photography', 'Essays', 'Field notes', 'Code', 'Reading', 'Memory', 'Architecture'];
const D_PUBLIC = [
  { person: 'p6', headline: 'A photographer keeping weather', tone1: '#3a3f3c', tone2: '#191c1a', kept: '2,140 entries · 9 collections' },
  { person: 'p2', headline: 'Three years of one square metre of coast', tone1: '#26303a', tone2: '#11171d', kept: '880 entries · 4 collections' },
  { person: 'p4', headline: "A bookbinder's daybook", tone1: '#2d2533', tone2: '#161118', kept: '1,510 entries · 12 collections' },
];
function DExploreBody({ nav }) {
  const [q, setQ] = useStateD('');
  const ql = q.trim().toLowerCase();
  const peopleHits = ql ? PEOPLE.filter(p => (p.name + p.title + p.note).toLowerCase().includes(ql)) : [];
  const entryHits = ql ? ENTRIES.filter(e => (e.title + e.body + (e.tags || []).join(' ')).toLowerCase().includes(ql)) : [];
  return (
    <div>
      <DPageHead title="Explore" sub="Discover people and public archives. No trending, no algorithm — just quiet corners worth opening." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', borderRadius: 14, border: '1px solid var(--line-strong)', background: 'var(--surface-2)', marginBottom: 22 }}>
        <Icon name="search" size={19} style={{ color: 'var(--ink-3)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search archives, entries, people…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 15 }} />
        {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0 }}><Icon name="close" size={17} /></button>}
      </div>
      {ql ? (
        <div>
          {!peopleHits.length && !entryHits.length && <div style={{ padding: '40px 0', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink-3)' }}>Nothing yet for “{q}”.</div>}
          {peopleHits.length > 0 && <div style={{ marginBottom: 24 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>People</div>{peopleHits.map(p => <DPersonRow key={p.id} person={p} nav={nav} wide />)}</div>}
          {entryHits.length > 0 && <div><div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>Entries</div><div style={{ borderTop: '1px solid var(--line)' }}>{entryHits.map(e => <EntryCard key={e.id} entry={e} onOpen={() => nav.openEntry(e)} />)}</div></div>}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>{D_THEMES.map((t, i) => <Chip key={t} active={i === 0}>{t}</Chip>)}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>Public archives, recently opened</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 34 }}>
            {D_PUBLIC.map((a, i) => {
              const p = PEOPLE.find(x => x.id === a.person);
              return (
                <div key={i} onClick={() => nav.openProfile(p)} style={{ cursor: 'pointer' }}>
                  <PhotoTile photo={{ tone1: a.tone1, tone2: a.tone2 }} radius={16} style={{ height: 150 }}>
                    <div style={{ position: 'absolute', inset: 0, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.7))' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.2, color: '#fff' }}>{a.headline}</div>
                    </div>
                  </PhotoTile>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}><Avatar person={p} size={26} /><div><div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}>{p.name}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)' }}>{a.kept}</div></div></div>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>People keeping things like you</div>
          <div>{PEOPLE.map(p => <DPersonRow key={p.id} person={p} nav={nav} wide />)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- People ---------- */
function DPeopleBody({ nav }) {
  const [tab, setTab] = useStateD('circle');
  const circle = PEOPLE.filter(p => p.following);
  const suggested = PEOPLE.filter(p => !p.following);
  const list = tab === 'circle' ? circle : suggested;
  return (
    <div>
      <DPageHead title="Your" italic="circle" sub={`${circle.length} people you keep close. No counts, no clout — just company.`} />
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
        {[['circle', `Circle · ${circle.length}`], ['suggested', `Suggested · ${suggested.length}`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', position: 'relative', fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: tab === id ? 600 : 500, color: tab === id ? 'var(--ink)' : 'var(--ink-3)' }}>
            {label}{tab === id && <div style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--accent)' }} />}
          </button>
        ))}
      </div>
      <div>{list.map(p => <DPersonRow key={p.id} person={p} nav={nav} wide />)}</div>
    </div>
  );
}

/* ---------- Notices ---------- */
function dNoticeVerb(t) { return { react: 'left a heart on', comment: 'left a note on', collect: 'kept your entry to', follow: 'added you to their circle', mention: 'mentioned you in' }[t]; }
function DNoticesBody({ nav }) {
  const groups = ['Today', 'This week', 'Earlier'];
  return (
    <div>
      <DPageHead title="Notices" sub="Word from your circle. Quiet on purpose — no counts, no noise." action={<button style={{ background: 'none', border: '1px solid var(--line-strong)', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>Mark all read</button>} />
      {groups.map(g => {
        const items = NOTICES.filter(n => n.group === g);
        if (!items.length) return null;
        return (
          <div key={g} style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>{g}</div>
            <div style={{ borderTop: '1px solid var(--line)' }}>
              {items.map(n => {
                if (n.type === 'memory') return (
                  <div key={n.id} onClick={() => nav.go('memories')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}><Icon name="sparkle" size={21} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--serif)', fontSize: 16.5, fontStyle: 'italic', color: 'var(--ink)' }}>{n.title}</div><div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>{n.sub}</div></div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{n.time}</span>
                  </div>
                );
                const p = PEOPLE.find(x => x.id === n.who);
                const target = n.type === 'collect' ? n.coll : n.target;
                return (
                  <div key={n.id} onClick={() => nav.openProfile(p)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer', position: 'relative' }}>
                    {n.unread && <div style={{ position: 'absolute', left: -14, top: 24, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
                    <div style={{ position: 'relative', flexShrink: 0 }}><Avatar person={p} size={42} /><div style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Icon name={{ react: 'heart', comment: 'comment', collect: 'collections', follow: 'people', mention: 'tag' }[n.type]} size={11} fill={n.type === 'react'} stroke={2} /></div></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.45, color: 'var(--ink-2)' }}><span style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.name}</span> {dNoticeVerb(n.type)}{n.type !== 'follow' && <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink)' }}> {target}</span>}.</div>
                      {n.quote && <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, color: 'var(--ink-3)', marginTop: 5, paddingLeft: 12, borderLeft: '1px solid var(--line-strong)' }}>{n.quote}</div>}
                      {n.type === 'follow' && <button onClick={e => e.stopPropagation()} style={{ marginTop: 9, padding: '7px 15px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)' }}>Follow back</button>}
                    </div>
                    {n.photo ? <PhotoTile photo={n.photo} radius={8} style={{ width: 46, height: 46, flexShrink: 0 }} /> : <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flexShrink: 0 }}>{n.time}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Profile ---------- */
function DProfileBody({ nav, person, isSelf }) {
  const d = isSelf ? { name: ME.name, handle: ME.handle, title: ME.title, bio: ME.bio, tone: ME.avatar.tone, initials: ME.avatar.initials, location: ME.location, joined: ME.joined, stats: ME.stats }
    : { name: person.name, handle: person.handle, title: person.title, bio: person.note, tone: person.tone, initials: person.initials, location: '—', joined: 'Since 2022', stats: { entries: 880 + person.mutual * 30, collections: person.mutual % 12 + 4, connections: 40 + person.mutual, daysKept: 900 } };
  const [following, setFollowing] = useStateD(isSelf ? false : person.following);
  const entries = isSelf ? ENTRIES.filter(e => e.author === 'me') : ENTRIES.filter(e => e.author === person.id).concat(ENTRIES.filter(e => e.author === 'me').slice(0, 2));
  return (
    <div>
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', marginBottom: 26 }}>
        <Avatar person={{ tone: d.tone, initials: d.initials }} size={84} ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 34, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.02em' }}>{d.name}</h1>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--accent)', marginTop: 2 }}>@{d.handle}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 4 }}>{d.title}</div>
          <p style={{ margin: '12px 0 0', fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 460 }}>{d.bio}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={13} />{d.location}</span><span>{d.joined}</span></div>
        </div>
        {isSelf
          ? <button style={{ flexShrink: 0, padding: '11px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="edit" size={17} />Edit archive</button>
          : <button onClick={() => setFollowing(!following)} style={{ flexShrink: 0, padding: '11px 26px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, border: `1px solid ${following ? 'var(--line-strong)' : 'transparent'}`, background: following ? 'transparent' : 'var(--accent)', color: following ? 'var(--ink)' : '#fff' }}>{following ? 'Following' : 'Follow'}</button>}
      </div>
      <div style={{ display: 'flex', gap: 40, padding: '18px 26px', borderRadius: 16, border: '1px solid var(--line)', background: 'var(--surface-1)', marginBottom: 32, width: 'fit-content' }}>
        {[[d.stats.entries.toLocaleString('en-US'), 'Entries'], [d.stats.collections, 'Collections'], [d.stats.connections, 'Circle'], [d.stats.daysKept.toLocaleString('en-US'), 'Days kept']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}><div style={{ fontFamily: 'var(--serif)', fontSize: 23, color: 'var(--ink)' }}>{n}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 3 }}>{l}</div></div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>Collections</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
        {COLLECTIONS.slice(0, 4).map(c => (
          <div key={c.id} onClick={() => nav.openCollection(c)} style={{ cursor: 'pointer' }}><div style={{ height: 80, borderRadius: 12, background: `linear-gradient(150deg, ${c.tone}, #0c0c0e)`, border: '1px solid var(--line-strong)' }} /><div style={{ fontFamily: 'var(--serif)', fontSize: 14.5, color: 'var(--ink)', marginTop: 8 }}>{c.name}</div><div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{c.count} entries</div></div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 4 }}>Recent</div>
      <div style={{ borderTop: '1px solid var(--line)' }}>{entries.map(e => <EntryCard key={e.id} entry={e} showAuthor={!isSelf ? false : false} onOpen={() => nav.openEntry(e)} />)}</div>
    </div>
  );
}

Object.assign(window, { DPageHead, DPersonRow, DTodayBody, DArchiveBody, DExploreBody, DPeopleBody, DNoticesBody, DProfileBody });
