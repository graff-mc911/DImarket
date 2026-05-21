# DImarket — деплой після зміни Supabase

## Поточний стан (перевірено)

| Що | Статус |
|----|--------|
| GitHub `main` | коміт з `vercel.json`, міграціями, fallback Supabase |
| Supabase `wjlfvajloxkevggwjgtk` | API 200: `categories`, `profiles`, `app_site_stats` |
| www.dimarket.market | **ще старий** `index-bcdSQWlw.js` з `qwvbbvipqmmrpmyysczh` |

## 1. Vercel (обов’язково)

1. [Vercel Dashboard](https://vercel.com) → проєкт DImarket → **Settings → Environment Variables** (Production):
   - `VITE_SUPABASE_URL` = `https://wjlfvajloxkevggwjgtk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = anon key з Supabase → Settings → API
2. **Deployments** → останній деплой → **⋯ → Redeploy** → **uncheck** “Use existing Build Cache”.
3. Після Ready: відкрийте `https://www.dimarket.market/assets/index-*.js` (новий hash) → Ctrl+F: `wjlfvajloxkevggwjgtk`, **не** `qwvbbvipqmmrpmyysczh`.

## 2. Supabase SQL (якщо ще не робили)

Один файл: **`supabase/ALL_IN_ONE.sql`** — вставити в SQL Editor проєкту `wjlfvajloxkevggwjgtk` і виконати.

## 3. Supabase Auth

**Authentication → URL Configuration** — додати:

- `https://dimarket.market/**`
- `https://www.dimarket.market/**`
- `http://localhost:5173/**`

## 4. Edge Functions (Stripe)

```bash
supabase link --project-ref wjlfvajloxkevggwjgtk
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase functions deploy create-checkout-session
supabase functions deploy verify-checkout-session
```

## 5. Локально

```bash
npm install
npm run dev
```

Ключі в `.env.local` (див. `.env.example`).
