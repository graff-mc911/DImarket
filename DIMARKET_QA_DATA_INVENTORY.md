# DIMARKET_QA_DATA_INVENTORY

**Date:** 2026-08-15  
**Source:** live anon REST `profiles` on `wjlfvajloxkevggwjgtk`  
**Rule:** DO NOT DELETE YET via this audit. Recommended actions only.

---

## Summary

| Metric | Value |
|--------|-------|
| QA/test-like profiles found | **33** |
| Public-listable (`is_professional=true`) | **14** |
| Private clients / leftover | 19 |
| Appear in raw Top Masters query (newest) | **YES — multiple QA Smoke / QA Chat / QA Master** |
| Appear in raw Top Companies query | **YES — QA Mfg Brand, QA Company GmbH** |
| Owner moderation columns on prod | **MISSING** (`deleted_at`/`hidden_at` absent) |
| Client-side QA gate on homepage (deployed bundle) | **PRESENT** (`filterPublicProfiles` in prod JS) |
| Server-side exclusion | **ABSENT** |

### Root cause (why QA was public)

1. Real rows in `profiles` with `is_professional=true` and names matching QA smoke tests.  
2. Homepage / catalog historically ordered by `created_at` / rating with **no DB filter**.  
3. Soft-hide columns never applied → Owner cannot permanently hide in DB.  
4. Gaps existed in Search / Map CA / Category / SEO / Estimator / AI match (fixed in code this audit; requires deploy).  
5. Bare name **`Test`** was not matched by old QA regex (fixed in code).

---

## Public-visible candidates (`is_professional=true`)

| name | role | profile_id | created_at | public_visible (DB) | owner_visible (intended) | source | recommended action |
|------|------|------------|------------|---------------------|--------------------------|--------|--------------------|
| QA Smoke professional | professional | ba2ccd8c-f0e0-4564-92b9-a1ebfc84553b | 2026-08-13 | YES | YES after Owner panel | smoke E2E | Hide: set `is_professional=false` or apply moderation SQL then soft-delete |
| QA Smoke professional | professional | cefa4240-5a86-4363-ba92-1b6ab6b628d9 | 2026-08-13 | YES | YES | smoke | same |
| QA Chat Pro | professional | c37e7a19-7c64-438c-8767-06b1f2fd7ec6 | 2026-08-13 | YES | YES | chat E2E | same |
| QA Smoke professional | professional | 81ab4668-3550-4a76-8c81-9accaffef808 | 2026-08-13 | YES | YES | smoke | same |
| QA Smoke professional | professional | bab59f93-e4bf-458f-9f12-a29ee3f34792 | 2026-08-13 | YES | YES | smoke | same |
| QA Smoke professional | professional | 0a501098-f48b-4adc-beeb-92ba29e2d555 | 2026-08-13 | YES | YES | smoke | same |
| QA Master Elektro | professional | 5a55418f-3c3a-445b-a483-929736adf35c | 2026-08-13 | YES | YES | flow test | same |
| Test | professional | abfbea08-d8e8-4eae-a194-0864dcb821d2 | 2026-05-25 | YES | YES | old seed/test | same |
| QA Mfg Brand | company | 0fbcac0f-06d7-448a-a1ee-7f51e1bde092 | 2026-08-13 | YES | YES | CA/mfr | same + unpublish mfr if linked |
| QA Company GmbH | company | e8d3e708-202c-4cb5-9621-82fbbb068c63 | 2026-08-13 | YES | YES | company flow | same |
| QA PV Agent | commercial_agent | afdcea05-f513-4081-b8cf-0e33831ff9d7 | 2026-08-13 | YES | YES | CA PV | same + unpublish agent row |
| QA PV Manufacturer | manufacturer | 44496220-3970-45c2-9bd3-5b67ced7d858 | 2026-08-13 | YES | YES | CA PV | same |
| QA Final Mfr2 | manufacturer | 002de6d8-3819-438f-a273-5c5e7bfafc19 | 2026-08-13 | YES | YES | CA | same |
| QA Final Manufacturer | manufacturer | 6b61c788-a357-44ec-8263-94ba139f6638 | 2026-08-13 | YES | YES | CA | same |

Emails: not readable via anon REST (not selected / RLS). Related records: likely auth users with same UUID; CA tables may link via `profile_id`.

---

## Non-public QA leftovers (`is_professional=false`)

Keep in DB for now unless Owner wants cleanup of auth orphans.

| name | role | profile_id | created_at | recommended action |
|------|------|------------|------------|--------------------|
| QA Self Delete | client | 34c94522-… | 2026-08-13 | keep / later delete auth |
| QA Admin Delete Agent | client | 47fa59af-… | 2026-08-13 | keep |
| Investor Demo Ads | client | eaa5df40-… | 2026-08-13 | keep |
| Investor Ad Test | client | 8af193da-… / 0b5cde21-… | 2026-08-13 | keep |
| QA Smoke client | client | (multiple) | 2026-08-13 | keep |
| QA Chat Client | client | 19b9a110-… | 2026-08-13 | keep |
| QA E2E Manufacturer | client | f1884b37-… | 2026-08-13 | keep |
| QA Mfr Role / Role2 | client | acb9f6f5-… / 6e1e9d96-… | 2026-08-13 | keep |
| QA Advertiser Co | client | be6f928d-… | 2026-08-13 | keep |
| qa-stranger-1786634265 | client | e395892f-… | 2026-08-13 | keep |
| QA Client Darmstadt | client | 5ac53ab1-… | 2026-08-13 | keep |
| qa-audit-should-fail-invalid | client | 2e52f652-… | 2026-08-13 | keep |
| Audit Fix User | client | 9d8eaabe-… | 2026-08-05 | keep |

---

## Safe DB action (human)

Preview + optional update script:

`supabase/migrations/APPLY_HIDE_QA_PUBLIC_PROFILES.sql`

Also apply for full Owner hide/delete:

`supabase/migrations/APPLY_OWNER_PROFILE_MODERATION.sql`

---

## Client mitigation (this PR)

- Strengthened `isLikelyQaOrTestProfile` (includes bare `Test`, Investor Ad/Demo).  
- Applied `filterPublicProfiles` / name gate to Search, Categories, SEO, Map CA, Estimator, AI match, ProfessionalDetail, CA directory.  
- Does **not** remove DB rows. After deploy, public UI should stop showing QA cards even before SQL hide.
