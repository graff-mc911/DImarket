# DImarket Security Audit — REVIEW_security.md

Scope: secrets management, Supabase RLS, service-role usage, CORS, middleware, Stripe integration, dependency vulnerabilities, storage buckets, Vercel config. No files were modified as part of this review; all line references point to the current working tree.

---

## CRITICAL

### C1. Client-supplied payment `amount` is trusted for Stripe Checkout — price tampering
**File:** `supabase/functions/create-checkout-session/index.ts:62-75, 133-152`

`create-checkout-session` builds the Stripe `price_data.unit_amount` directly from the request body (`Math.round(body.amount)`), with only a floor check (`body.amount < 50` → reject). There is no server-side lookup against `subscription_plans`, ad campaign pricing, or any other canonical price table:

```ts
if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount < 50) {
  return jsonResponse({ error: 'Invalid amount (minimum 0.50 in currency minor units)' }, 400)
}
...
unit_amount: Math.round(body.amount),
```

Any authenticated user can call this function directly (bypassing the UI) and set `amount: 50` to buy a `premium_profile`, `featured_listing`, `subscription`, `ad_campaign`, `sponsored_project`, or `lead_credits` pack for €0.50 regardless of real price. Stripe will happily charge that amount since it's a legitimate `price_data` object — this is not a "free" bypass, but a **price-manipulation** vulnerability that lets anyone set their own price.

**Fix:** Never accept `amount` from the client for anything except truly variable/quote-based flows (e.g. `project_escrow`, which is fine because it is tied to an accepted `quotes` row amount server-side). For all catalog products, look up the canonical price server-side (`subscription_plans.price_eur_month/year`, an `ad_campaign_pricing` table, a `lead_credits` pack price map, etc.) inside the edge function and ignore/validate `body.amount` against it before calling `stripe.checkout.sessions.create`.

### C2. Client-supplied `credits` / `duration_days` metadata is trusted to grant entitlements
**File:** `supabase/functions/create-checkout-session/index.ts:85-87` (metadata built from `body.credits`, `body.duration_days`) and `supabase/functions/stripe-webhook/index.ts:178-180, 249-256, 401-500` (`activateService`, `case 'lead_credits'`, `case 'premium_profile'`, etc.)

The checkout session's Stripe metadata embeds client-controlled `credits` and `duration_days` verbatim:

```ts
// create-checkout-session/index.ts
const durationDays = String(body.duration_days ?? defaultDurationDays(body.payment_type))
metadata = { ..., duration_days: durationDays, credits: String(body.credits ?? 0), ... }
```

The webhook later reads this same metadata back from the completed Stripe session and uses it, unchecked, to grant entitlements:

```ts
// stripe-webhook/index.ts
const durationDays = parseInt(String(meta.duration_days || '30'), 10)
const credits = parseInt(String(meta.credits || '0'), 10)
...
case 'lead_credits': {
  const amount = meta.credits > 0 ? meta.credits : Math.max(1, Math.round(meta.amount))
  await admin.rpc('grant_lead_credits', { p_user_id: userId, p_amount: amount, ... })
}
case 'premium_profile': {
  const expiresAt = new Date(now.getTime() + meta.durationDays * 24*60*60*1000).toISOString()
  await admin.from('profiles').update({ is_premium: true, premium_expires_at: expiresAt }).eq('id', userId)
}
```

Because Stripe metadata is set from the *original* checkout-session-creation request (attacker-controlled), a user can pay the €0.50 minimum from C1 and simultaneously request `credits: 999999` or `duration_days: 36500`, and `grant_lead_credits` / `premium_expires_at` will honor it. This compounds C1 into full entitlement forgery.

**Fix:** Derive `credits`/`duration_days`/plan entitlements from the server-side product/plan lookup performed when creating the checkout session (see C1), store that canonical value server-side (e.g. in the `payments` row or a `pending_checkout_intents` table keyed by `session.id`), and have the webhook read entitlements from that server-side record — never from client-supplied Stripe metadata.

### C3. Storage bucket rename `ad-media → media` has no tracked migration; live RLS still targets `ad-media`
**Files:** `supabase/migrations/20260519130000_dimarket_complete_backend.sql:344-382`, `supabase/migrations/20260529140000_production_self_serve_ads.sql:45-79`, commit `25c0b6f` ("rename Supabase storage bucket ad-media -> media")

Commit `25c0b6f` claims "RLS policies updated, 221 objects migrated" but only touches **frontend** files (`src/lib/adMediaStorage.ts`, `src/hooks/useAdBannerMediaUpload.ts`, `src/lib/directoryAvatars.ts`, etc.) that hardcode `const BUCKET = 'media'`. No SQL migration exists anywhere in `supabase/migrations/` (or `ALL_IN_ONE.sql`) that creates a `media` bucket or updates storage RLS policies to reference `bucket_id = 'media'`. Every versioned storage policy still says:

```sql
CREATE POLICY "Public read ad media" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ad-media');
CREATE POLICY "Authenticated upload ad media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');
```

This means the actual database state (bucket renamed + RLS presumably hand-edited via the Supabase dashboard) has **drifted from version control**. Either the `media` bucket in production has no RLS policies at all (uploads/reads unrestricted or entirely blocked), or someone manually created equivalent policies outside the migration history — unauditable and non-reproducible from `supabase db reset`.

**Fix:** Add a migration (e.g. `2026MMDDHHMMSS_rename_ad_media_bucket.sql`) that: creates/renames the `media` bucket, migrates policy names/definitions from `ad-media` to `media` (`bucket_id = 'media'`), and drops the stale `ad-media` policies. Treat any dashboard-only change as a P0 to backfill into migrations.

### C4. `project_escrows` UPDATE policy has no column/state-transition restriction — customer can self-mark escrow as captured
**File:** `supabase/migrations/20260807200000_project_escrows.sql:64-82`

```sql
CREATE POLICY project_escrows_update ON public.project_escrows
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR EXISTS (... l.author_id = auth.uid() ...))
  WITH CHECK (customer_id = auth.uid() OR EXISTS (... l.author_id = auth.uid() ...));
```

Row Level Security restricts *which rows* can be updated (by `customer_id`/listing ownership), but not *which columns* or *what state transitions* are valid. Since the `status`, `released_at`, `stripe_payment_intent_id`, `payout_status`, `platform_fee_amount` columns are all writable by anyone matching the `USING`/`WITH CHECK` predicate, a customer (who is legitimately allowed to update their own row for benign purposes) can call the Supabase JS/REST client directly:

```js
supabase.from('project_escrows').update({ status: 'captured', released_at: new Date().toISOString() }).eq('id', myEscrowId)
```

This bypasses `release-project-escrow`'s intended server-side capture/authorization workflow and can be used to fraudulently mark funds as released/captured without an actual Stripe capture, or to corrupt `payout_status`/fee fields that should only ever be written by the `stripe-webhook`/`release-project-escrow` edge functions (which use the `service_role` key).

**Fix:** Remove the general customer/owner UPDATE policy for this table. Only the `service_role` (edge functions) should be able to write `status`, `payout_status`, `stripe_*`, `released_at`, `platform_fee_*` — RLS should not allow authenticated users to UPDATE this table at all except perhaps a narrowly scoped policy with an explicit `WITH CHECK` that whitelists only cosmetic fields (if any exist) and never touches financial/state columns. Enforce via a `BEFORE UPDATE` trigger that rejects changes to protected columns unless `current_setting('role') = 'service_role'`, in addition to tightening RLS.

---

## HIGH

### H1. `ad-media`/`media` bucket UPDATE/DELETE storage policies are not owner-scoped
**File:** `supabase/migrations/20260519130000_dimarket_complete_backend.sql:378-382`, `supabase/migrations/20260529140000_production_self_serve_ads.sql:73-79`

```sql
CREATE POLICY "Authenticated update ad media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');

CREATE POLICY "Authenticated delete ad media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');
```

Unlike `portfolio-media` (`supabase/migrations/20260722140000_portfolio_upgrade.sql:129-136`), which correctly scopes writes to `(storage.foldername(name))[1] = auth.uid()::text`, the ad-media policies only check the top-level folder is literally `'campaigns'` — any authenticated user can update or delete **any other advertiser's** campaign image/video, not just their own. Combined with C3 (unknown current RLS state on the renamed `media` bucket), this needs re-verification once the bucket is properly migrated.

**Fix:** Scope UPDATE/DELETE (and ideally INSERT) to the owning user's folder, e.g. `(storage.foldername(name))[2] = auth.uid()::text` if paths are `campaigns/<user_id>/...`, matching the `portfolio-media` pattern.

### H2. CORS wildcard (`Access-Control-Allow-Origin: *`) on all Supabase Edge Functions, including admin/account-deletion endpoints
**Files:** `supabase/functions/_shared/cors.ts:2`, `supabase/functions/admin-delete-commercial-entity/index.ts:11`, `supabase/functions/delete-account/index.ts:5`, and every function importing `corsHeaders` (26 functions — see grep list below)

```ts
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  ...
}
```

Every edge function, including `admin-delete-commercial-entity` (deletes a commercial agent/manufacturer account) and `delete-account` (deletes the calling user's account), allows cross-origin requests from any origin. These functions do check the `Authorization` bearer JWT server-side and validate `is_site_owner`/`user_role` for admin actions, which meaningfully limits exploitability (an attacker still needs a valid token, not just a victim's cookies, since this is bearer-token auth not cookie auth). However, wildcard CORS is unnecessary and increases the blast radius if a token is ever exposed to third-party JS (e.g. via an XSS bug elsewhere, a malicious browser extension, or a compromised third-party script) that can read `localStorage`/make fetches with credentials from any origin.

**Fix:** Restrict `Access-Control-Allow-Origin` to the known production/staging origins (`https://dimarket.app`, preview deploy domains, `http://localhost:5173` for dev) via an allowlist check on the `Origin` request header, applied consistently across `_shared/cors.ts` and the two functions with inlined headers.

### H3. Content-Security-Policy is Report-Only and allows `'unsafe-inline'` scripts
**File:** `vercel.json:34` (header key `Content-Security-Policy-Report-Only`)

```json
"Content-Security-Policy-Report-Only": "default-src 'self'; ... script-src 'self' 'unsafe-inline' https://maps.googleapis.com ..."
```

The CSP is only in report-only mode — it never actually blocks anything in production, it only logs violations to `/api/csp-report`. In addition, `script-src` includes `'unsafe-inline'`, which (even once enforced) would substantially weaken XSS mitigation since it permits inline `<script>` execution.

**Fix:** After validating the CSP-Report-Only logs are clean for a deployment cycle, switch the header to `Content-Security-Policy` (enforcing). Replace `'unsafe-inline'` with either a nonce-based or hash-based script-src, or move inline scripts to external files.

### H4. `ai_translations_insert` and `ai_review_insert` allow arbitrary rows from any authenticated user
**File:** `supabase/migrations/20260602120000_ai_platform.sql:318-320, 361-363`

```sql
CREATE POLICY ai_translations_insert ON ai_translations FOR INSERT
  TO authenticated WITH CHECK (true);
...
CREATE POLICY ai_review_insert ON ai_review_analysis FOR INSERT
  TO authenticated WITH CHECK (true);
```

Any authenticated user can insert rows into `ai_translations` (arbitrary `source_type`/`source_id`/`translated_text`, no ownership tie) and `ai_review_analysis` (arbitrary AI-review-analysis payloads). Since `ai_translations_read` is `USING (true)` for all authenticated users, a malicious insert into `ai_translations` for someone else's `source_id` could poison translated content shown to other users (stored XSS / content-spoofing vector if `translated_text` is rendered without escaping).

**Fix:** These tables should only be written by trusted server-side code (edge functions / cron jobs using `service_role`), not directly by authenticated clients. Drop the `TO authenticated` INSERT policies and have the AI pipeline write via `service_role`, or add a `WITH CHECK` that validates the row against a legitimate source the user owns (e.g. `EXISTS (SELECT 1 FROM listings WHERE id = source_id::uuid AND author_id = auth.uid())`).

### H5. `match_scores_insert` lets any authenticated user write arbitrary match scores
**File:** `supabase/migrations/20260628120000_phase1_marketplace.sql:471`

```sql
CREATE POLICY "match_scores_insert" ON match_scores FOR INSERT TO authenticated WITH CHECK (true);
```

`match_scores` links a `listing_id` to a `contractor_id` with a `score`/`rank_position` used for marketplace matching. Any authenticated user can insert rows for any listing/contractor pair, allowing self-boosting (insert a high score for their own `contractor_id` against a competitor's listing) or sabotage (insert artificially low/duplicate scores, subject to the `UNIQUE (listing_id, contractor_id)` constraint blocking only exact duplicates).

**Fix:** This table should be written only by the `marketplace-matching` edge function via `service_role`. Drop the authenticated INSERT policy entirely, or restrict `WITH CHECK` to require the row's `contractor_id = auth.uid()` **and** an accompanying server-computed score can't be self-asserted — really this belongs behind `service_role` only.

---

## MEDIUM

### M1. `geo_catalog` and `osm_weekly_digest_runs` tables have no RLS enabled
**Files:** `supabase/migrations/20260519130000_dimarket_complete_backend.sql:260-266,340` (`geo_catalog`), `supabase/migrations/20260813220000_official_source_monitor_phase6.sql:6-15` (`osm_weekly_digest_runs`)

`geo_catalog` (countries/regions/cities reference data) has no `ENABLE ROW LEVEL SECURITY`, but is safe in practice because it only has `GRANT SELECT ON geo_catalog TO anon, authenticated;` — no INSERT/UPDATE/DELETE grants exist, so PostgREST cannot write to it regardless of RLS. `osm_weekly_digest_runs` (dedupe table for admin weekly-digest emails) also has no RLS and no explicit grants found in the migrations, meaning it currently relies entirely on the *absence* of a grant rather than defense-in-depth RLS.

**Fix:** Enable RLS on both tables even if only to formally deny all client access (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` with no policies = default-deny for `anon`/`authenticated`, while `service_role` still bypasses RLS). This removes the dependency on "no one ever accidentally grants this table" as the only safety net.

### M2. Public review submission policy has no anti-spam/anti-impersonation controls beyond non-empty fields
**File:** `supabase/migrations/20260327172059_fix_rls_security_policies.sql:57-68`

```sql
CREATE POLICY "Users can create reviews with identification" ON reviews FOR INSERT TO public
  WITH CHECK (reviewer_name IS NOT NULL AND reviewer_name != '' AND reviewer_email IS NOT NULL AND reviewer_email != '' AND comment IS NOT NULL AND comment != '' AND rating >= 1 AND rating <= 5);
```

This was already hardened from an earlier fully-open policy, but it still allows any unauthenticated visitor to post a review under any `reviewer_name`/`reviewer_email` (no verification the email belongs to the poster, no rate limiting, no CAPTCHA at the DB layer). This is an accepted product tradeoff for guest reviews, but combined with no application-level rate limiting it enables review spam/fake-review campaigns against professionals' listings.

**Fix:** Add application-layer rate limiting (per IP / per email) in the edge function or middleware fronting review submission, and consider requiring email verification (magic link) before a review is published, rather than only at insert time.

### M3. `profile_view_events` INSERT policy allows unauthenticated writes with no `TO` role restriction
**File:** `supabase/migrations/20260725120000_analytics_system.sql:42-44`

```sql
CREATE POLICY "Anyone can insert profile views" ON profile_view_events FOR INSERT WITH CHECK (true);
```

No `TO` clause means this applies to `PUBLIC` (including `anon`). Anyone can flood `profile_view_events` with fake `viewer_id`/`profile_id` pairs, inflating or corrupting analytics counts feeding `record_profile_view()`. Low direct security impact (no read exposure — `SELECT` is properly scoped to owner/site-owner) but a write-amplification / data-integrity risk.

**Fix:** Add basic validation (e.g. require `profile_id` references an existing published profile) and consider funneling writes through an edge function that can rate-limit by IP, rather than a raw open INSERT policy.

### M4. `dimarket-agent/.env.example` and `supabase/functions/.env.example` list many provider keys without inline warnings
**Files:** `dimarket-agent/.env.example`, `supabase/functions/.env.example`

Both files are properly free of real secrets (only key names with empty values), but unlike the root `.env.example` they lack the explicit "do not commit real values here" comment banner. Low risk since `.gitignore` covers `.env` (non-`.example`) files, but worth aligning for consistency and to reduce the chance a future contributor accidentally fills these in and commits.

**Fix:** Add the same warning header used in the root `.env.example` to both files.

---

## LOW

### L1. `npm audit` — 21 known vulnerabilities, transitive paths confirmed
**Command:** `npm audit --json` (run against `package-lock.json`)

Summary: 0 critical, 15 high, 4 moderate, 2 low (21 total).

| Package | Severity | Path | Fix |
|---|---|---|---|
| `ws` 8.18.3 | high (DoS via tiny fragments, GHSA-96hv-2xvq-fx4p) + moderate (uninitialized memory disclosure) | `@supabase/supabase-js` → `@supabase/realtime-js` → `ws` | `npm audit fix` (bump `ws` to `>=8.21.0`; wait for/bump `@supabase/realtime-js`) |
| `sharp` 0.34.5 | high (inherited libvips CVEs: CVE-2026-33327/33328/35590/35591) | direct dependency | Bump to `sharp@0.35.3` — `isSemVerMajor: true`, needs testing (used for server-side image processing in `scripts/`) |
| `yaml` 2.5.1 | moderate (stack overflow via deeply nested YAML, GHSA-48c2-rrv3-qjmp) | `tailwindcss` → `postcss-load-config` → `yaml` | `npm audit fix` (bump to `>=2.8.3`) |
| `vite` (<=6.4.2) | high (via `esbuild` dependency chain) | direct devDependency | `npm audit fix` |
| `react-router` / `react-router-dom` (6.0.0-7.18.1) | high | direct dependency | Upgrade to patched `react-router` release |
| `postcss` (<=8.5.22) | high | direct/transitive via `tailwindcss` toolchain | `npm audit fix` |
| `rollup` (4.0.0-4.58.0) | high | transitive via `vite` | Resolved by `vite` upgrade |
| `nanoid`, `picomatch`, `minimatch`, `glob`, `brace-expansion`, `cross-spawn`, `flatted`, `ajv`, `@babel/helpers` | high/moderate | transitive, mostly via `@typescript-eslint`/build tooling | `npm audit fix` |

All 21 have `fixAvailable: true` (sharp requires a major version bump and manual verification of image-processing output). None of these are exploitable from the deployed frontend bundle in a way that affects end users directly (they are build-tooling / server-side / realtime-client dependencies), but `sharp` runs server-side in `scripts/` against user-controlled input in some flows (image backfills) and should be prioritized.

**Fix:** Run `npm audit fix` for the auto-fixable set, then `npm install sharp@0.35.3` in an isolated branch and re-run any image-processing scripts/tests before merging.

### L2. `.vercelignore` excludes `supabase/` and `scripts/**` from deployment (correct), but no equivalent explicit block for `dimarket-agent/`
**File:** `.vercelignore`

`dimarket-agent/` contains its own `.env.example` referencing `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `DATABASE_URL`, social API tokens, etc., and is a separate Node service (not part of the Vite app). It is not explicitly excluded in `.vercelignore`, though Vercel's Vite framework preset would only build/deploy what `vite.config.ts`/`outputDirectory: dist` produces, so this is unlikely to be an active issue — but it's not defensively excluded either.

**Fix:** Add `dimarket-agent` to `.vercelignore` explicitly for defense-in-depth, matching the treatment already given to `supabase` and `scripts/**`.

### L3. `homepage_metrics` and several "public read" reference tables rely on unauthenticated `USING (true)` SELECT — expected but worth documenting
**Files:** various (`categories`, `professional_categories`, `listing_images`, `portfolio_items`, `reviews`, `homepage_metrics`, `country_sources`, `booking_blocked_dates`, `match_scores` SELECT, `portfolio_likes`/`review_likes`/`review_replies` SELECT)

All reviewed `USING (true)` policies found in migrations are scoped to `FOR SELECT` only (confirmed individually — see audit trail), which is appropriate for public marketplace/reference data. No write-side `USING (true)` policies remain after the `20260327172059_fix_rls_security_policies.sql` hardening, aside from the `WITH CHECK (true)` INSERT issues already called out in H4/H5/M3. This item is listed for completeness/documentation, not as a new defect.

---

## Items verified clean (no issues found)

- **Secrets in git:** `.env.local` is tracked (per `git ls-files | grep -i env`) but contains only placeholders (`SUPABASE_ACCESS_TOKEN=sbp_...`, `VITE_SUPABASE_ANON_KEY=...`) and the public project URL — confirmed across full git history (`git log -p -- .env.local`), both commits (`2e99776`, `4c07dca`) never contained real secrets. `.env.example`, `dimarket-agent/.env.example`, `supabase/functions/.env.example` all contain only empty/placeholder values.
- **Hardcoded secret patterns:** Repo-wide grep for `sk_live_`, `sk_test_...`, `sbp_...`, `AKIA...`, `ghp_...`, `xox[a-z]-...`, `whsec_...`, PEM private key headers across all git-tracked files returned zero matches.
- **Service role key isolation:** `SUPABASE_SERVICE_ROLE_KEY` is used only in `scripts/*.mjs` (Node-only, never bundled by Vite) and Supabase Edge Functions (Deno runtime, server-side). No `VITE_`-prefixed variable references it, and `src/` contains zero references to `service_role`/`SERVICE_ROLE`.
- **Stripe secret key isolation:** `STRIPE_SECRET_KEY` only appears in `supabase/functions/*/index.ts` (edge function secrets); `src/lib/stripe.ts` only calls `supabase.functions.invoke('create-checkout-session', ...)` — no Stripe secret material in client code.
- **Stripe webhook signature verification:** `supabase/functions/stripe-webhook/index.ts:23` correctly calls `stripe.webhooks.constructEventAsync(body, signature, webhookSecret)` and rejects requests missing `stripe-signature` or `STRIPE_WEBHOOK_SECRET`.
- **`middleware.ts`:** Confirmed to be a crawler-only Open Graph meta-tag injector (matches `/` only, checks `user-agent` for known bots) with no authentication/authorization logic — no auth-bypass risk.
- **`vercel.json` rewrites:** SPA fallback rewrite `/((?!api/|assets/).*) → /index.html` correctly excludes `api/` and `assets/`, so the one real serverless function (`api/csp-report.js`) and static assets are not swallowed by the SPA catch-all.
- **`.vercelignore`:** Correctly excludes `supabase` (edge function source referencing secrets) and `scripts/**` (server-only scripts referencing `SUPABASE_SERVICE_ROLE_KEY`) from the Vercel deployment bundle, with narrow allowlist exceptions only for SEO build scripts.
- **`api/csp-report.js`:** CSP violation collector logs only a truncated summary (directive/blocked-uri/document-uri, capped at 220 chars) to server logs; explicitly notes "no PII store"; caps payload size at 32KB.

---

## Summary Table

| ID | Severity | Area | Location |
|---|---|---|---|
| C1 | CRITICAL | Stripe | `supabase/functions/create-checkout-session/index.ts:62-152` |
| C2 | CRITICAL | Stripe | `supabase/functions/stripe-webhook/index.ts:178-256,401-500` |
| C3 | CRITICAL | Storage/RLS | migrations vs. commit `25c0b6f` |
| C4 | CRITICAL | RLS | `supabase/migrations/20260807200000_project_escrows.sql:64-82` |
| H1 | HIGH | Storage RLS | `20260519130000_dimarket_complete_backend.sql:378-382` |
| H2 | HIGH | CORS | `supabase/functions/_shared/cors.ts:2` (+25 functions) |
| H3 | HIGH | CSP | `vercel.json:34` |
| H4 | HIGH | RLS | `20260602120000_ai_platform.sql:318-320,361-363` |
| H5 | HIGH | RLS | `20260628120000_phase1_marketplace.sql:471` |
| M1 | MEDIUM | RLS | `geo_catalog`, `osm_weekly_digest_runs` |
| M2 | MEDIUM | RLS | `20260327172059_fix_rls_security_policies.sql:57-68` |
| M3 | MEDIUM | RLS | `20260725120000_analytics_system.sql:42-44` |
| M4 | MEDIUM | Secrets hygiene | `dimarket-agent/.env.example`, `supabase/functions/.env.example` |
| L1 | LOW | Dependencies | `npm audit` (21 vulns, all fixable) |
| L2 | LOW | Vercel config | `.vercelignore` |
| L3 | LOW | RLS (documentation only) | multiple public-read tables |
