# DIMARKET — Manufacturer / Commercial Agent / Advertising
## PRODUCTION FINAL VERIFICATION

**Date:** 2026-08-13  
**Project:** `wjlfvajloxkevggwjgtk` (`https://wjlfvajloxkevggwjgtk.supabase.co`)  
**App:** `https://dimarket.app`  
**Method:** Live Auth + PostgREST + Storage E2E against production (not code inspection)  
**Migration under test:** `APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql` (confirmed applied)

### FINAL PRODUCTION STATUS

# READY WITH ISSUES

Core manufacturer / commercial agent registration, profiles, products, search/map data, advertising linkage, storage upload, public campaign visibility, and RLS isolation all **PASS** on production with live evidence.

Issues that do **not** block registration or advertising:
- `npm run typecheck` fails (296 pre-existing TS errors)
- `npm run test` script does not exist (related scripts pass)
- 13/27 Edge Functions return HTTP 404 (none required for this feature path with `AD_PAYMENTS_ENABLED=false`)

---

## Checklist (1–27)

| # | Item | Result | Evidence |
|---|------|--------|----------|
| 1 | Register NEW user as Manufacturer | **PASS** | Auth signup `qa-pv-mfr-1786637132@dimarket-audit.test` → uid `44496220-3970-45c2-9bd3-5b67ced7d858` |
| 2 | Auth user created | **PASS** | Signup 200 + access_token issued |
| 3 | `profiles.user_role = manufacturer` | **PASS** | GET profiles → `"user_role":"manufacturer"` |
| 4 | `manufacturer_profiles` record | **PASS** | id `30955c9f-0fc4-4e8f-90f3-edb65f7d7201` |
| 5 | Create/edit manufacturer profile | **PASS** | PATCH description/headquarters persisted |
| 6 | Create manufacturer product | **PASS** | `manufacturer_products` id `4e62d5c0-827c-4bc2-acb8-b9e1fca3d7ee` |
| 7 | Product stored in production DB | **PASS** | Owner GET by id returns row |
| 8 | Product in public profile/search | **PASS** | Anon `name=ilike` finds product; public slug `qa-pv-mfr-1786637132` |
| 9 | Register NEW user as Commercial Agent | **PASS** | `qa-pv-agent-1786637132@dimarket-audit.test` → uid `afdcea05-f513-4081-b8cf-0e33831ff9d7` |
| 10 | `profiles.user_role = commercial_agent` | **PASS** | GET profiles → `commercial_agent` |
| 11 | `agent_profiles` record | **PASS** | id `02397d08-d3d1-4073-828b-5c5ca127601c` |
| 12 | Add represented brand | **PASS** | `current_manufacturers` includes `QABrandPV` |
| 13 | Add territory/location | **PASS** | `territory` + `city=Kyiv` + `service_regions` |
| 14 | Agent appears in search | **PASS** | Anon GET by slug published |
| 15 | Agent appears correctly on map | **PASS** | `profiles.service_latitude=50.4501`, `service_longitude=30.5234` via `agent_profiles`→`profiles` join used by map |
| 16 | Create ad campaign as Manufacturer | **PASS** | campaign `f62a235c-e819-41e9-b311-4525e44979a1` status `active` |
| 17 | Verify `manufacturer_profile_id` | **PASS** | `30955c9f-0fc4-4e8f-90f3-edb65f7d7201` |
| 18 | Upload banner | **PASS** | Storage `ad-media/campaigns/e2e/.../banner-1786637132.png` HTTP 200; public GET 200 |
| 19 | Publish campaign | **PASS** | Inserted `status=active` (phase A no-payment) |
| 20 | Anonymous/public can see campaign | **PASS** | Anon GET active campaign by id |
| 21 | Create ad campaign as Commercial Agent | **PASS** | campaign `db418d56-5e43-4746-945a-7cd6a6045d3e` |
| 22 | Verify `agent_profile_id` | **PASS** | `02397d08-d3d1-4073-828b-5c5ca127601c` |
| 23 | Verify campaign publication | **PASS** | Anon/active status confirmed |
| 24 | RLS cross-edit isolation | **PASS** | See RLS RESULT |
| 25 | typecheck / test / build | **PARTIAL** | build PASS; typecheck FAIL; `npm run test` missing (substitutes PASS) |
| 26 | Production console/network errors | **PARTIAL** | Pages 200; public REST 200; no browser DevTools session |
| 27 | Relevant Supabase Edge Functions | **PARTIAL** | 14 EXISTS / 13 MISSING; mfr/agent/ads path does not require missing fns |

---

## WHAT WAS TESTED

Live production E2E against Supabase Auth, PostgREST, and Storage:

1. Schema presence after `APPLY_MFR_AGENT_ROLES_PRODUCTS_ADS.sql`
2. Manufacturer signup → role → profile → product → public visibility
3. Commercial Agent signup → role → profile → brands/territory → search → map coords
4. Advertising for both roles with profile FK linkage + banner upload + public read
5. RLS: cross-manufacturer, cross-agent, cross-advertiser campaign edits
6. Local `npm run typecheck`, available test scripts, `npm run build`
7. Production page HTTP status + Edge Function deploy probe

QA accounts (leave in place unless cleanup requested):
- `qa-pv-mfr-1786637132@dimarket-audit.test`
- `qa-pv-agent-1786637132@dimarket-audit.test`
- Earlier probe: `qa-final-mfr-1786636988@dimarket-audit.test`, `qa-final-mfr2-1786637076@dimarket-audit.test`

---

## WHAT PASSED

- Auth trigger writes `manufacturer` / `commercial_agent` into `profiles.user_role`
- `manufacturer_products` table + owner RLS + public published SELECT
- `ad_campaigns.manufacturer_profile_id`, `agent_profile_id`, `target_categories`
- Full manufacturer and agent onboarding data paths
- Banner upload to `ad-media` bucket
- Free publish (`status=active`) visible to anon
- RLS blocks editing another manufacturer / agent / advertiser campaign (empty PATCH result; victim title unchanged)
- `npm run build` succeeds
- `npm run test:registration` (logic), `test:commercial-agents`, `test:commercial-agents:prod`
- Prod routes HTTP 200: `/`, `/register`, `/advertising`, `/commercial-agents`, `/map`, manufacturer + representative slugs
- Prod JS bundle contains `manufacturer` / `commercial_agent` / map `agent` kind

---

## WHAT FAILED

- **`npm run typecheck`** — exit 2, **296** `error TS*` (mostly strict `t()` key typing / supabase casts across commercialAgents + unrelated modules). Does not block deployed Vite production build.
- **`npm run test`** — script **does not exist** in `package.json`.

---

## WHAT WAS FIXED

**Nothing in this verification turn.** User instructed DO NOT MODIFY CODE YET.

Prior blocker (migration not on prod) is **resolved**: live probes now succeed for roles, `manufacturer_products`, and ad linkage columns. No code fix was required for READY path.

---

## DATABASE RESULT

| Object | Live result |
|--------|-------------|
| `profiles.user_role` CHECK allows `manufacturer` / `commercial_agent` | PASS (signup + PATCH) |
| `handle_new_user` maps roles | PASS |
| `manufacturer_profiles` | PASS (CRUD own row) |
| `agent_profiles` | PASS (CRUD own row) |
| `manufacturer_products` | PASS (create/read public) |
| `ad_campaigns.manufacturer_profile_id` | PASS |
| `ad_campaigns.agent_profile_id` | PASS |
| `ad_campaigns.target_categories` | PASS (column present; written on insert) |

---

## RLS RESULT

| Check | Result | Detail |
|-------|--------|--------|
| Manufacturer cannot edit another manufacturer | **PASS** | PATCH other id → HTTP 200 `[]` |
| Agent cannot edit another agent | **PASS** | PATCH other id → HTTP 200 `[]` |
| Advertiser cannot edit another advertiser campaign | **PASS** | Manufacturer token PATCH agent campaign → `[]`; agent re-read title unchanged |

---

## STORAGE RESULT

| Check | Result |
|-------|--------|
| Upload PNG to `ad-media` as authenticated manufacturer | **PASS** (200) |
| Public object URL fetch | **PASS** (200) |
| Campaign `image_url` points at uploaded banner | **PASS** |

Public banner URL:  
`https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/e2e/44496220-3970-45c2-9bd3-5b67ced7d858/banner-1786637132.png`

---

## ADVERTISING RESULT

| Actor | Campaign id | Linkage | Public active |
|-------|-------------|---------|---------------|
| Manufacturer | `f62a235c-e819-41e9-b311-4525e44979a1` | `manufacturer_profile_id=30955c9f-…` | PASS |
| Commercial Agent | `db418d56-5e43-4746-945a-7cd6a6045d3e` | `agent_profile_id=02397d08-…` | PASS |

Payments remain disabled (phase A); campaigns published with `price_paid=0`, `status=active`.

---

## MANUFACTURER RESULT

End-to-end **PASS** on production:
register → auth → `user_role=manufacturer` → `manufacturer_profiles` → edit → `manufacturer_products` → anon search → public slug page route 200 → ad with `manufacturer_profile_id`.

---

## COMMERCIAL AGENT RESULT

End-to-end **PASS** on production:
register → auth → `user_role=commercial_agent` → `agent_profiles` → brands + territory → anon search → map coordinates on linked profile → ad with `agent_profile_id`.

Public profile route verified:  
`https://dimarket.app/commercial-agents/representatives/qa-pv-agent-1786637132` (200)

---

## BUILD / TEST COMMANDS

```
npm run typecheck  → FAIL (exit 2, 296 errors)
npm run test       → FAIL / N/A (Missing script: "test")
npm run build      → PASS (vite build + seo-build)
npm run test:registration → PASS (logic); live role script needs SERVICE_ROLE_KEY (skipped)
npm run test:commercial-agents → PASS
npm run test:commercial-agents:prod → PASS
```

---

## EDGE FUNCTIONS (prod probe POST `/functions/v1/<name>`)

**EXISTS (14):** admin-ai-assistant, ai-assistant, ai-job-lead, ai-router, create-checkout-session, delete-account, marketing-agent, marketplace-matching, match-notify-channels, release-project-escrow, sales-chat, stripe-webhook, telegram-bot, verify-checkout-session

**MISSING 404 (13):** apply-auth-profile-migration, create-billing-portal, directory-avatar-backfill, dispatch-web-push, google-calendar-oauth, google-calendar-sync, notify-dispatch, official-sources-monitor, professional-digest, provision-scb-account, send-notification, send-quote-email, stripe-connect

Manufacturer/agent/ads flows verified here are client→PostgREST/Storage and do not depend on the missing functions while ad payments are off.

---

## PRODUCTION NETWORK / PAGES

| URL | HTTP |
|-----|------|
| https://dimarket.app/ | 200 |
| https://dimarket.app/register | 200 |
| https://dimarket.app/advertising | 200 |
| https://dimarket.app/commercial-agents | 200 |
| https://dimarket.app/map | 200 |
| …/manufacturers/qa-pv-mfr-1786637132 | 200 |
| …/representatives/qa-pv-agent-1786637132 | 200 |
| Public REST: ads / manufacturers / agents / products | 200 |

Browser DevTools console was **not** attached in this agent environment → item 26 marked **PARTIAL**.

---

## FINAL PRODUCTION STATUS

# READY WITH ISSUES

Registration and advertising for Manufacturer and Commercial Agent are **live and verified** on production after SQL apply. Remaining issues are tooling (typecheck / missing `test` script) and unrelated undeployed Edge Functions — not blockers for this feature.
