# DImarket cross-browser production audit

**Target:** https://dimarket.app/  
**Date:** 16 August 2026  
**Auditor environment:** Linux 6.12.94+ x86_64 (cloud agent, `DISPLAY=:1`)  
**Method:** Live UI in real browser engines against production. Not `npm run build`, not TypeScript, not API-only.  
**Production writes:** none. Registration submit, chat send, request create, campaign create/delete, and calculator save/delete were **not** executed (would mutate production data).

**FINAL STATUS: NOT READY**

Location-select text is vertically clipped in every engine that can open the header location panel. That is a critical, user-facing defect on production. The rest of the public shell (home, map tiles, ads, register UI, AI first turn) loads.

**CROSS-BROWSER SCORE: 6/10**

---

## 1. Browsers actually used

| Requested | What ran | Version | OS | Verdict on “was this browser tested?” |
|-----------|----------|---------|----|----------------------------------------|
| Google Chrome | Google Chrome (`channel: 'chrome'`) | **148.0.7778.96** | Linux x86_64 | Tested |
| Microsoft Edge | Microsoft Edge (`channel: 'msedge'`) | **151.0.4129.86** | Linux x86_64 | Tested |
| Mozilla Firefox | Playwright Firefox (Gecko) | **150.0.2** | Linux x86_64 | Tested |
| Safari | Apple Safari.app | — | — | **NOT TESTABLE** (no macOS/iOS Safari in this environment) |
| Safari engine surrogate | Playwright WebKit | **26.4** | Linux x86_64 | Extra evidence only — **not** Safari.app |
| Mobile Chrome | Chrome 148 + mobile viewports + Android UA | 148.0.7778.96 | Linux (emulation) | Viewport/UA emulation, **not a physical Android device** |
| Mobile Safari | iOS Safari | — | — | **NOT TESTABLE** |

Desktop viewports: **1440×900, 1366×768, 1280×800, 1024×768**  
Mobile / tablet viewports: **390×844, 375×812, 360×800, 768×1024**

Evidence screenshots: `docs/qa/cross-browser-2026-08-16/`

---

## 2. Compatibility matrix

Use: **PASS** / **PARTIAL** / **FAIL** / **NOT TESTABLE**

| Function | Chrome | Edge | Firefox | Safari |
|----------|--------|------|---------|--------|
| Homepage | PASS | PASS | PASS | NOT TESTABLE |
| Location | FAIL | FAIL | FAIL | NOT TESTABLE |
| Registration | PARTIAL | PARTIAL | PARTIAL | NOT TESTABLE |
| Request | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| Chat | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| Calculator | PARTIAL | PARTIAL | PARTIAL | NOT TESTABLE |
| AI | PARTIAL | PARTIAL | PARTIAL | NOT TESTABLE |
| Map | PASS | PASS | PARTIAL | NOT TESTABLE |
| Ads | PARTIAL | PARTIAL | PARTIAL | NOT TESTABLE |
| Mobile | PARTIAL | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |

**Safari column is NOT TESTABLE everywhere** — Apple Safari was not launched. WebKit 26.4 on Linux reproduced the same location clipping as Chrome (see §4). That is **not** a Safari PASS.

**Mobile Chrome column** in the table is collapsed into “Mobile”: Chrome viewport emulation only. Edge/Firefox/Safari mobile: **NOT TESTABLE**.

---

## 3. Homepage (desktop)

**Browsers:** Chrome 148, Edge 151, Firefox 150, WebKit 26.4  
**Viewports:** 1440, 1366, 1280, 1024

### Result

| Check | Result |
|-------|--------|
| Logo | Visible |
| Header “Deliver to” | Visible at ≥1024 (`lg`) |
| AI search | Visible on desktop |
| Secondary nav | Visible; **overcrowded** — trailing items clipped at the right edge |
| Hero / carousel | Visible |
| Stats cards | Visible (live counts change between reloads) |
| Lisanov banner | Visible, aspect not distorted (1954×805 natural → ~1342×553 display) |
| Footer | Present below the fold (viewport screenshot does not include it; no horizontal overflow) |
| Horizontal overflow | **0 px** at all four desktop sizes |
| Page JS errors | None recorded on homepage load |

**PASS** for homepage load/layout in Chrome, Edge, Firefox.

### High — nav crowding

At 1440×900, “Customer Service” is cut off on the right of the dark nav.  
At 1024×768, “Cost estimator” is cut to “Cost estim”, **and** the mobile bottom nav is shown together with the desktop header (breakpoint hybrid: bottom nav `xl:hidden` ≈ &lt;1280px, location trigger `lg:flex` ≈ ≥1024px).

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-1440x900-home.png`, `chrome-1024x768-home.png`

### Reproduction

1. Open https://dimarket.app/ in Chrome 148 at 1440×900.  
2. Observe header, AI bar, nav, hero, stats, banner.  
3. Resize to 1024×768 — desktop location control **and** bottom tab bar both present; nav labels clip.

---

## 4. Location selector (CRITICAL)

**Browsers:** Chrome, Edge, Firefox, WebKit  
**Viewports:** 1440, 1366, 1280, 1024 (header control is desktop `lg+`)

### What works (logic)

- Panel opens from “Deliver to”.
- Four native `<select>`s: Country, Region / State, City, Search radius.
- Country list includes Germany, Ukraine, Spain, USA / United States, United Kingdom, Dominican Republic (~70 countries).
- Germany → region list includes **North Rhine-Westphalia** and **Baden-Württemberg**.
- “Use my current location” and “Clear location filters” are present.
- Header label updates (e.g. “North Rhine-Westph…”) — horizontal ellipsis on the trigger is expected for long names.

### What fails (visual) — all tested engines

Closed-state select CSS on production:

- `height: 36px`
- `padding-top/bottom: 12px`
- content box **10px** for **14px** Inter
- `appearance: auto`

That is the live production bug (the unmerged branch fix is **not** on dimarket.app).

| Engine | Germany | All regions / NRW | All cities | 25 km | Long names |
|--------|---------|-------------------|------------|-------|------------|
| Chrome 148 | clipped | clipped | clipped | clipped | United Kingdom / NRW still clipped vertically |
| Edge 151 | clipped | clipped | clipped | clipped | same |
| Firefox 150 | clipped | clipped | clipped | clipped | same (descenders sit on the bottom edge) |
| WebKit 26.4 | clipped | clipped | clipped | clipped | same |

**FAIL** in Chrome, Edge, Firefox. Safari.app **NOT TESTABLE**; WebKit surrogate also FAIL.

Sidebar geo selects on `/map` use the same compact `.select-glass.h-9` recipe and show the same clip (Chrome).

Evidence:

- `docs/qa/cross-browser-2026-08-16/chrome-1440x900-location-germany.png`
- `docs/qa/cross-browser-2026-08-16/edge-1440x900-location-germany.png`
- `docs/qa/cross-browser-2026-08-16/firefox-1440x900-location-germany.png`
- `docs/qa/cross-browser-2026-08-16/webkit-1440x900-location-germany.png`
- `docs/qa/cross-browser-2026-08-16/chrome-map.png`

### Reproduction

1. https://dimarket.app/ at 1440×900, Chrome (repeat Edge / Firefox).  
2. Click **Deliver to**.  
3. Choose **Germany**.  
4. Choose **North Rhine-Westphalia**.  
5. Inspect Country / Region / City / Radius closed fields — glyphs are sliced (inner ≈ 10px vs 14px font).  
6. Repeat with United Kingdom as country.

Geolocation (“current location”) was **not** granted in this headless/cloud environment — button is visible, permission prompt not completed. **PARTIAL** for GPS.

---

## 5. Registration

**Browsers:** Chrome, Edge, Firefox (1440×900)

| Role button on `/register` | Visible |
|----------------------------|---------|
| Client | yes |
| Master / Professional | yes |
| Company | yes |
| Manufacturer | yes |
| Commercial Agent | yes |
| Advertiser (extra) | yes |

Step 2 (Client): Full name, email, password (min 6), phone, Back / Continue — all visible. No vertical clip on these inputs.

**Not done (by design):** submit, email confirm, profile row in Supabase. No production accounts created.

**PARTIAL** — UI/roles/fields PASS. Submit + profile creation **NOT TESTABLE** without writing to production.

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-register.png`

### Reproduction

1. Open https://dimarket.app/register  
2. Click each role card.  
3. Continue → account fields.  
4. Do not submit.

---

## 6. Client request (create project)

`/create-project` as a signed-out user shows **“Sign in to create a project”** + Sign in CTA.

No client request was created. Master inbox / respond / client sees response: **NOT TESTABLE** (no test accounts, no production writes).

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-create-project.png`

`/messages` redirects to `/login`.

---

## 7. Chat

Signed-out `/messages` → `/login` (email + password form renders).

Client → Master and Master → Client send/receive/realtime/attachments: **NOT TESTABLE**.

Chrome and Firefox both redirect the same way.

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-login.png`

---

## 8. Calculator (`/cost-estimator`)

Public wizard loads: **AI Cost Estimator**, Step 1 of 6, project-type grid (Apartment renovation, Electrical, …).

**Not completed:** quantity × unit price × VAT = total, save, edit, delete. This UI is a multi-step AI estimator, not a simple line-item calculator. No estimate was generated (would call production AI/backend).

**PARTIAL** in Chrome, Edge, Firefox. Safari **NOT TESTABLE**.

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-calculator.png`

Horizontal overflow: 0 px.

---

## 9. AI agent (header)

**Query:** `I need an electrician in Alicante`  
**Browsers:** Chrome, Edge, Firefox

| Check | Result |
|-------|--------|
| Input works | Yes |
| Navigates | https://dimarket.app/assistant/job |
| AI responds | Yes — follow-up: “What exactly needs to be done? Briefly describe the scope of the electrical work…” |
| Location extracted | Not confirmed on first turn (Alicante not echoed as a structured location) |
| Category extracted | Implied electrician via follow-up, not a confirmed category chip |
| Request created | No |
| Console pageerrors | None |

**PARTIAL** — first-turn chat works; extraction + job creation not verified.

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-ai-query.png`

---

## 10. Map (`/map`)

| Check | Chrome | Edge | Firefox |
|-------|--------|------|---------|
| Map container | PASS | PASS | PASS |
| Tiles | PASS (12 tile imgs) | PASS | PASS |
| Markers | PASS (17) | PASS | PASS |
| Zoom / pan | PASS (wheel + drag) | PASS | PASS |
| Marker click / popup | PASS (popup nodes appeared) | PASS | **PARTIAL** (0 popup nodes after click in this run) |
| Sidebar filters | Present; **select text clipped** (same 36px/12px bug) | same | same |
| Overflow | 0 px | 0 px | 0 px |

Safari **NOT TESTABLE**. WebKit map flow was not run (location-only pass).

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-map.png`

Mobile 390 map: tiles load (Iceland/Norway/Finland in frame), zoom controls visible, bottom nav Map active.

---

## 11. Advertising

| Check | Result |
|-------|--------|
| Homepage banner | Lisanov Group Real Estate — loads from Supabase `ad-media` |
| Distortion | **No** (natural ratio ≈ display ratio) |
| Empty “Ad Space” placeholder | **0** matches |
| `/advertising` | H1 + placement wireframe “Center 720×240” |
| New/deleted campaign live cycle | **NOT TESTABLE** (no production campaign mutations) |

**PARTIAL** — public render PASS; campaign lifecycle NOT TESTABLE.

Firefox console: Cloudflare `__cf_bm` cookie rejected for invalid domain on those PNG URLs. Cosmetic; images still loaded.

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-advertising.png`, homepage shots.

---

## 12. Responsive / mobile (Chrome viewport emulation)

**Not a physical phone. Not Mobile Safari.**

| Viewport | Overflow | Bottom nav | Hero | Map tiles | Notes |
|----------|----------|------------|------|-----------|-------|
| 390×844 | 0 | yes | yes | yes | AI placeholder “AI will guid” **horizontally clipped** by the orange button |
| 375×812 | 0 | yes | yes | yes | same |
| 360×800 | 0 | yes | yes | yes | same |
| 768×1024 | 0 | yes | yes | yes | AI search visible |

Header location selector is **hidden** on these widths (desktop `lg` control). Geo filters appear on `/professionals` after Filters (7 `select`s counted). Location GPS in the header panel is N/A on small screens.

No pageerrors. No recorded 4xx/5xx in the collector for these viewports.

Evidence: `docs/qa/cross-browser-2026-08-16/chrome-mobile-390x844-home.png`, `chrome-mobile-390x844-map.png`

**PARTIAL** for Mobile Chrome emulation. Mobile Safari **NOT TESTABLE**.

---

## 13. Console and network

### Chrome / Edge (homepage location pass)

- Page errors: **none**
- Failed HTTP responses (status ≥ 400): **none recorded**
- Later full pass: `Failed to load resource: net::ERR_NAME_NOT_RESOLVED` (host not attached to the console string). No matching 4xx/5xx in the response listener — likely a blocked/unresolvable third-party or telemetry host, not the app origin.

### Firefox

- `__cf_bm` cookie rejected for invalid domain on:
  - `https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/1786650118570-afe0s9shq1.png`
  - `https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/1786650014041-cf1a5wld0p.png`
- Banner still rendered. Not a user-facing functional break.

### CORS / 401 / 403 / 500 / Supabase REST

No 401/403/500 samples captured on the public pages exercised. Authenticated APIs were not hit.

### Missing assets

No 404s recorded for first-party JS/CSS on the homepage pass.

---

## 14. Per-function notes

### Works correctly (public shell)

- Homepage hero, logo, AI bar, stats, Lisanov banner across Chrome/Edge/Firefox
- Register role picker + step-2 fields
- Login form
- Map tiles + markers (Chrome/Edge; Firefox tiles/markers)
- Cost estimator step-1 type grid
- AI assistant first reply after header submit
- No horizontal document overflow on tested widths
- Mobile bottom nav at 390/375/360

### Critical blockers

1. **Location (and map/professionals) native `<select>` text vertically clipped** on production in Chrome, Edge, Firefox, and WebKit. Inner content box 10px vs 14px font. Germany / North Rhine-Westphalia / All cities / 25 km.

### High priority

1. Desktop secondary nav overflow: items clipped at 1440; worse at 1024.  
2. **1024×768 hybrid chrome:** desktop header + mobile bottom nav together.  
3. Authenticated loops (request, chat, calculator save) unverified on production.

### Medium

1. Mobile AI placeholder clipped: “AI will guid”.  
2. Firefox `__cf_bm` cookie warnings on ad PNGs.  
3. Chrome/Edge `ERR_NAME_NOT_RESOLVED` for an unnamed resource on the long session.  
4. Firefox marker-click popup not observed in this run.  
5. Public stats show **0 reviews** and **0 completed projects** (product/data, not engine-specific).  
6. AI did not confirm Alicante as structured location on the first turn.

---

## 15. What was deliberately not done

- No production user created  
- No production message sent  
- No production job/request posted  
- No ad campaign created or deleted  
- No geolocation permission accepted  
- No Apple Safari / iOS device  
- No physical Android device  
- No code or production config change

---

## 16. Engine × viewport log (location metrics)

Identical CSS clip in every desktop engine/size that opened the panel:

`height=36, padT=12, padB=12, inner=10, fontSize=14, appearance=auto, clipped=true`

Viewports: 1440×900, 1366×768, 1280×800, 1024×768  
Engines: Chrome 148, Edge 151, Firefox 150, WebKit 26.4 (1440 + 1024 only)

---

## FINAL STATUS

**NOT READY**

A shopper cannot reliably read Country / Region / City / Radius in the location selector on production Chrome, Edge, or Firefox. That is enough to refuse READY, even though home/map/register UI otherwise load.

Safari and Mobile Safari remain **NOT TESTABLE** here; they must be re-run on macOS/iOS before claiming Safari parity.
