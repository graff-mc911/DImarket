-- Complete verification system: address docs, badge flags, needs_info, review history RLS

-- ---------------------------------------------------------------------------
-- Status: needs_info (request additional documents)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'contractor_verifications'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE contractor_verifications DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE contractor_verifications
  ADD CONSTRAINT contractor_verifications_status_check
  CHECK (status IN ('unverified', 'pending', 'verified', 'rejected', 'needs_info'));

-- Address fields on verification request
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contractor_verifications' AND column_name = 'address_line'
  ) THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_line text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contractor_verifications' AND column_name = 'address_city'
  ) THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_city text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contractor_verifications' AND column_name = 'address_country'
  ) THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_country text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contractor_verifications' AND column_name = 'address_postal_code'
  ) THEN
    ALTER TABLE contractor_verifications ADD COLUMN address_postal_code text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Doc type: proof_of_address
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_doc_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE verification_documents
  ADD CONSTRAINT verification_documents_doc_type_check
  CHECK (doc_type IN (
    'identity',
    'business_registration',
    'trade_license',
    'vat',
    'insurance',
    'certification',
    'portfolio_proof',
    'background_check',
    'proof_of_address',
    'professional_license',
    'other'
  ));

-- ---------------------------------------------------------------------------
-- Public badge flags on profiles
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'identity_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN identity_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'business_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN business_verified boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'address_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address_verified boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Sync badge flags + level from documents / verification status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_verification_badges(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  has_identity boolean;
  has_company boolean;
  has_address boolean;
  has_license boolean;
BEGIN
  SELECT status INTO v_status
  FROM contractor_verifications
  WHERE profile_id = p_profile_id
  LIMIT 1;

  SELECT
    EXISTS (
      SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'identity'
    ),
    EXISTS (
      SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type IN ('business_registration', 'vat')
    ),
    EXISTS (
      SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'proof_of_address'
    ),
    EXISTS (
      SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id
        AND d.doc_type IN ('trade_license', 'professional_license')
    )
  INTO has_identity, has_company, has_address, has_license;

  UPDATE profiles
  SET
    identity_verified = (COALESCE(v_status, '') = 'verified' AND has_identity),
    business_verified = (COALESCE(v_status, '') = 'verified' AND has_company),
    address_verified = (COALESCE(v_status, '') = 'verified' AND has_address),
    is_verified = CASE
      WHEN COALESCE(v_status, '') = 'verified' THEN true
      ELSE is_verified
    END,
    verified_at = CASE
      WHEN COALESCE(v_status, '') = 'verified' AND verified_at IS NULL THEN now()
      ELSE verified_at
    END,
    verification_level = compute_verification_level(p_profile_id),
    updated_at = now()
  WHERE id = p_profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION compute_verification_level(p_profile_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  has_phone boolean;
  has_email boolean;
  v_status text;
  has_identity boolean;
  has_company boolean;
  has_insurance boolean;
  has_license boolean;
  has_bg boolean;
  has_address boolean;
BEGIN
  SELECT
    (
      (phone IS NOT NULL AND length(trim(phone)) > 5)
      OR phone_verified_at IS NOT NULL
    ),
    (email_verified_at IS NOT NULL)
  INTO has_phone, has_email
  FROM profiles WHERE id = p_profile_id;

  SELECT status INTO v_status
  FROM contractor_verifications WHERE profile_id = p_profile_id
  LIMIT 1;

  SELECT
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'identity'),
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type IN ('business_registration', 'vat')),
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'insurance'),
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id
        AND d.doc_type IN ('trade_license', 'professional_license')),
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'background_check'),
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'proof_of_address')
  INTO has_identity, has_company, has_insurance, has_license, has_bg, has_address;

  IF has_phone AND has_email AND COALESCE(v_status, '') = 'verified'
     AND has_identity AND has_company AND has_insurance AND has_license
     AND has_bg AND has_address THEN
    RETURN 'platinum';
  END IF;

  IF has_phone AND has_email AND COALESCE(v_status, '') = 'verified'
     AND has_insurance AND has_license AND has_address THEN
    RETURN 'gold';
  END IF;

  IF has_phone AND has_email AND (COALESCE(v_status, '') = 'verified' OR has_identity OR has_company) THEN
    RETURN 'silver';
  END IF;

  IF has_phone AND has_email THEN
    RETURN 'bronze';
  END IF;

  RETURN 'none';
END;
$$;

-- Keep badges in sync when docs / verification rows change
CREATE OR REPLACE FUNCTION public.trg_sync_verification_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  IF TG_TABLE_NAME = 'contractor_verifications' THEN
    pid := COALESCE(NEW.profile_id, OLD.profile_id);
  ELSIF TG_TABLE_NAME = 'verification_documents' THEN
    SELECT profile_id INTO pid
    FROM contractor_verifications
    WHERE id = COALESCE(NEW.verification_id, OLD.verification_id);
  END IF;

  IF pid IS NOT NULL THEN
    PERFORM public.sync_verification_badges(pid);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_contractor_verifications_badges ON contractor_verifications;
CREATE TRIGGER trg_contractor_verifications_badges
  AFTER INSERT OR UPDATE OF status ON contractor_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_verification_badges();

DROP TRIGGER IF EXISTS trg_verification_documents_badges ON verification_documents;
CREATE TRIGGER trg_verification_documents_badges
  AFTER INSERT OR DELETE ON verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_verification_badges();

-- ---------------------------------------------------------------------------
-- History RLS (was missing — inserts could fail silently)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "verification_reviews_select" ON verification_reviews;
CREATE POLICY "verification_reviews_select" ON verification_reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractor_verifications v
      WHERE v.id = verification_id
        AND (
          v.profile_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true)
        )
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
-- Admin review RPC (approve / reject / request_info) + history
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
  v_trust numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_action NOT IN ('approve', 'reject', 'request_info') THEN
    RAISE EXCEPTION 'invalid_action';
  END IF;

  SELECT profile_id INTO v_profile
  FROM contractor_verifications
  WHERE id = p_verification_id;

  IF v_profile IS NULL THEN
    RETURN false;
  END IF;

  v_status := CASE p_action
    WHEN 'approve' THEN 'verified'
    WHEN 'reject' THEN 'rejected'
    ELSE 'needs_info'
  END;

  v_trust := CASE p_action
    WHEN 'approve' THEN 85
    WHEN 'reject' THEN 20
    ELSE 40
  END;

  UPDATE contractor_verifications
  SET
    status = v_status,
    reviewer_id = auth.uid(),
    review_notes = p_notes,
    reviewed_at = now(),
    trust_score = v_trust,
    updated_at = now()
  WHERE id = p_verification_id;

  INSERT INTO verification_reviews (verification_id, reviewer_id, action, notes)
  VALUES (p_verification_id, auth.uid(), p_action, p_notes);

  PERFORM public.sync_verification_badges(v_profile);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_review_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_verification_badges(uuid) TO authenticated;

-- Backfill badge flags for already-verified contractors
UPDATE profiles p
SET
  verification_level = compute_verification_level(p.id);

SELECT public.sync_verification_badges(v.profile_id)
FROM contractor_verifications v
WHERE v.status = 'verified';
