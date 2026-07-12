/*
  Phase 3: job-match notifications RPC, referral program, premium extension.
*/

-- Referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_code_unique UNIQUE (code),
  CONSTRAINT referral_codes_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code_lower
  ON referral_codes (lower(code));

CREATE TABLE IF NOT EXISTS referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_redemptions_referred_unique UNIQUE (referred_user_id)
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Extend premium by N days (stack on existing expiry)
CREATE OR REPLACE FUNCTION public.extend_premium_days(p_user_id uuid, p_days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base timestamptz;
BEGIN
  IF p_user_id IS NULL OR p_days IS NULL OR p_days <= 0 THEN
    RETURN;
  END IF;

  SELECT GREATEST(COALESCE(premium_expires_at, now()), now())
  INTO v_base
  FROM profiles
  WHERE id = p_user_id;

  IF v_base IS NULL THEN
    v_base := now();
  END IF;

  UPDATE profiles
  SET
    is_premium = true,
    premium_expires_at = v_base + (p_days || ' days')::interval
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.extend_premium_days(uuid, int) TO authenticated;

-- Ensure referral code for professional/company
CREATE OR REPLACE FUNCTION public.ensure_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_role text;
BEGIN
  SELECT user_role INTO v_role FROM profiles WHERE id = p_user_id;
  IF v_role NOT IN ('professional', 'company') THEN
    RETURN NULL;
  END IF;

  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code
  RETURNING code INTO v_code;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_referral_code(uuid) TO authenticated;

-- Apply referral on signup (14-day premium boost for both)
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text, p_referred_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row referral_codes%ROWTYPE;
  v_referred_role text;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' OR p_referred_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_row
  FROM referral_codes
  WHERE lower(code) = lower(trim(p_code))
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN false;
  END IF;

  IF v_row.user_id = p_referred_user_id THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM referral_redemptions WHERE referred_user_id = p_referred_user_id) THEN
    RETURN false;
  END IF;

  SELECT user_role INTO v_referred_role
  FROM profiles WHERE id = p_referred_user_id;

  IF v_referred_role NOT IN ('professional', 'company') THEN
    RETURN false;
  END IF;

  INSERT INTO referral_redemptions (code_id, referrer_id, referred_user_id)
  VALUES (v_row.id, v_row.user_id, p_referred_user_id);

  UPDATE profiles SET referred_by = v_row.user_id WHERE id = p_referred_user_id;

  PERFORM extend_premium_days(v_row.user_id, 14);
  PERFORM extend_premium_days(p_referred_user_id, 14);

  INSERT INTO notifications (user_id, type, title, body, link_path, reference_type, reference_id)
  VALUES (
    v_row.user_id,
    'system',
    'Referral bonus activated',
    'A colleague joined via your invite link. You both received 14 days of profile boost.',
    '/settings',
    'referral',
    p_referred_user_id
  );

  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    RETURN false;
  WHEN others THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_referral_code(text, uuid) TO authenticated;

-- In-app notifications for matched professionals (service role via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.notify_job_match_professionals(
  p_listing_id uuid,
  p_profile_ids uuid[]
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_count int := 0;
  v_pid uuid;
BEGIN
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id;
  IF v_listing.id IS NULL OR v_listing.listing_type <> 'service_request' THEN
    RETURN 0;
  END IF;

  IF p_profile_ids IS NULL OR array_length(p_profile_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH v_pid IN ARRAY p_profile_ids LOOP
    IF v_pid IS NULL OR v_pid = v_listing.author_id THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = v_pid
        AND p.is_professional = true
        AND COALESCE(p.notifications_enabled, true) = true
    ) AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = v_pid
        AND n.reference_type = 'listing'
        AND n.reference_id = p_listing_id
        AND n.type = 'match'
    ) THEN
      INSERT INTO notifications (
        user_id, type, title, body, link_path, reference_type, reference_id
      )
      VALUES (
        v_pid,
        'match',
        'New job in your area',
        LEFT(COALESCE(v_listing.title, 'Job request'), 120),
        '/listing/' || p_listing_id::text,
        'listing',
        p_listing_id
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_job_match_professionals(uuid, uuid[]) TO authenticated;

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_codes_own" ON referral_codes;
CREATE POLICY "referral_codes_own" ON referral_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "referral_redemptions_involved" ON referral_redemptions;
CREATE POLICY "referral_redemptions_involved" ON referral_redemptions
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());
