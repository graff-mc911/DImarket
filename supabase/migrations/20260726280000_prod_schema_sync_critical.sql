-- =============================================================================
-- Production schema sync (idempotent) — closes gaps so current frontend works.
-- Safe: IF NOT EXISTS / OR REPLACE / ON CONFLICT. Never deletes user data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: is_site_owner (used by many RLS policies)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND coalesce(p.is_site_owner, false) = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_site_owner() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Profiles: verification / trust columns
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='verification_level') THEN
    ALTER TABLE profiles ADD COLUMN verification_level text NOT NULL DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email_verified_at') THEN
    ALTER TABLE profiles ADD COLUMN email_verified_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone_verified_at') THEN
    ALTER TABLE profiles ADD COLUMN phone_verified_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='identity_verified') THEN
    ALTER TABLE profiles ADD COLUMN identity_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='business_verified') THEN
    ALTER TABLE profiles ADD COLUMN business_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='address_verified') THEN
    ALTER TABLE profiles ADD COLUMN address_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='insurance_verified') THEN
    ALTER TABLE profiles ADD COLUMN insurance_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='license_verified') THEN
    ALTER TABLE profiles ADD COLUMN license_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='vat_verified') THEN
    ALTER TABLE profiles ADD COLUMN vat_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='trusted_professional') THEN
    ALTER TABLE profiles ADD COLUMN trusted_professional boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='trust_level') THEN
    ALTER TABLE profiles ADD COLUMN trust_level smallint NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='trust_score') THEN
    ALTER TABLE profiles ADD COLUMN trust_score numeric(5,2) DEFAULT 50;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='notification_prefs') THEN
    ALTER TABLE profiles ADD COLUMN notification_prefs jsonb NOT NULL DEFAULT '{"inapp":true,"push":true,"email":true,"categories":{}}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_level_check;
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_verification_level_check
    CHECK (verification_level IN ('none', 'bronze', 'silver', 'gold', 'platinum'));
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_trust_filters
  ON profiles (is_verified, business_verified, trusted_professional, is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_professional_search
  ON profiles (is_professional, user_role, rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (location);

-- ---------------------------------------------------------------------------
-- Notifications archive + delivery flags
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='is_archived') THEN
    ALTER TABLE notifications ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='archived_at') THEN
    ALTER TABLE notifications ADD COLUMN archived_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='email_sent') THEN
    ALTER TABLE notifications ADD COLUMN email_sent boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='push_sent') THEN
    ALTER TABLE notifications ADD COLUMN push_sent boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_inbox
  ON notifications (user_id, is_archived, is_read, created_at DESC);

-- Conversations archive flag (used by chat inbox filters)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conversations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Contractor verification address fields + needs_info status
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contractor_verifications' AND column_name='address_line') THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_line text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contractor_verifications' AND column_name='address_city') THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contractor_verifications' AND column_name='address_country') THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_country text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contractor_verifications' AND column_name='address_postal_code') THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_postal_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contractor_verifications' AND column_name='years_experience') THEN
    ALTER TABLE contractor_verifications ADD COLUMN years_experience int;
  END IF;
END $$;

DO $$
DECLARE cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname='public' AND rel.relname='contractor_verifications'
    AND con.contype='c' AND pg_get_constraintdef(con.oid) ILIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE contractor_verifications DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE contractor_verifications
    ADD CONSTRAINT contractor_verifications_status_check
    CHECK (status IN ('unverified','pending','verified','rejected','needs_info'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Core missing tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied',
  message text,
  saved boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, professional_id)
);
CREATE INDEX IF NOT EXISTS idx_project_applications_pro
  ON project_applications(professional_id, hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_applications_listing
  ON project_applications(listing_id, status);
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_applications_select" ON project_applications;
CREATE POLICY "project_applications_select" ON project_applications FOR SELECT TO authenticated
  USING (
    professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
    OR public.is_site_owner()
  );
DROP POLICY IF EXISTS "project_applications_insert" ON project_applications;
CREATE POLICY "project_applications_insert" ON project_applications FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());
DROP POLICY IF EXISTS "project_applications_update" ON project_applications;
CREATE POLICY "project_applications_update" ON project_applications FOR UPDATE TO authenticated
  USING (professional_id = auth.uid() OR public.is_site_owner());

CREATE TABLE IF NOT EXISTS public.verification_status (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  identity_verified boolean NOT NULL DEFAULT false,
  address_verified boolean NOT NULL DEFAULT false,
  license_verified boolean NOT NULL DEFAULT false,
  business_verified boolean NOT NULL DEFAULT false,
  insurance_verified boolean NOT NULL DEFAULT false,
  vat_verified boolean NOT NULL DEFAULT false,
  premium_verified boolean NOT NULL DEFAULT false,
  trusted_professional boolean NOT NULL DEFAULT false,
  trust_level smallint NOT NULL DEFAULT 0,
  request_status text NOT NULL DEFAULT 'unverified',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verification_status_select" ON verification_status;
CREATE POLICY "verification_status_select" ON verification_status
  FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "verification_status_write" ON verification_status;
CREATE POLICY "verification_status_write" ON verification_status
  FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR public.is_site_owner())
  WITH CHECK (profile_id = auth.uid() OR public.is_site_owner());

CREATE TABLE IF NOT EXISTS public.verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES contractor_verifications(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  notes text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verification_history_ver ON verification_history (verification_id, created_at DESC);
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verification_history_select" ON verification_history;
CREATE POLICY "verification_history_select" ON verification_history
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_site_owner());
DROP POLICY IF EXISTS "verification_history_insert" ON verification_history;
CREATE POLICY "verification_history_insert" ON verification_history
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_site_owner());

CREATE TABLE IF NOT EXISTS public.trust_scores (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL DEFAULT 0,
  verification_points numeric(5,2) NOT NULL DEFAULT 0,
  reviews_points numeric(5,2) NOT NULL DEFAULT 0,
  projects_points numeric(5,2) NOT NULL DEFAULT 0,
  response_points numeric(5,2) NOT NULL DEFAULT 0,
  profile_points numeric(5,2) NOT NULL DEFAULT 0,
  tenure_points numeric(5,2) NOT NULL DEFAULT 0,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trust_scores_select" ON trust_scores;
CREATE POLICY "trust_scores_select" ON trust_scores FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "trust_scores_write" ON trust_scores;
CREATE POLICY "trust_scores_write" ON trust_scores FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR public.is_site_owner())
  WITH CHECK (profile_id = auth.uid() OR public.is_site_owner());

CREATE TABLE IF NOT EXISTS public.homepage_metrics (
  key text PRIMARY KEY,
  value_num numeric,
  value_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.homepage_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "homepage_metrics_public_read" ON homepage_metrics;
CREATE POLICY "homepage_metrics_public_read" ON homepage_metrics FOR SELECT USING (true);
INSERT INTO homepage_metrics (key, value_num, value_text) VALUES
  ('professionals', 52000, NULL),
  ('reviews', 1800000, NULL),
  ('countries', 27, NULL),
  ('projects', 950000, NULL),
  ('app_store_url', NULL, ''),
  ('play_store_url', NULL, '')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'verification',
  entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verification_audit_owner" ON verification_audit_logs;
CREATE POLICY "verification_audit_owner" ON verification_audit_logs
  FOR SELECT TO authenticated USING (public.is_site_owner());
DROP POLICY IF EXISTS "verification_audit_insert" ON verification_audit_logs;
CREATE POLICY "verification_audit_insert" ON verification_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_site_owner());

-- Compatibility views requested by product brief
CREATE OR REPLACE VIEW public.verification_requests AS
SELECT * FROM public.contractor_verifications;

CREATE OR REPLACE VIEW public.favorites AS
SELECT * FROM public.saved_items;

CREATE OR REPLACE VIEW public.company_reviews AS
SELECT * FROM public.reviews;

CREATE OR REPLACE VIEW public.professional_reviews AS
SELECT * FROM public.reviews;

GRANT SELECT ON public.verification_requests TO anon, authenticated;
GRANT SELECT ON public.favorites TO authenticated;
GRANT SELECT ON public.company_reviews TO anon, authenticated;
GRANT SELECT ON public.professional_reviews TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Critical RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_homepage_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_object_agg(key, jsonb_build_object('value_num', value_num, 'value_text', value_text)),
    '{}'::jsonb
  )
  FROM homepage_metrics;
$$;
GRANT EXECUTE ON FUNCTION public.get_homepage_metrics() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_conversation(
  p_other_user_id uuid,
  p_listing_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_id uuid;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_other_user_id IS NULL OR p_other_user_id = v_me THEN RAISE EXCEPTION 'invalid_participant'; END IF;
  v_a := LEAST(v_me, p_other_user_id);
  v_b := GREATEST(v_me, p_other_user_id);

  SELECT c.id INTO v_id
  FROM conversations c
  WHERE c.participant_a = v_a AND c.participant_b = v_b
    AND COALESCE(c.listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(p_listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
  LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  INSERT INTO conversations (participant_a, participant_b, listing_id)
  VALUES (v_a, v_b, p_listing_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_conversation(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_path text DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  normalized_type text;
BEGIN
  IF p_user_id IS NULL OR p_title IS NULL OR p_body IS NULL THEN RETURN NULL; END IF;
  normalized_type := CASE
    WHEN p_type = 'quote_received' THEN 'quote'
    WHEN p_type = 'application' THEN 'system'
    ELSE p_type
  END;
  IF normalized_type NOT IN (
    'message','lead','verification','review','listing','match','system',
    'booking','payment','project','quote','application'
  ) THEN
    normalized_type := 'system';
  END IF;

  INSERT INTO notifications (user_id, type, title, body, link_path, reference_type, reference_id)
  VALUES (p_user_id, normalized_type, p_title, p_body, p_link_path, p_reference_type, p_reference_id)
  RETURNING id INTO new_id;
  RETURN new_id;
EXCEPTION WHEN others THEN
  -- Relaxed insert if type check rejects
  INSERT INTO notifications (user_id, type, title, body, link_path)
  VALUES (p_user_id, 'system', p_title, p_body, p_link_path)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, text, uuid)
  TO authenticated, service_role, anon;

CREATE OR REPLACE FUNCTION public.count_unread_notifications(p_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM notifications n
  WHERE n.user_id = coalesce(p_user_id, auth.uid())
    AND n.is_read = false
    AND coalesce(n.is_archived, false) = false
    AND (p_user_id IS NULL OR p_user_id = auth.uid() OR public.is_site_owner());
$$;
GRANT EXECUTE ON FUNCTION public.count_unread_notifications(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_marketplace_category_page(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat categories%ROWTYPE;
  services jsonb;
  pros jsonb;
  projects jsonb;
BEGIN
  SELECT * INTO cat FROM categories WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.sort_order), '[]'::jsonb)
  INTO services
  FROM (
    SELECT id, name, slug, icon, icon_key, name_i18n, description_i18n, sort_order, parent_id
    FROM categories
    WHERE parent_id = cat.id
    ORDER BY sort_order, name
  ) s;

  SELECT coalesce(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
  INTO pros
  FROM (
    SELECT
      pr.id, pr.full_name, pr.profile_photo, pr.avatar_url, pr.location,
      pr.rating, pr.total_reviews, pr.is_verified, pr.is_premium, pr.is_featured,
      pr.work_subcategory_slugs
    FROM profiles pr
    WHERE pr.is_professional = true
      AND (
        EXISTS (
          SELECT 1 FROM unnest(coalesce(pr.work_subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
      )
    ORDER BY pr.is_featured DESC NULLS LAST, pr.is_premium DESC NULLS LAST, pr.rating DESC NULLS LAST
    LIMIT 12
  ) p;

  SELECT coalesce(jsonb_agg(row_to_json(l)::jsonb), '[]'::jsonb)
  INTO projects
  FROM (
    SELECT
      li.id, li.title, li.description, li.location, li.city_name, li.created_at,
      li.urgency, li.budget_min, li.budget_max
    FROM listings li
    WHERE li.listing_type = 'service_request'
      AND coalesce(li.status, 'active') = 'active'
      AND (
        EXISTS (
          SELECT 1 FROM categories sc
          WHERE sc.id = li.category_id
            AND (sc.id = cat.id OR sc.parent_id = cat.id OR sc.slug = cat.slug)
        )
      )
    ORDER BY li.created_at DESC
    LIMIT 8
  ) l;

  RETURN jsonb_build_object(
    'ok', true,
    'category', row_to_json(cat),
    'services', services,
    'professionals', pros,
    'projects', projects
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_marketplace_category_page(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.compute_trust_level(p_profile_id uuid)
RETURNS smallint
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  email_ok boolean; phone_ok boolean; identity_ok boolean; license_ok boolean;
  business_ok boolean; insurance_ok boolean; address_ok boolean; v_status text;
BEGIN
  SELECT email_verified_at IS NOT NULL, phone_verified_at IS NOT NULL
  INTO email_ok, phone_ok FROM profiles WHERE id = p_profile_id;

  SELECT status INTO v_status FROM contractor_verifications WHERE profile_id = p_profile_id LIMIT 1;

  SELECT
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id=d.verification_id
      WHERE v.profile_id=p_profile_id AND d.doc_type IN ('identity','id_card','passport','driving_license')),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id=d.verification_id
      WHERE v.profile_id=p_profile_id AND d.doc_type IN ('trade_license','professional_license','professional_certificate')),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id=d.verification_id
      WHERE v.profile_id=p_profile_id AND d.doc_type='business_registration'),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id=d.verification_id
      WHERE v.profile_id=p_profile_id AND d.doc_type='insurance'),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id=d.verification_id
      WHERE v.profile_id=p_profile_id AND d.doc_type='proof_of_address')
  INTO identity_ok, license_ok, business_ok, insurance_ok, address_ok;

  IF COALESCE(v_status,'')='verified' AND identity_ok AND license_ok AND address_ok
     AND (business_ok OR insurance_ok) AND email_ok AND phone_ok THEN RETURN 6; END IF;
  IF COALESCE(v_status,'')='verified' AND business_ok AND email_ok AND phone_ok THEN RETURN 5; END IF;
  IF COALESCE(v_status,'')='verified' AND identity_ok AND license_ok AND email_ok AND phone_ok THEN RETURN 4; END IF;
  IF identity_ok AND email_ok AND phone_ok THEN RETURN 3; END IF;
  IF email_ok AND phone_ok THEN RETURN 2; END IF;
  IF email_ok THEN RETURN 1; END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_verification_level(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE AS $$
DECLARE lvl smallint;
BEGIN
  lvl := public.compute_trust_level(p_profile_id);
  RETURN CASE lvl WHEN 6 THEN 'platinum' WHEN 5 THEN 'gold' WHEN 4 THEN 'gold'
    WHEN 3 THEN 'silver' WHEN 2 THEN 'bronze' WHEN 1 THEN 'bronze' ELSE 'none' END;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_trust_score(p_profile_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ver_pts numeric := 0; rev_pts numeric := 0; proj_pts numeric := 0;
  resp_pts numeric := 0; prof_pts numeric := 0; ten_pts numeric := 0; total numeric := 0;
  v_rating numeric; v_reviews int; v_jobs int; v_response numeric; v_created timestamptz;
  v_bio text; v_phone text; v_photo text; v_loc text; years numeric;
  email_ok boolean; phone_ok boolean; lvl smallint;
BEGIN
  SELECT email_verified_at IS NOT NULL, phone_verified_at IS NOT NULL,
         coalesce(rating,0), coalesce(total_reviews,0), coalesce(completed_jobs,0),
         coalesce(response_rate,0), created_at, bio, phone,
         coalesce(profile_photo, avatar_url), location
  INTO email_ok, phone_ok, v_rating, v_reviews, v_jobs, v_response, v_created, v_bio, v_phone, v_photo, v_loc
  FROM profiles WHERE id = p_profile_id;

  IF email_ok THEN ver_pts := ver_pts + 5; END IF;
  IF phone_ok THEN ver_pts := ver_pts + 5; END IF;
  IF coalesce((SELECT identity_verified FROM profiles WHERE id=p_profile_id), false) THEN ver_pts := ver_pts + 10; END IF;
  IF coalesce((SELECT business_verified FROM profiles WHERE id=p_profile_id), false) THEN ver_pts := ver_pts + 7; END IF;
  IF coalesce((SELECT insurance_verified FROM profiles WHERE id=p_profile_id), false) THEN ver_pts := ver_pts + 5; END IF;
  IF coalesce((SELECT trusted_professional FROM profiles WHERE id=p_profile_id), false) THEN ver_pts := ver_pts + 5; END IF;
  ver_pts := LEAST(40, ver_pts);
  rev_pts := LEAST(20, (LEAST(v_reviews, 20) * 0.6) + (GREATEST(v_rating - 3, 0) * 4));
  proj_pts := LEAST(15, v_jobs * 1.5);
  resp_pts := LEAST(10, (v_response / 100.0) * 10);
  IF v_bio IS NOT NULL AND length(trim(v_bio)) > 40 THEN prof_pts := prof_pts + 3; END IF;
  IF v_phone IS NOT NULL AND length(trim(v_phone)) > 5 THEN prof_pts := prof_pts + 2; END IF;
  IF v_photo IS NOT NULL THEN prof_pts := prof_pts + 3; END IF;
  IF v_loc IS NOT NULL AND length(trim(v_loc)) > 2 THEN prof_pts := prof_pts + 2; END IF;
  prof_pts := LEAST(10, prof_pts);
  years := EXTRACT(EPOCH FROM (now() - COALESCE(v_created, now()))) / (365.25 * 24 * 3600);
  ten_pts := LEAST(5, years * 2.5);
  total := ROUND(LEAST(100, ver_pts + rev_pts + proj_pts + resp_pts + prof_pts + ten_pts)::numeric, 1);
  lvl := public.compute_trust_level(p_profile_id);

  INSERT INTO trust_scores AS ts (
    profile_id, score, verification_points, reviews_points, projects_points,
    response_points, profile_points, tenure_points, factors, recommendations, computed_at
  ) VALUES (
    p_profile_id, total, ver_pts, rev_pts, proj_pts, resp_pts, prof_pts, ten_pts,
    jsonb_build_object('verification', ver_pts, 'reviews', rev_pts, 'projects', proj_pts,
      'response', resp_pts, 'profile', prof_pts, 'tenure', ten_pts),
    '[]'::jsonb, now()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    score = EXCLUDED.score,
    verification_points = EXCLUDED.verification_points,
    reviews_points = EXCLUDED.reviews_points,
    projects_points = EXCLUDED.projects_points,
    response_points = EXCLUDED.response_points,
    profile_points = EXCLUDED.profile_points,
    tenure_points = EXCLUDED.tenure_points,
    factors = EXCLUDED.factors,
    computed_at = now();

  UPDATE profiles SET
    trust_score = total,
    trust_level = lvl,
    verification_level = public.compute_verification_level(p_profile_id),
    updated_at = now()
  WHERE id = p_profile_id;

  RETURN total;
END;
$$;
GRANT EXECUTE ON FUNCTION public.recompute_trust_score(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_verification_id uuid,
  p_action text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile uuid;
  v_status text;
BEGIN
  IF NOT public.is_site_owner() THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_action NOT IN ('approve','reject','request_info') THEN RAISE EXCEPTION 'invalid_action'; END IF;
  SELECT profile_id INTO v_profile FROM contractor_verifications WHERE id = p_verification_id;
  IF v_profile IS NULL THEN RETURN false; END IF;
  v_status := CASE p_action WHEN 'approve' THEN 'verified' WHEN 'reject' THEN 'rejected' ELSE 'needs_info' END;
  UPDATE contractor_verifications SET
    status = v_status, reviewer_id = auth.uid(), review_notes = p_notes,
    reviewed_at = now(), updated_at = now()
  WHERE id = p_verification_id;
  INSERT INTO verification_reviews (verification_id, reviewer_id, action, notes)
  VALUES (p_verification_id, auth.uid(), p_action, p_notes);
  INSERT INTO verification_history (verification_id, profile_id, actor_id, action, notes)
  VALUES (p_verification_id, v_profile, auth.uid(), p_action, p_notes);
  IF p_action = 'approve' THEN
    UPDATE profiles SET is_verified = true, verified_at = coalesce(verified_at, now()) WHERE id = v_profile;
  END IF;
  PERFORM public.recompute_trust_score(v_profile);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_profile_rating(p_profile_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE pid uuid := coalesce(p_profile_id, auth.uid());
BEGIN
  UPDATE profiles p SET
    rating = coalesce((SELECT round(avg(r.rating)::numeric, 2) FROM reviews r
      WHERE r.professional_id = pid AND coalesce(r.is_hidden,false)=false AND coalesce(r.is_approved,true)=true), 0),
    total_reviews = coalesce((SELECT count(*) FROM reviews r
      WHERE r.professional_id = pid AND coalesce(r.is_hidden,false)=false AND coalesce(r.is_approved,true)=true), 0),
    updated_at = now()
  WHERE p.id = pid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.refresh_profile_rating(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets (product names + app names)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('verification-docs', 'verification-docs', false, 26214400,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif','application/pdf']),
  ('verification-documents', 'verification-documents', false, 26214400,
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif','application/pdf']),
  ('chat-media', 'chat-media', true, 26214400,
    ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']),
  ('chat-files', 'chat-files', false, 26214400,
    ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('portfolio-media', 'portfolio-media', true, 52428800,
    ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']),
  ('portfolio', 'portfolio', true, 52428800,
    ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('project-files', 'project-files', true, 52428800,
    ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('avatars', 'avatars', true, 10485760,
    ARRAY['image/jpeg','image/png','image/webp']),
  ('company-logos', 'company-logos', true, 10485760,
    ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('company-gallery', 'company-gallery', true, 52428800,
    ARRAY['image/jpeg','image/png','image/webp']),
  ('ad-media', 'ad-media', true, 20971520,
    ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('review-media', 'review-media', true, 20971520,
    ARRAY['image/jpeg','image/png','image/webp']),
  ('quote-pdfs', 'quote-pdfs', false, 20971520,
    ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies (owner folder or site owner)
DO $$
BEGIN
  -- verification-docs
  EXECUTE 'DROP POLICY IF EXISTS "verification_docs_select" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "verification_docs_select" ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id IN ('verification-docs','verification-documents')
      AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_site_owner())
    )
  $p$;
  EXECUTE 'DROP POLICY IF EXISTS "verification_docs_insert" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "verification_docs_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id IN ('verification-docs','verification-documents')
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
  $p$;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'storage verification policies: %', SQLERRM;
END $$;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "public_media_read" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "public_media_read" ON storage.objects FOR SELECT TO public
    USING (bucket_id IN ('chat-media','portfolio-media','portfolio','project-files','avatars','company-logos','company-gallery','ad-media','review-media'))
  $p$;
  EXECUTE 'DROP POLICY IF EXISTS "auth_media_upload" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "auth_media_upload" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id IN ('chat-media','chat-files','portfolio-media','portfolio','project-files','avatars','company-logos','company-gallery','ad-media','review-media','quote-pdfs')
      AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_site_owner())
    )
  $p$;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'storage media policies: %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------------
-- Search / category / messaging indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_main ON categories(is_main, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_listings_active_type ON listings(status, listing_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Notification / verification reviews RLS if missing
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "verification_reviews_select" ON verification_reviews;
  CREATE POLICY "verification_reviews_select" ON verification_reviews
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM contractor_verifications v
        WHERE v.id = verification_id
          AND (v.profile_id = auth.uid() OR public.is_site_owner())
      )
    );
  DROP POLICY IF EXISTS "verification_reviews_insert" ON verification_reviews;
  CREATE POLICY "verification_reviews_insert" ON verification_reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id = auth.uid() AND public.is_site_owner());
EXCEPTION WHEN others THEN
  RAISE NOTICE 'verification_reviews RLS: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
