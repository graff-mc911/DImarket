# Commercial Agents / Representatives (Phase 1)

B2B marketplace connecting manufacturers with independent commercial agents.

## Production readiness

| Step | Command / action | Status |
|------|------------------|--------|
| 1. Schema + RLS | `npm run db:apply-commercial-agents` (or GitHub Action **Apply Commercial Agents schema**) | Required |
| 2. Grants + PostgREST reload | included in apply (grants migration) | Required |
| 3. Demo seed (optional) | `npm run db:seed-commercial-agents` | Optional showcase rows |
| 4. Verify | `npm run test:commercial-agents:prod` | Must pass (REST 200, not PGRST205) |

GitHub Action: `.github/workflows/apply-commercial-agents.yml`  
Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` (seed), optional `VITE_SUPABASE_ANON_KEY`.

Phase 1 is ready for real use after step 1+4: create profiles in `/commercial-agents/dashboard`, publish opportunities, apply / invite, chat via existing Messages.

**Not in Phase 1:** Stripe PRO billing, AI re-rank matching, full CRM/contracts.

## Positioning

Commercial Agents is a **top-level DImarket section** (not a product/service subcategory clone):

- Header dept + Mobile More + Footer + Home category tile (`commercial-agents` in `serviceCategories`)
- Routes under `/commercial-agents`
- Matching filters use **existing DImarket `serviceCategories`** (HVAC, Stores, Manufacturers, …)

Landing CTAs: Find Agent · Find Manufacturer · Post Opportunity · Create Agent Profile.

Manufacturer / Agent profiles include a **Commercial Representation** block and Find Agents / Find Manufacturers actions.

## Routes

| Path | Page |
|------|------|
| `/commercial-agents` | Landing / discovery |
| `/commercial-agents/manufacturers` | Manufacturer directory |
| `/commercial-agents/manufacturers/:slug` | Manufacturer profile |
| `/commercial-agents/representatives` | Agent directory |
| `/commercial-agents/representatives/:slug` | Agent profile |
| `/commercial-agents/opportunities` | Open mandates |
| `/commercial-agents/opportunities/:id` | Opportunity detail + apply |
| `/commercial-agents/dashboard` | Manufacturer / agent cabinet |

## Schema

Migrations:

- `supabase/migrations/20260810180000_commercial_agents.sql`
- `supabase/migrations/20260811120000_commercial_agents_grants.sql`

Tables: `manufacturer_profiles`, `agent_profiles`, `representation_opportunities`, `representation_applications`, `agent_invitations`, `commercial_entity_reports`, `commercial_analytics_events`

Also extends `saved_items.item_type`.

Apply on prod:

```bash
npm run db:apply-commercial-agents
npm run db:seed-commercial-agents   # optional
npm run test:commercial-agents:prod
```

## Matching

`src/lib/commercialAgents/matchingService.ts` — deterministic 0–100 score.
TODO Phase 2: AI re-rank via `enrichWithAi()`.

```bash
npm run test:commercial-agents
```

## Reuse

- Chat: existing `ensure_conversation` / Messages
- Notifications: `create_notification` (type `match`)
- Favorites: `saved_items`
- Auth: `profiles` + AppContext
- i18n: `t()` keys under `commercialAgents.*` (en/uk/es/de)

## Monetization (flags only)

`src/lib/commercialAgents/plans.ts` — FREE / PRO AGENT / PRO MANUFACTURER / PREMIUM OPPORTUNITY soft limits. No Stripe wiring in Phase 1.
