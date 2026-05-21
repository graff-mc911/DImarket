# DImarket — деплой після зміни Supabase

## Поточний стан (перевірено)

| Що | Статус |
|----|--------|
| GitHub `main` | коміт з `vercel.json`, міграціями, fallback Supabase |
| Supabase `wjlfvajloxkevggwjgtk` | API 200: `categories`, `profiles`, `app_site_stats` |
| www.dimarket.market | **ще старий** `index-bcdSQWlw.js` з `qwvbbvipqmmrpmyysczh` |

Якщо у Vercel деплой **Ready** (наприклад `38a7367`), а сайт старий — домен ще вказує на попередній реліз або CDN тримає `index.html`.

## 1. Vercel (обов’язково)

1. [Vercel Dashboard](https://vercel.com) → проєкт DImarket → **Settings → Environment Variables** (Production):
   - `VITE_SUPABASE_URL` = `https://wjlfvajloxkevggwjgtk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = anon key з Supabase → Settings → API
2. Відкрийте деплой `38a7367` → **⋯ → Promote to Production** (якщо є), або **Redeploy** без build cache.
3. **Settings → Caches → Purge CDN Cache** (або Purge Everything).
4. Перевірка після оновлення:
   - `https://www.dimarket.market/build-id.txt` — має містити hash коміту (наприклад `38a7367`).
   - View Source головної — `<script ... index-XXXX.js">` **не** `index-bcdSQWlw.js`.
   - У `index-*.js` (файл ~1.5 MB): `wjlfvajloxkevggwjgtk`, **не** `qwvbbvipqmmrpmyysczh`.

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
