# Interactive Europe Map — DImarket (original implementation)

## Goal
Interactive Europe map UX for professionals, companies, projects, marketplace and jobs — built on DImarket architecture (Leaflet + OSM + Supabase). No third-party site code or design was copied.

## Architecture
- **Page:** `src/pages/MapExplore.tsx` — filters, Map/List/Both toggle, global location binding
- **Map SSoT:** `src/components/map/EuropeMarketplaceMap.tsx` — Leaflet, custom grid clustering, popups, bounds events, selection sync
- **Hook SSoT:** `src/hooks/useMarketplaceMapMarkers.ts` — shared fetch → filter → distances (Home / Estimator / MapExplore)
- **Kind filters UI:** `src/components/map/MapKindFilters.tsx`
- **Home preview:** `src/components/home/HomeInteractiveMap.tsx` — section chrome only; reuses map SSoT
- **Sidebar:** `src/components/map/MapResultsSidebar.tsx` — synchronized results list
- **Data SSoT:** `src/lib/marketplaceMap.ts` — fetch, filter, cache, distances, `MAP_KIND_COLORS`, `DEFAULT_EUROPE_VIEW`, `COUNTRY_MAP_CENTERS`

See also: `docs/ARCHITECTURE_SSOT.md`.


## Marker kinds (DB-backed only)
| Kind | Color | Source |
|------|-------|--------|
| Professional | Green `#16a34a` | `profiles` professional + coords **or city text** |
| Company | Blue `#2563eb` | `profiles` company + coords **or city text** |
| Project | Orange `#ea580c` | `listings` service_request + coords **or city/location text** |
| Job | Purple `#7c3aed` | listings under vacancies / job heuristics |
| Marketplace | Brown `#92400e` | `item_sale` / `item_wanted` / sell-rent |

Listings without `latitude`/`longitude` are placed via `inferCoordsFromLocationText()` (city name → approximate center).

## Synchronization
- Header / AppContext geo → map center + radius filter (Home + `/map`)
- Search + category filters → markers + sidebar + counters
- Map move → optional viewport-only filter
- Sidebar select → map pan + popup
- Marker click → sidebar highlight
- Changing location anywhere updates the same map SSoT via `useApp().location`

## Performance
- Session cache key `dimarket_map_markers_v4` (~90s) for marker payload
- Client-side filter (no full reload)
- Zoom-aware clustering
- Lazy images in popups/sidebar
- Incremental listing queries in parallel
- Profile queries must not select columns that are not yet migrated (e.g. `service_radius_km`) — missing columns abort the whole pros/companies fetch

## Routes (existing DImarket)
- Professionals/companies → `/professional/:id`
- Projects/jobs/marketplace → `/listing/:id`

## Verification
- [x] Build passes
- [x] Kind filters + legend
- [x] Map / List / Both toggle preserves filters
- [x] Global location sync
- [x] Clustering + popups
- [x] Sidebar sync
- [ ] Live GPS via existing GeoSearchFilters control
- [ ] Dense production coords depend on profiles/listings having lat/lng
