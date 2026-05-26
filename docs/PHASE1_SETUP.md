# Dimarket Phase 1 — Setup Guide

## Overview

Phase 1 adds:

1. AI job sessions (`ai_job_sessions`, `ai_job_messages`, `ai_generated_jobs`)
2. Realtime chat with UUID conversations + attachments
3. Contractor verification workflow
4. Reviews 2.0 (multi-axis + reports)
5. In-app notifications + web push scaffold
6. Contractor matching scores

## 1. Database

Apply migration (recommended — uses Management API + `.env.local` token):

```bash
npm run db:apply-phase1
```

Or full Phase 1 backend deploy (migration + edge functions):

```bash
npm run deploy:phase1
```

Requires in `.env.local`:

```
SUPABASE_ACCESS_TOKEN=sbp_...   # https://supabase.com/dashboard/account/tokens
```

Manual alternative: SQL Editor → paste `supabase/migrations/20260628120000_phase1_marketplace.sql`

## 2. Edge Functions

```bash
npm run deploy:phase1-functions
# or: npx supabase functions deploy ai-job-lead marketplace-matching --project-ref wjlfvajloxkevggwjgtk
```

Set secrets (Supabase Dashboard → Edge Functions → Secrets):

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | AI job intake + existing bots |
| `VAPID_PUBLIC_KEY` | Web push (optional) |
| `VAPID_PRIVATE_KEY` | Web push (optional) |

Frontend (Vercel):

| Variable | Purpose |
|----------|---------|
| `VITE_VAPID_PUBLIC_KEY` | Browser push subscription |

## 3. Storage buckets

Created by migration:

- `chat-media` (public read, authenticated upload under `messages/`)
- `verification-docs` (private, owner + site owner read)

## 4. Realtime

Migration adds `messages`, `conversations`, `notifications` to `supabase_realtime` publication.

## 5. Routes

| Path | Feature |
|------|---------|
| `/assistant/job` | AI job creation (persisted when logged in) |
| `/messages` | Realtime messenger |
| `/verification` | Contractor KYC upload |
| `/dashboard` | Admin verification queue (site owner) |

## 6. Testing checklist

- [ ] Run migration on staging/prod
- [ ] Publish job via `/assistant/job` → listing created + `match_scores` rows
- [ ] Open listing as author → suggested contractors visible
- [ ] Contact author from listing → UUID conversation + realtime message
- [ ] Upload image/PDF in chat
- [ ] Submit verification docs → pending → approve in dashboard → badge
- [ ] Submit Review 2.0 on professional profile
- [ ] Receive in-app notification on new message
- [ ] (Optional) Enable push with VAPID keys + `public/sw.js`

## 7. Phase 2+

Do not enable CRM, quotes, emergency jobs, or moderation dashboards until Phase 1 is verified in production.
