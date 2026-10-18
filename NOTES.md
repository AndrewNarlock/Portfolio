# Development Log

A running record of what I asked the AI and what changed as a result.
---

## Entry 1 — 2026-10-10 — Initial build (Artifact 1)

**Tool:** Claude

**What I asked:**
Build a portfolio website for the Artifact 1 assignment based on my old portfolio
(`portfoliov4`). Keep the same style, layout, accessibility and responsive design.
Remove the Skills section (may be re-added later). Show five project cards inside the
same carousel as the old site: card 1 is this artifact, cards 2–5 are empty shells.
Make the design slightly more professional and clean.

**What changed:**
- Rebuilt the home page with the same sections as the old site: hero, Projects
  carousel, About, Contact and footer. Skills section removed.
- Kept the brand colors (navy `#23376b`, blue `#37679f`), the Montserrat font, the
  AND logo hero background and the hero's staggered fade-in and title reflection.
- Carousel keeps the dark inset container, white cards and side arrow buttons, but now
  uses native scrolling with scroll-snap, so it also works with touch, trackpad,
  keyboard and without JavaScript. Arrows move below the carousel on phones.
- Five cards: Artifact 01 (Portfolio Website) links to `views/artifact-1.html`;
  Artifacts 02–05 are placeholders with commented instructions for editing.
- New `views/artifact-1.html` project page in the style of the old project pages
  (navy nav bar with logo and Projects dropdown, navy text blocks).
- Accessibility: skip link, semantic landmarks, one `h1` per page, visible focus
  outlines, `aria-expanded` menus that close with Escape, labelled carousel buttons,
  a polite live region announcing visible cards, decorative text hidden from screen
  readers, and `prefers-reduced-motion` support.
- Cleaner design: consistent spacing, fluid type with `clamp()`, rounded corners,
  softer shadows, section heading accents.

**Where the AI misread me / what I adjusted:**
- Removed some paragraphs that were not necessary.

---

## Entry 2 — 2026-10-10 — Filling in cards 2 and 5

**Tool:** Claude

**What I asked:**
Fill in two of the four placeholder cards with real projects of mine, styled to match
card 1 instead of the gray "Coming Soon" shells. Card 2 is a tower defense game I have
been building; card 5 is Pebble Town, the web MMO I keep working on. Cards 3 and 4 stay
empty for now. I pointed the AI at my local `towerdefense` and `pebble-town` folders
rather than describing the projects from memory.

**What changed:**
- Cards 02 and 05 on the home page are now full cards: a real image, title, a short
  description and a working **View Project** link, same markup as card 01.
- New `views/artifact-2.html` (Tower Defense) and `views/artifact-5.html` (Pebble Town),
  built on the existing project page template — same navy nav bar, title block and
  footer as artifact 1.
- Both pages are deliberately minimal: the label reads "Temporary Idea", and the body is
  just a preview image of the game. Neither artifact is actually built for this course
  yet, so a full write-up would be claiming work I have not done.
- New `.project-preview` rule in `project.css` for that image-only layout, with a comment
  saying to swap it for `.project-block` sections once an artifact is real.
- The Projects dropdown on every project page now lists 01, 02 and 05.
- Four new images in `assets/img/`, generated from the games themselves rather than
  mocked up:
  - `tower-defense-card.jpg` / `tower-defense-board.jpg` — rendered by importing the
    game's own `GameMap` class so the path tiles are exactly what the game produces,
    then drawing enemies, towers and the base with the colors from their `draw()`
    methods.
  - `pebble-town-card.jpg` / `pebble-town-map.jpg` — the real `town.png` with each
    building sprite sliced out of `buildings.png` and placed at its actual footprint
    from `server/config.js`, the same way the game client draws them.
- Checked that all 50 local links and images across the four pages resolve.

**Where the AI misread me / what I adjusted:**
- It first laid the cards out as I originally described them — a messenger app on card 2
  and tower defense on card 4. I changed my mind partway through and moved tower defense
  to card 2, dropped the messenger app, and left cards 3 and 4 empty. It deleted the
  messenger mockups it had already generated.
- It asked before building the extra project pages instead of assuming, which was the
  right call — I did want them.
- Its first draft of those two pages was a full write-up of each game: overview, build
  details, lessons learned. That was more than I wanted, and more than is honest for
  artifacts I have not started for this class. I had it cut both pages back to a preview
  image labelled "Temporary Idea".

---

## Entry 3 — 2026-10-10 — Trimming artifact 1 and adding outbound links

**Tool:** Claude

**What I asked:**
Drop the "How It's Built" block and the blue HTML/CSS/JS tile from the artifact 1 page,
and give both the Overview block and card 01 on the home page a link to the live site
and a link to the GitHub repo. I do not have the URLs yet.

**What changed:**
- `views/artifact-1.html` is now a single Overview block with the logo image beside it.
  The "How It's Built" section and its gradient tile are gone.
- Two outbound links at the bottom of the Overview block, styled as outlined buttons
  against the navy (new `.project-links` / `.project-link` in `project.css`).
- Card 01 keeps its **View Project** button and gains a compact **Live Site** / **GitHub**
  row underneath (new `.card-links` / `.card-link` in `home.css`).
- Both link pairs are `href="#"` placeholders, each marked with a
  `<!-- TODO: replace both href="#" below with the real URLs -->` comment. Searching the
  project for `href="#"` finds all four.
- The `.project-panel` rule in `project.css` is now unused, since nothing references it
  any more. Left in place in case artifact 3 or 4 wants that tile later.

---

## Entry 4 — 2026-10-10 — Renaming the site and clearing out dead CSS

**Tool:** Claude

**What I asked:**
Change every "Andrew Narlock Design" to "Andrew Narlock Portfolio", then delete any CSS
that nothing uses — including the `.project-panel` rule left over from the entry above.

**What changed:**
- Seven renames: the hero `h1` and its reflection shadow, the nav bar logo text on all
  three project pages, and two image `alt` attributes. The page titles and the
  "Designed by Andrew Narlock" footers were left alone — different wording, still true.
- Scanned all three stylesheets for class selectors and custom properties with no
  reference in any HTML or JS file, then removed what came back:
  - `.project-block--reverse` — no page alternates sides any more.
  - `.detail-list` and its four child rules — went away with the "How It's Built" lists.
  - `.project-panel` — the gradient tile, now gone from every page.
  - `--blue-light` and `--shadow-sm` — defined in `:root`, never read.
  - The `max-width: 900px` media query lost its references to the two deleted classes.
- `project.css` went from 384 lines to 346. A re-scan reports zero unused classes and
  zero unused custom properties across all three files; braces balance in each.

**Where the AI misread me / what I adjusted:**
- Nothing this round. It checked each rule against the HTML and JS before deleting, and
  pointed out that the AND logo and favicon still spell out the old name — worth deciding
  on separately.


---

## Entry 5 — 2026-10-18 — Artifact 2 becomes Infection; temporary artifacts unlinked

**Tool:** Claude

**What I asked:**
Make artifact 2 feature my web game Infection
([infection-game](https://github.com/AndrewNarlock/infection-game)), focusing on the
new updates: optimizations, leaderboards built with what I've learned in my algorithms
class, and features like new characters and game length options. My professor also said
the temporary artifacts (3–5) should not link to a page yet.

**What changed:**
- `views/artifact-2.html` rewritten from the Tower Defense placeholder into a full
  write-up: a gameplay image, then Overview, Optimizations, Leaderboards and New Features
  blocks, with a GitHub link. All numbers and claims come from the game repo's README,
  `LOG.md` and `game/leaderboard.js`.
  - Optimizations: send-only-what-changed networking (6,454 → 0 bytes/sec idle, 87% less
    while moving), drawing only on-screen map tiles and scenery, one-time setup work.
  - Leaderboards: sorted array + hash map, binary search for re-insertion and for rank,
    cached top 50, compared against a per-view `O(n log n)` database sort.
  - Features: animated characters replacing colored circles, the Pebble Town map,
    host-chosen game lengths (30 s / 1 / 5 / 10 min).
- Card 02 on the home page is now Infection, with a new image, description and a GitHub
  link under **View Project**.
- Card 05 (Pebble Town) keeps its image and text, but its button is now the disabled
  "In progress" label used by cards 03 and 04. No card or menu links to artifacts 3–5.
- The Projects dropdown on artifacts 1 and 2 lists only 01 and 02.
- Two new images, `infection-card.jpg` and `infection-match.jpg`, rendered in headless
  Edge using the game's own `assets.js` and `avatar.js` with the renderer's draw order,
  so the town, buildings and characters are what the game actually draws.
- New list styles in `project.css` (`.project-text ul`, `li`, `strong`) for the bullet
  lists in the write-up.

**Cleanup (follow-up request):**
After the changes above, three files were left with nothing pointing to them. I asked
for them to be removed:
- `views/artifact-5.html`, the Pebble Town placeholder page.
- `assets/img/tower-defense-card.jpg` and `assets/img/tower-defense-board.jpg`.

A search of every HTML, CSS and JS file confirmed nothing else referenced them before
they were deleted. The `.project-preview` comment in `project.css` described placeholder
pages; it now describes the rule's current use as a lead image on artifact 2.

`assets/img/pebble-town-map.jpg` is also unreferenced now, since only the deleted page
used it. It is kept on purpose for artifact 5's page later.

**Where the AI misread me / what I adjusted:**
- It noticed the unused page and images but asked before deleting them, rather than
  deleting on its own.
