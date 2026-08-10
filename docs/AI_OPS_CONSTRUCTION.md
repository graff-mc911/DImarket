# AI Operating System for Construction

DImarket vision: not only a marketplace — an autonomous OS from first request to project close.

```text
Client → AI Analyst → AI Estimator → AI Matcher → AI Dispatcher
      → Pros (Ready / Inspection / Decline) → AI Ranking → Hire
      → AI Project Manager + AI Procurement + Learning profiles
```

## Agents (SSoT — no duplicates)

| Agent | Module | Extends |
|-------|--------|---------|
| Analyst | `aiAnalyst.ts` | Cost estimator clarifications |
| Estimator | `costEstimatorEngine.ts` | Regional reference costs |
| Matcher | `matching/aiMatchService.ts` + `proPerformance.ts` | Success-likelihood boost |
| Dispatcher | `aiDispatcher.ts` | Match notify package |
| Ranking | `aiOfferRanking.ts` | Quotes board |
| **Project Manager** | `projectManager.ts` + `/project/:id/manage` | Milestones, calendar, photos, docs, completion |
| **Procurement** | `aiProcurement.ts` + `EstimatorProcurementPanel` | BOM → supplier compare → approve |

## AI Project Manager capabilities

- Work calendar from milestone `due_at`
- Stage status → progress notifications to client + pro
- Next-stage reminder when a stage is done
- Before / during / after photo uploads (`project_media`)
- Generate act / invoice / warranty / payment checklist (`project_documents`)
- Complete project → issue docs + review prompt + recompute pro learning

## AI Procurement

- Reads estimate BOM
- Searches live sell-rent marketplace listings
- Scores by price-fit vs estimate + distance
- Client **Approve** stores intent in `project_procurement_items`

## Learning profiles

- Table `pro_performance_profiles`: jobs, avg price, duration, on-time, satisfaction, returns, recommend, specialties
- Recomputed on project completion
- Matcher adds boost for high satisfaction / specialty fit (recommends likely success, not only cheapest)

## Database

`supabase/migrations/20260806160000_ai_ops_construction.sql`

## Routes

- `/cost-estimator` — Analyst + Estimator + Procurement panel
- `/project/:id/manage` — AI Project Manager cockpit
- `/project/:id/offers` — Ranking + hire
- `/leads` — Dispatcher responses

## Honest gaps

- **Project payments deferred:** escrow + Connect payouts are implemented in code but **off in UI** (`PROJECT_PAYMENTS_ENABLED = false` in `src/lib/featureFlags.ts`) until audience justifies the money loop. Hire → Project Manager works without card hold.
- Supplier “order” is approve-intent + deep link (no checkout cart yet)
- Learning quality grows with completed jobs + reviews volume

## Escrow / Connect (deferred)

Code lives under `projectEscrow.ts`, `stripeConnect.ts`, `release-project-escrow`. Re-enable by setting `PROJECT_PAYMENTS_ENABLED = true` and deploying Connect edge + migration.
