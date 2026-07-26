-- =============================================================================
-- DImarket Trust & Verification System (production)
-- Keeps contractor_verifications; adds status flags, trust_scores, history,
-- audit logs, views matching product names, level 0–6, expanded doc types.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extend contractor_verifications (acts as verification_requests)
-- ---------------------------------------------------------------------------
DO $$
DECLARE cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public' AND rel.relname = 'contractor_verifications'
    AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE contractor_verifications DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE contractor_verifications
  ADD CONSTRAINT contractor_verifications_status_check
  CHECK (status IN ('unverified', 'pending', 'verified', 'rejected', 'needs_info'));

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

-- Product alias view
CREATE OR REPLACE VIEW public.verification_requests AS
SELECT * FROM public.contractor_verifications;

-- ---------------------------------------------------------------------------
-- Document types (identity card / passport / driving license / address / etc.)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_doc_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE verification_documents
  ADD CONSTRAINT verification_documents_doc_type_check
  CHECK (doc_type IN (
    'identity', 'id_card', 'passport', 'driving_license',
    'proof_of_address',
    'business_registration', 'vat',
    'trade_license', 'professional_license', 'professional_certificate',
    'insurance', 'certification', 'portfolio_proof', 'background_check',
    'experience_proof', 'other'
  ));

-- ---------------------------------------------------------------------------
-- verification_status — per-profile boolean flags
-- ---------------------------------------------------------------------------
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
  trust_level smallint NOT NULL DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 6),
  request_status text NOT NULL DEFAULT 'unverified',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_status_select" ON verification_status;
CREATE POLICY "verification_status_select" ON verification_status
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "verification_status_upsert_own" ON verification_status;
CREATE POLICY "verification_status_upsert_own" ON verification_status
  FOR ALL TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  );

-- Profile mirror columns for fast search/filter
DO $$
BEGIN
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
    ALTER TABLE profiles ADD COLUMN trust_level smallint NOT NULL DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='trust_score') THEN
    ALTER TABLE profiles ADD COLUMN trust_score numeric(5,2) DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_trust_filters
  ON profiles (is_verified, business_verified, trusted_professional, is_premium);

-- ---------------------------------------------------------------------------
-- verification_history (canonical history; also keep verification_reviews)
-- ---------------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_verification_history_profile ON verification_history (profile_id, created_at DESC);

ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_history_select" ON verification_history;
CREATE POLICY "verification_history_select" ON verification_history
  FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  );

DROP POLICY IF EXISTS "verification_history_insert" ON verification_history;
CREATE POLICY "verification_history_insert" ON verification_history
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  );

-- verification_reviews RLS (was missing)
DROP POLICY IF EXISTS "verification_reviews_select" ON verification_reviews;
CREATE POLICY "verification_reviews_select" ON verification_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractor_verifications v
      WHERE v.id = verification_id
        AND (v.profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true))
    )
  );

DROP POLICY IF EXISTS "verification_reviews_insert" ON verification_reviews;
CREATE POLICY "verification_reviews_insert" ON verification_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  );

-- ---------------------------------------------------------------------------
-- trust_scores — factor breakdown 0–100
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trust_scores (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
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
CREATE POLICY "trust_scores_select" ON trust_scores
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "trust_scores_write_owner" ON trust_scores;
CREATE POLICY "trust_scores_write_owner" ON trust_scores
  FOR ALL TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
  );

-- ---------------------------------------------------------------------------
-- Audit logs (GDPR / secure review trail)
-- ---------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_verification_audit_created ON verification_audit_logs (created_at DESC);

ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_audit_owner" ON verification_audit_logs;
CREATE POLICY "verification_audit_owner" ON verification_audit_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true));

DROP POLICY IF EXISTS "verification_audit_insert" ON verification_audit_logs;
CREATE POLICY "verification_audit_insert" ON verification_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true));

-- ---------------------------------------------------------------------------
-- Storage: allow HEIC
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'
]
WHERE id = 'verification-docs';

-- ---------------------------------------------------------------------------
-- Compute trust level 0–6 + sync flags
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_trust_level(p_profile_id uuid)
RETURNS smallint
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  email_ok boolean;
  phone_ok boolean;
  identity_ok boolean;
  license_ok boolean;
  business_ok boolean;
  insurance_ok boolean;
  address_ok boolean;
  vat_ok boolean;
  v_status text;
  premium_ok boolean;
BEGIN
  SELECT
    email_verified_at IS NOT NULL,
    phone_verified_at IS NOT NULL,
    COALESCE(is_premium, false)
  INTO email_ok, phone_ok, premium_ok
  FROM profiles WHERE id = p_profile_id;

  SELECT status INTO v_status FROM contractor_verifications WHERE profile_id = p_profile_id LIMIT 1;

  SELECT
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type IN ('identity','id_card','passport','driving_license')),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type IN ('trade_license','professional_license','professional_certificate')),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type IN ('business_registration')),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'insurance'),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'proof_of_address'),
    EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'vat')
  INTO identity_ok, license_ok, business_ok, insurance_ok, address_ok, vat_ok;

  -- Level 6 Trusted: verified + identity + license + (business or insurance) + address
  IF COALESCE(v_status,'') = 'verified' AND identity_ok AND license_ok AND address_ok
     AND (business_ok OR insurance_ok) AND email_ok AND phone_ok THEN
    RETURN 6;
  END IF;
  -- Level 5 Business
  IF COALESCE(v_status,'') = 'verified' AND business_ok AND (vat_ok OR insurance_ok) AND email_ok AND phone_ok THEN
    RETURN 5;
  END IF;
  -- Level 4 Professional
  IF COALESCE(v_status,'') = 'verified' AND identity_ok AND license_ok AND email_ok AND phone_ok THEN
    RETURN 4;
  END IF;
  -- Level 3 Identity
  IF identity_ok AND email_ok AND phone_ok THEN
    RETURN 3;
  END IF;
  -- Level 2 Phone
  IF email_ok AND phone_ok THEN
    RETURN 2;
  END IF;
  -- Level 1 Email
  IF email_ok THEN
    RETURN 1;
  END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_verification_level(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE lvl smallint;
BEGIN
  lvl := public.compute_trust_level(p_profile_id);
  RETURN CASE lvl
    WHEN 6 THEN 'platinum'
    WHEN 5 THEN 'gold'
    WHEN 4 THEN 'gold'
    WHEN 3 THEN 'silver'
    WHEN 2 THEN 'bronze'
    WHEN 1 THEN 'bronze'
    ELSE 'none'
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_verification_status(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_ok boolean;
  phone_ok boolean;
  identity_ok boolean;
  address_ok boolean;
  license_ok boolean;
  business_ok boolean;
  insurance_ok boolean;
  vat_ok boolean;
  premium_ok boolean;
  v_status text;
  lvl smallint;
  trusted boolean;
BEGIN
  SELECT
    email_verified_at IS NOT NULL,
    phone_verified_at IS NOT NULL,
    COALESCE(is_premium, false)
  INTO email_ok, phone_ok, premium_ok
  FROM profiles WHERE id = p_profile_id;

  SELECT status INTO v_status FROM contractor_verifications WHERE profile_id = p_profile_id LIMIT 1;

  -- Document-based badges only after admin approval
  IF COALESCE(v_status,'') = 'verified' THEN
    SELECT
      EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
        WHERE v.profile_id = p_profile_id AND d.doc_type IN ('identity','id_card','passport','driving_license')),
      EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
        WHERE v.profile_id = p_profile_id AND d.doc_type = 'proof_of_address'),
      EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
        WHERE v.profile_id = p_profile_id AND d.doc_type IN ('trade_license','professional_license','professional_certificate')),
      EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
        WHERE v.profile_id = p_profile_id AND d.doc_type = 'business_registration'),
      EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
        WHERE v.profile_id = p_profile_id AND d.doc_type = 'insurance'),
      EXISTS (SELECT 1 FROM verification_documents d JOIN contractor_verifications v ON v.id = d.verification_id
        WHERE v.profile_id = p_profile_id AND d.doc_type = 'vat')
    INTO identity_ok, address_ok, license_ok, business_ok, insurance_ok, vat_ok;
  ELSE
    identity_ok := false;
    address_ok := false;
    license_ok := false;
    business_ok := false;
    insurance_ok := false;
    vat_ok := false;
  END IF;

  lvl := public.compute_trust_level(p_profile_id);
  trusted := (lvl >= 6);

  INSERT INTO verification_status AS vs (
    profile_id, email_verified, phone_verified, identity_verified, address_verified,
    license_verified, business_verified, insurance_verified, vat_verified,
    premium_verified, trusted_professional, trust_level, request_status, updated_at
  ) VALUES (
    p_profile_id, email_ok, phone_ok, identity_ok, address_ok,
    license_ok, business_ok, insurance_ok, vat_ok,
    premium_ok, trusted, lvl, COALESCE(v_status, 'unverified'), now()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    email_verified = EXCLUDED.email_verified,
    phone_verified = EXCLUDED.phone_verified,
    identity_verified = EXCLUDED.identity_verified,
    address_verified = EXCLUDED.address_verified,
    license_verified = EXCLUDED.license_verified,
    business_verified = EXCLUDED.business_verified,
    insurance_verified = EXCLUDED.insurance_verified,
    vat_verified = EXCLUDED.vat_verified,
    premium_verified = EXCLUDED.premium_verified,
    trusted_professional = EXCLUDED.trusted_professional,
    trust_level = EXCLUDED.trust_level,
    request_status = EXCLUDED.request_status,
    updated_at = now();

  UPDATE profiles SET
    identity_verified = identity_ok,
    address_verified = address_ok,
    license_verified = license_ok,
    business_verified = business_ok,
    insurance_verified = insurance_ok,
    vat_verified = vat_ok,
    trusted_professional = trusted,
    trust_level = lvl,
    is_verified = CASE WHEN COALESCE(v_status,'') = 'verified' OR lvl >= 3 THEN true ELSE is_verified END,
    verification_level = public.compute_verification_level(p_profile_id),
    verified_at = CASE WHEN COALESCE(v_status,'') = 'verified' AND verified_at IS NULL THEN now() ELSE verified_at END,
    updated_at = now()
  WHERE id = p_profile_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Trust score computation (0–100)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_trust_score(p_profile_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ver_pts numeric := 0;
  rev_pts numeric := 0;
  proj_pts numeric := 0;
  resp_pts numeric := 0;
  prof_pts numeric := 0;
  ten_pts numeric := 0;
  total numeric := 0;
  v_rating numeric;
  v_reviews int;
  v_jobs int;
  v_response numeric;
  v_created timestamptz;
  v_bio text;
  v_phone text;
  v_photo text;
  v_loc text;
  years numeric;
  recs jsonb := '[]'::jsonb;
  vs verification_status%ROWTYPE;
BEGIN
  PERFORM public.sync_verification_status(p_profile_id);

  SELECT * INTO vs FROM verification_status WHERE profile_id = p_profile_id;

  IF vs.email_verified THEN ver_pts := ver_pts + 5; END IF;
  IF vs.phone_verified THEN ver_pts := ver_pts + 5; END IF;
  IF vs.identity_verified THEN ver_pts := ver_pts + 10; END IF;
  IF vs.address_verified THEN ver_pts := ver_pts + 5; END IF;
  IF vs.license_verified THEN ver_pts := ver_pts + 8; END IF;
  IF vs.business_verified THEN ver_pts := ver_pts + 7; END IF;
  IF vs.insurance_verified THEN ver_pts := ver_pts + 5; END IF;
  IF vs.vat_verified THEN ver_pts := ver_pts + 3; END IF;
  IF vs.premium_verified THEN ver_pts := ver_pts + 2; END IF;
  IF vs.trusted_professional THEN ver_pts := ver_pts + 5; END IF;
  -- max verification bucket ~55, normalize to 40
  ver_pts := LEAST(40, ver_pts);

  SELECT COALESCE(rating,0), COALESCE(total_reviews,0), COALESCE(completed_jobs,0),
         COALESCE(response_rate,0), created_at, bio, phone,
         COALESCE(profile_photo, avatar_url), location
  INTO v_rating, v_reviews, v_jobs, v_response, v_created, v_bio, v_phone, v_photo, v_loc
  FROM profiles WHERE id = p_profile_id;

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

  IF NOT COALESCE(vs.phone_verified, false) THEN
    recs := recs || '["Verify your phone number"]'::jsonb;
  END IF;
  IF NOT COALESCE(vs.identity_verified, false) THEN
    recs := recs || '["Upload and verify an identity document"]'::jsonb;
  END IF;
  IF NOT COALESCE(vs.license_verified, false) THEN
    recs := recs || '["Add a professional license"]'::jsonb;
  END IF;
  IF NOT COALESCE(vs.insurance_verified, false) THEN
    recs := recs || '["Upload liability insurance"]'::jsonb;
  END IF;
  IF NOT COALESCE(vs.address_verified, false) THEN
    recs := recs || '["Verify your address with a utility bill"]'::jsonb;
  END IF;
  IF v_bio IS NULL OR length(trim(COALESCE(v_bio,''))) < 40 THEN
    recs := recs || '["Complete your profile bio"]'::jsonb;
  END IF;
  IF v_jobs < 3 THEN
    recs := recs || '["Add more completed projects"]'::jsonb;
  END IF;
  IF v_reviews < 3 THEN
    recs := recs || '["Collect more client reviews"]'::jsonb;
  END IF;

  INSERT INTO trust_scores AS ts (
    profile_id, score, verification_points, reviews_points, projects_points,
    response_points, profile_points, tenure_points, factors, recommendations, computed_at
  ) VALUES (
    p_profile_id, total, ver_pts, rev_pts, proj_pts, resp_pts, prof_pts, ten_pts,
    jsonb_build_object(
      'verification', ver_pts, 'reviews', rev_pts, 'projects', proj_pts,
      'response', resp_pts, 'profile', prof_pts, 'tenure', ten_pts
    ),
    recs, now()
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
    recommendations = EXCLUDED.recommendations,
    computed_at = now();

  UPDATE profiles SET trust_score = total, updated_at = now() WHERE id = p_profile_id;

  RETURN total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recompute_trust_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_verification_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_trust_level(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin review RPC
-- ---------------------------------------------------------------------------
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
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF p_action NOT IN ('approve', 'reject', 'request_info') THEN
    RAISE EXCEPTION 'invalid_action';
  END IF;

  SELECT profile_id INTO v_profile FROM contractor_verifications WHERE id = p_verification_id;
  IF v_profile IS NULL THEN RETURN false; END IF;

  v_status := CASE p_action
    WHEN 'approve' THEN 'verified'
    WHEN 'reject' THEN 'rejected'
    ELSE 'needs_info'
  END;

  UPDATE contractor_verifications SET
    status = v_status,
    reviewer_id = auth.uid(),
    review_notes = p_notes,
    reviewed_at = now(),
    trust_score = CASE p_action WHEN 'approve' THEN 85 WHEN 'reject' THEN 20 ELSE 40 END,
    updated_at = now()
  WHERE id = p_verification_id;

  INSERT INTO verification_reviews (verification_id, reviewer_id, action, notes)
  VALUES (p_verification_id, auth.uid(), p_action, p_notes);

  INSERT INTO verification_history (verification_id, profile_id, actor_id, action, notes)
  VALUES (p_verification_id, v_profile, auth.uid(), p_action, p_notes);

  INSERT INTO verification_audit_logs (profile_id, actor_id, action, entity_type, entity_id, detail)
  VALUES (v_profile, auth.uid(), p_action, 'verification', p_verification_id,
          jsonb_build_object('notes', p_notes, 'status', v_status));

  PERFORM public.recompute_trust_score(v_profile);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_review_verification(uuid, text, text) TO authenticated;

-- Triggers
CREATE OR REPLACE FUNCTION public.trg_sync_trust_after_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE pid uuid;
BEGIN
  IF TG_TABLE_NAME = 'contractor_verifications' THEN
    pid := COALESCE(NEW.profile_id, OLD.profile_id);
  ELSIF TG_TABLE_NAME = 'verification_documents' THEN
    SELECT profile_id INTO pid FROM contractor_verifications
    WHERE id = COALESCE(NEW.verification_id, OLD.verification_id);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    pid := COALESCE(NEW.id, OLD.id);
  END IF;
  IF pid IS NOT NULL THEN
    PERFORM public.recompute_trust_score(pid);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_cv_trust ON contractor_verifications;
CREATE TRIGGER trg_cv_trust
  AFTER INSERT OR UPDATE OF status ON contractor_verifications
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_trust_after_verification();

DROP TRIGGER IF EXISTS trg_vd_trust ON verification_documents;
CREATE TRIGGER trg_vd_trust
  AFTER INSERT OR DELETE ON verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_trust_after_verification();
