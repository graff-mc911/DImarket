# Supabase — DImarket

## Що включено

| Файл / папка | Призначення |
|--------------|-------------|
| `config.toml` | Локальна конфігурація Supabase CLI |
| `migrations/` | SQL-схема (оголошення, реклама, платежі, гео, storage) |
| `functions/create-checkout-session` | Stripe Checkout |
| `functions/verify-checkout-session` | Перевірка оплати після redirect |
| `functions/delete-account` | Видалення акаунта |

## Швидкий старт

### 1. Встановіть CLI

```bash
npm install -g supabase
```

### 2. Увійдіть і прив’яжіть проєкт

```bash
supabase login
supabase link --project-ref wjlfvajloxkevggwjgtk
```

### 3. Застосуйте міграції

```bash
supabase db push
```

Або локально:

```bash
supabase start
supabase db reset   # увага: скидає локальну БД
```

### 4. Секрети Stripe (обов’язково для оплати)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### 5. Задеплойте Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy verify-checkout-session
supabase functions deploy delete-account
```

### 6. Фронтенд `.env`

Скопіюйте з кореня проєкту:

```bash
cp .env.example .env.local
```

Заповніть `VITE_SUPABASE_URL` та `VITE_SUPABASE_ANON_KEY` з Dashboard → Settings → API.

## Нова міграція `20260519130000_dimarket_complete_backend.sql`

- **ad_campaigns** — `placements`, `countries`, `regions`, `cities`, `media_*`, `pending_payment`
- **profiles** — `is_premium`, `premium_expires_at`, `is_verified`, `user_role`, …
- **listings** — `is_promoted`, `promoted_expires_at`
- **payments** — журнал транзакцій
- **announcements** — банери в шапці
- **saved_items** — обране
- **geo_catalog** + view **active_geo** — геотаргетинг реклами
- **storage** bucket `ad-media` — завантаження банерів

## Stripe Checkout (потік)

1. Фронтенд викликає `create-checkout-session` з сумою в **центах** (`eurosToCents`).
2. Користувач платить на сторінці Stripe.
3. Redirect на `/checkout?session_id=...`
4. `Checkout.tsx` викликає `verify-checkout-session` і активує послугу в БД.

## Перевірка після деплою

```sql
SELECT * FROM active_geo LIMIT 5;
SELECT id, status FROM ad_campaigns ORDER BY created_at DESC LIMIT 5;
```

У Storage має з’явитися bucket **ad-media**.

## Власник сайту

У таблиці `profiles` встановіть `is_site_owner = true` для email власника (див. `Header.tsx` → Dashboard).
