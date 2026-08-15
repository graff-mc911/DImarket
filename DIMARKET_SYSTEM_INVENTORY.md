# DIMARKET_SYSTEM_INVENTORY

**Date:** 2026-08-15  
**Production:** https://dimarket.app/  
**Supabase:** `wjlfvajloxkevggwjgtk`  
**Evidence:** live REST + Edge HTTP + code inventory (not assumptions)

---

## Stack

| Layer | Fact |
|-------|------|
| Frontend | Vite + React SPA (`src/`) |
| Hosting | Vercel → dimarket.app |
| Auth/DB | Supabase Auth + Postgres |
| Storage | Supabase Storage buckets (anon list returns `[]` — public listing denied) |
| Payments | Stripe Edge Functions; **UI flags OFF** |

---

## Feature matrix (inventory)

| FEATURE | FRONTEND | DATABASE | API/RPC | EDGE FUNCTION | STORAGE | RLS | OWNER CONTROL | PUBLIC FLOW | STATUS |
|---------|----------|----------|---------|---------------|---------|-----|---------------|-------------|--------|
| Auth / roles | Login, Register, AuthCallback, profileSync | `profiles`, auth.users | auth APIs | `delete-account` (401 without session) | — | yes (migrations) | OwnerProfilesManager (UI) | register → login | PARTIAL — roles exist; full E2E not owner-run here |
| Top Masters | HomeTopProfessionals, homeMarketplace | `profiles` (`user_role=professional`) | REST select | — | — | anon read pros | OwnerProfilesManager | homepage | PARTIAL — QA gate client-side; DB still has QA rows |
| Top Companies | HomeTopCompanies | `profiles` (`user_role=company`) | REST | — | — | anon read | OwnerProfilesManager «Топ компанії» | homepage | PARTIAL — same as masters |
| Manufacturers | commercialAgents pages | `manufacturer_profiles` | REST | `admin-delete-commercial-entity` **404** | — | published filter | CA admin panel | `/commercial-agents/manufacturers` | PARTIAL — brands seeded; QA profiles exist |
| Commercial Agents | CA pages | `agent_profiles` | REST | admin-delete **404** | — | published | CA admin | directory | WEAK — anon `agent_profiles` returned `[]` |
| Customer requests | CreateProject, listings | `listings` | REST | matching fns | project-files | yes | listings delete in Dashboard | create request | FAIL LIVE — **active listings = 0** |
| Search | Search.tsx, advancedSearch | profiles, categories, listings | REST | — | — | — | — | header search | FIXED IN CODE (QA filter) — deploy required |
| Map | MapExplore, marketplaceMap | profiles, mfr, agents, listings | REST | — | — | — | hide via profiles | `/map` | FIXED IN CODE (QA on mfr/agent) — deploy required |
| Chat | Messages, JobRequestChat | `messages` | REST/realtime | — | chat-media | yes | — | customer↔pro | UNVERIFIED LIVE — messages count `*/0` |
| Notifications | Notifications page | notification tables | — | **send-notification 404**, **notify-dispatch 404**, **dispatch-web-push 404** | — | — | — | in-app/push | **BLOCKED** — Edge missing |
| Calculator | CostEstimator | `cost_estimates` | REST | — | — | — | — | estimate save | TABLE reachable; empty; live calc flow not E2E'd |
| AI | AiAssistant, ai libs | sessions | — | `ai-assistant` 400, `ai-router` 400, `ai-job-lead` 400 (reachable) | — | — | admin AI | assistant | PARTIAL — functions exist; need session/tool payload |
| Advertising | Advertising, OwnerAdManager, PaidAdsContext | `ad_campaigns` | REST | checkout 401 | ad-media | owner RLS migrations | OwnerAdManager | home_center / mobile | PARTIAL — 1 active (`footer`); side banners removed |
| Documents | DocumentsHub | `legal_documents` (2 rows) | REST | **official-sources-monitor 404** | — | — | OfficialSourcesAdmin | `/documents` | **BLOCKED** monitor; catalog thin |
| Payments | Checkout, Billing, Pricing | payments/escrows | Stripe | stripe-webhook reachable; **stripe-connect 404**, **create-billing-portal 404** | — | — | — | — | **DISABLED BY CONFIG** (`PROJECT_PAYMENTS_ENABLED=false`, `AD_PAYMENTS_ENABLED=false`) |
| Owner dashboard | Dashboard.tsx | many | `admin_search_profiles` (exists; anon=unauthorized) | — | — | owner assert in SQL (not applied) | profiles/ads/CA/verification | `/dashboard` | PARTIAL — UI shipped; **moderation columns NOT on prod** |
| Reviews | home reviews | `reviews` | REST | — | review-media | — | — | homepage | LIVE — **approved reviews = 0** |
| Categories | MainCategoriesSection | `categories` + static `serviceCategories` | REST + static | — | — | — | — | home cards | STATIC marketing tree + DB overlay |
| Verification queue | VerificationAdminPanel | `verification_requests` | REST | — | verification-docs | — | approve/reject UI | — | LIVE count `*/0`; admin-delete CA edge **404** |

---

## Edge Functions (live POST with anon JWT)

| Function | HTTP | Note |
|----------|------|------|
| ai-assistant | 400 | deployed |
| ai-router | 400 | deployed |
| ai-job-lead | 400 | deployed |
| marketplace-matching | 401 | deployed |
| marketing-agent | 401 | deployed |
| telegram-bot | 403 | deployed |
| match-notify-channels | 400 | deployed |
| create-checkout-session | 401 | deployed |
| verify-checkout-session | 401 | deployed |
| release-project-escrow | 401 | deployed |
| delete-account | 401 | deployed |
| sales-chat | 501 | deployed (`use_client_engine`) |
| stripe-webhook | 400 | deployed (needs signature) |
| admin-ai-assistant | 401 | deployed |
| **official-sources-monitor** | **404** | NOT DEPLOYED |
| **send-notification** | **404** | NOT DEPLOYED |
| **notify-dispatch** | **404** | NOT DEPLOYED |
| **dispatch-web-push** | **404** | NOT DEPLOYED |
| **admin-delete-commercial-entity** | **404** | NOT DEPLOYED |
| **stripe-connect** | **404** | NOT DEPLOYED |
| **create-billing-portal** | **404** | NOT DEPLOYED |
| **professional-digest** | **404** | NOT DEPLOYED |
| **directory-avatar-backfill** | **404** | NOT DEPLOYED |
| **google-calendar-sync** | **404** | NOT DEPLOYED |
| **provision-scb-account** | **404** | NOT DEPLOYED |

---

## Production data snapshot (anon REST, 2026-08-15)

| Entity | Count |
|--------|-------|
| profiles | 196 |
| is_professional | 171 |
| masters (`professional`) | 40 |
| companies | 127 |
| manufacturers (role) | 3 |
| commercial_agent (role) | 1 |
| active listings | **0** |
| active ad_campaigns | **1** (placement=`footer`) |
| approved reviews | **0** |
| verification_requests | **0** |
| legal_documents | 2 |
| agent_profiles (table) | 0 visible |
| manufacturer_profiles | seeded brands (Knauf, Hilti, …) |

---

## Critical schema gaps on production

| Expected | Live |
|----------|------|
| `profiles.deleted_at` / `hidden_at` / `ranking_priority` | **column does not exist** (42703) |
| APPLY_OWNER_PROFILE_MODERATION.sql | **NOT APPLIED** |
| homepage_metrics | returns placeholder **52000 / 1.8M / 27 / 950000** |

---

## Storage buckets (code references)

`ad-media`, `chat-media`, `verification-docs`, `project-files`, `quote-pdfs`, `portfolio-media`, `review-media`, `media` (legacy)

Anon `GET /storage/v1/bucket` → `[]` (expected lockdown; upload policies not live-proven without auth).
