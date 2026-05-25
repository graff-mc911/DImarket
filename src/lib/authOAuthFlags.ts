/** Показувати кнопки Google/Apple лише якщо в Vercel задано ключі (див. docs/OAUTH_SETUP.md). */
export const oauthGoogleEnabled =
  import.meta.env.VITE_OAUTH_GOOGLE_ENABLED === 'true'
export const oauthAppleEnabled =
  import.meta.env.VITE_OAUTH_APPLE_ENABLED === 'true'
export const oauthAnyEnabled = oauthGoogleEnabled || oauthAppleEnabled
