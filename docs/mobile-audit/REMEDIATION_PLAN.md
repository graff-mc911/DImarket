# DImarket — Mobile UX Remediation Plan

**Based on:** `docs/mobile-audit/MOBILE_UX_AUDIT_REPORT.md` (2026-08-05)  
**Principle:** Fix conversion-critical mobile flows first. Do not redesign the visual language; harden touch, navigation, performance, and forms.

No fixes from this plan were auto-implemented in the audit PR — execute in follow-up PRs.

---

## Success criteria (definition of done)

After Phase 1–3:

- Bottom navigation visible on &lt; xl viewports; primary actions reachable one-handed  
- Interactive chrome ≥ **44×44 CSS px** (header, cards favorites, footer primary links)  
- Global location reachable on phones without opening desktop-only header control  
- Listings / Professionals / Map / Search / Jobs / Buy & Sell filters use a **sheet** with sticky Apply/Reset  
- Create Project phone uses telephone keyboard  
- Mobile Lighthouse Home: **LCP &lt; 4s** (simulated Slow 4G) and Perf score ≥ **70** as interim target; stretch **LCP &lt; 2.5s**  
- Lighthouse a11y ≥ **90** on Home, Search, Create Ad, Professionals  
- Re-run `e2e/mobile-audit.spec.ts` against prod/preview: zero Critical findings  

---

## Phase 0 — Prep (half-day engineering)

1. Add CI job: Playwright mobile audit (chromium) on preview URL for PRs that touch Header/App/CSS.  
2. Book BrowserStack / real devices for **Safari iOS + Samsung Internet** after Phase 1.  
3. Baseline metrics: save current Lighthouse JSON as regression gate.

---

## Phase 1 — Critical conversion blockers (do first)

| # | Issue | Work | Primary files | Verify |
|---|-------|------|---------------|--------|
| 1.1 | Bottom nav missing | Import and render `MobileBottomNav` in `App.tsx` for mobile; z-index vs AI/chat; hide on auth-heavy full-screen if needed | `App.tsx`, `MobileBottomNav.tsx`, `index.css` | Audit M1 gone; screenshot iPhone SE/13 |
| 1.2 | Dead padding | Keep `pb-24` only where bottom nav shows; remove elsewhere | Pages with `pb-24` | No double gap |
| 1.3 | Touch targets ≥44 | Enlarge hamburger, account chip, icon buttons, listing heart, show-password, footer back-to-top hit area | `Header.tsx`, `ListingCard.tsx`, `Login.tsx`, `Footer.tsx`, `index.css` | Audit M2 reduced |
| 1.4 | Location on mobile | Compact location trigger under mobile search or in menu; reuse `HeaderLocationControl` / `GeoSearchFilters` in a sheet | `Header.tsx`, `HeaderLocationControl.tsx` | Change city+radius on iPhone without desktop header |
| 1.5 | Create Project `tel` | `type="tel"`, `autoComplete="tel"`, `inputMode="tel"` | `ContactStep.tsx` | Numeric phone pad on iOS/Android |

**Exit:** One-hand Home → Search → Post → Profile works; geo settable; phone keyboard correct.

---

## Phase 2 — Filters, search, map (High)

| # | Issue | Work | Primary files | Verify |
|---|-------|------|---------------|--------|
| 2.1 | Filter sheets | Replace inline expand with bottom sheet / full-screen panel; backdrop; focus trap; `aria-expanded` | `Listings.tsx`, `Professionals.tsx`, `MapExplore.tsx`, `Search.tsx`, shared `MobileFilterSheet` | Apply/Reset; no clipping; scroll inside sheet |
| 2.2 | Search sticky collision | Adjust sticky `top` to measured header height; bump clear/voice to 44px | `index.css` adv-search, `SearchAutocomplete.tsx` | Filters usable under fixed header |
| 2.3 | Map touch | Larger marker hit area; kind filters in compact select/sheet; popup max-width `min(280px, 100vw - 2rem)` | `EuropeMarketplaceMap.tsx`, `MapExplore.tsx` | Tap pins on 320px; zoom/pan still work |
| 2.4 | Card CTAs | Directory/pro compact buttons ≥44px height | `DirectoryExpertCard`, `ProfessionalCard` CSS | Thumb-friendly |

**Exit:** Filter/map/search flows completable one-handed without losing place in results.

---

## Phase 3 — Performance (High)

| # | Issue | Work | Notes |
|---|-------|------|-------|
| 3.1 | Route code-split | Lazy-load Map, Admin, heavy dashboards, Leaflet | Cut unused JS on Home |
| 3.2 | Home weight | Defer below-fold rails; lazy images; avoid loading map stack on Home if possible | Home was ~6.2 MB in lab |
| 3.3 | Fonts/CSS | Audit critical CSS; remove unused | |
| 3.4 | Caching | Ensure long-cache hashed assets (Vercel defaults); revisit SW for app shell only | Don’t break auth |

**Exit:** Lighthouse Home Perf ≥ 70, LCP &lt; 4s (sim). Re-measure Search/Map.

---

## Phase 4 — Accessibility & forms polish (Medium)

| # | Work |
|---|------|
| 4.1 | `aria-label` on all icon-only header/footer buttons; fix `aria-hidden` focusable descendants |
| 4.2 | Contrast AA on Search / Map / Create Ad / Professionals muted text |
| 4.3 | Add `inputMode` / `enterKeyHint` on Create Ad, Register, Contact, Search |
| 4.4 | Register `autoComplete="tel"` |
| 4.5 | Footer language/social ≥44px; `safe-area-inset-bottom` |

---

## Phase 5 — Resilience & device lab (Medium / Process)

| # | Work |
|---|------|
| 5.1 | Global offline/reconnect banner when `navigator.onLine` flips; retry failed Supabase reads |
| 5.2 | Confirm loading skeletons on Search/Listings/Map |
| 5.3 | Real device pass: iPhone SE, 13, 15/16 Pro (Safari); Pixel 8 + S24 (Chrome + Samsung Internet); iPad Mini/Air; Firefox/Edge spot-check |
| 5.4 | Keyboard-open scroll tests on Create Ad / Register (visualViewport) |
| 5.5 | Optional: sticky publish CTA on Create Ad; job Apply sticky on ListingDetail |

---

## Suggested PR sequence

1. **`fix/mobile-bottom-nav-touch-targets`** — Phase 1.1–1.3  
2. **`fix/mobile-location-sheet`** — Phase 1.4  
3. **`fix/mobile-filter-sheets`** — Phase 2.1–2.2  
4. **`fix/create-project-tel-input`** — Phase 1.5 (+ 4.3 partial)  
5. **`perf/mobile-home-lcp`** — Phase 3  
6. **`a11y/mobile-header-contrast`** — Phase 4  
7. **`fix/offline-banner`** — Phase 5.1  

Each PR: run `PLAYWRIGHT_BASE_URL=<preview> npx playwright test e2e/mobile-audit.spec.ts --project=chromium` and attach Lighthouse Home summary.

---

## Explicit non-goals (for now)

- Full visual redesign / new brand system  
- Auto-enabling experimental swipe gestures without user testing  
- Parity with every desktop mega-menu detail on 320px (progressive disclosure OK)

---

## Ownership checklist per PR

- [ ] Screenshots: iPhone SE (320) + iPhone 13 (390) + Pixel-like (412)  
- [ ] Mobile audit harness green or Critical count ↓  
- [ ] Lighthouse delta recorded  
- [ ] No desktop regression on `lg+` header/filters  
