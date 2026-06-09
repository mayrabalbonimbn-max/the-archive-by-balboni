// app.jsx — The Archive by Balboni. Navigation + overlays + tweaks.
const { useState: useStateApp, useRef: useRefApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E86CB4"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useStateApp('today');
  const [sec, setSec] = useStateApp('overview');
  const [stack, setStack] = useStateApp([]);
  const scrollRef = useRefApp(null);

  // reset scroll on base navigation
  useEffectApp(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab, sec]);

  const nav = {
    go: (id) => {
      if (['memories', 'calendar', 'collections', 'library', 'photography', 'overview'].includes(id)) { setTab('archive'); setSec(id); setStack([]); }
      else if (id === 'people') { setStack(s => [...s, { kind: 'people' }]); }
      else if (id === 'notices') { setStack(s => [...s, { kind: 'notices' }]); }
      else { setTab(id); setStack([]); }
    },
    openEntry: (e) => setStack(s => [...s, { kind: 'entry', entry: e }]),
    openProfile: (p) => setStack(s => [...s, { kind: 'profile', person: p }]),
    openCollection: () => { setTab('archive'); setSec('overview'); setStack([]); },
    create: () => setStack(s => [...s, { kind: 'create' }]),
    back: () => setStack(s => s.slice(0, -1)),
  };

  const tabForBar = stack.length ? null : tab;

  let base;
  if (tab === 'today') base = <TodayScreen nav={nav} />;
  else if (tab === 'archive') base = <ArchiveScreen nav={nav} section={sec} setSection={(s) => { setSec(s); }} />;
  else if (tab === 'explore') base = <ExploreScreen nav={nav} />;
  else if (tab === 'profile') base = <ProfileScreen nav={nav} isSelf />;

  return (
    <div style={{ '--accent': t.accent, height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div key={tab + sec} style={{ animation: 'fadeUp .34s ease', paddingBottom: 22 }}>{base}</div>
      </div>
      <TabBar active={tabForBar} onNav={nav.go} onCreate={nav.create} />

      {/* overlays */}
      {stack.map((o, i) => (
        <React.Fragment key={i}>
          {o.kind === 'entry' && <EntryDetail entry={o.entry} nav={nav} />}
          {o.kind === 'create' && <CreateSheet onClose={nav.back} />}
          {o.kind === 'people' && <FullOverlay nav={nav}><ScrollScreen><PeopleScreen nav={nav} /></ScrollScreen></FullOverlay>}
          {o.kind === 'notices' && <FullOverlay nav={nav}><ScrollScreen><NoticesScreen nav={nav} /></ScrollScreen></FullOverlay>}
          {o.kind === 'profile' && <FullOverlay nav={nav}><ScrollScreen><ProfileScreen nav={nav} person={o.person} /></ScrollScreen></FullOverlay>}
        </React.Fragment>
      ))}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent" />
        <TweakColor label="Accent color" value={t.accent}
          options={['#E86CB4', '#E0A458', '#6E9BF0', '#6FBF8E', '#C98BF0', '#E5544E']}
          onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}

// full-screen overlay shell with its own scroll + slide-in
function FullOverlay({ children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 58, background: '#000', display: 'flex', flexDirection: 'column', animation: 'pushIn .3s cubic-bezier(.22,1,.36,1)' }}>
      {children}
    </div>
  );
}
function ScrollScreen({ children }) {
  return <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 30 }}>{children}</div>;
}

function Stage() {
  const ref = useRefApp(null);
  useEffectApp(() => {
    const fit = () => {
      if (!ref.current) return;
      const s = Math.min((window.innerWidth) / (402 + 28), (window.innerHeight) / (874 + 28), 1);
      ref.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div ref={ref} style={{ transformOrigin: 'center center' }}>
        <IOSDevice dark>
          <App />
        </IOSDevice>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Stage />);
