# DIMARKET_PUBLIC_DATA_OWNER_CONTROL_AUDIT

**Date:** 2026-08-13  
**Branch:** `cursor/owner-public-data-control-81bd`  
**Site:** https://dimarket.app  

**Status language:** this report does **not** claim READY. Live owner hide/delete E2E is blocked until SQL is applied and owner session is used.

---

## 1. ROOT CAUSE

### Why “Таланти / Топ майстри” shows QA Smoke / QA Chat Pro

| Layer | Exact source |
|-------|----------------|
| **Page** | `src/pages/Home.tsx` → `<HomeTopProfessionals professionals={data?.professionals ?? []} />` |
| **Loader** | `fetchHomeMarketplaceData()` → `fetchHomeProfessionals()` |
| **File** | `src/lib/homeMarketplace.ts` |
| **TABLE** | `public.profiles` |
| **VIEW / RPC** | none (direct PostgREST table select) |
| **QUERY (before fix)** | `profiles` where `is_professional = true` AND `user_role = 'professional'` **ORDER BY `created_at` DESC** LIMIT 24, then client-sort by `is_featured` → `rating` → `created_at` |

There is **no** mock/demo/fallback array of professionals for this section. Metrics have hardcoded defaults (`DEFAULT_METRICS`), but **Top Masters cards are real DB rows**.

QA profiles appear because:

1. They are real rows in `profiles` with `is_professional=true`, `user_role='professional'`.
2. Query preferred **newest** accounts.
3. Almost everyone has `rating=0`, `is_featured=false`, so **newest QA wins**.
4. Public query did **not** exclude QA names, soft-delete, or hide flags (those columns did not exist).

### Why Owner Dashboard cannot find them

| Layer | Finding |
|-------|---------|
| **Owner UI** | `src/pages/Dashboard.tsx` listed listings / ads / feedback / CA / verification — **no professionals directory** |
| **Existing RPC** | `admin_search_profiles` **already exists in production** (returns `unauthorized` without owner JWT) |
| **Gap** | RPC was **never wired** into Owner Dashboard UI |
| **Missing** | `admin_hide_profile` / soft-delete / `hidden_at` / `deleted_at` / `ranking_priority` columns (not in prod until SQL applied) |

So: **public DB and owner UI were not the same surface.** Public read all pros; Owner had no search UI for them.

---

## 2. PUBLIC SOURCE (Top Masters algorithm)

### Before

```ts
// homeMarketplace.ts (old)
.from('profiles')
.eq('is_professional', true)
.eq('user_role', 'professional')
.order('created_at', { ascending: false })
```

Then: sort featured → rating → created_at.

### After (this PR)

1. Prefer `deleted_at IS NULL` and `hidden_at IS NULL` when columns exist.
2. Client gate: `filterPublicProfiles` / `isLikelyQaOrTestProfile` (blocks `QA *`, `qa-*`, audit emails…).
3. Sort: `ranking_priority` → `is_featured` → `rating` → `total_reviews` → `created_at`.
4. Same gate applied to catalog (`Professionals.tsx`), service results, map.

**Not hardcoded QA users. Not demo seed on homepage.**

---

## 3. OWNER SOURCE

| Capability | Mechanism |
|------------|-----------|
| Search | `admin_search_profiles` (SECURITY DEFINER) — **UI added**: `OwnerProfilesManager` on `/dashboard` |
| Featured | `admin_update_profile_flags` (already on prod) |
| Hide / Unhide / Soft-delete / Restore | new RPCs in `APPLY_OWNER_PROFILE_MODERATION.sql` |
| Legacy fallback until SQL | Hide/Delete → `is_professional=false`; Restore/Unhide → `is_professional=true` |
| Ranking | `admin_set_ranking_priority` (new; does **not** change `rating`) |

Server-side: RPCs call `admin_assert_site_owner()` (DB flag **or** `ivan.sovban@gmail.com`).

---

## 4. QA RECORDS (anon-visible production scan)

`profiles.email` column does **not** exist; emails live in `auth.users` (owner RPC can join after SQL).

### Public Top Masters candidates (professional role) — QA

| profile_id | full_name | user_role | is_professional | is_verified | is_featured | rating | PUBLIC? | OWNER VISIBLE? (pre-UI) | ACTION |
|------------|-----------|-----------|-----------------|-------------|-------------|--------|---------|-------------------------|--------|
| `ba2ccd8c-f0e0-4564-92b9-a1ebfc84553b` | QA Smoke professional | professional | true | false | false | 0 | YES (raw) | NO UI | Hide/soft-delete after confirm |
| `cefa4240-5a86-4363-ba92-1b6ab6b628d9` | QA Smoke professional | professional | true | false | false | 0 | YES | NO UI | same |
| `c37e7a19-7c64-438c-8767-06b1f2fd7ec6` | QA Chat Pro | professional | true | false | false | 0 | YES | NO UI | same |
| `81ab4668-3550-4a76-8c81-9accaffef808` | QA Smoke professional | professional | true | false | false | 0 | YES | NO UI | same |
| `bab59f93-e4bf-458f-9f12-a29ee3f34792` | QA Smoke professional | professional | true | false | false | 0 | YES | NO UI | same |
| `0a501098-f48b-4adc-beeb-92ba29e2d555` | QA Smoke professional | professional | true | false | false | 0 | YES | NO UI | same |
| `5a55418f-3c3a-445b-a483-929736adf35c` | QA Master Elektro | professional | true | false | false | 0 | YES | NO UI | same |

### Other QA-named profiles (not Top Masters role, but QA junk)

Clients / companies / manufacturers / agents with names like `QA Smoke client`, `QA Company GmbH`, `QA PV Agent`, `QA Admin Delete Agent`, `qa-stranger-*`, etc. — **28** name matches total via `full_name ILIKE 'QA%' OR 'qa-%'`.

**No auto-delete performed.** SQL file includes optional hide of `QA %` / `qa-%` names after columns exist.

---

## 5. FALLBACK / MOCK DATA

| Item | Present? |
|------|----------|
| Homepage Top Masters mock list | **NO** |
| Demo professionals injected when DB empty | **NO** |
| Hardcoded metrics fallback | YES (`DEFAULT_METRICS` 52k/1.8M…) — unrelated to card names |
| QA name patterns in seed SQL historically | partner/seed ads only; QA rows are live auth signups |

---

## 6. DATABASE INTEGRITY NOTES

| Check | Result |
|-------|--------|
| `profiles.deleted_at` / `hidden_at` / `ranking_priority` | **missing on prod until SQL** |
| Orphan scan (reviews/favorites/media) | not mass-deleted; soft-delete preferred |
| Related tables | hide/soft-delete profile does not cascade-delete listings/reviews (intentional) |

Apply: `supabase/migrations/APPLY_OWNER_PROFILE_MODERATION.sql`

---

## 7. LIVE E2E

| Test | Result |
|------|--------|
| Unit: QA name gate | PASS (`npm run test` / `verify-public-profile-visibility.mjs`) |
| Live raw prod fetch contains QA Smoke | YES (root cause confirmed) |
| Live gate excludes QA from listable set | PASS (`e2e-top-masters-qa-gate.mjs`) |
| Owner search UI → hide → public gone → restore | **PENDING** — requires: (1) merge/deploy, (2) apply SQL, (3) owner login session |
| Create TEST pro → owner hide/delete cycle | **PENDING** same blockers |

---

## 8. FINAL (honest)

| Question | Answer |
|----------|--------|
| OWNER HAS FULL CONTROL | **NO** until SQL applied + owner uses new Dashboard panel (search exists in DB already; hide columns/RPCs needed for proper Hide) |
| PUBLIC DATA AND OWNER DATA CONSISTENT | **NO** historically; **YES after deploy+SQL** by design (same `profiles` table + owner search of all rows) |
| QA DATA CLEAN | **NO** — QA rows still in DB; public gate will hide QA names after frontend deploy; DB hide via SQL recommended |
| READY | **NOT CLAIMED** |

### Owner action required

1. Merge PR and deploy frontend (QA leave Top Masters via client gate + ranking fix).
2. Run `APPLY_OWNER_PROFILE_MODERATION.sql` in Supabase SQL Editor.
3. Open `/dashboard` → **Профілі DImarket** → filter **QA / тест** → Hide or Soft-delete.
4. Confirm each row before permanent auth-user deletion (out of scope here).
