// screens-profile.jsx — Profile / Archive owner page (self or others)
const { useState: useStateP } = React;

function Stat({ n, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ProfileScreen({ nav, person, isSelf }) {
  const self = isSelf;
  const data = self ? {
    name: ME.name, handle: ME.handle, title: ME.title, bio: ME.bio, tone: ME.avatar.tone, initials: ME.avatar.initials,
    location: ME.location, joined: ME.joined, stats: ME.stats,
  } : {
    name: person.name, handle: person.handle, title: person.title, bio: person.note, tone: person.tone, initials: person.initials,
    location: '—', joined: 'Since 2022', stats: { entries: 880 + person.mutual * 30, collections: person.mutual % 12 + 4, connections: 40 + person.mutual, daysKept: 900 },
  };
  const [following, setFollowing] = useStateP(self ? false : person.following);
  const theirEntries = self ? ENTRIES.filter(e => e.author === 'me') : ENTRIES.filter(e => e.author === person.id).concat(ENTRIES.filter(e => e.author === 'me').slice(0, 2));
  const pinned = self ? COLLECTIONS : COLLECTIONS.slice(0, 4);

  return (
    <React.Fragment>
      <AppBar
        left={self
          ? <span style={{ fontFamily: 'var(--serif)', fontSize: 19, color: 'var(--ink)', fontStyle: 'italic' }}>You</span>
          : <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex' }}><Icon name="back" size={22} /></button>}
        right={<RoundBtn icon="more" onClick={() => {}} />}
      />
      {/* identity */}
      <div style={{ padding: '20px 20px 0' }}>
        <Avatar person={{ tone: data.tone, initials: data.initials }} size={76} ring />
        <h1 style={{ margin: '16px 0 3px', fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.01em' }}>{data.name}</h1>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--accent)' }}>@{data.handle}</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 15.5, fontStyle: 'italic', color: 'var(--ink-2)', marginTop: 3 }}>{data.title}</div>
        <p style={{ margin: '13px 0 0', fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 340 }}>{data.bio}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={13} />{data.location}</span>
          <span>{data.joined}</span>
        </div>
      </div>
      {/* action */}
      <div style={{ padding: '18px 20px 20px' }}>
        {self ? (
          <button style={{ width: '100%', padding: '12px', borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="edit" size={17} />Edit your archive</button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setFollowing(!following)} style={{ flex: 1, padding: '12px', borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, border: `1px solid ${following ? 'var(--line-strong)' : 'transparent'}`, background: following ? 'transparent' : 'var(--accent)', color: following ? 'var(--ink)' : '#fff' }}>{following ? 'Following' : 'Follow'}</button>
            <button style={{ width: 48, borderRadius: 13, cursor: 'pointer', border: '1px solid var(--line-strong)', background: 'transparent', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="comment" size={18} /></button>
          </div>
        )}
      </div>
      {/* stats */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '18px 20px', margin: '0 20px', borderRadius: 16, border: '1px solid var(--line)', background: 'rgba(255,255,255,0.015)' }}>
        <Stat n={data.stats.entries.toLocaleString('en-US')} label="Entries" />
        <Stat n={data.stats.collections} label="Collections" />
        <Stat n={data.stats.connections} label="Circle" />
        <Stat n={data.stats.daysKept.toLocaleString('en-US')} label="Days kept" />
      </div>
      {/* pinned collections */}
      <div style={{ marginTop: 28 }}>
        <SectionLabel>{self ? 'Your collections' : 'Collections'}</SectionLabel>
        <div style={{ display: 'flex', gap: 11, overflowX: 'auto', padding: '0 20px 6px', scrollbarWidth: 'none' }}>
          {pinned.map(c => (
            <div key={c.id} onClick={() => nav.openCollection && nav.openCollection(c)} style={{ flexShrink: 0, width: 140, cursor: 'pointer' }}>
              <div style={{ height: 92, borderRadius: 13, background: `linear-gradient(150deg, ${c.tone}, #0c0c0e)`, border: '1px solid var(--line-strong)' }} />
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', marginTop: 8 }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>{c.count} entries</div>
            </div>
          ))}
        </div>
      </div>
      {/* recent entries */}
      <div style={{ marginTop: 26 }}>
        <SectionLabel>Recent</SectionLabel>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {theirEntries.map(e => <EntryCard key={e.id} entry={e} showAuthor={false} onOpen={() => nav.openEntry(e)} />)}
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { ProfileScreen });
