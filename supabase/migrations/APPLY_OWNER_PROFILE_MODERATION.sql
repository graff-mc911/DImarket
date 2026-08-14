-- OWNER PROFILE MODERATION: soft-delete / hide / ranking / search
-- Apply in Supabase SQL Editor (service role). Idempotent.

-- 1) Columns (public visibility + owner ranking; rating untouched)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid,
  ADD COLUMN IF NOT EXISTS ranking_priority integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.ranking_priority IS
  'Owner/manual homepage & catalog priority. Independent from user rating.';
COMMENT ON COLUMN public.profiles.hidden_at IS
  'When set, profile is hidden from public listings (not deleted).';
COMMENT ON COLUMN public.profiles.deleted_at IS
  'Soft delete. Public queries must exclude deleted_at IS NOT NULL.';

CREATE INDEX IF NOT EXISTS profiles_public_list_idx
  ON public.profiles (is_professional, user_role, ranking_priority DESC, rating DESC)
  WHERE deleted_at IS NULL AND hidden_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx
  ON public.profiles (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_hidden_at_idx
  ON public.profiles (hidden_at)
  WHERE hidden_at IS NOT NULL;

-- 2) Owner assert (DB flag OR hard-coded site owner email)
CREATE OR REPLACE FUNCTION public.admin_assert_site_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT lower(coalesce(email, '')) INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  ) THEN
    RETURN;
  END IF;

  IF v_email = 'ivan.sovban@gmail.com' THEN
    RETURN;
  END IF;

  RAISE EXCEPTION 'forbidden';
END;
$$;

-- 3) Search (name, phone, id, role, auth email)
CREATE OR REPLACE FUNCTION public.admin_search_profiles(
  p_query text DEFAULT '',
  p_filter text DEFAULT 'all',
  p_limit int DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  lim int := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 2000);
  q text := trim(COALESCE(p_query, ''));
BEGIN
  PERFORM public.admin_assert_site_owner();

  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      p.id,
      p.full_name,
      u.email,
      p.phone,
      p.location,
      p.user_role,
      p.is_professional,
      p.is_verified,
      p.verification_level,
      p.is_premium,
      p.is_featured,
      p.is_site_owner,
      p.rating,
      p.total_reviews,
      p.completed_jobs,
      p.ranking_priority,
      p.hidden_at,
      p.deleted_at,
      p.created_at,
      p.updated_at,
      (p.hidden_at IS NOT NULL) AS is_hidden,
      (p.deleted_at IS NOT NULL) AS is_deleted
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE (
        q = ''
        OR p.full_name ILIKE '%' || q || '%'
        OR coalesce(p.phone, '') ILIKE '%' || q || '%'
        OR coalesce(u.email, '') ILIKE '%' || q || '%'
        OR p.id::text ILIKE q || '%'
        OR coalesce(p.user_role, '') ILIKE '%' || q || '%'
      )
      AND (
        p_filter = 'all'
        OR (p_filter = 'professional' AND (p.is_professional = true OR p.user_role IN ('professional', 'company')))
        OR (p_filter = 'public_listable' AND p.is_professional = true AND p.deleted_at IS NULL AND p.hidden_at IS NULL)
        OR (p_filter = 'top_masters' AND p.is_professional = true AND p.user_role = 'professional' AND p.deleted_at IS NULL AND p.hidden_at IS NULL)
        OR (p_filter = 'top_companies' AND p.is_professional = true AND p.user_role = 'company' AND p.deleted_at IS NULL AND p.hidden_at IS NULL)
        OR (p_filter = 'client' AND coalesce(p.is_professional, false) = false AND coalesce(p.user_role, 'client') = 'client')
        OR (p_filter = 'company' AND p.user_role = 'company')
        OR (p_filter = 'manufacturer' AND p.user_role = 'manufacturer')
        OR (p_filter = 'commercial_agent' AND p.user_role = 'commercial_agent')
        OR (p_filter = 'premium' AND p.is_premium = true)
        OR (p_filter = 'verified' AND p.is_verified = true)
        OR (p_filter = 'hidden' AND p.hidden_at IS NOT NULL AND p.deleted_at IS NULL)
        OR (p_filter = 'deleted' AND p.deleted_at IS NOT NULL)
        OR (p_filter = 'qa' AND (
              p.full_name ILIKE 'QA %'
           OR p.full_name ILIKE 'qa-%'
           OR p.full_name ILIKE 'qa_%'
           OR coalesce(u.email, '') ILIKE '%qa%'
           OR coalesce(u.email, '') ILIKE '%dimarket-audit%'
           OR coalesce(u.email, '') ILIKE '%dimarket-test%'
        ))
      )
    ORDER BY p.created_at DESC
    LIMIT lim
  ) t;

  RETURN result;
END;
$$;

-- Exact counts: public-visible vs full owner universe (no artificial 70/100 gap)
CREATE OR REPLACE FUNCTION public.admin_profile_consistency_counts()
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
    'all_profiles', (SELECT count(*) FROM profiles),
    'public_listable', (
      SELECT count(*) FROM profiles
      WHERE is_professional = true
        AND deleted_at IS NULL
        AND hidden_at IS NULL
    ),
    'masters_role', (
      SELECT count(*) FROM profiles
      WHERE is_professional = true
        AND user_role = 'professional'
        AND deleted_at IS NULL
        AND hidden_at IS NULL
    ),
    'companies_role', (
      SELECT count(*) FROM profiles
      WHERE is_professional = true
        AND user_role = 'company'
        AND deleted_at IS NULL
        AND hidden_at IS NULL
    ),
    'hidden', (SELECT count(*) FROM profiles WHERE hidden_at IS NOT NULL AND deleted_at IS NULL),
    'deleted', (SELECT count(*) FROM profiles WHERE deleted_at IS NOT NULL),
    'qa_named', (
      SELECT count(*) FROM profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE p.full_name ILIKE 'QA %'
         OR p.full_name ILIKE 'qa-%'
         OR p.full_name ILIKE 'qa_%'
         OR coalesce(u.email, '') ILIKE '%qa%'
         OR coalesce(u.email, '') ILIKE '%dimarket-audit%'
         OR coalesce(u.email, '') ILIKE '%dimarket-test%'
    )
  ) INTO out;
  RETURN out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_profile_consistency_counts() TO authenticated;

-- 4) Flags + ranking (does NOT change rating)
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
    'user_role', updated.user_role,
    'ranking_priority', updated.ranking_priority,
    'hidden_at', updated.hidden_at,
    'deleted_at', updated.deleted_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_ranking_priority(
  p_profile_id uuid,
  p_ranking_priority integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  UPDATE profiles
  SET ranking_priority = COALESCE(p_ranking_priority, 0),
      updated_at = now()
  WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', p_profile_id, 'ranking_priority', COALESCE(p_ranking_priority, 0));
END;
$$;

-- 5) Hide / Restore / Soft-delete / Restore-from-delete
CREATE OR REPLACE FUNCTION public.admin_hide_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  UPDATE profiles
  SET hidden_at = now(),
      hidden_by = auth.uid(),
      updated_at = now()
  WHERE id = p_profile_id
    AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found_or_deleted');
  END IF;
  RETURN jsonb_build_object('ok', true, 'action', 'hide', 'id', p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unhide_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  UPDATE profiles
  SET hidden_at = NULL,
      hidden_by = NULL,
      updated_at = now()
  WHERE id = p_profile_id
    AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found_or_deleted');
  END IF;
  RETURN jsonb_build_object('ok', true, 'action', 'unhide', 'id', p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  IF p_profile_id = auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_delete_self');
  END IF;
  UPDATE profiles
  SET deleted_at = now(),
      deleted_by = auth.uid(),
      hidden_at = COALESCE(hidden_at, now()),
      hidden_by = COALESCE(hidden_by, auth.uid()),
      updated_at = now()
  WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'action', 'soft_delete', 'id', p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_restore_profile(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_assert_site_owner();
  UPDATE profiles
  SET deleted_at = NULL,
      deleted_by = NULL,
      hidden_at = NULL,
      hidden_by = NULL,
      updated_at = now()
  WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'action', 'restore', 'id', p_profile_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assert_site_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_flags(uuid, boolean, boolean, boolean, boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_ranking_priority(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hide_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unhide_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_profile(uuid) TO authenticated;

-- 6) One-shot: hide known QA public professionals (does NOT delete auth users)
-- Owner can restore individually after review.
UPDATE public.profiles
SET
  hidden_at = COALESCE(hidden_at, now()),
  hidden_by = COALESCE(hidden_by, auth.uid()),
  updated_at = now()
WHERE deleted_at IS NULL
  AND (
    full_name ILIKE 'QA %'
    OR full_name ILIKE 'qa-%'
    OR full_name ILIKE 'qa_%'
    OR full_name ILIKE 'side-ads-e2e-%'
  );
