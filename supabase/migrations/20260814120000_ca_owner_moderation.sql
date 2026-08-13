-- Commercial Agents: owner moderation — rejected status + safe delete RPC.
-- Does NOT weaken RLS; does NOT grant public delete.

-- 1) Allow verification_status = 'rejected' on both CA profile tables
ALTER TABLE public.manufacturer_profiles
  DROP CONSTRAINT IF EXISTS manufacturer_profiles_verification_status_check;
ALTER TABLE public.manufacturer_profiles
  ADD CONSTRAINT manufacturer_profiles_verification_status_check
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

ALTER TABLE public.agent_profiles
  DROP CONSTRAINT IF EXISTS agent_profiles_verification_status_check;
ALTER TABLE public.agent_profiles
  ADD CONSTRAINT agent_profiles_verification_status_check
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- 2) Ensure is_site_owner() exists (used by CA RLS + this RPC)
CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  );
$$;

-- Keep canonical owner email in sync (UI email bypass ≠ DB flag otherwise).
UPDATE public.profiles p
SET
  is_site_owner = true,
  user_role = COALESCE(NULLIF(p.user_role, ''), 'owner'),
  updated_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower('ivan.sovban@gmail.com');

-- 3) Owner-only safe delete for commercial agent / manufacturer profiles.
-- Cleans CA row + linked ads; cascades applications/invitations via FK.
-- Does NOT delete auth.users (use edge function admin-delete-commercial-entity).
CREATE OR REPLACE FUNCTION public.owner_delete_commercial_entity(
  p_kind text,
  p_id uuid,
  p_delete_auth boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_profile_id uuid;
  v_name text;
  v_company text;
  v_slug text;
  v_ads int := 0;
BEGIN
  IF p_kind NOT IN ('agent', 'manufacturer') THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  IF NOT (
    public.is_site_owner()
    OR v_email = lower('ivan.sovban@gmail.com')
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_kind = 'agent' THEN
    SELECT profile_id, full_name, company_name, slug
      INTO v_profile_id, v_name, v_company, v_slug
    FROM public.agent_profiles
    WHERE id = p_id;

    IF v_profile_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;

    -- Disable linked ads (FK is ON DELETE SET NULL, but reject first for clarity).
    UPDATE public.ad_campaigns
    SET
      status = CASE WHEN status = 'active' THEN 'rejected' ELSE status END,
      agent_profile_id = NULL,
      updated_at = now()
    WHERE agent_profile_id = p_id;
    GET DIAGNOSTICS v_ads = ROW_COUNT;

    DELETE FROM public.agent_profiles WHERE id = p_id;
  ELSE
    SELECT profile_id, company_name, company_name, slug
      INTO v_profile_id, v_name, v_company, v_slug
    FROM public.manufacturer_profiles
    WHERE id = p_id;

    IF v_profile_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;

    UPDATE public.ad_campaigns
    SET
      status = CASE WHEN status = 'active' THEN 'rejected' ELSE status END,
      manufacturer_profile_id = NULL,
      updated_at = now()
    WHERE manufacturer_profile_id = p_id;
    GET DIAGNOSTICS v_ads = ROW_COUNT;

    DELETE FROM public.manufacturer_profiles WHERE id = p_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'kind', p_kind,
    'id', p_id,
    'profile_id', v_profile_id,
    'name', v_name,
    'company', v_company,
    'slug', v_slug,
    'ads_cleared', v_ads,
    'delete_auth_requested', coalesce(p_delete_auth, false),
    'auth_deleted', false,
    'note', CASE
      WHEN coalesce(p_delete_auth, false)
        THEN 'Call edge function admin-delete-commercial-entity to remove auth.users'
      ELSE 'Commercial profile deleted; auth.users preserved'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owner_delete_commercial_entity(text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_delete_commercial_entity(text, uuid, boolean) TO authenticated;
