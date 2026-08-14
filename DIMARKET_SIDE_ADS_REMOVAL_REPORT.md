# DIMARKET_SIDE_ADS_REMOVAL_REPORT

**Date:** 2026-08-13  
**Branch:** `cursor/remove-side-banners-81bd`  
**Goal:** Fully remove side / left / right banner advertising from DImarket. Keep `home_center` + mobile inline placements.

## Verdict

**DONE (code + UI + live verification).**  
Side rails, side slot purchase, side matching, and `SideAdRails` rendering are removed. Central (`home_center`) and mobile inline ads remain.

Old DB rows that still mention `sidebar` / `home_side_*` were **not** auto-deleted (per request). Anon RLS shows **0** such rows among publicly visible campaigns; full historical list requires service-role SQL (provided below).

---

## Removed from code

| Area | Change |
|------|--------|
| Components | Deleted `SideAdRails.tsx`, `AdBanner.tsx` |
| Layout | `PageWithSideAds` is gutter-only; `pathUsesSideAdRails()` always `false` |
| Matching | `getCampaignPlacements()` strips `home_side_*`, `sidebar`, `side_left`, `side_right` |
| Catalog | `AD_PLACEMENT_CATALOG` has no side zones; `SlotZone` = `center` \| `mob_leaderboard` \| `mob_inline` |
| Fallbacks | Side stack pickers / side legacy expansion removed; `sidebar` no longer expands into mobile |
| Layout tokens | Removed `AD_SIDE_*` rail/stack constants from `adSlotLayout.ts` |
| Media editor | `AD_BANNER_LAYOUT_KEYS` no longer offers `side` |
| CSS | Removed `.ad-side-rail*`, `.layout-with-side-ads*`, side stack grid styles |
| E2E helpers | No longer expect 3-column side-rail grid |
| Scripts | Advertising UI / advertiser flow assert **zero** side rails |

## Removed from UI

- Side left / right slot pickers (empty arrays; not sold)
- Side rail placeholders / “Ad Space” side columns
- Side layout option in banner media editor
- Admin / advertising site preview side legend

## Database architecture

- **No destructive migration applied.** Campaign rows untouched.
- Runtime behavior: side placement IDs never match display slots.
- Legacy column value `placement='sidebar'` remains allowed by types/CHECK for old rows, but is filtered out of public matching.
- SQL to list historical side campaigns (service role):

```sql
-- scripts/LIST_SIDE_BANNER_CAMPAIGNS.sql
```

### Anon-visible scan (2026-08-13)

| Query | Result |
|-------|--------|
| `status=active` | 1 campaign: `5d899979-…` “Lisanov Group Real Estate” — placements `home_center`, `home_mob_inline_1` only |
| `placement=eq.sidebar` | 0 rows |
| `placements=cs.{sidebar}` | 0 rows |
| `placements=cs.{home_side_l1}` | 0 rows |

**Old side campaigns found (anon):** none visible.  
Inactive/draft/pending side campaigns may still exist behind RLS — run `LIST_SIDE_BANNER_CAMPAIGNS.sql` as owner, then confirm before delete/inactive.

Suggested report columns after SQL:

| campaign_id | advertiser | placement | status |
|-------------|------------|-----------|--------|
| _(none visible to anon)_ | — | — | — |

---

## What remains (kept)

- `home_center` wide / central banner
- Mobile: `home_mob_inline_*`, listings/professionals/default mobile inlines from catalog
- Advertiser accounts, campaign CRUD, analytics, RLS, banner upload (`ad-media`), publish flow
- Owner / phase-A publish without Stripe

## New advertiser flow

OWNER / ADVERTISER → Create Campaign → Upload Banner → Select **CENTRAL** (`home_center`) or **MOBILE INLINE** (`home_mob_inline_*`) → Publish → Ad appears only in selected slot(s).

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| `npm run test` (slot matching + cancel gate) | PASS |
| Live prod HTML `ad-side-rail` / `layout-with-side-ads` | absent |
| Live E2E `scripts/e2e-home-center-live.mjs` | **PASS** |

### Live E2E (desktop + mobile + incognito)

1. Create campaign with `placements: ['home_center']` + upload to `ad-media`
2. Publish/active with `approved_by`
3. Verify visible on `/`
4. Delete campaign
5. Verify immediately invisible
6. Assert **0** `.ad-side-rail` on desktop, mobile, and incognito

---

## Follow-up (needs your confirmation)

1. Run `scripts/LIST_SIDE_BANNER_CAMPAIGNS.sql` in Supabase SQL Editor.
2. Confirm list → then deactivate or delete those rows only.
3. Optional later: tighten DB CHECK to drop `sidebar` from allowed `placement` values (non-urgent; code already ignores it).

## Deploy note

Ship this branch to production (merge to `main` / Vercel prod) so remaining dead side CSS/components are gone from the bundle as well as runtime behavior.
