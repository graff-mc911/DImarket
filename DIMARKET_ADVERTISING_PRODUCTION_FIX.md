# DIMARKET_ADVERTISING_PRODUCTION_FIX

Live target: https://dimarket.app  
Date: 2026-08-13  
Deployed: merge `#89` → `main` (`e964fad`), Vercel production success  
Bundle verified: `assets/index-bEC9Mggo.js` (contains cancel-note gate)

## OLD AD BUG

**Identified live campaign (WIDE + CENTER + SIDES):**

| Field | Value |
|---|---|
| campaign_id / advertisement_id | `4ef33bff-593e-476f-966f-f2854fb3eb26` |
| banner_id | n/a (`image_url` / `media_url` / `slot_media`) |
| title | `This will be your advertisement.` |
| placement (legacy) | `home` |
| placements | `home_mob_inline_1..4`, `home_center`, `home_side_l1`, `home_side_r1` |
| status | was **`active`** while cancelled in note |
| approved_by | `b64a9350-4f7e-46bf-8697-d39c02491ad0` |
| review_note | `owner_managed: Відхилено власником` |
| starts_at / ends_at | 2026-06-16 → 2026-12-30 |
| deleted_at | none |
| storage path | `ad-media/campaigns/1781607765853-uio5sqwocqh.png` (HTTP 200) |

**Cause:**

1. Public query: `ad_campaigns.status = 'active'` (`fetchPaidAdCampaigns`).
2. Owner save (`buildOwnerCampaignPayload`) re-set `status: 'active'` while preserving rejection text in `review_note`.
3. Owner reject/delete treated PostgREST **200 + 0 rows** (RLS) as success.

**Fix:**

- Public gate `isCampaignPubliclyDisplayable` excludes cancelled review notes.
- Owner payload strips cancel/reject tails; clears `approved_by` when not active.
- Approve/reject/delete require `.select('id')` and fail if 0 rows.
- SQL: `APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql` (set `status=rejected` in DB).

**Verified (live site after deploy):**

- Desktop / mobile / incognito: stale PNG `1781607765853-uio5sqwocqh` **not** in page HTML.
- Stale title **not** rendered.
- **Follow-up still required:** apply SQL so DB status is `rejected` (agent lacked `SUPABASE_SERVICE_ROLE_KEY`). Until then frontend gate is the live protection; row may still be `active` in PostgREST.

## NEW AD BUG

**Cause:** Stale placeholder occupied home slots; PaidAds in-memory list did not refresh on focus; `/advertising` publish did not refresh public context; silent RLS failures in owner cabinet.

**Fix:** focus/visibility refresh; refresh after publish; row-count checks on owner mutations.

**Verified (production):**

- Upload → 200, public URL → 200 (`image/png`).
- Publish active campaign → appears immediately on homepage (desktop/mobile/incognito).
- Deactivate (`status=rejected`) → disappears immediately on hard refresh / new contexts.
- Reactivate → appears again.
- Investor demo campaign: `51a10ee0-4ce0-4009-a9e5-d2b7ac458abc`  
  title `DImarket Investor Demo Banner`  
  placements: `home_center`, `home_mob_inline_1`

## Matrix

| Check | Result |
|---|---|
| WIDE BANNER (`home_mob_inline_1`) | **PASS** |
| CENTER BANNER (`home_center`) | **PASS** |
| UPLOAD | **PASS** |
| PUBLISH | **PASS** |
| DELETE | **PASS** |
| CACHE INVALIDATION | **PASS** |
| RLS | **PASS** |
| MOBILE | **PASS** |
| DESKTOP | **PASS** |
| INCOGNITO | **PASS** |

## FINAL

**ADVERTISING READY FOR INVESTOR DEMO: YES**

Mandatory ops follow-up before / during demo prep:

1. Run in Supabase SQL Editor: `supabase/migrations/APPLY_DEACTIVATE_STALE_REJECTED_ADS.sql`  
   (or `node scripts/apply-deactivate-stale-ads.mjs` with `SUPABASE_SERVICE_ROLE_KEY`)
2. Optionally also apply `APPLY_AD_CAMPAIGNS_OWNER_RLS.sql` so owner email matches DB `is_site_owner`.

Without step 1, cancelled stale row can still appear in raw REST as `active`, but the deployed app will not render it.
