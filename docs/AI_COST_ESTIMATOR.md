# AI Cost Estimator — Enterprise implementation report

## Goal
Production multi-step **AI Construction Cost Estimator** integrated with DImarket professionals, companies, materials, map, project wizard and tender flow. Prices are **reference ranges** (орієнтовна оцінка), never invented as binding quotes.

## Architecture (One Feature = One SSoT)

| Concern | Source of truth |
|---|---|
| Wizard + results UI | `src/pages/CostEstimator.tsx` |
| History | `src/pages/CostEstimatorHistory.tsx` |
| Engine (costs, WBS, BOM, timeline, VAT, vision heuristics, AI blend) | `src/lib/costEstimatorEngine.ts` |
| Types / project catalogue | `src/lib/costEstimatorTypes.ts` |
| Marketplace matching | `src/lib/costEstimatorMatch.ts` |
| Persist + learning outcomes | `src/lib/costEstimatorPersist.ts` |
| Export PDF/CSV/Excel | `src/lib/costEstimatorExport.ts` |
| Scope of Work / Create tender | `src/lib/costEstimatorTender.ts` |
| Map embed | `EstimatorResultsMap` → **`EuropeMarketplaceMap`** (no second Leaflet) |
| Location | `LocationStep` + AppContext `globalLocation` |
| Convert / tender publish | Prefill → **`ProjectWizard`** → matches / tender board |
| Tender comparison table | Extended **`ProjectMatches`** (same matching pipeline) |

## Wizard flow
1. Project type (apartment / house renovation, bathroom, kitchen, trades, solar, pool, garden, office, warehouse, commercial, new build…)
2. Natural-language description (+ optional **voice input**)
3. Upload photos / video / PDF / CAD (+ camera / gallery / drag-drop)
4. Location synced with DImarket global geo
5. Measurements (area; L×W auto-fill; rooms/floors/height)
6. Async AI analysis → estimate results (breakdown, timeline, WBS, specialists, BOM, map, matches, insights, learning)

## Cost calculation logic
1. Baseline EUR/m² by project type × area × country × city multipliers × complexity heuristics × photo/floors/damage factors.
2. Split: labour / materials / equipment / transport / waste / permits + 8% contingency + **regional VAT**.
3. Tiers: Economy 0.78× · Standard 1× · Premium 1.32×.
4. Optional `ai-router` quote bot blends min/max into tiers (VAT preserved).
5. UI always shows reference-estimate disclaimer.

## Material estimation
Template BOM per type; qty from area/rooms; unit prices scaled by geo. Linked to live marketplace via `costEstimatorMatch` search queries.

## Specialist recommendation
Trade templates per type (e.g. bathroom → demolition → plumber → electrician → tiler → painter). Live counts of pros/companies nearby. Deep links to search / companies / sell-rent.

## Map synchronization
`EstimatorResultsMap` fetches `fetchMarketplaceMapMarkers` and filters with global location — same SSoT as `/map`.

## Create tender (competitive advantage)
1. Button **Create tender** builds professional **Scope of Work** (`buildScopeOfWork`).
2. Prefills Project Wizard (deadline step) with SoW + budget + invited pros.
3. On publish, `linkEstimateToListing` connects estimate ↔ listing.
4. `/project/:id/matches` shows **Tender board** table: match fit, availability, rating, jobs, reviews, verification.

## Learning system
Opt-in actual final cost → `cost_estimate_outcomes` (consent required, anonymised fields). Never overwrites user estimates.

## Database
`cost_estimates` + `cost_estimate_outcomes` — `supabase/migrations/20260805140000_cost_estimates.sql`.  
Apply: `npm run db:apply-cost-estimates` when Management API token is set. Until then, localStorage fallback.

## Performance
Async progress labels: Uploading → Analysing → Calculating → AI blend → Searching professionals → Generating report. UI never blocked by match fetch.

## Files touched (enterprise pass)
### New
- `src/lib/costEstimatorTender.ts`
- `src/components/cost-estimator/EstimatorResultsMap.tsx`

### Updated
- `src/pages/CostEstimator.tsx` — tender CTA, map, VAT factors, voice, camera, history reopen, learning UI
- `src/pages/CostEstimatorHistory.tsx` — open / duplicate / export / compare
- `src/pages/ProjectWizard.tsx` — tender prefill + `linkEstimateToListing`
- `src/pages/ProjectMatches.tsx` — tender board table
- `src/lib/costEstimatorEngine.ts` — VAT, vision heuristics, blend fix, progress
- `src/lib/costEstimatorPersist.ts` — get / duplicate / outcomes / link
- `src/lib/costEstimatorTypes.ts` — house renovation type
- `src/lib/globalLocation.ts` — estimator paths location-aware
- `src/lib/Translations/en.ts`, `uk.ts`

## Verification checklist
- [x] Wizard steps 1–5 + results
- [x] AI / local analysis + progress UI
- [x] Image upload (gallery, camera, drag-drop)
- [x] BOM + cost tiers + timeline + WBS
- [x] Specialists / companies / shops CTAs
- [x] Map embed via EuropeMarketplaceMap SSoT
- [x] Quote / convert / **Create tender** → Project Wizard
- [x] Tender board on matches
- [x] History open / duplicate / export / compare
- [x] Actual-cost learning with consent
- [x] Voice description (Web Speech API when available)
- [ ] Apply SQL migration on prod (needs Management API token)
- [ ] Live AI blend depends on deployed `ai-router` + OpenAI key
- [ ] True CV vision model (current: filename + description heuristics; photos increase confidence)

## Implemented feature list
1. Multi-step project wizard  
2. NL description + voice  
3. Media upload + visual cue inference  
4. Global location sync  
5. Measurements + auto area  
6. AI analysis (WBS, trades, hours, materials, equipment, waste, delivery, complexity, risks)  
7. Cost breakdown + Economy/Standard/Premium + VAT  
8. Timeline + completion date  
9. BOM + marketplace material links  
10. Specialist sequence + area counts  
11. Interactive map (SSoT)  
12. Multi-pro quote request via project publish  
13. Convert estimate → project  
14. **Create tender** + Scope of Work  
15. Tender board comparison table  
16. AI recommendations / insights  
17. History (edit reopen, duplicate, share via export, delete, compare)  
18. Export PDF / CSV / Excel / print  
19. Supabase + localStorage persistence  
20. Async progress UX  
21. Mobile camera / gallery / drag-drop / voice  
22. Learning loop (consent + anonymised outcomes)  
