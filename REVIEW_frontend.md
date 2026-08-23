# DImarket Frontend Review

Scope: `/home/user/workspace/DImarket/src/` — React 18 + Vite + TypeScript + Tailwind + custom i18n marketplace. Read-only review; no files were modified.

---

## 1. Page structure and routing

Routing is a hand-rolled switch/if-chain in `src/App.tsx` (`getPage()`), driven by `window.location.pathname` (no React Router). It handles:

- Dynamic/slug routes (`/category/:slug`, `/listing/:id`, `/professional/:id`, `/book/:id`, `/project/:id/matches|offers|manage`, `/leads/:id/quote`).
- A `commercial-agents/*` sub-app (manufacturers, representatives, opportunities, dashboard).
- SEO landing routes: `/de/darmstadt/elektriker` (3-part locale+city+trade) and `/spain/alicante/electricians` (geo-service path), plus short aliases like `/electrician`.
- A large `switch (path)` block for ~45 static routes.
- A legacy-URL redirect (`/admin`, `/admin/panel` → `/dashboard`).

Only three pages are imported eagerly (bundled into the main chunk): `Home`, `CategoryPage`, `CostEstimator`. Every other page (~48 files) is wrapped in `lazyWithRetry(() => import(...))`, which is good practice — `lazyWithRetry` (`src/lib/lazyWithRetry.ts`) also auto-recovers from stale-chunk errors after a deploy.

### Page inventory

| Page file | Route(s) | Purpose | Status |
|---|---|---|---|
| `Home.tsx` | `/` | Landing page, hero, categories, top pros/companies, map, FAQ | Eager — complete |
| `CategoryPage.tsx` | `/category/:slug` | Category landing w/ hero, filters, featured pros, FAQ | Eager — complete |
| `CostEstimator.tsx` | `/cost-estimator`, `/estimate` | AI-assisted quote/estimate flow (2,018 lines) | Eager — complete but oversized |
| `CostEstimatorHistory.tsx` | `/cost-estimator/history` | Saved estimates | Lazy — complete |
| `Search.tsx` | `/search` | Search results | Lazy — complete |
| `MapExplore.tsx` | `/map` | Interactive map explore | Lazy — complete |
| `Categories.tsx` | `/categories` | Category directory | Lazy — complete |
| `Professionals.tsx` / `Companies.tsx` | `/professionals`, `/companies` | Directory listings | Lazy — complete (has lint errors, see §2) |
| `Listings.tsx` | `/listings`, `/vacancies`, `/jobs`, `/sell-rent`, `/buy-sell` | Classifieds listing | Lazy — complete (lint errors) |
| `ListingDetail.tsx` / `ProfessionalDetail.tsx` | `/listing/:id`, `/professional/:id` | Detail pages | Lazy — complete (lint errors) |
| `ServiceResults.tsx` | `/services/:slug`, geo/SEO aliases | Trade/service search results | Lazy — complete (lint errors) |
| `Contact.tsx`, `Pricing.tsx`, `ForProfessionals.tsx`, `ForCompanies.tsx`, `ForAdvertisers.tsx` | static | Marketing pages | Lazy — complete |
| `Login.tsx`, `Register.tsx`, `AuthCallback.tsx` | auth | Supabase auth flows | Lazy — complete |
| `Dashboard.tsx`, `ProDashboard.tsx`, `CustomerDashboard.tsx` | `/dashboard`, `/pro`, `/customer` | Owner/pro/customer cabinets | Lazy — complete |
| `Settings.tsx`, `Profile.tsx`, `Notifications.tsx`, `Favorites.tsx`, `MyListings.tsx` | account | Account management | Lazy — complete |
| `Messages.tsx` | `/messages` | Wraps `ChatMessenger` (real conversations/messages, Supabase-backed) | Functionally implemented, **but** several `messages.description` translation strings still say "Internal chat is coming soon" — stale/contradictory copy (see §2 stub findings) |
| `CreateProject.tsx` (re-exports `ProjectWizard`), `ProjectWizard.tsx` | `/create-project`, `/project/new` | Multi-step project intake wizard | Complete, fully wired to `submitProjectWizard` |
| `ProjectFeed.tsx`, `ProjectMatches.tsx`, `ProjectOffers.tsx`, `ProjectManage.tsx`, `QuoteBuilder.tsx`, `MyProjects.tsx` | `/leads`, `/projects`, project sub-routes | Marketplace project/lead flow | Lazy — complete (one has `any` lint error) |
| `Advertising.tsx`, `CreateAd.tsx`, `BoostProfile.tsx`, `Billing.tsx`, `Checkout.tsx` | ads/monetization | Ad campaign builder, checkout, billing | Lazy — complete, several `any`-cast Supabase writes (see §2) |
| `AiAssistant.tsx`, `JobRequestChat.tsx` | `/assistant`, `/assistant/job` | AI chat-to-listing flow | Lazy — complete |
| `Analytics.tsx` | `/analytics` | Analytics dashboard | Lazy — complete |
| `AiAdmin.tsx`, `MarketingAgentAdmin.tsx`, `OfficialSourcesAdmin.tsx` | `/admin/ai`, `/admin/marketing-agent`, `/admin/official-sources` | Internal admin tooling | Lazy — complete |
| `DocumentsHub.tsx`, `DocumentDetailPage.tsx`, `LegalDocumentDetail.tsx`, `LegalDocuments.tsx` | `/documents*`, `/legal-documents*` | Official-documents/legal knowledge base | Lazy — complete |
| `Verification.tsx` | `/verification` | Pro verification flow | Lazy — complete |
| `BookProfessional.tsx`, `ProCalendar.tsx` | `/book/:id`, `/calendar` | Booking flow | Lazy — complete |
| `SeoMarketLanding.tsx` | `/xx/city/trade` | Programmatic SEO landing pages | Lazy — complete |
| `commercialAgents/*` (6 pages) | `/commercial-agents/*` | B2B manufacturer/agent marketplace sub-app | Lazy — complete |

No page-level component was found with an explicit "TODO", "not implemented", or genuinely empty render. The one candidate stub is **Messages** — see below.

### Incomplete / stub findings

1. **`messages.description` copy says the internal chat "is coming soon"** in 22 of 23 non-English/Ukrainian locale files (e.g. `en.ts:2124` "Internal chat is coming soon.", `de.ts:1516`, `fr.ts:1505`, etc.) even though `src/components/chat/ChatMessenger.tsx` (458 lines) is a real, working messenger wired to `chat.conversations` / `chat.messages` state and Supabase. This key appears to be **stale/unused leftover copy** from an earlier phase before the messenger shipped — worth auditing whether it's still referenced anywhere in the live UI, since it would mislead users into thinking messaging doesn't work.
2. `src/lib/Translations/en.ts:850` — `'homePremium.appComingSoon': 'Apps coming soon — links will appear here when published.'` — legitimate placeholder for a not-yet-published "apps" section.
3. `src/lib/Translations/documents.ts:123` — `'docs.esign.title': 'Electronic signature (coming soon)'` — legitimate, explicitly gated feature.
4. `src/lib/bots/messaging/channels.ts` — explicit `TODO: TELEGRAM_BOT_TOKEN, WHATSAPP_ACCESS_TOKEN у Supabase secrets` and both channels return `configured: false` — Telegram/WhatsApp integration is scaffolded but **not connected** to real credentials.
5. `src/lib/commercialAgents/matchingService.ts` — two `TODO(Phase 2)` markers: AI enrichment (`enrichWithAi()`) and AI re-rank/embeddings are not implemented; current matching is rule-based only.
6. `src/lib/aiDispatcher.ts:133` — comment "Enrich individual notifications when RPC only creates stubs" — indicates the notification RPC can return stub/incomplete records by design; downstream code compensates but this is worth confirming server-side.

No other pages showed commented-out render blocks, `return null` placeholders, or "under construction" markers.

---

## 2. Lint errors (60 errors / 59 warnings confirmed via `npx eslint .`)

Confirmed counts: **21** `no-explicit-any` errors, **19** `prefer-const` errors, **46** `react-hooks/exhaustive-deps` warnings (warnings, not counted in the 60 errors), plus a handful of `no-unused-vars`, `no-useless-escape`, and `no-unsafe-function-type` errors. Total matches the reported "60 errors."

### `any`-type errors that hide real runtime bugs

The most significant risk is a recurring pattern: **Supabase query builder casts to `any` to work around a soft-delete/hide filter that may not exist in every environment.**

```ts
// src/pages/Professionals.tsx, src/pages/ServiceResults.tsx,
// src/lib/homeMarketplace.ts (fetchHomeProfessionals / fetchHomeCompanies)
let { data, error } = await (query as any).is('deleted_at', null).is('hidden_at', null)
if (error && /deleted_at|hidden_at|42703/i.test(error.message || '')) {
  // falls back to a query WITHOUT the deleted_at/hidden_at filter
  ;({ data } = await supabase.from('profiles').select(select)...)
}
```

- The comment in `homeMarketplace.ts` ("Soft-delete / hide columns — APPLY_OWNER_PROFILE_MODERATION.sql") confirms this filter depends on a migration that may not be applied in all environments (dev/staging/older prod). Postgres error code `42703` ("column does not exist") is explicitly matched.
- **Bug risk**: if the migration is missing, the code silently falls back to a query that returns *all* profiles including deleted/hidden ones. This is a real data-leak risk (a professional who deleted their account or was hidden by a moderator could still appear publicly), and the `any` cast is what allows this fragile fallback to compile without TypeScript catching a shape mismatch.
- Same `(supabase as any)` / `(query as any)` pattern recurs in `src/pages/ProjectFeed.tsx` (querying `sponsored_projects`), `src/pages/Checkout.tsx` (writing to `payments` and `sponsored_projects`), and `src/pages/Advertising.tsx` (5 occurrences — `profiles` upsert, `ad_campaigns` insert/update ×2, `ad_campaigns` status update). In all these cases the cast exists because chaining `.is()`/`.update()`/`.insert()`/`.upsert()` after certain builder calls breaks Supabase's generated-type inference, so devs escaped it with `any` rather than fixing the query shape or the `Database` type in `src/lib/types.ts`. Any drift between the actual DB schema and `types.ts` at these call sites will not be caught by the compiler.

Other `any` usages with direct runtime-crash exposure:

- **`src/lib/geocoding.ts:92`** — `data.map((item: any) => ({ name: item.address?.city || ... }))` on the response of an unauthenticated `fetch()` to `nominatim.openstreetmap.org`. There is no check that `data` is an array before `.map()` — if OpenStreetMap returns an error object (rate limit, 5xx with JSON body, or a changed response shape) instead of an array, this throws at runtime with no guard.
- **`src/pages/Listings.tsx:201-202`** — `(l as any).is_promoted` used twice to partition listings into `promoted`/`regular`. `is_promoted` is a real typed field on the `Database` listings table (`src/lib/types.ts`), so the cast is unnecessary and suggests `ListingWithImages` (the type actually used in this file) doesn't include `is_promoted` — a type mismatch between the query's declared return type and what the UI actually reads, which will silently produce `undefined` instead of a compile error if the field is ever renamed.
- **`src/pages/ProfessionalDetail.tsx:231-232`** — `(profile as any).is_premium` / `.is_featured`, same pattern as above: fields exist in `types.ts` but the local `profile` variable's inferred type doesn't carry them.
- **`src/pages/Advertising.tsx:1510`** — `const data = campaign as any` then reads `data.placements`, `data.countries` — bypasses the campaign type entirely for a multi-field read, so any of those fields being renamed/missing fails silently instead of at compile time.
- **`src/components/OwnerAdManager.tsx`** (4 `any` errors, lines 253/268/294/319) and **`src/components/commercialAgents/CommercialAgentsAdminPanel.tsx`** (3 `no-unsafe-function-type` errors using bare `Function` type) — same class of issue: admin-only surfaces where a typed event handler or payload was replaced with `any`/`Function`.

### `prefer-const` errors

19 instances of `let` used for variables that are never reassigned (e.g. `src/lib/adCampaigns.ts:589`, `src/pages/Professionals.tsx:113/121`, `src/lib/homeMarketplace.ts:181/214/222`, `src/pages/ServiceResults.tsx:178`, plus several in `supabase/functions/*`). These are style-only issues with no runtime impact, but several sit directly beside the `any`-cast Supabase fallback pattern above (e.g. `Professionals.tsx:121`, `homeMarketplace.ts:222`), reinforcing that this fallback code path has not been cleaned up since it was written.

### `exhaustive-deps` warnings

46 warnings, overwhelmingly "missing dependency" on a `load`/`loadX` callback inside a mount-only `useEffect` (e.g. `Dashboard.tsx`, `Favorites.tsx`, `MyListings.tsx`, `Settings.tsx`, `Verification.tsx`, `Analytics.tsx`, `Billing.tsx`, `ReferralPanel.tsx`, `TelegramLinkPanel.tsx`, `NotificationCenter.tsx`, `PortfolioManager.tsx`). This is a common intentional pattern (fetch-once-on-mount) but is also the most common source of **stale-closure bugs** if any of those load functions later starts depending on props/state that change after mount — worth a pass to either wrap loaders in `useCallback` with correct deps or add explicit eslint-disable comments documenting intent. `Header.tsx:118` (`loadUnreadCount`) and `ChatMessenger.tsx` (3 warnings referencing `user`/`chat`/`bootstrap`) are the highest-traffic components in this group.

---

## 3. Bundle size and code-splitting

Confirmed against the checked-in `dist/` build:

- `dist/assets/index-7X8hoVau.js` = **1,124,609 bytes** raw, **316,612 bytes gzip** — matches the reported "1MB / 318KB gzip" main chunk almost exactly.
- `vite.config.ts` already does manual chunking for `node_modules` code: `sentry`, `supabase`, `motion` (framer-motion), `i18n` (i18next libs — note: unused, see §5), `icons` (lucide-react), `react-vendor`, and a catch-all `vendor`. Grepping the main chunk confirms none of the big third-party libs (mapbox, leaflet, chart.js, framer-motion, lucide-react, date-fns, @supabase) leak into it — the manual chunking is working as intended.
- Confirmed via `grep` that the main chunk does contain `stripe`-related and `pdf`-related first-party code, meaning **Stripe integration code and PDF generation code are not lazy-loaded** even though they're only needed on `Checkout`/`Billing`/quote-PDF flows.
- Because App.tsx only marks `Home`, `CategoryPage`, and `CostEstimator` as eager, the 1MB main chunk is essentially **all first-party app code that isn't behind those three eager pages plus every shared component/lib they and the app shell (`Header`, `Footer`, `MobileBottomNav`, contexts) import**.

### Code-splitting candidates, in priority order

1. **`src/pages/CostEstimator.tsx` (2,018 lines) — highest-impact target.** It is eagerly imported in `App.tsx` alongside `Home`/`CategoryPage`, yet it pulls in `EstimatorQuoteWizard` (660 lines), `EstimatorProcurementPanel` (147 lines), `EstimatorShell`, `LocationStep`, `ProfessionalCard`, and heavy first-party libs (`costEstimatorEngine`, `estimatorObjectTypes`, `buildzoomQuoteSession`, `submitProjectWizard`, `pageSeo`). Nothing about the route (`/cost-estimator`, `/estimate`) justifies eager-loading it on every page view — it should be lazy like every other route. This alone is likely the single biggest lever to shrink the main chunk.
2. **Stripe/checkout code** — `stripe` and `stripeConnect` libs are reachable from the main chunk (confirmed by string search) but are only needed on `Checkout.tsx`/`Billing.tsx`/`ConnectPayoutPanel.tsx`, which are already lazy pages — the leak suggests something eager (Header or a context) imports Stripe helpers unconditionally. Worth auditing `Header.tsx`'s and `AppContext.tsx`'s import lists for any top-level `stripe`/`stripeConnect` import that could be deferred to first use.
3. **PDF generation (`quotePdf.ts`, `documents/pdf.ts`, `officialSources/legalDocumentPdf.ts`, `officialSources/pdfMeta.ts`)** — same issue: PDF export is a documents/quote-detail-only feature and should be dynamically `import()`-ed at the click handler that triggers a PDF download, not bundled eagerly.
4. **`Header.tsx` (710 lines)** — necessarily eager (it's outside the route switch, rendered every page), but it statically imports `NotificationCenter`, `PwaInstallButton`, `HeaderLocationControl`, `LanguageSelector`, and `CURRENCIES`/`siteOwner` helpers. `NotificationCenter` in particular does its own data loading (`useEffect` + `load`) and could be split into a lazily-mounted popover so its bundle weight (and any Supabase realtime subscription code it pulls in) doesn't sit in the main chunk.
5. **Home page subcomponents** (`src/components/home/*`, ~1,258 lines total) — individually small, but `HomeInteractiveMap.tsx` likely pulls map-rendering code; since `Home` is eager, confirm the map library it uses isn't duplicated with `EuropeMarketplaceMap.tsx` (used by `MapExplore`, already lazy) — if they share a mapping library, that library should live in its own manual chunk rather than inside both the eager `Home` bundle and the lazy `MapExplore` bundle.
6. **`EstimatorCalculator.tsx` (314 lines) + `costCalculator/*`** — only needed inside the estimator flow; once CostEstimator itself is lazy (item 1), this follows automatically, but confirm `costCalculator/loadCatalog.ts` uses dynamic `import()` for the catalog JSON rather than a static import, since cost catalogs tend to be large data files.

**Recommendation**: converting `CostEstimator` from eager to `lazyWithRetry` (matching every other route) is a one-line change in `App.tsx` with the highest expected payoff, since it's a 2,000-line page with several heavy dependent components that today loads on literally every visit regardless of route.

---

## 4. Supabase client initialization (`src/lib/supabase.ts`)

```ts
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // full JWT hardcoded;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, { ... });
```

**Finding: env vars are not guarded for presence — they fall back to hardcoded production credentials baked directly into the source file.**

- If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset at build time (e.g. a misconfigured preview deploy, a fork, or a local `.env` typo), the app does **not** fail fast or warn — it silently connects to the live production Supabase project (`wjlfvajloxkevggwjgtk.supabase.co`) using an anon key that is committed to the repository in plaintext.
- This is a common "helpful fallback for local dev" pattern, but as written it means the fallback is indistinguishable from a real misconfiguration: a developer who forgets to set env vars in a new environment (e.g. a preview/staging Vercel deploy, or an open-source fork) will unknowingly point that environment at production data with no error, no console warning, and no way to tell from the UI that the fallback path was used.
- There is no `if (!import.meta.env.VITE_SUPABASE_URL) throw/console.error(...)` guard anywhere in the file.
- The anon key is a JWT — while anon keys are meant to be public-safe (RLS-gated), hardcoding it as a source-level fallback still means it can't be rotated without a code change, and it's committed to git history.
- `.env.example` correctly documents `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and even shows a local Supabase option, but nothing enforces that these are actually set in every deploy target.

**Recommendation**: replace the `||` fallback with an explicit presence check that throws (or at minimum logs a loud console error) when the env vars are missing, and remove the hardcoded key from source — even though it's "only" an anon key, hardcoding a specific project's credentials as a silent fallback is a footgun for any environment that isn't production.

---

## 5. i18n setup (`src/lib/i18n.ts` → `src/lib/locales/index.ts`)

- This project does **not** use `i18next`/`react-i18next` at runtime for translations — despite `vite.config.ts` reserving an `'i18n'` manual chunk for `i18next`/`react-i18next` packages, the actual translation system is a **hand-rolled** lazy-loading table keyed by `LanguageCode` (`src/lib/locales/index.ts`). If `i18next` is a real dependency, confirm it's still needed; if not, the `i18n` manual chunk in `vite.config.ts` is dead configuration for an unused library and should be removed (or the library should be uninstalled) to avoid it being bundled for nothing.
- `LANGUAGE_CODES` (`src/lib/locales/index.ts`) lists **24 codes**: `en, uk, ru, kk, pl, es, de, fr, it, pt, ro, cs, sk, hu, bg, sr, hr, sl, lt, lv, et, tr, ar, zh, ja` — i.e. **23 non-English + English**, matching "23 languages" in the task. All 24 are wired into `localeLoaders` as dynamic `import()`s, so they are lazily code-split per-language (confirmed in the `dist/` build: `uk-*.js`, `kk-*.js`, `bg-*.js`, `ru-*.js`, etc. each exist as separate chunks, 100–220 KB each). This part of the architecture is sound — no language is bundled unless selected.
- **Translation completeness is uneven.** Comparing key counts against the English source (`en.ts`, 2,883 keys):

| Language | Keys present | Missing vs. English | Coverage |
|---|---|---|---|
| `uk` (source/default locale) | 2,883 | 0 | 100% |
| `es` | 2,263 | 620 | 78.5% |
| `de` | 2,180 | 703 | 75.6% |
| `ru` | 2,105 | 778 | 73.0% |
| `pl` | 2,010 | 873 | 69.7% |
| `ar, bg, cs, et, fr, hr, hu, it, ja, kk, lt, lv, pt, ro, sk, sl, sr, tr, zh` (19 languages) | 1,999 each | 884 each | 69.3% |

  Every non-Ukrainian, non-English language is missing roughly **30% of all UI strings** (~884 keys). The fallback mechanism (`withEnglishFallback` in `locales/index.ts`) merges `enTranslations` underneath each partial locale, so missing keys silently render in **English**, not the user's selected language, and there's no visible indicator that this happened. A French, German, or Chinese user will see a real mix of French/German/Chinese and English strings throughout the app.
  - The missing-key set is broad, spanning cost-estimator flows, commercial-agents, official-source docs, the pipeline/analytics admin surfaces, map explore, sales-bot dialogue, geo/nav labels, and even basic `header`/`footer` strings — i.e. it's not confined to a rarely-used admin corner, it affects core shopping/browsing flows.
  - `es`, `de`, `ru`, and `pl` are meaningfully more complete than the other 19 languages, suggesting translation work was prioritized for a few key markets and then stalled before being extended to the rest.
- The `aiAssistant.ts` / `aiAssistantMore.ts` / `aiAssistantRest.ts` translation packs are merged in separately for all non-`en/uk/ru` locales (`loadAiAssistantPack()`), which is a second, easy-to-miss place where a language could have a gap even if its main file looks complete.
- `resolveUiLanguageCode()` correctly normalizes legacy `ua`/`UA`/`UK` values to `uk`, and unknown/unsupported codes fall back to `uk` (the product default), not `en` — a deliberate choice worth confirming is intentional given the marketplace's Ukrainian origin, but potentially surprising for a "European marketplace" positioning if a majority-English or majority-Spanish audience is expected.

---

## 6. PWA install prompt — the "Dlmarket" typo

**Root cause: not a literal typo in the source text — it's a font-rendering ambiguity between capital "I" and lowercase "l" in the sans-serif UI font.**

- `src/components/PwaInstallPrompt.tsx` renders `t('pwa.installTitle')` and `t('pwa.alreadyTitle')`. The literal English strings, defined in `src/lib/Translations/en.ts`, are:
  - `'pwa.installTitle': 'Install DImarket'` (line 31)
  - `'pwa.alreadyTitle': 'DImarket is already installed'` (line 39)
  - Same pattern in `uk.ts` lines 32/40 ("Встановити DImarket" / "DImarket уже встановлено").
- A repo-wide search for the literal string `"Dlmarket"` (capital D, lowercase l) returns **zero matches** — the word "Dlmarket" does not exist anywhere in the codebase, translations, `index.html`, or `public/manifest.json`/`manifest.webmanifest` (all correctly say `"DImarket"`).
- The install-prompt title text renders in the app's default sans-serif stack — `--font-sans: "Inter", "Amazon Ember", "Segoe UI", Arial, sans-serif` (`src/index.css:8`) — **not** the stylized serif wordmark font used by the actual `Logo` component (`--font-logo: "Libre Bodoni", "Didot", "Bodoni MT", Georgia, serif`, `src/components/Logo.tsx`), which renders each letter of "D-I" in separate styled `<span>`s specifically to keep the capital "I" visually distinct.
- In Inter (and most grotesque/humanist sans fonts), a bare capital "I" is a plain vertical stroke nearly identical in shape to a lowercase "l" at small sizes, especially without letter-spacing cues from surrounding context. "DImarket" set in Inter at the install-prompt's small font size (`text-sm`/`text-xs` per the component's Tailwind classes) is what a user is misreading as "Dlmarket" — it is a **visual perception bug caused by font choice**, not a text-content bug.

**Fix recommendation**: either (a) apply a distinguishing style to the brand name wherever it appears as plain text in dialogs/prompts (small-caps, the branded `Logo`/`Wordmark` component instead of a raw string, or a non-breaking span with slight tracking), or (b) globally reconsider using a font for brand-name mentions in body copy that doesn't visually collapse capital I into lowercase l — this will recur anywhere `t('pwa.installTitle')`, `t('pwa.alreadyTitle')`, or similar literal "DImarket" strings are rendered in the Inter body font (found in `PwaInstallPrompt.tsx`, `PwaInstallButton.tsx` settings variant via `pwa.settingsTitle`/`pwa.settingsText`, and potentially SEO meta/title text in `index.html`, though those aren't user-visible in the same way).

---

## 7. "Роботи в USA" header bug

**Root cause: the country allow-list used for both IP-based geolocation and the registration dropdown includes non-European countries (including USA), and that same list feeds the header's location label.**

Chain of evidence:

1. **Header UI**: `src/components/HeaderLocationControl.tsx` renders `t('header.deliverTo')` next to `formatGlobalLocationLabel(location, t('dimarket.loc.all-europe'))`. The Ukrainian translation of `header.deliverTo` (`src/lib/Translations/uk.ts:588`) is `'Роботи в'` (literally "Work/Jobs in") — the Ukrainian-language build of the site uses "Роботи в {location}" as its "Deliver to" equivalent, i.e. this is expected behavior for the label text itself.
2. **Location value**: `formatGlobalLocationLabel()` (`src/lib/globalLocation.ts`) is purely data-driven from a `GeoSearchState.country` string — it does not hardcode "USA" anywhere, and its own `COUNTRY_SLUG_TO_NAME` map (used for slug↔label conversion) only lists European countries. So the bug isn't in this formatting function.
3. **Where "USA" comes from**: `src/lib/countryIso2.ts` defines `COUNTRY_NAME_TO_ISO2`, a single shared map used for **two different purposes** that should probably be separate lists:
   - `REGISTRATION_COUNTRIES` (`src/lib/registrationGeoData.ts`) — the country dropdown shown at registration/profile-location entry — is derived directly from `Object.keys(COUNTRY_NAME_TO_ISO2)`.
   - `IP_COUNTRY_MAP` (also in `countryIso2.ts`, re-exported from `registrationGeoData.ts`) — used by `detectViewerCountryOnce()` in `src/lib/viewerGeo.ts` to reverse-map an IP geolocation API's ISO country code (from `ipapi.co/json/`) back to a display name.
   - This map explicitly includes `USA: 'US'` (line 25) alongside Canada, Mexico, Brazil, Argentina, China, Japan, Australia, India, and many more clearly non-European countries.
4. **The actual bug path**: `detectViewerCountryOnce()` fetches the visitor's IP-derived country code from `ipapi.co`, looks it up in `IP_COUNTRY_MAP`, and — since `isRegistrationCountry('USA')` returns `true` (because "USA" is in the same shared list) — stores `"USA"` via `storeViewerCountry()` into `sessionStorage`. Separately/similarly, a user can directly pick "USA" from the registration country dropdown, since it's a valid option in `REGISTRATION_COUNTRIES`. Either path can end up reflected in the header's `GeoSearchState.country`, which `initializeGlobalLocation()` persists to `localStorage` and which `HeaderLocationControl` renders verbatim as "{header.deliverTo label} {country}" — producing **"Роботи в USA"** on a site whose empty-state label is `dimarket.loc.all-europe` ("All Europe") and whose own country-slug map (`COUNTRY_SLUG_TO_NAME`) is Europe-only.
5. This confirms a real **data-model inconsistency**: the marketing/UX positioning is explicitly European ("All Europe" default, European-only slug map for SEO routes), but the underlying `COUNTRY_NAME_TO_ISO2` list used for registration and IP-geolocation includes ~30+ non-European countries (USA, Canada, Mexico, most of South America, UAE, China, Japan, India, Australia, etc.), with nothing preventing a non-European value from reaching the header.

**Fix recommendation**: either restrict `REGISTRATION_COUNTRIES` / the IP-geolocation fallback to the same European set used by `COUNTRY_SLUG_TO_NAME`, or — if non-European registrations are intentionally supported — change the header/empty-state logic to only show a specific country label for countries in the "supported markets" list and fall back to "All Europe" (or a generic "International") for everything else, rather than echoing whatever string happens to be in `GeoSearchState.country`.

---

## 8. Cost-estimator and project-wizard completeness

No TODO/FIXME/stub markers found in either area — both appear functionally complete:

- **Cost estimator** (`src/pages/CostEstimator.tsx` + `src/components/cost-estimator/*`): `EstimatorShell`, `EstimatorIntake`, `EstimatorCalculator`, `EstimatorQuoteWizard` (660 lines — the largest sub-component), `EstimatorProcurementPanel`, and `EstimatorResultsMap` are all implemented with real logic (calls into `costEstimatorEngine.ts`, `costEstimatorMatch.ts`, `costEstimatorGeo.ts`, `costEstimatorPersist.ts`, `costEstimatorTender.ts`, `buildzoomQuoteSession.ts`). It integrates with Supabase (`supabase` import), voice input (`useVoiceInput`), AI prefill (`ai/estimatorPrefill.ts`), and project submission (`submitProjectWizard`). The main issue with this area is architectural (its 2,018-line size and eager-loading status — see §3), not incompleteness.
- **Project wizard** (`src/components/project-wizard/*` + `src/pages/ProjectWizard.tsx`, aliased as `CreateProject`): all seven step components (`CategoryStep`, `DescriptionStep`, `UploadStep`, `LocationStep`, `BudgetStep`, `DeadlineStep`, `PreviewStep`) plus `WizardShell` are implemented, wired to `projectWizard.ts` (state/validation) and `submitProjectWizard.ts` (submission), with a `linkEstimateToListing` bridge back to the cost estimator. No stubbed steps or disabled submit paths were found.

One related risk carried over from §2: `CostEstimator.tsx` calls `supabase` directly and — via `homeMarketplace.ts`/`Professionals.tsx`-style helpers used elsewhere in the estimator/matching pipeline (`costEstimatorMatch.ts`, not audited line-by-line here) — may share the same `deleted_at`/`hidden_at` soft-delete fragility described in §2 if it queries `profiles` for matching professionals. Worth a follow-up pass specifically on `src/lib/costEstimatorMatch.ts` and `src/lib/matching/*` for the same `(x as any).is('deleted_at', null)` pattern.

---

## Summary of highest-priority fixes

1. **Guard Supabase env vars** in `src/lib/supabase.ts` — stop silently falling back to hardcoded production credentials.
2. **Lazy-load `CostEstimator`** in `App.tsx` — single highest-impact bundle-size fix (2,018-line page currently eager on every route).
3. **Fix or remove the `deleted_at`/`hidden_at` `any`-cast fallback** across `Professionals.tsx`, `ServiceResults.tsx`, `homeMarketplace.ts` — either ensure the moderation migration is applied everywhere and drop the fallback, or make the fallback fail closed (hide all results) instead of silently showing unmoderated data.
4. **Separate the European-only country list from the global `COUNTRY_NAME_TO_ISO2`/IP-geolocation list** to fix "Роботи в USA" and any other non-European country leaking into the header.
5. **Backfill translations** for the 19 languages stuck at 69.3% coverage (884 missing keys each) — currently silently falling back to English for ~30% of the UI.
6. **Style brand-name mentions distinctly** (or reuse the `Logo`/`Wordmark` component) wherever "DImarket" appears as plain text in Inter, to stop the capital-I/lowercase-l misread ("Dlmarket") in the PWA install prompt and similar dialogs.
