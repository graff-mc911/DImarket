# Architecture — Single Source of Truth

**Date:** 2026-08-06  
**Goal:** Stop duplicate maps / categories / i18n / navigation from drifting. Prefer adapters over second copies.

---

## Maps

| Concern | SSoT | Do not |
|---------|------|--------|
| Leaflet UI | `src/components/map/EuropeMarketplaceMap.tsx` | Second `L.map` / Mapbox / Google map |
| Marker fetch/filter/colors | `src/lib/marketplaceMap.ts` | Hardcode kind colors; duplicate fetch |
| Fetch orchestration | `src/hooks/useMarketplaceMapMarkers.ts` | Copy `useEffect`+`filterMapMarkers` in pages |
| Kind filter chips | `src/components/map/MapKindFilters.tsx` | Duplicate chip JSX on Home vs `/map` |
| Default Europe view | `DEFAULT_EUROPE_VIEW` in `marketplaceMap.ts` | Inline `[50.1, 10.5]` |
| Country focus | `COUNTRY_MAP_CENTERS` in `marketplaceMap.ts` | Local centers tables |
| Distance label | `formatDistanceKm` (`projectFeed`) → `formatMapDistance` thin wrapper | Second formatter |

Surfaces: `HomeInteractiveMap`, `MapExplore`, `EstimatorResultsMap` — chrome only.

---

## Categories (two layers)

| Layer | SSoT | Used by |
|-------|------|---------|
| Browsable mains (DB) | Supabase `categories` via `marketplaceCategories.ts` | Mega-menu, `/category/:slug`, Search |
| Site chrome order/icons | `siteCategories.ts` | Professionals filters, listings paths |
| Work specialization | `categoryCatalog.ts` + `*WorkGroups.ts` | Create ad, Settings, matching |
| Work matching helpers | `categoryMatching.ts` | Professionals, category pages |
| Marketing Home cards (legacy) | `config/categories.ts` + `categoriesI18n.ts` | Home `MainCategoriesSection` only until migrated |

**Alias table (do not invent a third slug):**

| Concept | Serviya (Home) | Site / DB |
|---------|----------------|-----------|
| Buy & Sell | `buy-sell` | `sell-rent` |
| Jobs | `jobs` | `vacancies` |
| Legal | `legal-services` | `legal-notary` |
| Handyman | `home-services` | `handyman` |

Telegram bot mirrors `siteCategories` icons (Deno cannot import Vite `src/`); keep comments + icons in sync.

Details: `docs/CATEGORIES_SOURCE_OF_TRUTH.md`.

---

## Navigation

| Concern | SSoT |
|---------|------|
| Paths, aliases, surfaces, labels | `src/lib/navMap.ts` |
| SPA navigate helper | `src/lib/navigation.ts` (no route list) |
| Mobile chrome | `MobileBottomNav` (reads `navMap`) |
| Reserved SEO segments | `isReservedAppPath` → `navMap.isReservedNavPath` |

**Canonical paths** (prefer in new links): `/advertising`, `/vacancies`, `/sell-rent`, `/cost-estimator`, `/create-project`, `/projects`, `/pricing`, `/pro/dashboard`, `/customer/dashboard`.

Aliases remain in `App.tsx` for bookmarks.

---

## Translations (i18n)

| Concern | SSoT |
|---------|------|
| UI keys | `src/lib/Translations/en.ts` (`TranslationKey`) |
| Locale overlays | `Translations/{uk,ru,…}.ts` via `locales/index.ts` |
| Runtime | `useApp().t` / `getTranslation` only |
| Category labels | Prefer DB `name_i18n`; fallbacks `CATEGORY_LABEL_I18N` / Serviya map (do not merge blindly) |
| Bot copy | `supabase/functions/telegram-bot/i18n.ts` (isolated) |

Do not add parallel `header.*` / `nav.*` keys for new shared chrome — use `navMap.labelKey` (+ `labelKeyBySurface` when copy must differ).

---

## Rules for new work

1. No new features that introduce a second map, category list, nav array, or translation store.
2. New routes: add to `navMap.ts` first, then `App.tsx`.
3. New category mains: seed DB + `siteCategories` if chrome; do not grow Serviya unless Home still depends on it.
4. New map surfaces: `useMarketplaceMapMarkers` + `EuropeMarketplaceMap` only.
