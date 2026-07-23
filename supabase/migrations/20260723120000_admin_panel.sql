-- Admin Panel: owner RPCs + policies for management

CREATE OR REPLACE FUNCTION public.admin_assert_site_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_search_profiles(
  p_query text DEFAULT '',
  p_filter text DEFAULT 'all',
  p_limit int DEFAULT 80
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  lim int := LEAST(GREATEST(COALESCE(p_limit, 80), 1), 200);
  q text := trim(COALESCE(p_query, ''));
BEGIN
  PERFORM public.admin_assert_site_owner();

  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      id, full_name, phone, location, user_role, is_professional,
      is_verified, verification_level, is_premium, is_featured, is_site_owner,
      rating, total_reviews, created_at
    FROM profiles
    WHERE (
        q = ''
        OR full_name ILIKE '%' || q || '%'
        OR coalesce(phone, '') ILIKE '%' || q || '%'
        OR id::text ILIKE q || '%'
      )
      AND (
        p_filter = 'all'
        OR (p_filter = 'professional' AND (is_professional = true OR user_role IN ('professional', 'company')))
        OR (p_filter = 'client' AND coalesce(is_professional, false) = false AND coalesce(user_role, 'client') = 'client')
        OR (p_filter = 'premium' AND is_premium = true)
        OR (p_filter = 'verified' AND is_verified = true)
      )
    ORDER BY created_at DESC
    LIMIT lim
  ) t;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_profile_flags(
  p_profile_id uuid,
  p_is_verified boolean DEFAULT NULL,
  p_is_premium boolean DEFAULT NULL,
  p_is_featured boolean DEFAULT NULL,
  p_is_professional boolean DEFAULT NULL,
  p_user_role text DEFAULT NULL,
  p_verification_level text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated profiles%ROWTYPE;
BEGIN
  PERFORM public.admin_assert_site_owner();

  UPDATE profiles SET
    is_verified = COALESCE(p_is_verified, is_verified),
    is_premium = COALESCE(p_is_premium, is_premium),
    is_featured = COALESCE(p_is_featured, is_featured),
    is_professional = COALESCE(p_is_professional, is_professional),
    user_role = COALESCE(p_user_role, user_role),
    verification_level = COALESCE(p_verification_level, verification_level),
    updated_at = now()
  WHERE id = p_profile_id
  RETURNING * INTO updated;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', updated.id,
    'is_verified', updated.is_verified,
    'is_premium', updated.is_premium,
    'is_featured', updated.is_featured,
    'is_professional', updated.is_professional,
    'user_role', updated.user_role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_listing_status(
  p_listing_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  IF p_status NOT IN ('active', 'expired', 'sold', 'deleted', 'draft', 'closed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;

  UPDATE listings SET status = p_status
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_review(
  p_review_id uuid,
  p_is_hidden boolean DEFAULT NULL,
  p_is_approved boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  UPDATE reviews SET
    is_hidden = COALESCE(p_is_hidden, is_hidden),
    is_approved = COALESCE(p_is_approved, is_approved)
  WHERE id = p_review_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_review_report_status(
  p_report_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  IF p_status NOT IN ('open', 'reviewed', 'dismissed', 'actioned') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_status');
  END IF;
  UPDATE review_reports SET status = p_status WHERE id = p_report_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_panel_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out jsonb;
BEGIN
  PERFORM public.admin_assert_site_owner();
  SELECT jsonb_build_object(
    'users', (SELECT count(*) FROM profiles),
    'professionals', (SELECT count(*) FROM profiles WHERE is_professional = true OR user_role IN ('professional', 'company')),
    'listings', (SELECT count(*) FROM listings WHERE coalesce(status, 'active') <> 'deleted'),
    'active_listings', (SELECT count(*) FROM listings WHERE status = 'active'),
    'reviews', (SELECT count(*) FROM reviews),
    'hidden_reviews', (SELECT count(*) FROM reviews WHERE is_hidden = true),
    'open_reports', (SELECT count(*) FROM review_reports WHERE status = 'open'),
    'pending_ads', (SELECT count(*) FROM ad_campaigns WHERE status = 'pending'),
    'active_ads', (SELECT count(*) FROM ad_campaigns WHERE status = 'active'),
    'payments', (SELECT count(*) FROM payments),
    'premium_users', (SELECT count(*) FROM profiles WHERE is_premium = true),
    'pending_verifications', (
      SELECT count(*) FROM contractor_verifications WHERE status = 'pending'
    )
  ) INTO out;
  RETURN out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_flags(uuid, boolean, boolean, boolean, boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_listing_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_review(uuid, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_review_report_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_panel_stats() TO authenticated;

-- Owner can manage categories
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
CREATE POLICY "categories_admin_all" ON categories
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner'))
  );

-- Owner read payments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "payments_admin_select" ON payments';
    EXECUTE $pol$
      CREATE POLICY "payments_admin_select" ON payments
        FOR SELECT TO authenticated
        USING (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
          )
        )
    $pol$;
  END IF;
END $$;

-- Owner read/update reviews for moderation
DROP POLICY IF EXISTS "reviews_admin_update" ON reviews;
CREATE POLICY "reviews_admin_update" ON reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );
