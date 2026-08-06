# AI agents — environment checklist (DImarket)

**Never put these in `VITE_*`.** Set as Supabase Edge secrets (and optionally `.env.local` for `npm run secrets:ai`).

Last audit: 2026-08-06 (post billing + confidence/warning fixes).

---

## Quick status

| Agent | Route / trigger | Needs LLM key? | Works without key? |
|-------|-----------------|----------------|--------------------|
| Job chat | `/assistant/job` | Optional `OPENAI_API_KEY` (polishes reply) | **Yes** — local `salesBotEngine` |
| AI Assistant tools | `/assistant` | `OPENAI_API_KEY` for rich replies | **Yes** — offline fallback |
| Cost Estimator | `/cost-estimator` | Optional for LLM blend | **Yes** — local engine |
| Analyst Q&A | estimator step | No | **Yes** — heuristics |
| Matcher / Dispatcher | after publish | No | **Yes** — scoring + notify (**not LLM**) |
| Project Manager / Procurement | project + estimator | No | **Yes** — ops / search |
| Telegram bot | webhook | `TELEGRAM_BOT_TOKEN` | **No** (503 without token) |
| Admin AI | `/admin/ai` | `ANTHROPIC_API_KEY` for NL chat | Shortcuts only; needs `admin_ai_*` tables |
| Marketing agent | `/admin/marketing-agent` | Anthropic or OpenAI | Template copy only |
| `ai-job-lead` edge | none (UI unused) | OpenAI | Deployed only — job chat does not call it |
| `marketplace-matching` edge | none (UI unused) | No | Deployed only — client matcher is SSOT |

---

## Secrets to set (production)

### Core LLM (recommended)

```bash
supabase secrets set OPENAI_API_KEY=sk-... --project-ref wjlfvajloxkevggwjgtk
supabase secrets set OPENAI_MODEL=gpt-4o-mini --project-ref wjlfvajloxkevggwjgtk
```

Used by: `sales-chat`, `ai-assistant`, `ai-router` (translation / quote blend), marketing fallback.

Or from repo:

```bash
# put OPENAI_* in .env.local (gitignored)
npm run secrets:ai
```

### Admin + Marketing (Claude)

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref wjlfvajloxkevggwjgtk
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-20250514 --project-ref wjlfvajloxkevggwjgtk
```

### Telegram bot

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=... --project-ref wjlfvajloxkevggwjgtk
# optional webhook verification
supabase secrets set TELEGRAM_WEBHOOK_SECRET=... --project-ref wjlfvajloxkevggwjgtk
```

### Marketing publish channels (optional)

```bash
supabase secrets set TELEGRAM_CHANNEL_ID=... --project-ref wjlfvajloxkevggwjgtk
supabase secrets set FACEBOOK_PAGE_ID=... --project-ref wjlfvajloxkevggwjgtk
supabase secrets set FACEBOOK_ACCESS_TOKEN=... --project-ref wjlfvajloxkevggwjgtk
```

### Admin extras (optional)

```bash
supabase secrets set TAVILY_API_KEY=... --project-ref wjlfvajloxkevggwjgtk
supabase secrets set RESEND_API_KEY=... --project-ref wjlfvajloxkevggwjgtk
supabase secrets set RESEND_FROM_EMAIL='DImarket <noreply@dimarket.app>' --project-ref wjlfvajloxkevggwjgtk
supabase secrets set TELEGRAM_ADMIN_CHAT_ID=... --project-ref wjlfvajloxkevggwjgtk
```

---

## Deploy edge functions after secrets

```bash
npx supabase functions deploy sales-chat --project-ref wjlfvajloxkevggwjgtk
npx supabase functions deploy ai-assistant --project-ref wjlfvajloxkevggwjgtk
npx supabase functions deploy ai-router --project-ref wjlfvajloxkevggwjgtk
npx supabase functions deploy admin-ai-assistant --project-ref wjlfvajloxkevggwjgtk
npx supabase functions deploy marketing-agent --project-ref wjlfvajloxkevggwjgtk
npx supabase functions deploy telegram-bot --project-ref wjlfvajloxkevggwjgtk
```

Also apply admin AI migration if tables missing:

```bash
# supabase/migrations/20260701120000_admin_ai_assistant.sql → admin_ai_logs, ai_knowledge_base
```

---

## How Job chat LLM works (fixed 2026-08-06)

1. Browser always runs `salesBotEngine` → correct **step + draft** (publish-safe).
2. Then calls `sales-chat` edge with that next step / draft.
3. If `OPENAI_API_KEY` is set → edge returns **`replyText`** polish; UI shows it (still keeps `replyKey` for language remap fallback).
4. If no key / edge error → UI shows local i18n template. Flow still completes.

Previously the client **required `replyKey`** and ignored `replyText`, so LLM replies were discarded.

---

## Smoke checks

| Check | How |
|-------|-----|
| Job chat without OpenAI | Open `/assistant/job`, complete flow, publish |
| Job chat with OpenAI | Same; replies should sound freer / locale-aware |
| Assistant | `/assistant` → run a tool; with key = richer text |
| Estimator | `/cost-estimator` finishes without secrets |
| Admin AI | `/admin/ai` as owner; without Anthropic = limited shortcuts |
| Telegram | Message bot; without token function returns 503 |

---

## Related docs

- `docs/AI_BOTS.md` — platform overview  
- `docs/AI_PROJECT_PIPELINE.md` — estimator → match → dispatch  
- `docs/AI_OPS_CONSTRUCTION.md` — PM / procurement / learning  
- `docs/AI_COST_ESTIMATOR.md` — cost engine  
