# DImarket — опис функцій сайту

Оновлено: 2026-08-06. Живий сайт: https://dimarket.app

---

## Публічні сторінки

| Маршрут | Що робить |
|---------|-----------|
| `/` | Головна: герої, категорії, топ майстрів/компаній, карта, FAQ |
| `/search` | Розширений пошук послуг, майстрів, оголошень |
| `/map` | Інтерактивна карта майстрів, компаній і замовлень |
| `/professionals` | Каталог майстрів із фільтрами |
| `/companies` | Каталог компаній |
| `/listings` | Стрічка оголошень / замовлень |
| `/vacancies`, `/jobs` | Вакансії |
| `/sell-rent`, `/buy-sell` | Купівля / продаж / оренда |
| `/listing/:id` | Картка оголошення |
| `/professional/:id` | Профіль майстра/компанії + портфоліо |
| `/category/:slug` | Лендінг категорії |
| `/services/:slug` (+ geo SEO) | Результати послуги з геофільтром |
| `/contact` | Контакти / юридичні теми |
| `/advertising`, `/advertise` | Реклама на сайті |
| `/pricing`, `/plans` | Тарифи підписок |
| `/for-professionals` | Лендінг для майстрів |
| `/for-companies` | Лендінг для компаній |
| `/for-advertisers` | Лендінг для рекламодавців |
| `/login`, `/register`, `/auth/callback` | Вхід, реєстрація, OAuth callback |

---

## Кабінети користувача

| Маршрут | Що робить |
|---------|-----------|
| `/dashboard` | Загальний кабінет |
| `/customer`, `/my` | Кабінет замовника |
| `/pro`, `/pro/dashboard` | Кабінет майстра |
| `/pro/calendar`, `/calendar` | Календар записів / Google Calendar |
| `/profile` | Редагування профілю |
| `/settings` | Налаштування акаунта |
| `/my-listings` | Мої оголошення |
| `/my-projects` | Мої проєкти |
| `/favorites` | Обране |
| `/messages` | Чати з користувачами |
| `/notifications` | Сповіщення (in-app / push) |
| `/billing` | Підписка / рахунки |
| `/boost` | Просування профілю |
| `/checkout` | Оплата Stripe |
| `/verification` | Верифікація профілю |
| `/analytics` | Аналітика (для власників/про) |
| `/create-ad` | Створення оголошення вручну |
| `/book/:id` | Запис до майстра |

---

## Проєкти, кошторис, офери

| Маршрут | Що робить |
|---------|-----------|
| `/create-project`, `/project/new` | Майстер створення проєкту / замовлення |
| `/projects`, `/leads` | Стрічка проєктів / лідів для про |
| `/project/:id/matches` | Топ підібраних майстрів (скоринг, не LLM) |
| `/project/:id/offers` | Пропозиції по проєкту |
| `/project/:id/manage` | Керування проєктом (PM-панель) |
| `/leads/:id/quote` | Конструктор комерційної пропозиції + PDF/email |
| `/cost-estimator`, `/estimate` | Кошторис ремонту / будівництва |
| `/cost-estimator/history` | Історія кошторисів |

---

## AI-інструменти (що реально LLM, що евристика)

| Маршрут / місце | Що робить | LLM? |
|-----------------|-----------|------|
| `/assistant/job` | Чат створення замовлення (кроки + публікація) | Локальний двигун; OpenAI лише полірує текст відповіді |
| `/assistant` | Панель AI-інструментів (бюджет, категорія, КП…) | Так, через `ai-assistant` (є офлайн-fallback) |
| Віджет чату (плаваючий) | Швидкий доступ до ботів (matching, quote, fraud…) | Частково: translate/quote — OpenAI; matching/fraud/lead — правила |
| `/admin/ai` | Адмін-асистент власника сайту | Claude (`ANTHROPIC_API_KEY`), інакше шорткати |
| `/admin/marketing-agent` | Генерація / постинг маркетингового контенту | Anthropic або OpenAI |
| Matcher після публікації | Ранжує профілі і шле нотифікації | Ні — ваги (відстань, рейтинг…) |
| Fraud / OCR / Analyst | Ризик, парсинг тексту, підказки | Ні (Vision OCR — опційно) |

---

## Адмінка

| Маршрут | Що робить |
|---------|-----------|
| `/admin`, `/admin/panel` | Панель власника сайту |
| `/admin/ai` | Адмін AI + knowledge base |
| `/admin/marketing-agent` | Маркетинг-агент |

---

## Edge-функції Supabase (бекенд)

| Функція | Призначення | Хто викликає |
|---------|-------------|--------------|
| `sales-chat` | LLM-полірування реплік job-чату | `salesBotApi` |
| `ai-router` | Translate / fraud / quote / OCR / status | `bots/client`, estimator, AiBotPanel |
| `ai-assistant` | Інструменти асистента (бюджет, категорія…) | `/assistant` |
| `admin-ai-assistant` | Адмін NL + knowledge/audit | `/admin/ai` (тільки owner) |
| `marketing-agent` | Маркетинг-контент / постинг | `/admin/marketing-agent` |
| `ai-job-lead` | Freeform extract (legacy API) | **Не викликається з UI** (чат = sales engine) |
| `marketplace-matching` | Серверний matching | **Не викликається з UI** (SSOT = client matcher) |
| `match-notify-channels` | Нотифікації підібраним про | `aiDispatcher` |
| `telegram-bot` | Telegram webhook | Telegram |
| `create-checkout-session` | Stripe Checkout | Billing / boost |
| `verify-checkout-session` | Підтвердження оплати | Checkout |
| `create-billing-portal` | Stripe Customer Portal | Billing |
| `stripe-webhook` | Події Stripe | Stripe |
| `send-quote-email` | Лист з КП | QuoteBuilder |
| `send-notification` / `notify-dispatch` / `dispatch-web-push` | Доставка сповіщень | сервер / клієнт notify |
| `delete-account` | Видалення акаунта | Settings |
| `google-calendar-oauth` / `google-calendar-sync` | Календар майстра | Pro calendar |
| `professional-digest` | Дайджест для про | cron / admin |
| `directory-avatar-backfill` | Службова міграція аватарів | ops |
| `apply-auth-profile-migration` | Службова міграція профілів | ops |

---

## Прибрано в цьому cleanup (безпечно)

- Мертві UI: `AiBotPanel`, `VoiceRecorder`, `AdminAIPanel`, `HomeCategoryCard`, `CategoryCard`, `LeadFeed`
- Мертві AI helpers: `ai/bots.ts`, `conversationService`, `ai/config`, `ai/locale`, `invokeAiJobLead`
- Невикористані bot wrappers: fraud/lead/review/ocr/translation client modules (edge `ai-router` лишається)
- Deprecated aliases без callers + `bots/matching/rank.ts`

Edge `ai-job-lead` / `marketplace-matching` **залишені** в репо (deployed); UI ними не користується.
