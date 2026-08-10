# Phase A — Stabilization (payments deferred)

Goal: product works for audience growth without project payment flows.

## Flags

`src/lib/featureFlags.ts`

- `PROJECT_PAYMENTS_ENABLED = false` (default)
  - Hire → Project Manager (no Stripe hold)
  - Connect payout UI hidden (Settings / ProDashboard)
  - Complete project does not require / call escrow release

Flip to `true` only when Connect edge + SQL migration are live.

## Perf & monitoring

- Route-level `React.lazy` in `src/App.tsx` (Home eager; other pages split)
- **Lazy locale packs** via `ensureLanguageLoaded` in `src/lib/locales/index.ts` — only English (+ active language) load at boot; other languages are separate chunks (~100–130 KB each)
- Vite `manualChunks`: `react-vendor`, `supabase`, `motion`, `i18n`, `icons`, `sentry`, `vendor`
- Optional Sentry: set `VITE_SENTRY_DSN` in Vercel → `src/lib/monitoring.ts` loads `@sentry/react` only then; ErrorBoundary reports via `captureException`

Target: initial `index-*.js` ≈ 0.6 MB (was ~3.4–5 MB monolithic) before gzip.

## CI

`.github/workflows/ci-smoke.yml`

- `build` — `npm run build:app` + registration role logic
- `e2e-prod-smoke` — Playwright `e2e/smoke.spec.ts` (chromium) against `https://dimarket.app`

## Next (still Phase A)

- Runtime bug backlog (typecheck debt)
- DB indexes for listings/search
- Further chunk tuning after measuring Lighthouse on prod
