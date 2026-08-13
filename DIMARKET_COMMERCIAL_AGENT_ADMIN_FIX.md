# DIMARKET_COMMERCIAL_AGENT_ADMIN_FIX

Date: 2026-08-13  
Branch: `cursor/ca-admin-delete-fix-81bd`  
Live: https://dimarket.app

## ROOT CAUSE

**UI button missing** (primary).

`CommercialAgentsAdminPanel` (Dashboard → Commercial Agents verification queue) only rendered **View** and **Verify**. There was **no Reject** and **no Delete** control.

Secondary constraints discovered live:

| Check | Result |
|---|---|
| RLS owner DELETE policy | Already present (`profile_id = auth.uid()` OR `is_site_owner` / `user_role=owner`) |
| Anon DELETE | 200 + `[]` (0 rows) — correct |
| Agent DELETE another agent | 200 + `[]` — correct |
| Agent DELETE own profile | **PASS** — row removed from public API |
| `verification_status='rejected'` | **FAIL** until SQL — CHECK only allows `unverified\|pending\|verified` |
| RPC `owner_delete_commercial_entity` | Missing until SQL apply |

Not the cause: Edge Function absence for basic profile delete; foreign-key block on `agent_profiles` delete (applications/invitations CASCADE; ads `ON DELETE SET NULL`).

## FIX

1. **UI** — Verification Queue tabs: Pending / Approved / Rejected. Per row: View, Verify, Reject, Delete + confirmation dialog (name, company, email).
2. **API** — `setVerificationStatus` supports `rejected` (unpublishes). Soft-reject fallback if CHECK not migrated yet (`is_published=false`).
3. **API** — `ownerDeleteCommercialEntity` calls RPC then optional edge `admin-delete-commercial-entity` for `auth.users`.
4. **SQL** — `APPLY_CA_OWNER_MODERATION.sql`: add `rejected` CHECK, sync owner flag, create `owner_delete_commercial_entity`.
5. **Edge** — `supabase/functions/admin-delete-commercial-entity` (owner-only auth user cleanup).

## DATABASE CHANGES

- `verification_status` CHECK → includes `rejected` (agent + manufacturer).
- Function `owner_delete_commercial_entity(kind, id, delete_auth)`.
- Owner profile sync for `ivan.sovban@gmail.com`.

**Must run in Supabase SQL Editor:** `supabase/migrations/APPLY_CA_OWNER_MODERATION.sql`

## RLS CHANGES

None weakened. Existing owner delete policies retained. RPC is `SECURITY DEFINER` but gated by `is_site_owner()` **or** owner email JWT claim.

## OWNER PERMISSION

Owner can VIEW / VERIFY / REJECT / DELETE any commercial agent or manufacturer profile from the queue, independent of who created it (after SQL + deploy).

## DELETE FLOW

1. Confirm dialog.
2. RPC (or RLS DELETE fallback): delete `agent_profiles` / `manufacturer_profiles`.
3. Linked `ad_campaigns` cleared / rejected.
4. Applications & invitations CASCADE.
5. Optional edge: `auth.admin.deleteUser(profile_id)` (never deletes site owner / self).

## QA CLEANUP (NOT auto-deleted)

Listed for owner confirmation (live anon read 2026-08-13):

| email | profile_id | agent_profile_id | created_at | reason |
|---|---|---|---|---|
| `qa-admin-delete-1786649448@dimarket-audit.test` | `47fa59af-501c-40c1-98fc-8227272ce488` | `f7263127-9a8f-4d03-a350-75d906ba580a` | 2026-08-13T19:30+ | Owner-delete E2E target (kept) |
| *(none public)* | `afdcea05-f513-4081-b8cf-0e33831ff9d7` | `02397d08-d3d1-4073-828b-5c5ca127601c` | 2026-08-13T16:05 | QA PV Agent |
| *(none public)* | `0fbcac0f-06d7-448a-a1ee-7f51e1bde092` | `9240f51a-20f3-4ef7-a865-22690629c845` | 2026-08-13T15:33 | QA Agent |

Related QA manufacturers (preserve unless confirmed): `qa-pv-mfr-*`, `qa-final-mfr2-*`, `qa-mfg-brand-*`.

**Preserved:** verified brand manufacturers (VELUX, Uponor, GREE, DEWALT, Festool, Philips, ROCKWOOL, Sika, Knauf, Saint-Gobain, …).

## SECURITY TEST

| Actor | Action | Result |
|---|---|---|
| OWNER/ADMIN | DELETE agent (RLS/RPC) | PASS when `is_site_owner` / owner email (SQL sync) |
| Agent | DELETE another agent | FAIL (0 rows) |
| Normal / anon | DELETE agent | FAIL (0 rows) |
| Agent | DELETE own | PASS (own RLS) |

## LIVE E2E TEST

| Step | Result |
|---|---|
| Register test agent | PASS (`f7263127-…`) |
| Appears public / queue pending | PASS |
| Soft reject (unpublish) → search empty | PASS |
| Re-publish for owner delete | PASS |
| Owner UI Delete on production | **PENDING** — requires deployed UI + owner login + SQL |
| Self-delete probe (`qa-self-del-*`) | PASS — disappears from API |

## WHAT WAS ACTUALLY DELETED

- Accidental during diagnosis: prior `qa-admin-delete-1786649377` via existing prod RPC `delete_my_account` while probing (not owner moderation).
- Intentional self-delete probe: `qa-self-del-*` agent profile only.

## WHAT WAS PRESERVED

- All verified commercial brand manufacturers.
- Remaining QA agent/mfr rows listed above (awaiting owner confirmation).
- Owner account, RLS, registration flows.

## WHAT REMAINS

1. Apply `APPLY_CA_OWNER_MODERATION.sql` in Supabase.
2. Deploy edge: `npm run deploy:ca-admin-delete` (needs valid `SUPABASE_ACCESS_TOKEN`).
3. Owner login → Dashboard → Verification Queue → Delete `QA Admin Delete Agent`.
4. Confirm which QA rows to remove after review.

## FINAL STATUS

**PARTIAL**

Frontend moderation UI + safe delete API are implemented and ready to deploy. Production DB still needs the SQL (rejected status + owner RPC). Full owner→delete→queue/map/search gone loop completes after SQL apply + owner click on the kept test agent.
