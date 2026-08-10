# Phase A — Stabilization (payments deferred)

Goal: product works for audience growth without project payment flows.

## Flags

`src/lib/featureFlags.ts`

- `PROJECT_PAYMENTS_ENABLED = false` (default)
  - Hire → Project Manager (no Stripe hold)
  - Connect payout UI hidden (Settings / ProDashboard)
  - Complete project does not require / call escrow release

Flip to `true` only when Connect edge + SQL migration are live.

## CI

`.github/workflows/ci-smoke.yml` — `npm run build:app` + registration role logic on every push/PR to `main`.

## Next (still Phase A)

- Runtime bug backlog (typecheck debt)
- Optional Sentry (`VITE_SENTRY_DSN`)
- Perf: code-split large bundle, DB indexes for listings/search
- E2E smoke against preview URL
