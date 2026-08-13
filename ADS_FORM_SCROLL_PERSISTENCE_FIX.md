# Advertising form / scroll persistence fix

## WHAT WAS THE ROOT CAUSE

The UI with **«Реклама на блоках і банерах» / «Усього» / «Нова реклама»** is `OwnerAdManager` on `/dashboard` (not a modal on `/advertising`).

1. **`formOpen` lived only in React state.** Closing the tab or remounting the tree reset it to `false`.
2. **Dashboard remounted on every auth `user` object change** (`useEffect(..., [user])`). Supabase `TOKEN_REFRESHED` (common when returning to a tab) called `setUser(session.user)` → `loadOwnerDashboard()` → **`setLoading(true)`** → full-page spinner → **`OwnerAdManager` unmounted** → form discarded.
3. **Footer scroll jump:** after the spinner, the long owner page remounted while the browser kept a large `scrollY`, so the viewport landed near the footer. This was not fixed by `window.scrollTo(0,0)` hacks — the remount was the root cause.

Self-serve `/advertising` already had field drafts in `localStorage`, but lacked an explicit **composer-active** URL/flag, so focus/scroll after return was unreliable.

## WHAT WAS FIXED

| Area | Fix |
|------|-----|
| Dashboard | Reload only when `user?.id` changes; soft refresh when profile already loaded (no spinner remount) |
| OwnerAdManager | Persist `formOpen` + fields in **sessionStorage**; sync **`?ads=create\|edit&adId=`**; restore + scroll `#owner-ad-form`; Continue / Discard unsaved banner |
| `/advertising` | `composerActive` + **`?compose=1`**; restore scroll to `#ad-form`; draft includes composer flag |
| Helpers | `src/lib/ownerAdFormDraft.ts`; extended `adCampaignDraft.ts` |

No DB schema changes. Create/edit/delete/publish/targeting paths unchanged.

## HOW STATE IS NOW PRESERVED

- **Open/closed:** URL query (`ads` / `compose`) + sessionStorage (`formOpen` / `composerActive`)
- **Tab return without remount:** React state kept; Dashboard no longer remounts on token refresh
- **Remount / short reload:** sessionStorage + URL restore open form and fields
- **Manual close:** clears draft + removes query → Scenario C (stays closed)

## HOW SCROLL RESTORATION WORKS

- Root fix: **stop remounting** the owner page on token refresh
- When composer is restored open: scroll **`#owner-ad-form` / `#ad-form`** into view (`scroll-mt-24`), not `window.scrollTo(0,0)` alone
- Feedback-driven scroll on `/advertising` only while `composerActive`

## HOW DRAFT DATA IS PRESERVED

- Owner: sessionStorage `dimarket_owner_ad_form_draft_v1` (title, geo, slots, media **URLs**, etc. — no files/tokens/secrets)
- Self-serve: existing `dimarket_ad_campaign_draft_v1` + `composerActive`
- Unsaved banner: **Продовжити редагування** / **Відхилити чернетку**

## MOBILE RESULT

**PARTIAL** — logic is viewport-safe (`scroll-mt-24`, no modal portal). Real iPhone/Android tab-switch / keyboard QA not run in this agent environment.

## TEST RESULT

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** (0) |
| `npm run build` | **PASS** |
| `npm run test:ad-persist` | **PASS** |
| sessionStorage draft roundtrip | **PASS** |
| Live browser tab-switch on owner dashboard | **PARTIAL** (logic verified; no device browser session) |

### Scenario matrix (logic)

| Scenario | Status |
|----------|--------|
| A Open form → other tab → return | **PASS** (no remount + persist) |
| B Open form → other route → Back | **PASS** (URL `?ads=` / `?compose=` + draft) |
| C Close form → leave → return | **PASS** (draft cleared) |

## Overall status

# PASS (with PARTIAL mobile/browser device confirmation)
