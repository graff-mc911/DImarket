# DImarket — Повний огляд (зведений звіт)

Дата: 2026-08-23. Метод: typecheck + lint + build + скріншот живого сайту + 4 паралельних агенти (міграції, Edge-функції, фронтенд, безпека).

**Важливо:** GitHub підключений; Supabase та Vercel ще не підключені. Тому позначка **[треба перевірити в проді]** означає, що знахідку встановлено за кодом, але фінальну критичність підтвердимо лише після підключення Supabase (перевірка фактичних RLS-політик і привілеїв на живій БД).

Поточний стан: **збірка, typecheck і тести проходять**; додаток живий на dimarket.app. Але є серйозні вразливості в грошових потоках і безпеці, які треба закрити до повного запуску.

---

## 🔴 КРИТИЧНЕ (блокери запуску)

### 1. Підробка цін Stripe (C1)
`supabase/functions/create-checkout-session/index.ts:62-152` — `amount` береться з тіла запиту клієнта, лише з перевіркою `>= 50` (€0.50). Будь-який автентифікований користувач може викликати функцію напряму і купити `premium_profile`, `subscription`, `ad_campaign`, `lead_credits` за €0.50.
**Фікс:** шукати ціну серверно з довіреної таблиці планів; ігнорувати `body.amount` для каталожних продуктів (крім `project_escrow`, де сума прив'язана до прийнятої пропозиції).

### 2. Підробка ентайтлментів через metadata (C2)
`stripe-webhook/index.ts:178-256,401-500` + `create-checkout-session/index.ts:85-87` — `credits` і `duration_days` клієнт контролює; webhook читає їх з metadata і нараховує преміум/кредити без перевірки. Комбінується з #1: платиш €0.50 + `credits: 999999` / `duration_days: 36500`.
**Фікс:** вираховувати ентайтлменти серверно при створенні сесії; зберігати в `payments`/`pending_checkout_intents` за `session.id`; webhook читає звідти, а не з metadata.

### 3. Ескроу-самозахоплення (C4) [треба перевірити в проді]
`migrations/20260807200000_project_escrows.sql:64-82` — RLS UPDATE політика дозволяє клієнту оновлювати `status`, `released_at`, `payout_status`, `stripe_payment_intent_id` на власному рядку. Якщо таблиця експонована через PostgREST і `authenticated` має UPDATE-привілей, клієнт може позначити ескроу як `captured` без реальної Stripe-операції.
**Статус:** блокер, доки не підтверджено фактичні привілеї в проді.
**Фікс:** забрати клієнтську UPDATE-політику; лише `service_role` (Edge-функції) пише фінансові/статусні колонки. Додати `BEFORE UPDATE` тригер, що блокує захищені колонки поза `service_role`.

### 4. Storage-бакет `media` розсинхронізований з міграціями (C3) [треба перевірити в проді]
Комміт `25c0b6f` перейменував бакет `ad-media → media` лише у фронтенді. Жодної SQL-міграції, що створює `media`-бакет чи оновлює storage-RLS з `bucket_id = 'media'`, немає. Критичність залежить від фактичного стану: якщо в проді на `media` відсутні або пермісивні RLS — P0; інакше High (БД неповторювана з `supabase db reset`).
**Фікс:** додати міграцію, що створює `media`-бакет, мігрує політики з `ad-media` на `media`, дропає застарілі.

### 5. "Бог-ендпоінт" з raw SQL без авторизації
`apply-auth-profile-migration` виконує `sql.unsafe` (DDL/DML) проти прод-Postgres за статичним секретом `x-migration-secret`, без перевірки користувача. Витік/вгадування секрету = повна мутація схеми/даних.
**Фікс:** відключити цю функцію після одноразового застосування, або додати admin-JWT-перевірку + ротути `MIGRATION_SECRET`.

---

## 🟠 ВИСОКИЙ пріоритет

| # | Проблема | Локація | Фікс |
|---|---|---|---|
| H1 | "Будь-який Bearer-токен" = авторизація | `dispatch-web-push`, `match-notify-channels` | Замінити перевірку наявності заголовка на `supabase.auth.getUser()` або строгий service-role |
| H2 | AI-ендпоінти без авторизації | `ai-assistant`, `ai-router`, `ai-job-lead`, `sales-chat` | Якщо анонімний доступ є продуктовим (onboarding) — rate-limit per-IP/session + обмеження розміру + CAPTCHA; інакше вимагати JWT |
| H3 | `marketing-agent` `registration_webhook` без авторизації | `marketing-agent/index.ts` | Вимагати JWT для `userId` завжди (не лише `if (authHeader)`) — бо контент автопублікується в Telegram/блог |
| H4 | `TELEGRAM_WEBHOOK_SECRET` fail-open | `telegram-bot/index.ts:292-297` | Перевіряти секрет завжди; відмовляти, якщо не налаштовано (як у `stripe-webhook`) |
| H5 | Storage UPDATE/DELETE не обмежені власником | `20260519130000` (ad-media) | Скоупити до `auth.uid()` (як `portfolio-media`) |
| H6 | CORS `*` на всіх 28 Edge-функціях | `_shared/cors.ts:2` | Allowlist origin: dimarket.app, preview, localhost |
| H7 | CSP у Report-Only режимі + `unsafe-inline` | `vercel.json:34` | Перевести в enforcing; замінити `unsafe-inline` на nonce/hash |
| H8 | `ai_translations`/`ai_review_analysis`/`match_scores` INSERT `WITH CHECK (true)` | `20260602120000`, `20260628120000` | Писати лише через `service_role`; дропнути клієнтські INSERT-політики |

---

## 🟡 СЕРЕДНІЙ пріоритет

- **Silent fallback показує видалені/приховані профілі** (фронтенд): `Professionals.tsx`, `ServiceResults.tsx`, `homeMarketplace.ts` — при відсутності колонок `deleted_at`/`hidden_at` (міграція модерации не накладена) код падає у fallback, що повертає ВСІ профілі, включно з видаленими. Це data-leak, прикритий кастом `as any`.
- **Supabase-клієнт без presence guard**: `src/lib/supabase.ts` — за відсутності env-змінних фолбэк на хардкоджені прод-URL + anon-JWT у сорс-коді.
- **`create-checkout-session`**: `payment_type` не перевіряється проти довіреного каталогу (пов'язано з C1).
- **`send-quote-email`**: без `quote_id` — автентифікований open email-relay (будь-який юзер шле шаблонні листи "від DImarket").
- **`provision-scb-account`**: приймає клієнтський пароль без перевірки міцності.
- **`google-calendar-oauth`**: `state=user.id` без HMAC — слабка CSRF-захист.
- **`admin-delete-commercial-entity`**: хардкоджений email `ivan.sovban@gmail.com` як обхід авторизації.
- **Помилки витікають інтернали**: `String(err)` у 16 функціях повертає текст помилок Postgres/Stripe клієнту.
- **Картки знайдених багів**: 21 `no-explicit-any`, 19 `prefer-const`, 46 `exhaustive-deps` попереджень; негардований `.map()` над Nominatim-відповіддю в `geocoding.ts:92`.
- **i18n**: 19 з 23 неанглійських мов на 69% покриття ключів (884/2883 відсутні), тихий фолбэк на англійську.
- **RLS відсутня** на `geo_catalog`, `osm_weekly_digest_runs`; публічні INSERT в `profile_view_events`; слабкий анти-спам у публічних відгуках.

---

## 🔵 НИЗЬКИЙ пріоритет / гігієна

- **Великий main-чанк**: 1.12 MB (316 KB gzip). Головна ціль — `CostEstimator.tsx` (2018 рядків, eager-завантажений) винести в lazy. Також Stripe/PDF-код підтікає в main-чанк, хоча потрібен лише на Checkout/документах.
- **`SEED_CA_MANUFACTURERS_REAL.sql`**: 30 прямих інсертів у `auth.users` — ризикований, нетрекований паттерн.
- **`.env.local` закомічений** у git (плейсхолдери, секретів немає) — `git rm --cached .env.local`.
- **npm audit**: 21 вразливість (ws high, sharp high/major, yaml moderate, vite/esbuild/react-router high). Більшість — `npm audit fix`; sharp потребує мажорного бампу + тестів.
- **Міграції**: ordering-баг — три файли травня модифікують `app_site_stats` до створення таблиці `20260514190333` (фраш-БД зламається). Дублікати `APPLY_*` ↔ timestamped — надлишкові, але нешкідливі. Ланцюжок втрати даних у ad_campaigns (delete→no-op→restore) — працює лише через пізніший restore-файл.
- **`.vercelignore`**: не виключає `dimarket-agent/`.
- **Зайві .md у корені** (12+ звітів) — перенести в `docs/`.

---

## Що працює добре (не потребує змін)

- Stripe webhook signature verification — коректний, fail-closed.
- `release-project-escrow` — авторизація/ownership найсильніші з платіжних функцій; idempotency-ключ на `transfers.create`.
- `official-sources-monitor` — найкраще захищена Edge-функція; SSRF захищено.
- Vercel config — security headers, SPA rewrites, CSP-Reporting правильні.
- CI/CD — `ci-smoke.yml` (build+typecheck+e2e проти прод) + `deploy-production.yml`.
- `.env` файли не містять реальних секретів (перевірено по всій git-історії); service-role і Stripe-ключі ніколи не доходять до клієнтського бандлу.
- Маршрутизація: 48+ сторінок правильно lazy-loaded; `lazyWithRetry` з авто-відновленням від stale-чанків.
- Міграції: всі `CREATE TABLE`/`ADD COLUMN` захищені `IF NOT EXISTS`; немає `TRUNCATE`/`DROP TABLE`.

---

## Рекомендований порядок дій

1. **Грошові потоки (C1, C2, C4)** — підробка цін/ентайтлментів/ескроу. Найвищий ризик прямої втрати коштів.
2. **Storage-бакет `media` (C3, H5)** — БД розійшлася з кодом; невідомий стан RLS.
3. **Auth-вразливості (H1-H4, H8)** — фейкові Bearer-токени, AI без авторизації, fail-open секрети.
4. **Silent fallback видалених профілів** — data-leak користувацьких даних.
5. **CORS/CSP (H6, H7)** — звуження поверхні атаки.
6. **Лінт/бандл/гігієна** — якість коду та продуктивність.
7. **npm audit + .env.local cleanup** — залежності та секрети.

---

## Регресійні тести для P0-фіксів

Після виправлення критичних вразливостей перевірити:
- Прямий виклик `create-checkout-session` з `amount: 50`, `payment_type: 'premium_profile'`, `duration_days: 36500` → має відхилятись або використати серверну ціну плану.
- Пряме `supabase.from('project_escrows').update({status:'captured'})` від імені клієнта → має відхилятись RLS/тригером.
- `Authorization: Bearer garbage` до `dispatch-web-push` / `match-notify-channels` → має повернути 401.
- Telegram-webhook без/з невірним `TELEGRAM_WEBHOOK_SECRET` → має fail-closed.
- Storage-політика бакета `media` → довести, що write/delete обмежені `auth.uid()` власника.

---

## Детальні звіти (підтримуючі артефакти)

- `REVIEW_migrations.md` — 119 SQL-міграцій, дублікати, ordering-баги.
- `REVIEW_edge_functions.md` — 28 Edge-функцій, auth-моделі, платежі, AI.
- `REVIEW_frontend.md` — 48+ сторінок, lint, бандл, i18n.
- `REVIEW_security.md` — 16 тегованих вразливостей з файл:рядок.
