// entries.jsx — entry rendering for The Archive. Exports to window.
const { useState: useStateE } = React;

function authorOf(entry) {
  if (entry.author === 'me') return { name: ME.name, handle: ME.handle, ...ME.avatar };
  return PEOPLE.find(p => p.id === entry.author) || PEOPLE[0];
}

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ReactionRow({ entry, onOpen, compact }) {
  const [liked, setLiked] = useStateE(false);
  const [saved, setSaved] = useStateE(false);
  const n = entry.reactions + (liked ? 1 : 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
      <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, color: liked ? 'var(--accent)' : 'var(--ink-3)', transition: 'color .15s' }}>
        <Icon name="heart" size={18} fill={liked} stroke={1.7} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'inherit' }}>{n}</span>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)' }}>
        <Icon name="comment" size={18} stroke={1.7} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{entry.comments}</span>
      </button>
      <div style={{ flex: 1 }} />
      <button onClick={(e) => { e.stopPropagation(); setSaved(!saved); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: saved ? 'var(--accent)' : 'var(--ink-3)' }}>
        <Icon name="bookmark" size={18} fill={saved} stroke={1.7} />
      </button>
    </div>
  );
}

function EntryMeta({ entry, showAuthor = true }) {
  const a = authorOf(entry);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
      {showAuthor && <Avatar person={a} size={26} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flexWrap: 'wrap' }}>
        {showAuthor && <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{a.name}</span>}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.02em' }}>{fmtDate(entry.date)}{entry.time ? ' · ' + entry.time : ''}</span>
      </div>
      <div style={{ flex: 1 }} />
      <TypeTag type={entry.type} />
    </div>
  );
}

function CodePreview({ entry }) {
  return (
    <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderBottom: '1px solid var(--line)' }}>
        <FileBadge kind="PY" tone="#E0AF68" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink)' }}>{entry.file.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{entry.file.lang} · {entry.file.lines} lines · {entry.file.size}</div>
        </div>
      </div>
      <pre style={{ margin: 0, padding: '13px 15px', overflow: 'auto', fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>{entry.code}</pre>
    </div>
  );
}

function FileRow({ entry }) {
  const f = entry.file;
  const tone = entry.type === 'pdf' ? '#F7768E' : '#E0AF68';
  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(255,255,255,0.02)' }}>
      <FileBadge kind={f.kind === 'PDF' ? 'PDF' : 'PY'} tone={tone} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{f.kind} · {f.pages ? f.pages + ' pages · ' : ''}{f.size}</div>
      </div>
      <Icon name="upload" size={18} style={{ color: 'var(--ink-3)', transform: 'rotate(180deg)' }} />
    </div>
  );
}

function EntryCard({ entry, onOpen, showAuthor = true, hairline = true }) {
  return (
    <article onClick={onOpen} style={{ padding: '20px 20px', cursor: 'pointer', borderBottom: hairline ? '1px solid var(--line)' : 'none' }}>
      <EntryMeta entry={entry} showAuthor={showAuthor} />
      <h3 style={{ margin: '0 0 7px', fontFamily: 'var(--serif)', fontSize: 21, lineHeight: 1.2, color: 'var(--ink)', fontWeight: 500, letterSpacing: '-0.01em' }}>{entry.title}</h3>
      {entry.body && (
        <p style={{ margin: 0, fontFamily: entry.type === 'article' ? 'var(--serif)' : 'var(--sans)', fontSize: entry.type === 'article' ? 15.5 : 14.5, lineHeight: 1.6, color: 'var(--ink-2)', display: '-webkit-box', WebkitLineClamp: entry.type === 'photo' ? 2 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{entry.body}</p>
      )}
      {entry.type === 'photo' && <PhotoTile photo={entry.photo} style={{ marginTop: 13, aspectRatio: '4/3' }}>
        <div style={{ position: 'absolute', left: 12, bottom: 11, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)' }}>{entry.photo.label}</div>
      </PhotoTile>}
      {entry.type === 'code' && <CodePreview entry={entry} />}
      {entry.type === 'pdf' && <FileRow entry={entry} />}
      {entry.type === 'article' && (
        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          <Icon name="clock" size={13} /> {entry.readTime} read
        </div>
      )}
      <ReactionRow entry={entry} onOpen={onOpen} />
    </article>
  );
}

Object.assign(window, { authorOf, fmtDate, ReactionRow, EntryMeta, EntryCard, CodePreview, FileRow });
