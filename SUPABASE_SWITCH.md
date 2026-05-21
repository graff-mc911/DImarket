# Перехід Supabase: qwvbbvipqmmrpmyysczh → wjlfvajloxkevggwjgtk

Старий ref **не зашитий у код** — лише в змінних середовища (Vercel / `.env.local`).
Після зміни env потрібен **новий build** (інакше в JS лишиться старий URL).

## 1. Vercel (обов’язково)

**Project → Settings → Environment Variables → Production:**

| Змінна | Нове значення |
|--------|----------------|
| `VITE_SUPABASE_URL` | `https://wjlfvajloxkevggwjgtk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon key з **нового** проєкту (Dashboard → API) |

Видаліть або оновіть старі значення з `qwvbbvipqmmrpmyysczh`.

Потім:

1. **Deployments** → Production → **Redeploy**
2. Вимкніть **Use existing Build Cache**
3. За потреби **Purge CDN Cache**

## 2. Локально

```bash
cp .env.example .env.local
# Вставте anon key з Dashboard проєкту wjlfvajloxkevggwjgtk
npm run dev
```

## 3. Supabase Dashboard (новий проєкт)

1. **Authentication → URL Configuration**  
   Site URL: `https://www.dimarket.market`  
   Redirect URLs: `https://dimarket.market/**`, `https://www.dimarket.market/**`, `http://localhost:5173/**`

2. **SQL Editor** — виконайте міграції з `supabase/migrations/` (якщо БД порожня), зокрема `20260519130000_dimarket_complete_backend.sql`.

3. **Edge Functions** — deploy `create-checkout-session`, `verify-checkout-session`, `delete-account`.

4. **Secrets:** `STRIPE_SECRET_KEY` (якщо потрібна оплата).

5. **Storage** — bucket `ad-media` (з міграції або вручну).

## 4. CLI (опційно)

```bash
supabase login
supabase link --project-ref wjlfvajloxkevggwjgtk
supabase db push
```

## 5. Перевірка після deploy

1. View Source на сайті → новий `/assets/index-XXXXX.js`
2. У цьому файлі **Ctrl+F:** має бути `wjlfvajloxkevggwjgtk`, **не** `qwvbbvipqmmrpmyysczh`
3. Network → запити на `wjlfvajloxkevggwjgtk.supabase.co`

## Дані зі старого проєкту

Новий проєкт **порожній**, поки не перенесете таблиці/користувачів. Потрібен export/import або повторне застосування SQL + seed.
