# Dimarket AI Bots Platform

**Env secrets checklist (what to enable):** [`docs/AI_ENV_CHECKLIST.md`](./AI_ENV_CHECKLIST.md)

## Environment variables (Supabase Edge secrets / Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Recommended | Translation, enhanced quotes, sales-chat reply polish |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Admin / marketing | Claude for `/admin/ai` and marketing agent |
| `GOOGLE_VISION_API_KEY` | Optional | OCR on PDF/images (client fallback: text parse) |
| `TELEGRAM_BOT_TOKEN` | For Telegram bot | Webhook bot (edge `telegram-bot`) |
| `WHATSAPP_ACCESS_TOKEN` | Optional | Future WhatsApp Cloud API |

Never put these keys in `VITE_*` frontend env vars.

### Set secrets on production

1. Add to `.env.local` (not committed):

```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

2. Run:

```bash
npm run secrets:ai
```

This runs `supabase secrets set` and redeploys `ai-router`.

## Database

Apply migrations:

```bash
supabase db push
# core: supabase/migrations/20260602120000_ai_platform.sql
# admin AI: supabase/migrations/20260701120000_admin_ai_assistant.sql
```

Tables: `ai_conversations`, `ai_messages`, `ai_bot_tasks`, `ai_leads`, `ai_matches`, `ai_translations`, `ai_fraud_reports`, `ai_quote_estimates`, `ai_ocr_documents`, `ai_profile_suggestions`, `ai_review_analysis`, `ai_voice_transcripts`, `ai_messaging_channels`, `ad_image_assets`, `ad_image_variants`, `admin_ai_logs`, `ai_knowledge_base`.

## Edge Functions

```bash
supabase functions deploy ai-router
supabase functions deploy sales-chat
supabase functions deploy ai-assistant
supabase functions deploy admin-ai-assistant
```

Also in repo but **not wired from the main UI**:

| Function | Status |
|----------|--------|
| `ai-job-lead` | Deployed; freeform extract API. Job chat uses `salesBotEngine` + `sales-chat` polish; client invoke removed. |
| `marketplace-matching` | Deployed; production matching is client `aiMatchService` (scoring heuristics, no LLM). |

`ai-router` body:

```json
{
  "bot": "translation",
  "action": "translate",
  "payload": { "text": "...", "sourceLang": "uk", "targetLang": "en" }
}
```

## Frontend structure

```
src/lib/bots/          # Bot logic (client-safe)
src/lib/ai/            # Sales chat, conversations, config
src/components/ai/     # Widget, admin, voice
src/components/ads/    # Ad image adaptation UI
```

Routes:

- `/assistant/job` — Sales / lead chatbot
- `/admin/ai` — Owner moderation dashboard

## Bots

| ID | Client | Edge | Notes |
|----|--------|------|-------|
| sales | ✓ engine | ✓ polish | Job request dialog — local step machine; OpenAI polishes `replyText` when keyed |
| matching | ✓ rank | edge unused | Weighted score (distance, rating…) — **not LLM** |
| translation | ✓ + cache | ✓ OpenAI | Keeps original + translated |
| fraud | ✓ heuristics | ✓ persist | Regex + disposable domains — **not LLM** |
| quote | ✓ ranges | ✓ optional AI | min/max EUR; confidence 0–100 |
| ocr | ✓ text parse | ✓ store | Vision TODO (`GOOGLE_VISION_API_KEY`) |
| profile | ✓ analyze | — | quality score — heuristics |
| review | ✓ sentiment | — | moderation flag — heuristics |
| lead | ✓ qualify | — | lead_quality_score — heuristics |
| voice | ✓ Web Speech | — | transcript → chat |
| messaging | placeholders | status | Telegram token set; WhatsApp TODO |
| ad_image | ✓ canvas resize | — | 4 storage variants |

## Test checklist

- [ ] Migration applied, RLS allows own conversations
- [ ] `/assistant/job` completes → listing in `listings`
- [ ] Floating AI widget opens, matching returns ranked profiles
- [ ] Translation returns text when OpenAI missing (fallback = original)
- [ ] Same-lang translate does **not** show billing warning
- [ ] Fraud scan flags disposable email pattern
- [ ] Quote estimate shows min/max and confidence as integer % (not `0.85%`)
- [ ] Ad image panel generates 4 previews (logged-in advertiser)
- [ ] `/admin/ai` visible only to site owner; knowledge/corrections persist
- [ ] No API keys in browser network tab (only `ai-router` invoke)
