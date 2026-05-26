# DiMarket AI Marketing Agent

Autonomous multilingual marketing for [DiMarket](https://dimarket.app/).

## Architecture

| Layer | Location | Role |
|--------|----------|------|
| **Dashboard** | `https://dimarket.app/admin/marketing-agent` | Owner UI — start/stop, markets, platforms, preview, publish |
| **Edge API** | `supabase/functions/marketing-agent` | Content generation, config, cycles, registration webhook |
| **Worker** | `dimarket-agent/` (Docker) | Scheduled cycles via BullMQ + Redis |
| **Database** | `marketing_*` tables | Posts, campaigns, analytics, attribution |

## Quick start

### 1. Database

```bash
supabase db push
# or apply migration 20260629120000_marketing_agent.sql via Dashboard SQL
```

### 2. Edge function secrets

```bash
npx supabase secrets set \
  ANTHROPIC_API_KEY=... \
  OPENAI_API_KEY=... \
  TELEGRAM_BOT_TOKEN=... \
  TELEGRAM_CHANNEL_ID=... \
  --project-ref wjlfvajloxkevggwjgtk

npx supabase functions deploy marketing-agent --project-ref wjlfvajloxkevggwjgtk
```

### 3. Dashboard

Sign in as site owner → user menu → **AI Marketing Agent**.

### 4. Optional Docker worker

```bash
cd dimarket-agent
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REDIS_URL, API keys
docker compose up -d
```

Schedule daily runs with cron on the host or Railway:

```bash
0 9 * * * cd /path/dimarket-agent && npm run build && npm start
```

## API keys — where to get them

| Variable | Service | URL |
|----------|---------|-----|
| `ANTHROPIC_API_KEY` | Claude content | https://console.anthropic.com/ |
| `OPENAI_API_KEY` | GPT fallback + DALL·E | https://platform.openai.com/api-keys |
| `DEEPL_API_KEY` | Translation | https://www.deepl.com/pro-api |
| `FACEBOOK_ACCESS_TOKEN` | Meta Graph API | https://developers.facebook.com/ |
| `INSTAGRAM_ACCESS_TOKEN` | Meta (linked FB page) | Same as Facebook |
| `TIKTOK_ACCESS_TOKEN` | TikTok Marketing API | https://developers.tiktok.com/ |
| `TWITTER_*` | X API v2 | https://developer.x.com/ |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn Marketing | https://www.linkedin.com/developers/ |
| `TELEGRAM_BOT_TOKEN` | @BotFather | https://t.me/BotFather |
| `TELEGRAM_CHANNEL_ID` | Channel numeric ID | Telegram API |
| `GOOGLE_ADS_*` | Google Ads API | https://ads.google.com/home/tools/api-center/ |
| `SENDGRID_API_KEY` | Email | https://sendgrid.com/ |
| `MAILCHIMP_API_KEY` | Newsletters | https://mailchimp.com/developer/ |
| `REDIS_URL` | BullMQ queue | Redis Cloud / self-hosted |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker DB access | Supabase Dashboard → API |

## Project layout

```
dimarket-agent/
  src/core/          agent.ts, planner.ts, scheduler.ts
  src/content/       generator, translator, images, video scripts
  src/integrations/  telegram, facebook, twitter, linkedin, email, stubs
  src/analytics/     tracker, reporter
  Dockerfile
  docker-compose.yml
```

## Behavior

- Rotates **Client / Master / Company / Advertiser** messaging
- Generates unique copy per market (content hash deduplication)
- **Registration webhook** — welcome campaign in user language after sign-up
- Publishing: Telegram fully wired in edge; other platforms need tokens + extended OAuth in worker

## Integration with DiMarket

- `Register.tsx` calls `triggerRegistrationMarketing()` after profile creation
- Attribution stored in `marketing_registration_attribution`
- RLS: `is_ai_admin()` (site owner / owner role)
