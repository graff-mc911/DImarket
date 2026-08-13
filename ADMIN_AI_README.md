# Admin AI Assistant — DImarket

Floating AI panel on **`/dashboard`** for site owners only.

## Features

- Text + voice chat (Web Speech API)
- Rating / verification / featured profile management
- Ad campaigns & listings via natural language
- Email & in-app notifications (via Edge Functions)
- System health monitoring (every 5 min)
- Web search (Tavily) + self-learning knowledge base
- Audit log in `admin_ai_logs`

## Quick commands

| Command | Action |
|---------|--------|
| `/stats` | Platform statistics |
| `/health` | System health check |
| `/boost email N` | Boost rating |
| `/verify email` | Verify professional |
| `/ban email` | Ban user (requires `ПІДТВЕРДЖУЮ`) |
| `/email email message` | Send email |
| `/search query` | Web search |
| `/learn` | Show knowledge base |
| `/alert test` | Test admin alert |
| `/help` | Command list |

Natural language (Ukrainian) examples:

- `підніми рейтинг фахівця ivan@test.com на 10 балів`
- `покажи топ 5 фахівців`
- `створи рекламну кампанію для Hilti на 30 днів`
- `відправ email користувачу ivan@test.com: Ваш профіль верифіковано`

Destructive actions require typing **`ПІДТВЕРДЖУЮ`**.

## Deploy

1. Apply migration:
   ```bash
   npm run db:apply-admin-ai
   ```

2. Set Supabase secrets (Dashboard → Edge Functions → Secrets):
   - `ANTHROPIC_API_KEY` — Claude for chat
   - `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — emails
   - `TAVILY_API_KEY` — web search (optional)
   - `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` — alerts
   - `ADMIN_EMAIL` — default alert recipient

3. Deploy functions:
   ```bash
   npm run deploy:admin-ai
   ```

4. Deploy frontend (Vercel / push to GitHub).

## Security

- **Never** put `ANTHROPIC_API_KEY` in `VITE_*` — keys stay on the server.
- All actions logged to `admin_ai_logs`.
- Rate limit: 100 requests/hour per admin.
- Only `is_site_owner` or `user_role = owner` can invoke functions.

## Files

- `src/components/AdminAI/` — UI panel
- `src/hooks/useAdminAI.ts` — state
- `src/lib/adminAI/` — client API + monitor
- `supabase/functions/admin-ai-assistant/` — backend
- `supabase/functions/send-notification/` — notifications
- `supabase/migrations/20260701120000_admin_ai_assistant.sql`
