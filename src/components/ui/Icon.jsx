// Stroke-based line icon set — 24×24 viewBox, currentColor
export default function Icon({ name, size = 22, stroke = 1.6, fill = false, className = '', style = {} }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    today:      <g {...p}><path d="M12 3v3M5 9l1.8 1.8M19 9l-1.8 1.8M3 16h4M17 16h4"/><path d="M8 16a4 4 0 0 1 8 0"/><path d="M3 20h18"/></g>,
    archive:    <g {...p}><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 9h16M9 4v5"/></g>,
    explore:    <g {...p}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></g>,
    people:     <g {...p}><circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3 3 0 0 1 0 5.4M16.5 19a5.5 5.5 0 0 0-2-4.3"/></g>,
    profile:    <g {...p}><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></g>,
    plus:       <g {...p}><path d="M12 5v14M5 12h14"/></g>,
    calendar:   <g {...p}><rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M4 9h16M8 3v4M16 3v4"/></g>,
    collections:<g {...p}><rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/></g>,
    library:    <g {...p}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-1.6H5.5A1.5 1.5 0 0 1 4 16V5.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a2 2 0 0 1 2-1.6h4.5A1.5 1.5 0 0 0 20 16V5.5z"/></g>,
    photo:      <g {...p}><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-7 7"/></g>,
    heart:      <g {...p} fill={fill ? 'currentColor' : 'none'}><path d="M12 20s-7-4.3-9.2-8.4C1.3 8.8 2.7 5.5 6 5.5c2 0 3.2 1.3 4 2.4.8-1.1 2-2.4 4-2.4 3.3 0 4.7 3.3 3.2 6.1C19 15.7 12 20 12 20z"/></g>,
    comment:    <g {...p}><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-8L7 20.5V18H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5z"/></g>,
    bookmark:   <g {...p} fill={fill ? 'currentColor' : 'none'}><path d="M6 4h12v17l-6-4-6 4V4z"/></g>,
    more:       <g {...p}><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/></g>,
    chevron:    <g {...p}><path d="M9 5l7 7-7 7"/></g>,
    chevronDown:<g {...p}><path d="M5 9l7 7 7-7"/></g>,
    back:       <g {...p}><path d="M15 5l-7 7 7 7"/></g>,
    close:      <g {...p}><path d="M6 6l12 12M18 6L6 18"/></g>,
    search:     <g {...p}><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></g>,
    edit:       <g {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></g>,
    pdf:        <g {...p}><path d="M7 3h7l4 4v14H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/></g>,
    code:       <g {...p}><path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/></g>,
    markdown:   <g {...p}><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6.5 15v-6l2.2 2.6L11 9v6M15 9v4.5M13 12l2 2.2L17 12"/></g>,
    tag:        <g {...p}><path d="M4 4h7l9 9-7 7-9-9V4z"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/></g>,
    clock:      <g {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g>,
    pin:        <g {...p}><path d="M12 21s6-5.2 6-10A6 6 0 0 0 6 11c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/></g>,
    sparkle:    <g {...p}><path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2L12 4z"/></g>,
    grid:       <g {...p}><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></g>,
    list:       <g {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></g>,
    image:      <g {...p}><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-7 7"/></g>,
    note:       <g {...p}><path d="M5 4h10l4 4v12H5V4z"/><path d="M8 11h8M8 15h5"/></g>,
    link:       <g {...p}><path d="M9 15l6-6M8 8.5l-1.5 1.5a3.5 3.5 0 0 0 5 5L13 13.5M16 15.5l1.5-1.5a3.5 3.5 0 0 0-5-5L11 10.5"/></g>,
    feather:    <g {...p}><path d="M20 4C13 4 7 10 7 17l-3 3M9 15h7"/><path d="M20 4c0 6-4 11-11 11"/></g>,
    bell:       <g {...p}><path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.6 5.5 2.3 6.2.3.3.1.8-.3.8H4.5c-.4 0-.6-.5-.3-.8.7-.7 2.3-2 2.3-6.2z"/><path d="M10 19.5a2 2 0 0 0 4 0"/></g>,
    upload:     <g {...p}><path d="M12 16V5M8 9l4-4 4 4"/><path d="M5 16v3h14v-3"/></g>,
    file:       <g {...p}><path d="M6 2h9l4 4v16H6V2z"/><path d="M14 2v5h5"/><path d="M8 13h8M8 17h5"/></g>,
    play:       <polygon points="6,3 20,12 6,21" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>,
    stories:    <g {...p}><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></g>,
    check:      <g {...p}><path d="M5 12l5 5L19 7"/></g>,
    settings:   <g {...p}><circle cx="12" cy="12" r="2.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>,
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {paths[name] ?? null}
    </svg>
  )
}
