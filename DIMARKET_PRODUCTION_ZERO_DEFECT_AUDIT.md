# DIMARKET_PRODUCTION_ZERO_DEFECT_AUDIT

**Audit date:** 2026-08-15  
**Production URL:** https://dimarket.app/  
**Supabase project:** wjlfvajloxkevggwjgtk  
**Method:** live REST + Edge HTTP + production JS bundle inspection + code path audit  
**Branch with fixes:** `cursor/production-zero-defect-audit-81bd`

==================================================
EXECUTIVE VERDICT
==================================================

# NOT READY

A real customer / master / company / manufacturer / commercial agent / advertiser / investor **cannot** rely on the production system as a complete marketplace today.

Evidence below. Not opinion.

==================================================
CRITICAL BLOCKERS
==================================================

1. **QA / test profiles are real public DB rows**  
   - Live: 14 `is_professional=true` QA profiles (Smoke, Chat Pro, Master Elektro, QA companies, QA manufacturers, `Test`).  
   - Raw Top Masters query returns QA Smoke first.  
   - Soft-delete columns **do not exist** on prod → Owner cannot DB-hide without SQL apply.

2. **Owner profile moderation SQL not applied**  
   - Live error: `column profiles.deleted_at does not exist`.  
   - File exists: `APPLY_OWNER_PROFILE_MODERATION.sql` — **human must run in Supabase**.

3. **Marketplace supply empty for requests**  
   - Live: **active listings = 0**.  
   - Customer “publish request → masters see it” cannot succeed with zero active requests in DB.

4. **Homepage metrics were fake**  
   - Live RPC `get_homepage_metrics` returns **52000 professionals / 1.8M reviews / 27 countries / 950000 projects**.  
   - Real: ~171 professionals, 0 approved reviews, 5 countries in footer stats.  
   - Code fix in this PR prefers live counts (deploy required).

5. **Notifications Edge Functions missing**  
   - Live: `send-notification`, `notify-dispatch`, `dispatch-web-push` → **HTTP 404**.  
   - Push/email notification pipeline is **BLOCKED**.

6. **Official source monitor missing**  
   - Live: `official-sources-monitor` → **HTTP 404**.  
   - Documents “current official” monitoring cannot run.

7. **Commercial agent admin delete Edge missing**  
   - Live: `admin-delete-commercial-entity` → **HTTP 404**.

8. **Payments disabled by configuration**  
   - `PROJECT_PAYMENTS_ENABLED = false`  
   - `AD_PAYMENTS_ENABLED = false`  
   - Stripe Connect / billing portal Edge → **404**.  
   - Status: **DISABLED BY CONFIGURATION** — not READY for paid monetization.

9. **Typecheck fails**  
   - `npm run typecheck` → exit 2, **~299 TS errors** (mostly TranslationKey vs `string`).  
   - Build still succeeds; type safety is not enforced in CI sense.

10. **No complete live browser E2E of registration→chat→hire executed in this run**  
    - Playwright exists (`npm run test:e2e`) but was not run against production with secrets.  
    - Claiming PASS on those flows would violate RULE 1.

==================================================
HIGH PRIORITY
==================================================

- Search / category / SEO / map CA / estimator / AI match lacked QA gate → **fixed in code**, deploy required.  
- Owner vs public: panel exists on `/dashboard` after prior merge, but without SQL, Hide/Delete use fragile `is_professional=false` fallback only when RPCs exist.  
- Active ads: only **1** campaign (`footer` placement) — not `home_center` inventory proof.  
- Approved reviews: **0**.  
- Verification queue: **0** pending; CA delete path broken (404).  
- Storage: anon cannot list buckets (good); authenticated upload not live-proven here.  
- `.env.local` in agent environment had **invalid** anon key; production uses hardcoded public anon in `supabase.ts` fallback (works on Vercel if env set).

==================================================
MEDIUM PRIORITY
==================================================

- Static Home category tree vs DB categories dual system (documented SSOT debt).  
- `sales-chat` returns 501 `use_client_engine`.  
- Agent profiles table empty via anon while `user_role=commercial_agent` profile exists.  
- Documents catalog: only **2** `legal_documents` rows.  
- Mobile UX: not device-lab tested this run (code/responsive present; RULE 1 → not PASS).  
- Language flag indicator / i18n: not fully live-validated this run.

==================================================
LOW PRIORITY
==================================================

- Seeded manufacturer brand directory (Knauf, Hilti, …) may be marketing seed — confirm ownership.  
- Footer/metrics inflation historically.  
- Multiple leftover private QA client accounts (not public).

==================================================
FEATURE MATRIX
==================================================

| Feature | Live Test | DB | RLS | Owner | Mobile | Status |
|---------|-----------|----|-----|-------|--------|--------|
| Auth | NOT RUN full E2E | profiles exist | present in migrations | OwnerProfilesManager | untested | UNVERIFIED |
| Master | DB query only | 40 pros | anon read | search/hide (needs SQL) | untested | NOT READY (QA pollution) |
| Company | DB query only | 127 | anon read | «Топ компанії» | untested | NOT READY (QA pollution) |
| Manufacturer | table+role | 3 role + mfr_profiles | published | CA panel; delete EF 404 | untested | NOT READY |
| Commercial Agent | role=1; agent_profiles=[] | weak | — | delete EF 404 | untested | NOT READY |
| Customer Request | active listings=0 | empty | — | listing delete UI | untested | FAIL |
| Search | code audit | — | — | — | untested | FIXED IN CODE / DEPLOY |
| Map | code audit | — | — | — | untested | FIXED IN CODE / DEPLOY |
| Chat | messages=0 | empty | migrations | — | untested | UNVERIFIED |
| Notifications | Edge 404 | — | — | — | — | BLOCKED |
| Calculator | table 200 empty | cost_estimates | — | — | untested | UNVERIFIED |
| AI | Edge 400 reachable | — | — | admin AI | untested | PARTIAL |
| Advertising | 1 active footer | ad_campaigns | owner migrations | OwnerAdManager | untested | PARTIAL |
| Documents | 2 rows; monitor 404 | legal_documents | — | admin page | untested | BLOCKED monitor |
| Payments | flags false; Connect 404 | — | — | — | — | DISABLED BY CONFIG |
| Owner Control | UI present | moderation cols missing | RPC unauthorized to anon | profiles+ads | untested | NOT READY until SQL |
| Reviews | approved=0 | reviews | — | — | — | EMPTY |
| Categories | static+DB | categories | — | — | untested | PARTIAL |

==================================================
DATA INTEGRITY
==================================================

**Public records (anon):**  
profiles 196 · professional-listable 171 · masters 40 · companies 127 · active listings 0 · active ads 1 · approved reviews 0  

**Owner-visible:**  
Owner UI for profiles exists in shipped frontend; DB moderation incomplete without SQL.

**QA records:**  
33 name-matched; 14 public-listable — see `DIMARKET_QA_DATA_INVENTORY.md`.

**Orphans / duplicates:**  
Multiple duplicate «QA Smoke professional» rows (same name, different UUIDs). Investor Ad Test duplicated.

**Fake metrics:**  
homepage_metrics / get_homepage_metrics placeholder inflation — confirmed live.

==================================================
SECURITY
==================================================

**RLS:**  
Migrations exist historically; full live policy matrix not exhaustively proven with multi-role JWT in this run. Anon cannot call `admin_search_profiles` (unauthorized) — PASS for that RPC.

**Owner authorization:**  
SQL `admin_assert_site_owner` in APPLY file — **not confirmed applied** (moderation columns missing implies APPLY not run).

**Anonymous access:**  
Can read public profiles / active ads / published manufacturers. Cannot list storage buckets. Edge admin/marketing require auth.

**Cross-user write:**  
Not live-proven with attacker session (gap).

==================================================
PRODUCTION
==================================================

**Edge Functions:**  
Deployed subset OK; **critical notification + OSM + CA delete + Stripe Connect/portal missing (404)**.

**Storage:**  
Buckets referenced in code; anon list empty.

**Cron:**  
official-sources-monitor missing → cron useless if pointed at 404.

**Payments:**  
DISABLED BY CONFIGURATION + missing Connect functions.

==================================================
MOBILE
==================================================

Not device-lab verified this audit. Responsive components exist. **Status: UNVERIFIED (not PASS).**

==================================================
FINAL BLOCKERS
==================================================

1. Apply `APPLY_OWNER_PROFILE_MODERATION.sql` on production.  
2. Run `APPLY_HIDE_QA_PUBLIC_PROFILES.sql` (preview then update) OR Owner Hide on each QA public profile.  
3. Deploy frontend with QA gate + live metrics fixes.  
4. Deploy missing Edge Functions (notifications, official-sources-monitor, admin-delete-commercial-entity, stripe-connect/billing if payments to be enabled).  
5. Decide payments: keep disabled (document) OR enable flags + secrets + deploy Stripe functions.  
6. Seed or generate real active customer requests / content — marketplace cannot launch with 0 active listings and 0 reviews.  
7. Fix or quarantine `npm run typecheck` (299 errors).  
8. Run Playwright production E2E for auth/chat/ads with dedicated `qa-zero-defect-*` accounts, then clean them.

==================================================
FIXES IMPLEMENTED (THIS AUDIT)
==================================================

| Fix | Status |
|-----|--------|
| Strengthen QA name detector (`Test`, Investor…) | FIXED IN CODE |
| QA filter: Search, Categories, SEO, Map mfr/agent, Estimator, AI match, ProfessionalDetail, CA API | FIXED IN CODE |
| Homepage metrics prefer live counts; drop fake 52k/1.8M defaults | FIXED IN CODE |
| SQL scripts documented for Owner hide QA + moderation | CREATED (human apply) |
| Inventory + QA inventory + this audit report | WRITTEN |
| Unit test script updated for new QA rules | PASS (`npm run test`) |
| `npm run build` | PASS |
| `npm run typecheck` | FAIL (pre-existing ~299 errors) |
| Production deploy from this branch | **REQUIRED** (Vercel CLI login expired in agent) |

==================================================
WHAT STILL REQUIRES HUMAN ACTION
==================================================

1. **Supabase SQL Editor:** run `APPLY_OWNER_PROFILE_MODERATION.sql`  
2. **Supabase SQL Editor:** preview+apply `APPLY_HIDE_QA_PUBLIC_PROFILES.sql`  
3. **Merge/deploy** this branch to `main` / Vercel production  
4. **Deploy Edge Functions** listed as 404  
5. **Secrets:** Stripe, OpenAI, Resend, push keys as needed  
6. **Owner login E2E:** Hide QA → confirm homepage empty of QA → Restore  
7. **Create real content** (listings, reviews) or accept empty marketplace  
8. **Payments product decision** (keep off vs turn on)  
9. **Mobile device QA** (Safari iPhone)  
10. **Typecheck debt** cleanup

==================================================
PRODUCTION TESTS PASSED
==================================================

- Anon REST connectivity to production Supabase  
- Profile / listing / ad / review / verification counts measured  
- Edge function reachability matrix completed  
- Prod JS bundle contains `filterPublicProfiles` / `isLikelyQaOrTestProfile`  
- `admin_search_profiles` rejects anon (unauthorized)  
- `npm run test` visibility unit checks  
- `npm run build`  

==================================================
PRODUCTION TESTS FAILED / NOT RUN
==================================================

- Full registration flows (all roles) — NOT RUN  
- Owner hide→public disappear→restore — BLOCKED without SQL + owner session  
- Chat send/receive realtime — NOT RUN (0 messages)  
- Notifications push/email — BLOCKED (404)  
- Payments checkout — DISABLED BY CONFIG  
- Official source monitor — BLOCKED (404)  
- Mobile Safari lab — NOT RUN  
- Typecheck clean — FAIL  
- Active customer request publish with matching — FAIL (0 listings)  
- DB soft-delete columns — FAIL (missing)

==================================================
FINAL SCORE
==================================================

# NOT READY

**Companions:**  
- `DIMARKET_SYSTEM_INVENTORY.md`  
- `DIMARKET_QA_DATA_INVENTORY.md`
