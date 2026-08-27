# AGENTS.md

## Cursor Cloud specific instructions

This repo is primarily a single **React 18 + Vite + TypeScript** SPA (the **DImarket** marketplace, also called "Buildster" in `README.md`). It talks to a **hosted Supabase** backend (project ref `wjlfvajloxkevggwjgtk`) — Postgres, Auth, Storage, and Deno Edge Functions. There is no separate local API server; the SPA calls hosted Supabase directly, so the frontend runs standalone without starting any backend.

Standard commands live in `package.json` scripts and `README.md`. Key ones:
- Dev server: `npm run dev` (Vite on `http://localhost:5173`).
- Lint: `npm run lint` · Typecheck: `npm run typecheck` · Build: `npm run build` (Vite build + SEO prerender via `scripts/seo-build.mjs`).
- E2E: `npm run test:e2e` (Playwright; run `npm run test:e2e:install` once to install the chromium browser). There is no unit-test runner (no Jest/Vitest).

Non-obvious caveats:
- **`.env.local` is committed and its values matter.** Vite loads `.env.local`, which overrides the hardcoded fallback anon key in `src/lib/supabase.ts`. If `VITE_SUPABASE_ANON_KEY` there is a placeholder (e.g. `...`), the app gets **401s from Supabase** — categories won't load and posting an ad fails with "Unable to publish". Keep `.env.local` set to the real public `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (the anon key is a public key, already present in `src/lib/supabase.ts`). Restart `npm run dev` after editing env files — Vite does not hot-reload env changes.
- **The app writes to the live/production Supabase project.** Actions like "post an ad without registration" (`/create-ad`) do a real `INSERT` into the `listings` table (free, anonymous, no Stripe). Be mindful that test data persists in production; clean up test rows if needed.
- `npm run lint` and `npm run typecheck` currently report **pre-existing errors** (unused vars, `prefer-const`, and Supabase generated-type mismatches, plus a parse error in a `supabase/functions/telegram-bot` file). These are not caused by env setup. The Vite **build succeeds** regardless (it does not typecheck).
- Optional backend features (Stripe checkout, AI assistant, marketing agent, Telegram, email) require **Supabase Edge Function secrets** set server-side — not `VITE_*` vars. They are not needed to run/browse the SPA or post an ad.
- `dimarket-agent/` is an **optional** BullMQ/Redis marketing worker with its own `package.json` (not installed by the root `npm install`). Not required for the main app.
- Routing in `App.tsx` is custom path-based (not React Router `<Routes>`).
