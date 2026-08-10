# Commercial Agents / Representatives (Phase 1)

B2B marketplace connecting manufacturers with independent commercial agents.

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

Migration: `supabase/migrations/20260810180000_commercial_agents.sql`

Tables: `manufacturer_profiles`, `agent_profiles`, `representation_opportunities`, `representation_applications`, `agent_invitations`, `commercial_entity_reports`, `commercial_analytics_events`

Also extends `saved_items.item_type` with `manufacturer` | `agent` | `opportunity`.

Apply on prod:

```bash
npm run db:apply-commercial-agents
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
