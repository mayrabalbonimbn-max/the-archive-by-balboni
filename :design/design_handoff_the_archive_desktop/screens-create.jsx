// screens-create.jsx — Create new entry sheet + Entry detail (reading view)
const { useState: useStateC } = React;

const CREATE_TYPES = [
  { id: 'note', label: 'Note', icon: 'note', hint: 'A short thought, kept in passing' },
  { id: 'article', label: 'Essay', icon: 'feather', hint: 'Longer writing, room to think' },
  { id: 'photo', label: 'Photo', icon: 'image', hint: 'An image, a moment' },
  { id: 'pdf', label: 'Document', icon: 'pdf', hint: 'Upload a PDF' },
  { id: 'markdown', label: 'Markdown', icon: 'markdown', hint: 'Upload a .md file' },
  { id: 'code', label: 'Code', icon: 'code', hint: 'A script or snippet' },
];
const PRIVACY = [['private', 'Private'], ['circle', 'Circle'], ['public', 'Public']];

function CreateSheet({ onClose }) {
  const [type, setType] = useStateC('note');
  const [title, setTitle] = useStateC('');
  const [body, setBody] = useStateC('');
  const [coll, setColl] = useStateC('Field Notes');
  const [privacy, setPrivacy] = useStateC('circle');
  const active = CREATE_TYPES.find(t => t.id === type);
  const isFile = ['photo', 'pdf', 'markdown', 'code'].includes(type);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 58, background: '#000', display: 'flex', flexDirection: 'column', animation: 'sheetUp .32s cubic-bezier(.22,1,.36,1)' }}>
      {/* header */}
      <div style={{ paddingTop: 58, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 12px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--ink-3)', padding: 0 }}>Cancel</button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', color: 'var(--ink)' }}>Keep something</span>
          <button onClick={onClose} style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, color: '#fff', padding: '8px 16px', borderRadius: 999 }}>Save</button>
        </div>
        <div style={{ height: 1, background: 'var(--line)' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* type selector */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 18px', scrollbarWidth: 'none' }}>
          {CREATE_TYPES.map(t => {
            const on = t.id === type;
            return (
              <button key={t.id} onClick={() => setType(t.id)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${on ? 'transparent' : 'var(--line-strong)'}`, background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>
                <Icon name={t.icon} size={17} />{t.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '4px 20px 20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginBottom: 14, letterSpacing: '0.04em' }}>{active.hint}</div>

          {isFile && (
            <div style={{ marginBottom: 18, padding: '30px 20px', borderRadius: 16, border: '1.5px dashed var(--line-strong)', background: 'rgba(255,255,255,0.015)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="upload" size={22} /></div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--ink)' }}>Drop your {type === 'photo' ? 'photo' : type === 'pdf' ? 'PDF' : type === 'markdown' ? 'Markdown' : 'code'} here</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)' }}>or tap to browse</div>
            </div>
          )}

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 12 }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={type === 'article' ? 'Begin writing\u2026' : type === 'code' ? '# paste or describe your code\u2026' : 'Write what you want to remember\u2026'} rows={isFile ? 4 : 8} style={{ width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none', color: 'var(--ink-2)', fontFamily: type === 'code' ? 'var(--mono)' : 'var(--sans)', fontSize: 15, lineHeight: 1.65 }} />
        </div>

        {/* meta options */}
        <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>COLLECTION</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {COLLECTIONS.slice(0, 5).map(c => <Chip key={c.id} active={coll === c.name} onClick={() => setColl(c.name)}>{c.name}</Chip>)}
            <Chip>+ New</Chip>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 11 }}>WHO CAN SEE THIS</div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 12, border: '1px solid var(--line-strong)', overflow: 'hidden', maxWidth: 280 }}>
            {PRIVACY.map(([id, label]) => (
              <button key={id} onClick={() => setPrivacy(id)} style={{ flex: 1, padding: '10px', cursor: 'pointer', border: 'none', background: privacy === id ? 'var(--accent)' : 'transparent', color: privacy === id ? '#fff' : 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Entry detail (reading view) ──
const COMMENTS = [
  { id: 'cm1', who: 'p4', text: 'This is the one I keep coming back to. Filed it in my own archive too.', time: '2h' },
  { id: 'cm2', who: 'p1', text: 'The last line. Yes.', time: '5h' },
];

function EntryDetail({ entry, nav }) {
  const a = authorOf(entry);
  const [liked, setLiked] = useStateC(false);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 58, background: '#000', display: 'flex', flexDirection: 'column', animation: 'pushIn .3s cubic-bezier(.22,1,.36,1)' }}>
      <div style={{ paddingTop: 58, flexShrink: 0, background: 'linear-gradient(#000 70%, rgba(0,0,0,0.7))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px 12px' }}>
          <button onClick={nav.back} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', width: 38, height: 38, borderRadius: '50%', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="back" size={21} /></button>
          <div style={{ display: 'flex', gap: 6 }}><RoundBtn icon="bookmark" /><RoundBtn icon="more" /></div>
        </div>
        <div style={{ height: 1, background: 'var(--line)' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 30 }}>
        <div style={{ padding: '22px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => entry.author !== 'me' && nav.openProfile(a)}>
              <Avatar person={a} size={36} />
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{fmtDate(entry.date)}{entry.time ? ' · ' + entry.time : ''}</div>
              </div>
            </div>
            <TypeTag type={entry.type} />
          </div>
          <h1 style={{ margin: '0 0 16px', fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1.16, color: 'var(--ink)', fontWeight: 400, letterSpacing: '-0.015em' }}>{entry.title}</h1>
        </div>

        {entry.type === 'photo' && <PhotoTile photo={entry.photo} radius={0} style={{ aspectRatio: '4/3', margin: '0 0 4px' }}><div style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{entry.photo.label}</div></PhotoTile>}

        <div style={{ padding: '8px 22px 0' }}>
          {entry.type === 'code' && <CodePreview entry={entry} />}
          {entry.type === 'pdf' && <FileRow entry={entry} />}
          <p style={{ margin: '14px 0 0', fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.72, color: 'var(--ink-2)' }}>{entry.body}</p>
          {entry.type === 'article' && <p style={{ margin: '18px 0 0', fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.72, color: 'var(--ink-2)' }}>The shelf does not judge what it holds. It keeps the half-formed beside the finished, the embarrassing beside the proud. Over years this becomes a kind of self-portrait you did not pose for — truer, maybe, than the one you would have chosen.</p>}

          {entry.tags && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            {entry.tags.map(t => <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>#{t}</span>)}
            {entry.collection && <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="collections" size={13} />{entry.collection}</span>}
          </div>}

          {/* reactions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <button onClick={() => setLiked(!liked)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--accent)' : 'var(--ink-2)' }}><Icon name="heart" size={20} fill={liked} stroke={1.7} /><span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{entry.reactions + (liked ? 1 : 0)}</span></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--ink-2)' }}><Icon name="comment" size={20} stroke={1.7} /><span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{entry.comments}</span></div>
          </div>
        </div>

        {/* comments */}
        <div style={{ padding: '22px 22px 0' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 16 }}>NOTES IN THE MARGIN</div>
          {COMMENTS.map(c => {
            const p = PEOPLE.find(x => x.id === c.who);
            return (
              <div key={c.id} style={{ display: 'flex', gap: 11, marginBottom: 18 }}>
                <Avatar person={p} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{p.name}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{c.time}</span></div>
                  <p style={{ margin: '4px 0 0', fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', fontStyle: 'italic' }}>{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* comment input */}
      <div style={{ flexShrink: 0, padding: '12px 16px 30px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, background: '#000' }}>
        <Avatar person={ME} size={32} />
        <input placeholder="Leave a note…" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-strong)', borderRadius: 999, padding: '10px 16px', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 14 }} />
        <button style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron" size={18} style={{ transform: 'rotate(-90deg)' }} /></button>
      </div>
    </div>
  );
}

Object.assign(window, { CreateSheet, EntryDetail });
