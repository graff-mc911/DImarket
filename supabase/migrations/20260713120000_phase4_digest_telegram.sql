-- Phase 4: weekly email digest prefs + Telegram account linking for professionals

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_digest_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_link_code text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_telegram_link_code_uidx
  ON profiles (telegram_link_code)
  WHERE telegram_link_code IS NOT NULL;

COMMENT ON COLUMN profiles.email_digest_enabled IS 'Weekly email digest of matching job requests';
COMMENT ON COLUMN profiles.telegram_link_code IS 'One-time code for /link in Telegram bot';

CREATE OR REPLACE FUNCTION public.ensure_telegram_link_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT telegram_link_code INTO v_code FROM profiles WHERE id = p_user_id;
  IF v_code IS NOT NULL AND length(v_code) >= 6 THEN
    RETURN v_code;
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  UPDATE profiles SET telegram_link_code = v_code, updated_at = now() WHERE id = p_user_id;
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_telegram_link_code(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_telegram_by_code(p_code text, p_chat_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 6 OR p_chat_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_user_id
  FROM profiles
  WHERE upper(trim(telegram_link_code)) = upper(trim(p_code))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET
    telegram_chat_id = p_chat_id,
    telegram_link_code = NULL,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.link_telegram_by_code(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_telegram_by_code(text, bigint) TO service_role;
