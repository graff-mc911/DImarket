# Auth Header + Account White Screen — Fix Report

**Date:** 2026-08-05  
**Branch:** `cursor/fix-auth-header-account-81bd`  
**Verified against:** local Vite preview with live Supabase session

---

## Bug 1 — Header still shows “Sign In” after login

### Root cause (two compounding bugs)

1. **Mobile Account chip always rendered `t('header.signIn')`**, even when `user` was present:

```tsx
// Header.tsx (mobile) — BEFORE
<span className="amazon-header-block__top text-[10px]">{t('header.signIn')}</span>
```

2. **Desktop greeting required `profile.full_name`**. If the session existed but profile sync was slow/failed, greeting fell back to “Sign In”, and Account click required `user && profile` (otherwise redirected to `/login`).

3. **`onAuthStateChange` called Supabase queries inline**. Supabase documents that async client work inside the auth callback can **deadlock** the auth lock, so `syncProfile()` may never complete → `profile` stays `null`.

### Why it happened

Header treated “logged in UI” as `user && profile?.full_name` instead of “has session”. Mobile never used the greeting variable at all. Profile sync could stall inside the auth callback.

### Fix

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Derive `accountDisplayName` from profile → metadata → email local-part; mobile chip shows name when logged in; Account menu opens on `user` alone |
| `src/contexts/AppContext.tsx` | Defer `syncProfile` with `setTimeout(0)`; await bootstrap `getSession`; add `authReady` + `refreshProfile`; fallback mini-profile if DB row missing |

### Verification

Live login (`Audit Fix User`):

- After login (mobile): header **`Audit` / `Account`** (not Sign In)
- After refresh on `/profile`: still **`Audit`**
- After navigate to `/listings`: still **`Audit`**
- After logout: **`Sign in` / `Account`**
- Re-login: **`Audit`** again

---

## Bug 2 — Account opens a blank white screen

### Root cause (confirmed runtime error)

`Profile` always mounts `PortfolioManager` on the default Portfolio tab.

`PortfolioManager` called `t(...)` in render **without importing `useApp` / defining `t`**:

```tsx
{t(c.labelKey as never)}  // ReferenceError: t is not defined
```

That React render error tore down the page tree. With **no Error Boundary**, users saw a white screen.

### Why it happened

Incomplete i18n wiring when portfolio filters were added; TypeScript did not catch it because `t` was used as an unbound free identifier and `tsc` in this repo already has many unrelated errors / loose settings for that path.

### Fix

| File | Change |
|------|--------|
| `src/components/portfolio/PortfolioManager.tsx` | `const { t } = useApp()` |

### Verification

Opening `/profile` after login shows full profile UI (name, Portfolio category chips, Add project) — **no pageerror**, main content length ≫ 0.

---

## Bug 3 — Add Error Boundaries

### Fix

| File | Change |
|------|--------|
| `src/components/ErrorBoundary.tsx` | New friendly fallback (Try again / Go home) |
| `src/App.tsx` | Boundaries around Header, Page, Footer |
| `src/main.tsx` | Root boundary around `<App />` |

Users now get a recoverable error page instead of a blank screen if a child throws.

---

## Files modified

- `src/contexts/AppContext.tsx`
- `src/components/Header.tsx`
- `src/components/portfolio/PortfolioManager.tsx`
- `src/components/ErrorBoundary.tsx` *(new)*
- `src/App.tsx`
- `src/main.tsx`
- `e2e/auth-header-profile.spec.ts` *(regression harness)*
- `docs/auth-fix-report.md` *(this file)*

---

## Auth verification checklist

| Step | Result |
|------|--------|
| Login | Header shows first name |
| Open Account → `/profile` | Profile renders (no white screen) |
| Refresh | Session + header name persist |
| Navigate `/listings` | Header still correct |
| Logout | Header returns to Sign in |
| Login again | Header name restored |

---

## Notes

- Do not finish with “works” only — evidence above from Playwright against preview + live Supabase token `200`.
- `.env.local` stub `VITE_SUPABASE_ANON_KEY=...` is dangerous for local *dev* if Vite injects it; production bundle uses the real anon JWT. Prefer a real anon key in `.env.local` for future local debugging.
