# AI Construction Cost Estimator — Enterprise Final Report

Production feature on DImarket (not a demo calculator). Integrated with professionals, companies, materials marketplace, map SSoT, project wizard, tender, quotes, and AI project pipeline.

**Live:** `https://dimarket.app/cost-estimator` · History: `/cost-estimator/history`

---

## Architecture (One Feature = One SSoT)

| Concern | Source of truth |
|---------|-----------------|
| Wizard + results | `src/pages/CostEstimator.tsx` |
| History | `src/pages/CostEstimatorHistory.tsx` |
| Engine (costs, WBS, BOM, timeline, VAT, vision heuristics, AI blend) | `src/lib/costEstimatorEngine.ts` |
| Types / catalogue | `src/lib/costEstimatorTypes.ts` |
| Analyst Q&A | `src/lib/aiAnalyst.ts` |
| Matching | `src/lib/costEstimatorMatch.ts` (+ platform `lib/matching`) |
| Persist / outcomes / archive / link | `src/lib/costEstimatorPersist.ts` |
| Export | `src/lib/costEstimatorExport.ts` |
| Tender / Scope of Work | `src/lib/costEstimatorTender.ts` |
| Map embed | `EstimatorResultsMap` → **`EuropeMarketplaceMap`** + `marketplaceMap.ts` |
| Location | `LocationStep` + AppContext `globalLocation` / `geoSearch` |
| Convert / tender publish | Prefill → **`ProjectWizard`** |
| Tender board / offers | `ProjectMatches` + `ProjectOffers` + `aiOfferRanking` |
| Dispatcher | `aiDispatcher.ts` via `runMatchingForListing` |

**Never duplicated:** map, search, categories, mobile nav.

---

## AI workflow

1. Client: type → NL (+ voice) → media → geo (+ radius) → measurements (+ Analyst Q&A)  
2. Async engine: visual cues → local regional model → optional `ai-router` blend → WBS / BOM / timeline / insights  
3. Marketplace match: specialists, companies, material listings (radius-aware)  
4. CTAs: Find pros/companies/shops · Request quotes · Convert to project · **Create tender**  
5. Publish → Dispatcher notifies matched pros with SoW package  
6. Pros: Ready / Need inspection / Decline → quotes  
7. AI Ranking board → client Select → AI Project Manager milestones  

---

## Cost calculation logic

1. Baseline EUR/m² by project type × area × country × city multipliers  
2. Complexity from description (urgency, premium, damage, detail)  
3. Photo / floors / high-ceiling / visible-damage multipliers  
4. Split: labour / materials / equipment / transport / waste / permits + 8% contingency + regional **VAT**  
5. Tiers: Economy 0.78× · Standard 1× · Premium 1.32×  
6. Optional AI blend anchors economy/premium grand totals; VAT structure preserved  
7. UI always labels **reference estimate** — never binding quotes  

---

## Material estimation logic

- Template BOM per project type; qty from area/rooms/unit rules  
- Unit prices scaled by geo multiplier  
- Per-row **Find offers** → `/sell-rent?q=`  
- Live marketplace hits via `fetchEstimatorMatches` search queries  

---

## Specialist recommendation logic

- Trade templates per type (e.g. bathroom: demolition → plumber → electrician → drywall/waterproofing → tiler → painter → installer)  
- Live counts of pros/companies nearby (trade slug + radius)  
- Deep links to `/search`, `/companies`, `/sell-rent`  

---

## Map synchronization

- `EstimatorResultsMap` fetches `fetchMarketplaceMapMarkers`  
- Filters with global location **and** estimate `subcategorySlug` / `serviceQuery`  
- Same Leaflet instance as `/map` — no second map  

---

## Performance

Async progress: Uploading → Analysing → Calculating → Searching materials → AI blend → Searching professionals & companies → Generating report. Match fetch non-blocking after results paint.

---

## Database

| Migration | Purpose |
|-----------|---------|
| `20260805140000_cost_estimates.sql` | `cost_estimates`, `cost_estimate_outcomes` |
| `20260806140000_cost_estimates_archive.sql` | `archived` flag |
| `20260806120000_ai_project_pipeline.sql` | pro triad statuses, milestones, hire pointer |

Apply with Management API when token available; app falls back to `localStorage`.

---

## Verification (Steps 1–21)

| # | Feature | Status |
|---|---------|--------|
| 1 | Project type wizard | ✓ (garden = landscaping label) |
| 2 | NL description + complexity heuristics + Analyst | ✓ |
| 3 | Upload photo/video/PDF/CAD + visual cue inference | ✓ (heuristic; not full CV) |
| 4 | Global location + region/province/radius + local multipliers | ✓ |
| 5 | Measurements + live L×W→area + height factor | ✓ |
| 6 | AI analysis WBS/trades/hours/materials/equipment/waste/delivery/complexity/risk | ✓ |
| 7 | Cost breakdown + Economy/Standard/Premium + VAT | ✓ |
| 8 | Timeline prep/construction/finishing/**inspection** + completion | ✓ |
| 9 | BOM + marketplace purchase links | ✓ |
| 10 | Specialists + area counts | ✓ |
| 11 | Interactive map SSoT filtered to estimate | ✓ |
| 12 | Request quotes (multi-select → project prefill) | ✓ |
| 13 | Convert → create → publish → offers | ✓ |
| 14 | Insights: saving/upgrade/energy/sequence/missing/risk/maintenance | ✓ |
| 15 | History open/duplicate/share/export/delete/archive/compare | ✓ |
| 16 | Export PDF/Excel/CSV/Print | ✓ |
| 17 | Supabase + localStorage | ✓ |
| 18 | Async progress labels | ✓ |
| 19 | Mobile camera/gallery/DnD/voice | ✓ |
| 20 | Actual cost learning + consent | ✓ |
| 21 | **Create tender** + SoW + tender board (real quote prices when sent) | ✓ |

---

## Honest remaining depth (not blockers)

- True computer-vision model (current: filename + description heuristics)  
- Outcomes table not yet used to retrain multipliers automatically  
- SQL migrations may need Management API apply on prod  
- Live AI blend needs deployed `ai-router` + OpenAI key  

---

## Implemented feature list

1. Multi-step project wizard  
2. NL + voice description  
3. Media upload + visual cue inference  
4. Global location sync + radius  
5. Measurements + auto area  
6. AI Analyst clarifying questions  
7. Full analysis report (WBS, trades, hours, materials, equipment, waste, delivery, complexity, risk)  
8. Cost breakdown + 3 tiers + VAT + reference disclaimer  
9. Timeline with Inspection + completion date  
10. Professional BOM + shop links  
11. Specialist sequences + nearby counts  
12. EuropeMarketplaceMap embed (filtered)  
13. Multi-pro quote request  
14. Convert estimate → project  
15. **Create tender** + Scope of Work  
16. Tender board with AI-ranked offers  
17. AI recommendations (incl. energy & maintenance)  
18. History (edit/open, duplicate, share, export, delete, archive, compare)  
19. Export PDF / CSV / Excel / print  
20. Supabase persistence + learning outcomes  
21. Async non-blocking UX  
22. Mobile camera / gallery / DnD / voice  
