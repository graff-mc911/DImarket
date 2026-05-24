/*
  Автоматичний profiles при реєстрації в auth.users.
  Вирішує: email-підтвердження без сесії, OAuth без upsert на клієнті.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  role_text text;
  is_prof boolean;
  display_name text;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  role_text := lower(COALESCE(meta->>'user_role', 'client'));

  IF role_text = 'advertiser' THEN
    role_text := 'client';
  ELSIF role_text NOT IN ('client', 'professional', 'company', 'owner') THEN
    role_text := 'client';
  END IF;

  is_prof := role_text IN ('professional', 'company');

  display_name := nullif(trim(meta->>'full_name'), '');
  IF display_name IS NULL THEN
    display_name := split_part(COALESCE(NEW.email, 'user'), '@', 1);
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    user_role,
    is_professional,
    phone,
    location
  )
  VALUES (
    NEW.id,
    display_name,
    role_text,
    is_prof,
    nullif(trim(meta->>'phone'), ''),
    nullif(trim(meta->>'location'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(nullif(trim(EXCLUDED.full_name), ''), profiles.full_name),
    user_role = CASE
      WHEN profiles.user_role IS NOT NULL AND profiles.user_role <> 'client' THEN profiles.user_role
      ELSE EXCLUDED.user_role
    END,
    is_professional = profiles.is_professional OR EXCLUDED.is_professional,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    location = COALESCE(EXCLUDED.location, profiles.location);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
