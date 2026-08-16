# DImarket — Complete Mobile UX & Functionality Audit

**Date:** 2026-08-05  
**Production build audited:** `97c0087` (`https://dimarket.app/build-id.txt`)  
**Branch / PR:** `cursor/mobile-ux-audit-81bd`  
**Raw data:** `docs/mobile-audit/raw-findings.json`, `docs/mobile-audit/lighthouse-*.json`, screenshots `docs/mobile-audit/shot-*-iphone-13.png`

---

## Method & honesty limits

This audit **did** exercise the live production SPA across phone/tablet viewports with automated Chromium (touch + mobile UA), plus Lighthouse mobile (simulated Slow 4G) on key pages, plus a full static/code review of Header, filters, forms, cards, map, footer, and `MobileBottomNav`.

This audit **did not** open physical devices with Safari iOS, Samsung Internet, Firefox Mobile, or Edge Mobile. Those engines can differ on keyboard, safe-area, 100vh/dvh, and gesture scrolling. Treat browser-specific rows below as **risk ratings inferred from code + Chromium emulation**, not as signed device-lab results.

| Layer | Coverage |
|-------|----------|
| Viewports | 320, 360, 375, 390, 393, 402, 412, 414, 430, 768, 820, 1024 + iPhone 13 landscape |
| Emulated devices | iPhone SE / 13 / 15 Pro / 16 Pro sizes, Pixel 8, Galaxy S24, iPad Mini, iPad Air (+ landscape) |
| Pages | Home, Search, Professionals, Companies, Listings, Buy & Sell (`/buy-sell`→SPA), Jobs (`/jobs`→SPA), Map, Create Ad, Create Project, Login, Register, Contact, Pricing |
| Combos checked | **183** screen×viewport runs (all navigations completed; **0 hard load failures**) |
| Overflow | Measured `document.scrollWidth − clientWidth` on every combo |
| Touch targets | Measured interactive controls; flag if &lt; 44×44 CSS px |
| Performance / a11y | Lighthouse mobile on `/`, `/search`, `/map`, `/create-ad`, `/professionals` |

---

## Executive verdict

DImarket’s **layout mostly adapts** (no systematic horizontal page scroll in 183 checks), and several mobile foundations exist (viewport-fit, safe-area on header menu, mobile search row, 48px form controls under 640px).  

But the **primary mobile product shell is incomplete**: `MobileBottomNav` is implemented and never mounted; global location is desktop-only (`lg+`); filters expand in-place instead of a proper sheet; many chrome controls are **&lt; 44px**; mobile LCP is **~8–12 s** under Lighthouse simulation. For a marketplace where users act from a job site, that is a conversion risk.

**Do not ship “mobile-first” messaging until Phase 1 of the remediation plan lands.**

---

## Scores (0–10)

| Area | Score | Evidence |
|------|------:|----------|
| **Mobile UX** | **5.0** | Usable catalog, but missing bottom nav, weak one-hand flows, dead `pb-24` |
| **Performance** | **4.0** | Home Perf 50; FCP ~9s; LCP ~12s; Home transfer ~6.2 MB |
| **Accessibility** | **7.0** | LH a11y 78–91; button-name / aria-hidden-focus / contrast fails on inner pages |
| **Navigation** | **4.0** | Hamburger works; bottom nav absent; location control hidden on phones |
| **Forms** | **6.0** | Login/Register/CreateAd keyboards mostly OK; Create Project phone lacks `type="tel"`; no `inputMode`/`enterKeyHint` |
| **Search** | **6.5** | Dedicated mobile search; voice present; filters not one-hand friendly |
| **Responsiveness** | **7.5** | Strong breakpoint coverage; no measured page-level horizontal overflow |
| **Touch Experience** | **4.5** | Widespread sub-44px chrome (hamburger 32px, hearts ~28px, footer links ~20px height) |

**Overall mobile readiness: 5.2 / 10**

---

## Screens verified (demonstration)

Every row was opened and measured. `ok` = navigation + measurement completed (not “UX perfect”).

| Page | Devices checked | Load OK | Screenshots (iPhone 13) |
|------|----------------:|:-------:|-------------------------|
| Home | 14 (incl. landscape) | ✓ | `shot-home-iphone-13.png` |
| Global Search | 13 | ✓ | `shot-global-search-iphone-13.png` |
| Professionals | 13 | ✓ | `shot-professionals-iphone-13.png` |
| Companies | 13 | ✓ | — |
| Listings / Projects | 13 | ✓ | — |
| Buy & Sell | 13 | ✓ | `shot-buy-&-sell-iphone-13.png` |
| Jobs | 13 | ✓ | `shot-jobs-iphone-13.png` |
| Map | 13 | ✓ | `shot-map-iphone-13.png` |
| Create Ad | 13 | ✓ | `shot-create-ad-iphone-13.png` |
| Create Project | 13 | ✓ | — |
| Login | 13 | ✓ | — |
| Register | 13 | ✓ | — |
| Contact | 13 | ✓ | — |
| Pricing | 13 | ✓ | — |

Full matrix: `docs/mobile-audit/raw-findings.json` → `checkedScreens`.

---

## Performance (Lighthouse mobile, simulated throttling)

| Page | Perf | A11y | FCP | LCP | TBT | CLS | Notes |
|------|-----:|-----:|----:|----:|----:|----:|-------|
| `/` | 50 | 91 | 9.0s | 12.1s | 230ms | 0.063 | **~6.2 MB** total weight; main-thread 2.8s |
| `/search` | 55 | 78 | 8.0s | 8.3s | 190ms | 0.001 | Unused JS ~292 KiB |
| `/map` | 55 | 88 | 8.0s | 11.7s | 160ms | 0 | Leaflet + UI cost |
| `/create-ad` | 56 | 79 | 8.0s | 8.0s | 140ms | 0 | Contrast fail |
| `/professionals` | 57 | 87 | 8.0s | 8.0s | 80ms | 0 | Contrast fail |

INP was not consistently reported by this Lighthouse run (lab limitation). TBT is a proxy for main-thread interactivity risk; Home is the worst offender.

---

## Accessibility (lab)

Recurring fails (Home and/or inner pages):

- Buttons without accessible name (`button-name`) — matches unlabeled hamburger / icon buttons in Header.
- `[aria-hidden="true"]` with focusable descendants.
- Invalid / empty ARIA roles.
- Color contrast fails on Search / Map / Create Ad / Professionals.
- Visible label vs accessible name mismatches.

---

## Issue catalog

Severity key: **Critical** blocks core mobile conversion · **High** frequent friction · **Medium** quality · **Low** polish.

### M1 — Critical — Mobile bottom navigation not mounted

| Field | Detail |
|-------|--------|
| **Page** | All public pages (Home → Pricing) |
| **Device** | All phone viewports (320–430); reproduced on 14 page types × 9 phone sizes |
| **Browser** | Chromium mobile emulation (applies to Chrome Android; likely Safari/Samsung too) |
| **Steps** | 1) Open any page at 390×844. 2) Look for bottom tab bar (Home / Search / Post / Messages / Profile). |
| **Result** | `.mobile-bottom-nav` absent. Component exists at `src/components/MobileBottomNav.tsx` but is **not imported in `App.tsx`**. Many pages still pad `pb-24` for a ghost nav. |
| **Impact** | One-hand primary navigation missing — highest business impact for on-site users. |
| **Fix** | Mount `<MobileBottomNav />` in App for `xl:hidden`; reconcile padding; ensure FAB/chat don’t collide. |

### M2 — Critical / High — Touch targets below 44×44

| Field | Detail |
|-------|--------|
| **Page** | Header on all pages; Listing/Pro cards; Footer |
| **Device** | All phones + tablets (28 automated findings) |
| **Browser** | Chromium mobile emulation |
| **Steps** | Inspect hamburger, Sign in chip, cart/badge icons, listing favorite, footer “Back to top”, language pills, show-password (20×20). |
| **Measured** | Hamburger **32×32**; Sign in ~**60×31**; listing hearts historically **28×28** in code; footer back-to-top height **~20**; login show-password **20×20**. |
| **Fix** | Enforce `min-width/min-height: 44px` (or 48px) hit areas; enlarge icons with padding, not just visual size. |

### M3 — High — Global location control hidden on phones

| Field | Detail |
|-------|--------|
| **Page** | Header (all) |
| **Device** | &lt; `lg` (~1024px) |
| **Browser** | All |
| **Steps** | Open Home on iPhone 13; look for “Deliver to / Work in” control. |
| **Result** | `HeaderLocationControl` uses `hidden … lg:flex` — geo radius/city unavailable from chrome on phones. Users must hunt filters/search. |
| **Fix** | Expose compact location entry in mobile header or sticky under search; deep-link to geo sheet. |

### M4 — High — Filters expand in-page (not a sheet/drawer)

| Field | Detail |
|-------|--------|
| **Page** | Listings, Professionals, Map, Search, Buy & Sell, Jobs |
| **Device** | Phones |
| **Browser** | All |
| **Steps** | Tap Filters; observe layout. |
| **Result** | Sidebar toggles from `hidden` → block **inline**, pushing results down. No backdrop, no focus trap, no `aria-expanded`. Long scrolls on 320–390px. Project feed shows a long filter grid with no collapse. |
| **Fix** | Bottom sheet / full-screen filter panel with Apply/Reset sticky; `aria-expanded` + focus management. |

### M5 — High — Create Project phone field without `type="tel"`

| Field | Detail |
|-------|--------|
| **Page** | `/create-project` (`ContactStep.tsx`) |
| **Device** | All phones |
| **Browser** | Safari iOS / Chrome Android (keyboard) |
| **Steps** | Start project wizard → Contact → focus Phone. |
| **Result** | Plain text `<input>` — default alphanumeric keyboard. |
| **Fix** | `type="tel"` + `autoComplete="tel"` + `inputMode="tel"`. |

### M6 — High — Mobile performance / LCP

| Field | Detail |
|-------|--------|
| **Page** | Home worst; also Search/Map |
| **Device** | Mobile Lighthouse (390×844, Slow 4G sim) |
| **Browser** | Chromium lab |
| **Steps** | Run Lighthouse mobile on `/`. |
| **Result** | FCP 9.0s, LCP 12.1s, Perf 50, ~6.2 MB weight, unused JS hundreds of KiB, main-thread 2.8s. |
| **Fix** | Code-split routes/maps; defer non-critical home rails; compress/lazy images; reduce JS for first paint. |

### M7 — High — Accessible names / ARIA on header chrome

| Field | Detail |
|-------|--------|
| **Page** | Home + global header |
| **Device** | All |
| **Browser** | Screen readers (VoiceOver / TalkBack) — inferred from Lighthouse |
| **Steps** | Lighthouse a11y; inspect icon buttons. |
| **Result** | `button-name` fail; aria-hidden focusable descendants; empty roles. |
| **Fix** | `aria-label` on icon-only controls; fix `aria-hidden` menus so focusable items aren’t hidden incorrectly. |

### M8 — Medium — Missing `inputMode` / `enterKeyHint` on forms

| Field | Detail |
|-------|--------|
| **Page** | Create Ad, Create Project (and others) |
| **Device** | iOS/Android keyboards |
| **Browser** | Safari / Chrome |
| **Steps** | Focus title, price, email fields. |
| **Result** | Repo has essentially **zero** `inputMode` / `enterKeyHint` usage. Price uses `type="number"` (OK); search could use `inputMode="search"`. |
| **Fix** | Add hints per field; `enterKeyHint="next"|"done"|"search"`. |

### M9 — Medium — Listing / directory card secondary actions too small

| Field | Detail |
|-------|--------|
| **Page** | Professionals, Companies, Listings |
| **Device** | Phones |
| **Browser** | All |
| **Steps** | Try favorite / compact CTA. |
| **Result** | Directory CTAs ~2.4rem; hearts smaller; compact pro cards use tiny padding. |
| **Fix** | 44px hit boxes; keep compact visual via padding. |

### M10 — Medium — Map markers / kind chips dense on small screens

| Field | Detail |
|-------|--------|
| **Page** | `/map` |
| **Device** | 320–390 |
| **Browser** | Touch browsers |
| **Steps** | Open map; use kind filters; tap pins. |
| **Result** | Pins ~32–36px; filter chips wrap into tall stacks; Leaflet defaults OK for pan/zoom but fat-finger pin selection is tight. Popups maxWidth 280 on 320 with gutters. |
| **Fix** | Larger hit radius; collapse kind filters into select/sheet; responsive popup width. |

### M11 — Medium — Search filters toggle semantics

| Field | Detail |
|-------|--------|
| **Page** | `/search` |
| **Device** | Phones |
| **Browser** | All |
| **Steps** | Toggle filters. |
| **Result** | No `aria-expanded` / `aria-controls`; clear/voice ~36×36. Sticky filter `top: 5.5rem` may collide with tall fixed header. |
| **Fix** | Sheet pattern + ARIA; bump control sizes. |

### M12 — Medium — Color contrast on key flows

| Field | Detail |
|-------|--------|
| **Page** | Search, Map, Create Ad, Professionals |
| **Device** | All |
| **Browser** | All |
| **Steps** | Lighthouse a11y contrast audit. |
| **Result** | Failed on those pages (Home contrast passed). |
| **Fix** | Raise ink contrast on muted labels/chips to WCAG AA. |

### M13 — Medium — Footer language / social targets + no bottom safe-area

| Field | Detail |
|-------|--------|
| **Page** | Footer (all) |
| **Device** | iPhone with home indicator |
| **Browser** | Safari iOS |
| **Steps** | Scroll to footer; tap language pills / social. |
| **Result** | Dense `text-xs` pills; social ~36×36; footer strip lacks `safe-area-inset-bottom` (unlike designed bottom nav). |
| **Fix** | Larger pills; safe-area padding. |

### M14 — Medium — Dead bottom padding without nav

| Field | Detail |
|-------|--------|
| **Page** | Listings, Map, Create Ad, Professionals, ProjectFeed, etc. |
| **Device** | Phones |
| **Browser** | All |
| **Steps** | Scroll to end of content. |
| **Result** | `pb-24` reserved for unmounted nav → empty space / awkward last CTA. |
| **Fix** | Pair with mounting bottom nav, or remove padding until then. |

### M15 — Medium — Horizontal scroll surfaces (contained, risk of leak)

| Field | Detail |
|-------|--------|
| **Page** | Home rails, Amazon dept scroll, mega chips |
| **Device** | 320–430 |
| **Browser** | All |
| **Steps** | Swipe category/dept rails. |
| **Result** | Intentional overflow-x on rails; **page-level** overflow not detected. No `overflow-x: hidden` on `html/body` — a future wide child can break the page. |
| **Fix** | Keep rails; add body/page clip as safety net; audit new components. |

### M16 — Medium — Offline / network resilience incomplete for browsing

| Field | Detail |
|-------|--------|
| **Page** | Catalog browsing |
| **Device** | Phones on flaky LTE |
| **Browser** | All |
| **Steps** | Disable network mid-browse; reconnect. |
| **Result** | `sw.js` exists mainly for push; no robust offline shell for listings/search. Loading indicators exist on some pages; no global reconnect toast observed in code path for marketplace browse. |
| **Fix** | Offline banner + retry; cache shell; keep forms from silent-fail. |

### M17 — Low / Medium — AI chat widget hidden on narrow screens

| Field | Detail |
|-------|--------|
| **Page** | Global |
| **Device** | &lt;1280px |
| **Browser** | All |
| **Steps** | Look for AI FAB on phone. |
| **Result** | Widget layer hidden under 1280px (intentional). Support path missing on mobile unless elsewhere. |
| **Fix** | Optional compact help entry in mobile menu / bottom nav overflow. |

### M18 — Low — Register phone missing `autoComplete="tel"`

| Field | Detail |
|-------|--------|
| **Page** | `/register` |
| **Device** | Phones |
| **Browser** | Safari / Chrome |
| **Steps** | Focus phone. |
| **Result** | Has `type="tel"` but weak autocomplete attributes. |
| **Fix** | `autoComplete="tel"`. |

### M19 — Low — Landscape Home

| Field | Detail |
|-------|--------|
| **Page** | Home |
| **Device** | iPhone 13 landscape 844×390 |
| **Browser** | Chromium emulation |
| **Steps** | Rotate; measure overflow. |
| **Result** | No major page overflow in run; header height dominates — content short. |
| **Fix** | Re-test sticky header height vs content after bottom nav lands. |

### M20 — Low — Browser matrix gaps (process)

| Field | Detail |
|-------|--------|
| **Page** | All |
| **Device** | Real iPhone / Galaxy / iPad |
| **Browser** | Safari, Samsung Internet, Firefox, Edge |
| **Steps** | Device lab / BrowserStack. |
| **Result** | Not executed in this environment. |
| **Fix** | Schedule lab pass after Phase 1–2 fixes; include keyboard + notch + gesture back. |

---

## Top 20 mobile issues by business impact

1. **Bottom nav not mounted** — kills one-hand primary UX (Critical)  
2. **Mobile LCP / heavy Home** — bounce before first action (High)  
3. **Sub-44px header & card actions** — mis-taps on site (High)  
4. **Location control desktop-only** — geo marketplace unusable from chrome (High)  
5. **Filters not a mobile sheet** — abandonment on Listings / Pros / Map / Jobs (High)  
6. **Create Project phone keyboard wrong** — friction on lead capture (High)  
7. **Unlabeled icon buttons (a11y)** — VoiceOver/TalkBack failures (High)  
8. **Search filter UX + sticky collision** — hard to refine “Electrician near me” (Medium/High)  
9. **Map pin / chip density** — map exploration friction (Medium)  
10. **Contrast fails on Search/Create/Pros** — trust & readability (Medium)  
11. **Dead `pb-24` without nav** — awkward scroll end / CTA reach (Medium)  
12. **No inputMode/enterKeyHint** — slower form completion (Medium)  
13. **Favorite/compact CTAs too small** — save/contact fail (Medium)  
14. **Footer targets + safe-area** — legal/lang hard to hit (Medium)  
15. **Offline browse resilience** — field network drops (Medium)  
16. **Body overflow safety net missing** — future horizontal scroll regressions (Medium)  
17. **AI help hidden on phone** — support gap (Low/Medium)  
18. **Register autocomplete gaps** — minor form UX (Low)  
19. **Landscape header dominance** — secondary (Low)  
20. **No real Safari/Samsung lab yet** — residual risk (Process)

---

## Recommendations (list only — not implemented)

Sticky bottom actions for Create Ad / Apply Job; mount bottom nav; floating compact search; filter bottom sheets; swipe-to-dismiss sheets; larger map hit areas; route-level code splitting; offline reconnect banner. See remediation plan for order.

---

## What looks solid (keep)

- `viewport-fit=cover`, PWA meta, text-size-adjust  
- Safe-area on mobile menu  
- Mobile search row under logo  
- Form control min-height 3rem under 640px  
- Product grid 2-col on phones; directory card reflow  
- iOS scroll lock while menu open  
- Login email/password autocomplete  
- CreateAd `tel` / `email` / `number` types  
- No measured **page-level** horizontal overflow across 183 combos  

---

## Artifacts

- `e2e/mobile-audit.spec.ts` — repeatable harness  
- `docs/mobile-audit/raw-findings.json`  
- `docs/mobile-audit/lighthouse-*.json`  
- `docs/mobile-audit/shot-*-iphone-13.png`  
- `docs/mobile-audit/REMEDIATION_PLAN.md`  
