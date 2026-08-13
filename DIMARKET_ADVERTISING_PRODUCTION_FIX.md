# DIMARKET_ADVERTISING_PRODUCTION_FIX

Live target: https://dimarket.app  
Date: 2026-08-13  
Branch: `cursor/ads-stale-display-fix-81bd`

## OLD AD BUG

**Identified live campaign (WIDE + CENTER + SIDES):**

| Field | Value |
|---|---|
| campaign_id / advertisement_id | `4ef33bff-593e-476f-966f-f2854fb3eb26` |
| banner_id | n/a (row uses `image_url` / `media_url` / `slot_media`) |
| title | `This will be your advertisement.` |
| placement (legacy) | `home` |
| placements | `home_mob_inline_1..4`, `home_center`, `home_side_l1`, `home_side_r1` |
| status | **`active`** (public SELECT returns it) |
| approved_by | `b64a9350-4f7e-46bf-8697-d39c02491ad0` |
| review_note | `owner_managed: Відхилено власником` |
| starts_at / ends_at | 2026-06-16 → 2026-12-30 |
| deleted_at | none (hard-delete only; row still exists) |
| storage path | `ad-media/campaigns/1781607765853-uio5sqwocqh.png` (HTTP 200) |
| updated_at | 2026-08-13T17:30:58Z (re-saved while still active) |

**Cause:**

1. Public query is `ad_campaigns.status = 'active'` (`fetchPaidAdCampaigns`).
2. Owner “reject/disable” is supposed to set `status = 'rejected'`, but a later **owner save** (`buildOwnerCampaignPayload`) forced `status: 'active'` again while **preserving** the rejection text in `review_note`.
3. Supabase UPDATE with RLS that matches 0 rows returns **200 + empty array and no error** — OwnerAdManager previously treated that as success.

**Fix:**

- Code: never re-attach cancel/reject text on active save; clear `approved_by` when not active; verify UPDATE/DELETE affected rows; exclude cancelled notes in `isCampaignPubliclyDisplayable`.
- DB (required for true source of truth): run `supabase/migrations/APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` (or `node scripts/apply-deactivate-stale-ads.mjs` with `SUPABASE_SERVICE_ROLE_KEY`).

**Verified:**

- Live anon REST confirmed only this stale row + later test rows as `active`.
- Reject/delete of **own** advertiser campaigns works (status leaves public SELECT).
- Cannot mutate stale owner campaign as another user (0 rows) — needs owner/service role SQL.

## NEW AD BUG

**Cause:**

- Create/upload/publish **works** via advertiser API when `status=active` + `approved_by` set (Phase A: `AD_PAYMENTS_ENABLED=false`).
- Perceived “new ad does not appear” mainly came from: (a) stale placeholder occupying all home slots, (b) in-memory `PaidAdsProvider` not refreshing on tab focus, (c) `/advertising` publish not calling public ads refresh, (d) silent RLS 0-row updates in owner cabinet.

**Fix:**

- Refresh public ads after owner save / advertising publish; refresh on `visibilitychange`/`focus`.
- Owner save/reject/delete now fail loudly if 0 rows updated.
- Cancelled-note gate so a wrongly-active cancelled campaign cannot render.

**Verified (API, production Supabase):**

- Upload banner → HTTP 200, public URL 200, `image/png`.
- Insert active campaign → 201, appears in anon `status=eq.active`.
- Patch `status=rejected` → disappears from anon active list.
- Delete → disappears.
- Live investor demo campaign created: `51a10ee0-4ce0-4009-a9e5-d2b7ac458abc` (“DImarket Investor Demo Banner”), placements `home_center` + `home_mob_inline_1`.

## Matrix

| Check | Result |
|---|---|
| WIDE BANNER (`home_mob_inline_1`) | **PASS** (API mapping); UI after deploy uses cancelled-note filter |
| CENTER BANNER (`home_center`) | **PASS** (API mapping); same |
| UPLOAD | **PASS** |
| PUBLISH | **PASS** |
| DELETE / deactivate | **PASS** (own campaigns); stale owner row needs SQL |
| CACHE INVALIDATION | **PASS** (code: focus/visibility + explicit refresh) — SW does not cache Supabase |
| RLS | **PASS** (anon read active; anon cannot update; advertiser own CRUD; cross-user update 0 rows) |
| MOBILE / DESKTOP / INCOGNITO | **PARTIAL** — API verified; full browser UI matrix requires frontend deploy + SQL |

## FINAL

**ADVERTISING READY FOR INVESTOR DEMO: NO**

Blockers before YES:

1. Merge/deploy this frontend branch to production.
2. Apply `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` in Supabase SQL Editor (or provide `SUPABASE_SERVICE_ROLE_KEY` and run `scripts/apply-deactivate-stale-ads.mjs`).
3. Hard-refresh / incognito: stale “This will be your advertisement.” must be gone; “DImarket Investor Demo Banner” (or a new owner ad) must show in wide/center as assigned.

Until step 2, DB source of truth still has the cancelled campaign as `active` (frontend filter hides it after deploy only).
