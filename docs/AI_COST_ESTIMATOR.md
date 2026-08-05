# AI Cost Estimator — implementation report

## Goal
Production multi-step AI Cost Estimator linked to DImarket professionals, companies, materials and project quotes. Prices are **reference ranges** (орієнтовна оцінка), not binding quotes.

## Flow
Type → Description → Files → Location (global geo) → Measurements → AI analysis → Estimate (Economy/Standard/Premium) → Specialists → Materials → Timeline → Matches → Request quotes / Convert to project.

## Files
### New
- `src/lib/costEstimatorTypes.ts` — project types, state, estimate shapes
- `src/lib/costEstimatorEngine.ts` — local reference model + AI blend + WBS/materials/timeline/insights
- `src/lib/costEstimatorMatch.ts` — pros/companies/material listing matches
- `src/lib/costEstimatorPersist.ts` — DB + localStorage history
- `src/lib/costEstimatorExport.ts` — CSV / Excel CSV / print PDF
- `src/components/cost-estimator/EstimatorShell.tsx` — wizard chrome (matches Project Wizard language)
- `src/pages/CostEstimatorHistory.tsx` — saved estimates
- `supabase/migrations/20260805140000_cost_estimates.sql`
- `scripts/apply-cost-estimates-migration.mjs`

### Updated
- `src/pages/CostEstimator.tsx` — full wizard + results + CTAs
- `src/pages/ProjectWizard.tsx` — prefill from estimator sessionStorage
- `src/App.tsx` — `/cost-estimator/history`
- `src/lib/Translations/en.ts`, `uk.ts`
- `src/lib/costEstimator.ts` — kept for AiAssistant / legacy simple API
- `src/lib/serviceTaxonomy.ts` — reserved paths
- `package.json` — `db:apply-cost-estimates`

## Cost logic
1. Baseline EUR/m² by project type × area × country × city multipliers × complexity heuristics × photo/floors factors.
2. Split into labor / materials / equipment / transport / waste / permits + 8% contingency.
3. Three tiers: Economy 0.78×, Standard 1×, Premium 1.32×.
4. Optional `ai-router` quote bot blends min/max into tiers when available.
5. UI always shows reference-estimate disclaimer.

## Materials
Template BOM per project type with qty from area/rooms; unit prices scaled by geo. Linked to live `item_sale` / non-request listings via search queries when present.

## Specialists & matching
Trade template per project type → query `profiles` (professional/company) by subcategory + location/distance → sort verified → rating → distance. Counts per trade shown on results.

## Quotes / project
- **Find pros / companies / shops** — deep links to search/companies/sell-rent.
- **Convert to project / Request quotes** — writes sessionStorage prefill → `/create-project` (budget, description, geo, trade).
- Selected match IDs stored in prefill for follow-up.

## Database
`cost_estimates` (user history) + `cost_estimate_outcomes` (opt-in anonymised actuals for future training). Apply with `npm run db:apply-cost-estimates` when `SUPABASE_ACCESS_TOKEN` is set. Until then, estimates save to `localStorage`.

## Verification (manual)
- [x] All project types selectable
- [x] Description + files + location + measurements steps
- [x] Progress UI during analysis
- [x] Economy/Standard/Premium + breakdown + timeline + materials + specialists
- [x] Match CTAs + convert to project prefill
- [x] Export PDF/CSV/Excel
- [x] History route
- [ ] Apply SQL migration on prod (needs Management API token)
- [ ] Live AI blend depends on deployed `ai-router` + OpenAI key
