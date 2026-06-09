# Handoff: The Archive by Balboni

> A quiet, editorial social network — a personal archive that happens to have people inside it.
> Mobile-first, dark editorial interface. This bundle is the design reference.

---

## Overview

**The Archive** is a calm, reflective social app where people *archive* their thoughts, projects, memories, photos, files, code, articles and discoveries over time — rather than posting for attention. Each user has their own Archive organized around **Today, Memories, Calendar, Collections, Library, Photography, and People/Connections**. The social layer is intimate and intentional: no infinite algorithmic feed, no follower-count obsession, no trending topics, no repost culture, no vanity metrics.

Mood references: Day One, Are.na, Readwise Reader, Bear, Obsidian, Cosmos, Linear, Apple-grade polish.

---

## About the Design Files

The files in this bundle are **design references built in HTML/React (via in-browser Babel)** — a working prototype that demonstrates the intended look, layout, and interactions. **They are not meant to be shipped as-is.**

Your task: **recreate these designs inside the target codebase using its existing environment and patterns** (React/Next, Vue, React Native, SwiftUI, Flutter, etc.). If the project has a component library, design-token system, router, and state conventions, use them. If no environment exists yet, choose the most appropriate framework for the project and implement there.

Treat the HTML/JSX as the **source of truth for visual + behavioral intent**, and `tokens.css` as the **source of truth for design tokens**.

---

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, radii, and interactions are all specified. Recreate the UI pixel-accurately using the codebase's libraries. Exact hex values, font families, sizes and behaviors are documented below and in `tokens.css`.

---

## Form factors

This bundle ships **two implementations of the same product and design language**:

- **Mobile** (`The Archive.html`) — the primary, mobile-first experience inside an iOS frame. Bottom tab bar + pushed overlays + slide-up create sheet.
- **Desktop** (`The Archive Desktop.html`) — a 3-column app (left sidebar nav · centered reading column · contextual right rail). Same tokens, data, entry cards, and copy; navigation and a couple of surfaces are re-shaped for the wider canvas (see **Desktop layout** below).

Build both from the shared design language; only the **shell/navigation** differs.

---

## Design Language (read first)

- **Surface:** pure flat black `#000000`. No heavy cards — separation is done with **hairlines** (`rgba(255,255,255,0.08)`), not fills/shadows. Raised elements use barely-there white overlays (1.5–5% alpha).
- **Ink:** warm off-whites, never pure `#fff`. Primary `#F2EDE6`, secondary `#ABA49A`, tertiary `#6C665E`.
- **Accent:** rose `#E86CB4`, used confidently on the brand mark, primary CTAs, active tab/nav states, eyebrows, links, progress, and selected states.
- **Type system (the core of the "editorial" feeling):**
  - **Newsreader** (serif, incl. *italic*) → all headlines, titles, entry titles, reading body, pull quotes, comments. Italic is used expressively (greetings, section accents, quotes).
  - **Hanken Grotesk** (sans) → all UI: nav, buttons, labels, list text, note/short-entry body.
  - **JetBrains Mono** (mono) → dates, file metadata, eyebrows (UPPERCASE + wide tracking), tags, code, numeric stats.
- **Tone of copy:** literary, warm, understated. e.g. "What are you keeping today?", "Notes in the margin" (comments), "That is today.", "Nothing kept this day. A quiet one."
- **Motion:** gentle. Screens fade-up on enter; pushed views slide in from the right; the create view slides up as a sheet. Easing `cubic-bezier(.22,1,.36,1)`. Respect `prefers-reduced-motion`.

---

## Global Layout / Chrome

Presented inside an **iOS device frame** (390–402pt wide). The app shell is a vertical flex column:

1. **Sticky AppBar** (per screen) — `padding-top: 58px` to clear the status bar/dynamic island; bottom hairline. Left slot = brand wordmark or back button; optional center italic-serif title; right slot = round icon buttons (38px circle, `surface-3` fill).
2. **Scroll area** — `flex: 1; overflow-y: auto`. Default horizontal gutter **20px**.
3. **Bottom Tab Bar** — solid black, top hairline, `padding-bottom: 26px` to clear the home indicator. Five slots: **Today · Archive · [Create] · Explore · You**. The center **Create** is a 46px rose circle with a feather icon and a soft glow (`0 6px 20px -4px var(--accent), 0 0 0 5px accent@14%`). Inactive tab icons/labels use `--ink-3`; active uses `--accent`. Labels 10.5px.

Pushed/overlay views (Entry detail, Create sheet, People, Notices, other-person Profile) render `position: absolute; inset: 0; z-index: 58` over the shell, each with its own header + back/cancel affordance.

---

## Desktop layout

The desktop build (`The Archive Desktop.html`) keeps every screen's content, copy, tokens, and entry cards identical — only the **shell** changes:

- **Left sidebar (264px, fixed, full-height, right hairline):** brand wordmark (rose dot + "The Archive"), a prominent rose **"Keep something"** button (opens Create), primary nav (**Today · Explore · People · Notices** — Notices carries an unread dot), a **"YOUR ARCHIVE"** group (Overview · Memories · Calendar · Collections · Library · Photography), and a pinned user chip at the bottom (avatar + name + @handle → your profile). Active item = rose text on a `accent@12%` pill.
- **Center column (reading width):** the active screen body. `max-width` of the whole content area is **1140px** when a rail is present, **880px** otherwise, centered; large serif page titles (40px) sit at the top of each view via a shared `DPageHead` (eyebrow + title + optional italic + sub).
- **Right rail (300px, contextual):** shown on **Today** ("On this day" memory cards + "Latest notices" peek) and the **Archive family** ("About this archive" bio+stats + a Collections quick-list). Hidden on Explore / People / Notices / Profile (those center their single column).
- **Create** and **Entry detail** are **centered modal dialogs** over a dimmed (`rgba(0,0,0,0.72)`) backdrop (radius 20, hairline border, `dPop`/`dFade` entrance), instead of the mobile sheet/pushed view. Click-outside or the × closes them.
- **Other people's profiles** open in the main column with a sticky "← Back" bar.
- Navigation is a single `view` string (+ a `person` for viewing others, `entry`/`createOpen` for modals) — no bottom tabs.

Same tokens, same `EntryCard` / `Avatar` / `Chip` / `PhotoTile` / `TypeTag` primitives, same reading/notices/calendar/collections/library/photography bodies as mobile.

---

## Screens / Views

### 1. Today (Home)
- **Purpose:** a calm daily landing — open the app like opening a journal.
- **Layout (top→bottom):**
  - AppBar: left = rose 7px dot + "The Archive" (Newsreader 17px); right = a **bell** (→ Notices, with a small unread accent dot) + search round button.
  - **Masthead** (`padding: 22px 20px 18px`): mono eyebrow in **accent**, `0.16em` tracking — full date uppercase ("MONDAY, JUNE 8, 2026"). Then serif greeting 33px / line-height 1.08, weight 400, tracking -0.02em — "Good morning," with the **first name in italic**. Then a sans 13.5px sub-line in `--ink-3`: "Day 1,640 of your archive · 1,284 entries kept" (numbers in `--ink-2`).
  - **Today prompt** (tappable → opens Create): full-width, radius 16, border `--line-strong`, bg `accent@6%`. Left: 40px rose circle w/ feather. Title italic serif 16.5px "What are you keeping today?", sub sans 12.5px `--ink-3`. Trailing `+`.
  - **"On this day" strip:** SectionLabel ("ON THIS DAY" mono eyebrow + "See all" accent action). Horizontal scroll of 168px memory cards (photo cards with bottom gradient + "N YEARS AGO" accent eyebrow; note cards show an italic-serif excerpt). Caption + year below each.
  - **"From your circle today":** SectionLabel, then a vertical list of **EntryCards** separated by hairlines.
  - **Footer:** centered italic-serif "That is today." + sub line.

### 2. Personal Archive (Archive → Overview)
- **Purpose:** the owner's own body of work, filterable.
- AppBar: left = italic-serif "Your Archive"; right = search.
- **Sticky sub-nav** (below AppBar, `top: 92px`): horizontal tabs — **Archive · Memories · Calendar · Collections · Library · Photos**. Active = `--ink` weight 600 with a 2px accent underline; inactive = `--ink-3`.
- Overview body: identity row (56px ring avatar + name serif 22px + "@handle · N entries · N collections" mono/sans meta). Type **filter chips** (Everything/Notes/Essays/Photos/Documents/Code). Then EntryCards (author hidden, since it's all "me").

### 3. Memories (Archive → Memories)
- Eyebrow "ON THIS DAY · JUNE 8" (accent). Serif headline 26px "What you kept, on other Junes." (second line italic).
- A **vertical timeline**: left rail = "Ny" (italic serif accent) + year (mono); a 1px vertical line with an 8px accent node; right = optional photo (150px), serif title 17px, sans body.

### 4. Calendar (Archive → Calendar)
- Header: "June 2026" (serif; year italic in `--ink-3`) + prev/next round buttons.
- **Month grid** 7 columns. Weekday initials (mono 10px, `--ink-3`). Day cells are square buttons radius 11; selected day = solid accent fill, white number; entry **density dots** (0–3) under the number — accent dots normally, white when the day is selected.
- Below: hairline, mono eyebrow "JUNE N · M ENTRIES", then EntryCards for that day, or an italic-serif empty state.

### 5. Collections (Archive → Collections)
- 2-column grid of collection cards (radius 16, border `--line-strong`). Each: an 88px gradient header (per-collection tone → near-black), an optional accent **pin** icon, a mono kind label; body has serif name 16.5px, 2-line sans description `--ink-2`, mono "N entries".

### 6. Library (Archive → Library)
- Intro line. Then a hairline-separated list. Each row: a 38×50 "spine" (tinted gradient + tone border) with a kind glyph (PDF / Markdown / Code); serif title 16px; sans author/meta; a thin **progress bar** (accent fill) + mono meta ("168 pp · annotated", "41 lines · Python", etc.).

### 7. Photography (Archive → Photos)
- 3-column gallery, 3px gaps, square tiles (radius 3). Tiles are gradient placeholders with film-grain overlay; on hover, a bottom gradient reveals a mono date.

### 8. Profile / Archive owner page (You, or any person)
- AppBar: "You" (self, italic serif) or back button (others); right = more (•••).
- Identity block: 76px ring avatar, name serif 28px, "@handle" in accent, italic-serif title, sans bio (max-width 340), mono row with location (pin) + joined.
- **Action:** self → outline "Edit your archive" (pencil). Other → solid accent "Follow" / outline "Following" + a square message button.
- **Stats card:** bordered, radius 16, 4 stats (Entries / Collections / Circle / Days kept) — serif number 21px + mono UPPERCASE label.
- **Collections strip** (horizontal 140px cards) + **Recent** EntryCards.

### 9. Explore / Search
- AppBar: italic-serif "Explore".
- **Search field:** radius 13, border `--line-strong`, bg `surface-2`, leading search glyph, trailing clear (×) when filled.
- **Empty/default state:** theme chips (Photography, Essays, Field notes, Code, Reading, Memory, Architecture; first active). "Public archives, recently opened" = horizontal 256px cards (gradient + bottom gradient + serif headline overlay; avatar + name + mono stats below). "People keeping things like you" = PersonRow list + "See all" → People.
- **Active search state:** live filter over people + entries; "People" section (PersonRows) and "Entries" section (EntryCards). Empty → italic-serif "Nothing yet for ''."

### 10. People / Connections
- Pushed view. AppBar back + center title "People".
- Header: serif "Your circle" (circle italic) + sans sub ("N people you keep close. No counts, no clout — just company.").
- Segmented tabs "Circle · N" / "Suggested · N" (accent underline on active).
- **PersonRow** list.

### 11. Create new entry (sheet)
- Slides up (`sheetUp`), full screen, solid black.
- Header: "Cancel" (`--ink-3`) · italic-serif "Keep something" · solid accent "Save" pill.
- **Type selector** (horizontal): Note / Essay / Photo / Document / Markdown / Code — pill buttons w/ icon; active = solid accent.
- A mono hint line for the chosen type. For file types (Photo/PDF/Markdown/Code): a dashed **drop zone** (radius 16) with a rose upload circle + italic-serif "Drop your … here" + "or tap to browse".
- **Title** input — serif 26px. **Body** textarea — serif for Essay, mono for Code, else sans; 15px / line-height 1.65.
- Meta block (hairline top): "COLLECTION" mono label + collection chips + "+ New"; "WHO CAN SEE THIS" mono label + a 3-segment control **Private / Circle / Public** (active segment solid accent).

### 12. Notices / Notifications
- **Purpose:** calm, intimate activity — "word from your circle", quiet on purpose. Opened from the **bell** in the Today header (overlay, slides in).
- AppBar: back + center title "Notices" + a right-aligned accent text button "Mark read".
- Intro: "Word from your circle. Quiet on purpose — no counts, no noise."
- Grouped by time with mono eyebrows: **Today · This week · Earlier**. Footer: italic-serif "You're all caught up."
- **NoticeRow types:** `react` (left a heart on…), `comment` (left a note on… + an italic-serif quote in a left-border blockquote), `collect` (kept your entry to <collection>), `follow` (added you to their circle + a "Follow back" outline button), `mention` (mentioned you in…), `memory` (system — accent **sparkle** circle + italic title + sub, taps through to Memories).
  - Layout: 40px avatar with a small **type-glyph badge** (heart/comment/collections/people/tag) on its bottom-right; text uses sans for the action + **bold name** + *italic-serif target*; optional 44px photo thumbnail or a mono timestamp on the right; unread rows get a 6px accent dot on the far left.
  - Targets/quotes are italic serif; names are bold sans `--ink`.

### 13. Entry detail (reading view)
- Pushed view. Header: 38px back circle + bookmark/more round buttons; bottom hairline.
- Author row (tappable → their profile for non-self): 36px avatar + name + mono date/time; right = TypeTag.
- Serif title 30px (line-height 1.16, tracking -0.015em).
- Media by type: photo = full-bleed 4:3 with caption; code = code card; pdf = file row. Then serif reading body 17px / line-height 1.72 (Essays get an extra paragraph).
- **Tags** (accent `#tag` mono) + collection chip (right-aligned).
- **Reactions** row (heart + count, comment + count) above a hairline.
- **"NOTES IN THE MARGIN"** comments: 30px avatar + name + mono time + italic-serif comment.
- Sticky bottom **comment composer**: 32px avatar + pill input "Leave a note…" + 38px accent send circle.

---

## Reusable Components (build these once)

| Component | Spec |
|---|---|
| **Avatar** | Circle, 1px hairline border (or 1.5px accent ring when `ring`). Initials in **italic serif**, color = person's tone, size ≈ 40% of avatar. |
| **AppBar** | Sticky, `padding-top: 58px`, solid black gradient, bottom hairline. Left / optional center title / right slots. |
| **RoundBtn** | 38px circle (configurable), `surface-3` bg, icon `--ink-2` (or accent when active / white when `accent`). |
| **TabBar** | See "Global Layout". |
| **Chip** | Pill, 7×14px padding, 13px sans 500. Active = solid accent + white; inactive = transparent + `--line-strong` border + `--ink-2`. |
| **PhotoTile** | Gradient bg (`tone1`→`tone2`, 150°), top-right radial sheen, SVG fractal-noise grain overlay (blend `overlay`, ~0.5 alpha), hairline border. Photos are **placeholders** — wire to real images. |
| **FileBadge** | 40px rounded square, `surface-2`, glyph by kind (PDF/Code/Markdown). |
| **SectionLabel** | Mono 11px UPPERCASE `0.14em` tracking `--ink-3`, optional accent action on the right. |
| **TypeTag** | Mono UPPERCASE 10.5px with a small leading icon: Note/Essay/Photograph/Document/Code/Link. |
| **EntryCard** | `padding: 20px`, bottom hairline. Meta row (avatar+name+mono date + TypeTag) → serif title 21px → clamped excerpt (serif for Essay, sans otherwise; 2 lines for photo, else 3) → type media (PhotoTile / code card / file row / read-time) → ReactionRow. Whole card tappable → detail. |
| **ReactionRow** | Heart (fills + recolors accent on tap, count +1), comment (count, opens detail), spacer, bookmark (toggles accent). Counts in mono 12px. |
| **PersonRow** | 44px avatar + serif name 16.5px + sans "title · N shared" + italic-serif note; trailing Follow/Following button. Tappable → profile. |

---

## Interactions & Behavior

- **Tab nav:** Today / Archive / Explore / You switch the base screen and reset scroll to top. Archive sub-nav switches the section in place.
- **Create (+):** pushes the Create sheet (slide-up). Cancel/Save closes it.
- **Open entry:** tapping any EntryCard pushes the reading view (slide-in from right). Back pops it.
- **Open profile:** tapping a person (PersonRow, public archive card, entry author for non-self) pushes their Profile.
- **People:** Explore "See all" pushes the People view.
- **Search:** typing filters people + entries live (case-insensitive over title/body/tags/name/title/note); clearing returns to the discovery state.
- **Local toggles (optimistic, no backend):** heart like (+1 + recolor), bookmark save, follow/unfollow (label + style swap), calendar day select, archive type filter, create type/collection/privacy selection.
- **Animations:** `fadeUp .34s` on base-screen change; `pushIn .3s` for pushed views; `sheetUp .32s` for the create sheet. All gated by `prefers-reduced-motion`.

## State Management

- `tab`: 'today' | 'archive' | 'explore' | 'profile'
- `archiveSection`: 'overview' | 'memories' | 'calendar' | 'collections' | 'library' | 'photography'
- `overlayStack`: ordered list of pushed views — `{kind:'entry', entry}`, `{kind:'create'}`, `{kind:'people'}`, `{kind:'notices'}`, `{kind:'profile', person}`. Back = pop.
- Per-component local UI state: liked/saved (EntryCard, EntryDetail), following (PersonRow, Profile), selected calendar day, active filter/segment, create-form fields.
- **Data is mock** (see `data.jsx`): swap for real models — `ME`, `PEOPLE`, `ENTRIES` (types: note/article/photo/pdf/code/link), `COLLECTIONS`, `LIBRARY`, `PHOTOS`, `MEMORIES`, `CAL_DENSITY`, `NOTICES` (types: react/comment/collect/follow/mention/memory).

---

## Design Tokens

The complete, authoritative token set is in **`tokens.css`** (`:root`). Summary:

**Colors**
- Accent: `#E86CB4` · press `#d4549f` · soft `accent@12%` · faint `accent@6%`
- Background: `#000000`
- Surfaces: `rgba(255,255,255,0.015 / 0.03 / 0.05)`
- Ink: `#F2EDE6` / `#ABA49A` / `#6C665E`
- Hairlines: `rgba(255,255,255,0.08)` / `rgba(255,255,255,0.15)`

**Typography**
- Serif: **Newsreader** (300–600, italic) — headlines & reading
- Sans: **Hanken Grotesk** (400–700) — UI & body
- Mono: **JetBrains Mono** (400–500) — meta/eyebrows/code
- Scale (px): display 33 · title 28 · h2 25 · entry 21 · body 15 · ui 14 · meta 12.5 · mono-label 11
- Line-heights: tight 1.12 · snug 1.2 · body 1.6 · read 1.72
- Tracking: display -0.02em · mono eyebrow 0.14em

**Spacing** (px): 4 · 8 · 12 · 16 · **20 (gutter)** · 26 · 32
**Radii**: sm 9 · md 13 · lg 16 · xl 26 · pill 999
**Motion**: ease-out `cubic-bezier(.22,1,.36,1)` · fast .18s · screen .34s
**Layout**: safe-top 58 · safe-bottom 26 · device 402×874

---

## Assets

- **Fonts:** Google Fonts — Newsreader, Hanken Grotesk, JetBrains Mono. (Swap for self-hosted/equivalent if the codebase requires.)
- **Icons:** custom inline SVG line set in `icons.jsx` (stroke-based, `currentColor`, 24×24, ~1.6 stroke). Names: today, archive, explore, people, profile, plus, calendar, collections, library, photo, heart, comment, bookmark, more, chevron, chevronDown, back, close, search, edit, pdf, code, markdown, tag, clock, pin, sparkle, grid, list, image, note, link, feather, upload. Re-implement with the codebase's icon system or port these SVGs.
- **Photography:** all photos are **CSS gradient placeholders with a noise overlay** — there are no real image assets. Wire `<img>`/remote images in production.
- No raster/brand image files are included.

---

## Screenshots

Reference renders of every screen live in **`screenshots/`** (PNG, captured from the live prototype). Use them as the visual north-star for fidelity:

| File | Screen |
|---|---|
| `01-today.png` | Today / Home |
| `02-archive.png` | Personal Archive (Overview) |
| `03-memories.png` | Memories |
| `04-calendar.png` | Calendar |
| `05-collections.png` | Collections |
| `06-library.png` | Library |
| `07-photography.png` | Photography |
| `08-explore.png` | Explore / Search |
| `09-people.png` | People / Connections |
| `10-profile.png` | Profile / owner page |
| `11-create.png` | Create new entry (sheet) |
| `12-entry-detail.png` | Entry detail (reading view) |
| `13-notices.png` | Notices / Notifications |

> These are the intended look. The HTML prototype is the interactive counterpart; `tokens.css` is the value source.

**Desktop renders** live in **`screenshots/desktop/`** — `01-today`, `02-explore`, `03-collections`, `04-profile`, `05-notices`, `06-people`, `07-library`, `08-calendar`, `09-photography` (the 3-column shell with sidebar + rail).

---

## Files in this bundle

| File | Role |
|---|---|
| `The Archive.html` | **Mobile** app shell — loads fonts, `tokens.css`, React/Babel, mounts the prototype inside the iOS frame with viewport scaling. |
| `The Archive Desktop.html` | **Desktop** app shell — loads fonts, `tokens.css`, React/Babel + `screens-archive.jsx` (reused section bodies) + the desktop files below. |
| `tokens.css` | **Design tokens** (`:root`) + base reset + keyframes. Authoritative for values. |
| `data.jsx` | Mock data models (ME, PEOPLE, ENTRIES, COLLECTIONS, LIBRARY, PHOTOS, MEMORIES, CAL_DENSITY). |
| `icons.jsx` | `<Icon name>` inline-SVG line set. |
| `components.jsx` | Avatar, AppBar, RoundBtn, TabBar, Chip, PhotoTile, FileBadge, SectionLabel, TypeTag. |
| `entries.jsx` | authorOf, fmtDate, ReactionRow, EntryMeta, EntryCard, CodePreview, FileRow. |
| `screens-today.jsx` | Today (Masthead, TodayPrompt, MemoryStrip, feed). |
| `screens-archive.jsx` | Archive + Overview / Memories / Calendar / Collections / Library / Photography + sub-nav. |
| `screens-social.jsx` | Explore/Search, PersonRow, People/Connections, **NoticesScreen** (notifications). |
| `screens-profile.jsx` | Profile / owner page (self + others). |
| `screens-create.jsx` | Create sheet + Entry detail (reading view) + comments. |
| `app.jsx` | **Mobile** navigation state machine, overlays, viewport scaling, Tweaks (accent color). |
| `desktop-screens.jsx` | **Desktop** screen bodies: DPageHead, DPersonRow, DToday/DArchive/DExplore/DPeople/DNotices/DProfile. |
| `desktop-app.jsx` | **Desktop** shell — Sidebar, contextual right rail, Entry & Create modals, nav state, mount. |
| `ios-frame.jsx` | iOS device bezel (presentation only — drop in production). |
| `tweaks-panel.jsx` | Prototype tweak panel (presentation only — drop in production). |

> **Note:** `ios-frame.jsx` and `tweaks-panel.jsx` are prototype scaffolding for this demo — do **not** port them. The viewport scaling in `app.jsx` is also demo-only.

---

## Suggested implementation order

1. Port **`tokens.css`** into the codebase's token system (CSS vars / Tailwind theme / native constants).
2. Load the three fonts.
3. Build the **primitives** (Avatar, Chip, RoundBtn, PhotoTile, FileBadge, SectionLabel, TypeTag, Icon).
4. Build **EntryCard / ReactionRow / PersonRow**.
5. Build the **shell** (AppBar + TabBar + nav/overlay state).
6. Build screens in priority order: **Today → Archive (+sub-sections) → Entry detail → Create → Explore → People → Profile**.
7. Replace mock data with real models; wire real images for photography.
