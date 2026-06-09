# The Archive by Balboni

> A quiet, editorial social network — a personal archive that happens to have people inside it.

A calm, reflective app where people *archive* their thoughts, projects, memories, photos, files, code, and discoveries over time — rather than posting for attention. Each user has their own Archive organized around **Today, Memories, Calendar, Collections, Library, Photography, and People**. The social layer is intimate and intentional: no algorithmic feed, no follower-count obsession, no trending topics.

**Production:** https://social.balbonilab.com

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Routing | React Router v6 |
| PWA | vite-plugin-pwa |
| Backend | Express + PostgreSQL |
| Process manager | PM2 (`mayra-social-api`) |

---

## Design language

- **Surface:** pure flat black `#000000`. Separation via hairlines (`rgba(255,255,255,0.08)`), not fills or shadows.
- **Accent:** rose `#E86CB4` — CTAs, active states, eyebrows, links.
- **Type:** Newsreader (serif, headlines + reading), Hanken Grotesk (sans, UI), JetBrains Mono (mono, dates + code).
- **Ink:** warm off-whites — `#F2EDE6` / `#ABA49A` / `#6C665E`.
- **Motion:** gentle fade-up on screen entry; slide-up sheet for Create on mobile; centered modal on desktop.

---

## Layout

**Mobile (< 768px)**
- Sticky `AppBar` per screen (clears iOS safe area)
- Fixed bottom `TabBar`: Today · Archive · Create · Explore · You
- Full-screen slide-up sheet for the Create form

**Desktop (≥ 768px)**
- 264px left sidebar: rose dot + "The Archive" wordmark, "Guardar algo" button, primary nav (Hoje / Explorar / Pessoas / Avisos), "SEU ARQUIVO" archive group, user chip at bottom
- Center reading column (flex-1, max-width ~880–1140px)
- 300px contextual right rail: "Neste dia" memories + notices peek on Today; bio + stats + collections on Archive pages; hidden on all other routes
- Centered modal dialog for Create (instead of full-screen sheet)

---

## Screens

| Route | Screen |
|---|---|
| `/` | Today — masthead, today prompt, memory strip, circle feed |
| `/archive` | Archive hub — overview / memories / calendar / collections / library / photos (subnav on mobile, sidebar on desktop) |
| `/explore` | Explore — search, theme chips, public archives, people |
| `/profile` | Your profile — stats card, collections strip, recent entries |
| `/profiles/:id` | Public profile — follow/unfollow, collections, entries |
| `/friends` | People / Connections — circle, followers |
| `/notifications` | Notices — activity grouped by time, "Mark read" |
| `/settings` | Settings — edit profile, password, export/import, danger zone |
| `/articles/:id` | Entry detail — reading view, reactions, comments |
| `/collections/:id` | Collection detail |

---

## Components

### Shell
- **Layout** — sidebar + main + right rail + global compose listener (`window.dispatchEvent(new CustomEvent('open-compose'))`)
- **Sidebar** — 264px desktop sidebar with editorial nav; mobile drawer
- **RightPanel** — contextual right rail (Today content vs Archive content, hidden on other routes)
- **ComposeBox** — desktop: centered modal over dimmed backdrop; mobile: full-screen slide-up sheet

### UI primitives (`src/components/ui/`)

| Component | Description |
|---|---|
| `AppBar` | Sticky top bar, `md:hidden`, clears iOS safe area |
| `TabBar` | Fixed bottom bar, mobile only |
| `Avatar` | Circle with initials fallback, accent ring variant |
| `EntryCard` | Meta row + serif title + excerpt + type media + ReactionRow |
| `ReactionRow` | Heart / comment / bookmark with optimistic counts |
| `PersonRow` | Avatar + serif name + follow/following button |
| `Chip` | Pill tag — active = solid accent fill |
| `TypeTag` | Mono UPPERCASE kind label with leading icon |
| `PhotoTile` | CSS gradient placeholder with noise overlay |
| `FileBadge` | 40px rounded square with kind glyph |
| `SectionLabel` | Mono eyebrow + optional accent action |
| `Icon` | Inline SVG line set (stroke-based, 24×24, `currentColor`) |

---

## Local development

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Backend (in /backend)
cd backend
npm install
npm run dev        # http://localhost:3001
```

Copy `.env.example` to `.env` and fill in the database URL and JWT secret.

---

## Deploy

```bash
# Push code
git push origin main

# On the VPS
cd /var/www/mayra-social
git pull origin main
npm install
npm run build
pm2 restart mayra-social-api
```

See `DEPLOY.md` for the full PostgreSQL, PM2, Nginx, storage, and SSL setup.

---

## Security

Never commit:
- `.env` or `backend/.env`
- `backend/storage/uploads/` (keep only `.gitkeep`)
- `dist/` or `node_modules/`

---

*The Archive by Balboni — kept, not broadcast.*
