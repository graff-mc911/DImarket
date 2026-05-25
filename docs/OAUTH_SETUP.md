# Google / Apple вхід для DImarket

Помилка `missing OAuth client ID` означає: провайдер увімкнено в Supabase, але **Client ID і Secret не вставлені**.

## Швидко: лише email (зараз)

Кнопки Google/Apple **приховані**, поки не налаштуєте ключі. Реєстрація **email + пароль** працює на https://dimarket.app

## Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **Create OAuth client ID** (Web application).
2. **Authorized redirect URIs** (обовʼязково):

   ```
   https://wjlfvajloxkevggwjgtk.supabase.co/auth/v1/callback
   ```

3. Скопіюйте **Client ID** і **Client secret**.

### Варіант A — Supabase Dashboard

Authentication → Providers → **Google** → увімкнути → вставити ID і Secret → Save.

### Варіант B — скрипт (`.env.local`)

```env
GOOGLE_OAUTH_CLIENT_ID=ваш-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=ваш-secret
```

```bash
node scripts/apply-auth-config-prod.mjs
```

У **Vercel** → Environment variables:

- `VITE_OAUTH_GOOGLE_ENABLED` = `true`

Потім redeploy.

## Apple

1. [Apple Developer](https://developer.apple.com/) → Identifiers → Services ID + Key для Sign in with Apple.
2. Return URL:

   ```
   https://wjlfvajloxkevggwjgtk.supabase.co/auth/v1/callback
   ```

3. У Supabase: Authentication → Providers → **Apple** → Client ID (Services ID) + Secret (ключ).

Або в `.env.local`:

```env
APPLE_OAUTH_CLIENT_ID=...
APPLE_OAUTH_CLIENT_SECRET=...
```

І `VITE_OAUTH_APPLE_ENABLED=true` у Vercel.

## Перевірка

Після налаштування: Login → «Продовжити з Google» → редірект на Google → повернення на `https://dimarket.app/auth/callback`.
