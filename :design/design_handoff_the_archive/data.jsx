// data.jsx — mock content for The Archive by Balboni
// Warm, editorial, intimate. Exported to window.

const ME = {
  name: 'Elena Vance',
  handle: 'elena',
  title: 'Writer · Architect of small things',
  location: 'Lisbon',
  joined: 'Since 2021',
  avatar: { initials: 'EV', tone: '#E86CB4' },
  bio: 'Keeping a slow record of what I read, build, and notice. The archive is the work.',
  stats: { entries: 1284, collections: 19, connections: 86, daysKept: 1640 },
};

const PEOPLE = [
  { id: 'p1', name: 'Tomas Adeyemi', handle: 'tomas', tone: '#7AA2F7', initials: 'TA', title: 'Type designer', note: 'Letterforms, slow mornings, marginalia.', following: true, mutual: 12 },
  { id: 'p2', name: 'Junko Mori', handle: 'junko', tone: '#9ECE6A', initials: 'JM', title: 'Field ecologist', note: 'Tidepools, soil notes, quiet data.', following: true, mutual: 8 },
  { id: 'p3', name: 'Rafael Costa', handle: 'rafa', tone: '#E0AF68', initials: 'RC', title: 'Composer', note: 'Scores, found sound, late practice.', following: false, mutual: 5 },
  { id: 'p4', name: 'Ingrid Solis', handle: 'ingrid', tone: '#BB9AF7', initials: 'IS', title: 'Bookbinder', note: 'Paper, thread, the smell of glue.', following: true, mutual: 21 },
  { id: 'p5', name: 'Noah Bergström', handle: 'noah', tone: '#F7768E', initials: 'NB', title: 'Systems gardener', note: 'Code as compost. Tools for thought.', following: false, mutual: 3 },
  { id: 'p6', name: 'Amara Diallo', handle: 'amara', tone: '#73DACA', initials: 'AD', title: 'Photographer', note: 'Grain, fog, the hour before rain.', following: true, mutual: 17 },
];

// entry types: note | article | photo | pdf | code | link
const ENTRIES = [
  {
    id: 'e1', type: 'note', author: 'me', date: '2026-06-08', time: '7:14 AM',
    title: 'Morning, before the noise',
    body: 'Woke before the street did. Coffee going cold while I read the same paragraph four times — not because it was hard, but because it was good. Stillwell on attention: that to attend to a thing is already a kind of love. Want to keep that near today.',
    tags: ['morning', 'reading'], reactions: 14, comments: 3, collection: 'Field Notes',
  },
  {
    id: 'e2', type: 'photo', author: 'me', date: '2026-06-07',
    title: 'Tejo, low tide',
    body: 'The river pulled back further than I have seen it. Boys walking out on the mud like it owed them something.',
    photo: { tone1: '#2a3140', tone2: '#11141c', label: '35mm · Portra 400' },
    tags: ['lisbon', 'film'], reactions: 41, comments: 7, collection: 'River Year',
  },
  {
    id: 'e3', type: 'article', author: 'me', date: '2026-06-05', readTime: '9 min',
    title: 'On keeping things you will never reread',
    body: 'There is a quiet argument for the archive that has nothing to do with retrieval. We rarely go back. And yet the act of setting something down — deliberately, by hand — changes how it lives in us. The archive is less a library than a discipline of noticing…',
    tags: ['essay', 'memory'], reactions: 88, comments: 19, collection: 'Essays',
  },
  {
    id: 'e4', type: 'code', author: 'me', date: '2026-06-04',
    title: 'tide.py — a tiny almanac',
    body: 'A script that prints tomorrow\u2019s tide and the moon phase to my terminal each morning. Forty lines. It has changed my mood more than most apps.',
    file: { name: 'tide.py', lang: 'Python', lines: 41, size: '1.8 KB' },
    code: 'from datetime import date\n\ndef almanac(d=date.today()):\n    phase = moon(d)\n    high, low = tides(d, place="Lisbon")\n    return f"{d:%a %d} \u00b7 {phase} \u00b7 high {high} low {low}"\n\nif __name__ == "__main__":\n    print(almanac())',
    tags: ['tools', 'python'], reactions: 33, comments: 5, collection: 'Workshop',
  },
  {
    id: 'e5', type: 'pdf', author: 'me', date: '2026-06-02',
    title: 'Berger — Ways of Seeing (annotated)',
    body: 'My marked-up copy. Most of the ink is in the second essay. Filing it here so the marginalia outlives the paper.',
    file: { name: 'ways-of-seeing.pdf', kind: 'PDF', pages: 168, size: '22 MB' },
    tags: ['reading', 'art'], reactions: 27, comments: 4, collection: 'Library',
  },
  {
    id: 'e6', type: 'note', author: 'p1', date: '2026-06-07', time: '9:02 PM',
    title: 'A serif is a handshake',
    body: 'Spent the evening drawing a single lowercase a. The bowl wanted to be rounder than the counter would allow. Some days the letter teaches you patience whether you asked for it or not.',
    tags: ['type', 'practice'], reactions: 22, comments: 6, collection: 'Daybook',
  },
  {
    id: 'e7', type: 'photo', author: 'p6', date: '2026-06-06',
    title: 'Fog, 6am, the long field',
    body: 'Stood there until my hands went numb. Worth it.',
    photo: { tone1: '#3a3f3c', tone2: '#191c1a', label: 'Mamiya 7 · Tri-X' },
    tags: ['fog', 'film'], reactions: 64, comments: 11, collection: 'Weather',
  },
  {
    id: 'e8', type: 'article', author: 'p2', date: '2026-06-05', readTime: '6 min',
    title: 'What the tidepool remembers',
    body: 'Three years of the same square metre of coast. The data is boring and the data is everything. A small note on attention as a research method…',
    tags: ['ecology', 'fieldwork'], reactions: 51, comments: 9, collection: 'Coast Log',
  },
];

const COLLECTIONS = [
  { id: 'c1', name: 'River Year', count: 64, desc: 'A photograph of the Tejo, most days, for a year.', tone: '#2a3140', kind: 'Photography', pinned: true },
  { id: 'c2', name: 'Essays', count: 22, desc: 'Longer thinking, finished and unfinished.', tone: '#2d2533', kind: 'Writing' },
  { id: 'c3', name: 'Field Notes', count: 318, desc: 'The daybook. Small observations, mostly mornings.', tone: '#1f2b29', kind: 'Notes' },
  { id: 'c4', name: 'Workshop', count: 47, desc: 'Tools, scripts, half-built machines.', tone: '#2b2722', kind: 'Code' },
  { id: 'c5', name: 'Library', count: 140, desc: 'Books, annotated PDFs, things worth keeping.', tone: '#26222b', kind: 'Reading' },
  { id: 'c6', name: 'Weather', count: 29, desc: 'Skies, fog, the quality of a given light.', tone: '#222a2e', kind: 'Photography' },
];

const LIBRARY = [
  { id: 'l1', kind: 'PDF', title: 'Ways of Seeing', author: 'John Berger', meta: '168 pp · annotated', tone: '#E86CB4', progress: 1 },
  { id: 'l2', kind: 'PDF', title: 'The Poetics of Space', author: 'Gaston Bachelard', meta: '241 pp · reading', tone: '#7AA2F7', progress: 0.4 },
  { id: 'l3', kind: 'MD', title: 'second-brain.md', author: 'personal notes', meta: '1,204 words', tone: '#9ECE6A', progress: 1 },
  { id: 'l4', kind: 'PY', title: 'tide.py', author: 'almanac script', meta: '41 lines · Python', tone: '#E0AF68', progress: 1 },
  { id: 'l5', kind: 'PDF', title: 'A Pattern Language', author: 'Christopher Alexander', meta: '1,171 pp · to read', tone: '#BB9AF7', progress: 0 },
  { id: 'l6', kind: 'MD', title: 'reading-2026.md', author: 'running list', meta: '38 entries', tone: '#73DACA', progress: 0.6 },
];

const PHOTOS = [
  { id: 'ph1', tone1: '#2a3140', tone2: '#11141c', date: 'Jun 7', label: 'Tejo, low tide' },
  { id: 'ph2', tone1: '#3a3f3c', tone2: '#191c1a', date: 'Jun 6', label: 'The long field' },
  { id: 'ph3', tone1: '#3d3340', tone2: '#1d1822', date: 'Jun 3', label: 'Stairwell, Alfama' },
  { id: 'ph4', tone1: '#403a33', tone2: '#1f1a14', date: 'Jun 1', label: 'Bakery, 6am' },
  { id: 'ph5', tone1: '#33403c', tone2: '#15201d', date: 'May 29', label: 'Rain, tram 28' },
  { id: 'ph6', tone1: '#2e3440', tone2: '#14181f', date: 'May 27', label: 'Blue hour, bridge' },
  { id: 'ph7', tone1: '#403338', tone2: '#1f1519', date: 'May 24', label: 'Market figs' },
  { id: 'ph8', tone1: '#363f33', tone2: '#171f14', date: 'May 22', label: 'Garden, after' },
  { id: 'ph9', tone1: '#3a3640', tone2: '#1a1620', date: 'May 20', label: 'Window light' },
];

// On this day — memories
const MEMORIES = [
  { id: 'm1', yearsAgo: 1, year: '2025', type: 'photo', title: 'First morning in the new flat', tone1: '#2d2533', tone2: '#161118', body: 'Boxes everywhere. Made coffee on the floor. Happiest I had been in months.' },
  { id: 'm2', yearsAgo: 2, year: '2024', type: 'note', title: 'A line I did not want to lose', body: '\u201cThe present is the only thing that has no end.\u201d \u2014 copied from a book I have since lost.' },
  { id: 'm3', yearsAgo: 4, year: '2022', type: 'photo', title: 'The day the river froze at the edges', tone1: '#26303a', tone2: '#11171d', body: 'Rare cold. The whole city walked down to look.' },
];

// calendar — June 2026 entry density per day (0-3)
const CAL_DENSITY = {
  1: 2, 2: 1, 3: 3, 4: 2, 5: 3, 6: 1, 7: 2, 8: 2,
  11: 1, 13: 2, 14: 1, 17: 3, 19: 1, 22: 2, 24: 1, 27: 2, 29: 1,
};

// notices — calm, grouped by time. type: react | comment | collect | follow | mention | memory
const NOTICES = [
  { id: 'n1', group: 'Today', type: 'comment', who: 'p4', target: 'On keeping things you will never reread', quote: 'This is the one I keep coming back to.', time: '2h', unread: true },
  { id: 'n2', group: 'Today', type: 'react', who: 'p1', target: 'On keeping things you will never reread', time: '4h', unread: true },
  { id: 'n3', group: 'Today', type: 'collect', who: 'p2', target: 'tide.py', coll: 'Coast Log', time: '5h', unread: true },
  { id: 'n4', group: 'This week', type: 'memory', title: 'A memory resurfaced', sub: 'One year ago — First morning in the new flat', time: '2d' },
  { id: 'n5', group: 'This week', type: 'react', who: 'p6', target: 'Tejo, low tide', photo: { tone1: '#2a3140', tone2: '#11141c' }, time: '3d' },
  { id: 'n6', group: 'This week', type: 'follow', who: 'p3', time: '4d' },
  { id: 'n7', group: 'Earlier', type: 'mention', who: 'p4', target: 'Paper, thread, and the long afternoon', time: '1w' },
  { id: 'n8', group: 'Earlier', type: 'collect', who: 'p6', target: 'Fog, 6am, the long field', coll: 'Weather', time: '1w' },
  { id: 'n9', group: 'Earlier', type: 'follow', who: 'p5', time: '2w' },
];

Object.assign(window, { ME, PEOPLE, ENTRIES, COLLECTIONS, LIBRARY, PHOTOS, MEMORIES, CAL_DENSITY, NOTICES });
