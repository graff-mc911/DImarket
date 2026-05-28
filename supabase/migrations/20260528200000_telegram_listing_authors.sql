-- Link Telegram posters to profiles so in-app chat (author_id) works.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telegram_user_id bigint,
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_user_id
  ON profiles (telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

COMMENT ON COLUMN profiles.telegram_user_id IS 'Telegram user id for listings posted via @dimarket_ads_ua_bot';
COMMENT ON COLUMN profiles.telegram_chat_id IS 'Telegram chat id for forwarding in-app messages';
