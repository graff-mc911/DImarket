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

- Escrow V1 + Connect V1: full-quote hold → capture → Transfer to pro Express account minus 5% platform fee. Soft-skip if pro not onboarded (`skipped_no_connect` + retry). No milestone splits or disputes UI yet.
- Supplier “order” is approve-intent + deep link (no checkout cart yet)
- Learning quality grows with completed jobs + reviews volume

## Escrow V1

| Step | Surface |
|------|---------|
| Hire → Checkout authorize | `ProjectOffers` → `startProjectEscrowCheckout` |
| Hold status | `ProjectManage` escrow banner |
| Complete → capture → Transfer | `release-project-escrow` (+ Connect payout) |
| Table | `project_escrows` |

## Connect payout V1 (Prompt #12)

| Step | Surface |
|------|---------|
| Pro onboarding | Settings / ProDashboard → `stripe-connect` Express |
| Sync flags | `account.updated` webhook + status action |
| Transfer | After capture: `transfers.create` → pro `stripe_account_id` |
| Retry | Manage “Retry professional payout” if skipped/failed |
| Migration | `20260810120000_stripe_connect_escrow_payout.sql` |
