# AI Project Pipeline — 9-step orchestration

DImarket end-to-end flow from client intake to AI Project Manager.
**Principle:** One Feature = One Component = One Source of Truth — extend existing estimate / matching / applications / quotes / notifications.

## Pipeline map

| Step | Role | Implementation |
|------|------|----------------|
| 1 | Client describes (voice / text / photo) | `CostEstimator`, `ProjectWizard`, `useVoiceInput`, uploads |
| 2 | AI Analyst | `src/lib/aiAnalyst.ts` → clarifying Q&A in estimator step 5 |
| 3 | AI Estimator | `costEstimatorEngine.runFullCostEstimate` |
| 4 | AI Matcher | `lib/matching/aiMatchService.rankProfessionals` + `runMatchingForListing` |
| 5 | AI Dispatcher | `src/lib/aiDispatcher.ts` (package + notify + channels) |
| 6 | Pros respond | `respondToProject` → Ready / Need inspection / Decline (`ProjectFeed`) |
| 7 | AI Ranking | `src/lib/aiOfferRanking.rankQuotesForListing` → `/project/:id/offers` |
| 8 | Client selects | `selectProfessionalForProject` |
| 9 | AI Project Manager | `projectManager` + `/project/:id/manage` milestones |

## Routes
- `/cost-estimator` — Analyst + Estimator
- `/create-project` — publish (Dispatcher triggers on submit)
- `/project/:id/matches` — matched pros
- `/leads` — pro feed + triad responses
- `/project/:id/offers` — ranked quotes + Select
- `/project/:id/manage` — milestones / progress

## Database
Migration: `supabase/migrations/20260806120000_ai_project_pipeline.sql`
- Expand `project_applications.status`: `ready`, `needs_inspection`, `declined`
- `project_milestones` for PM
- `listings.hired_professional_id`, `pipeline_stage`

Until migration is applied, `respondToProject` falls back to legacy statuses (`applied` / `saved` / `withdrawn`).

## Files
### New
- `src/lib/aiAnalyst.ts`
- `src/lib/aiDispatcher.ts`
- `src/lib/aiOfferRanking.ts`
- `src/lib/projectManager.ts`
- `src/pages/ProjectOffers.tsx`
- `src/pages/ProjectManage.tsx`
- `supabase/migrations/20260806120000_ai_project_pipeline.sql`

### Extended
- `costEstimatorTypes` / `CostEstimator` — clarifications
- `projectApplications` — triad responses
- `matching/persistMatches` — dispatch package
- `ProjectFeed`, `ProjectMatches`, `App.tsx`

## Gaps (honest)
- True CV vision still heuristic (`inferVisualFeatures`)
- Dispatcher enrichment needs migration + `match-notify-channels` accepting package body
- PM is milestone tracking + notifications — not a full autonomous agent yet
- Apply SQL on prod when Management API token available
