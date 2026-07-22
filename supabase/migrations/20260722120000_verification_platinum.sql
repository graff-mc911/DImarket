-- Verification system: Platinum tier + background check + contact flags

-- Drop old CHECK and add platinum
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_level_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_verification_level_check
    CHECK (verification_level IN ('none', 'bronze', 'silver', 'gold', 'platinum'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verified_at timestamptz;
  END IF;
END $$;

-- Allow background_check on verification_documents (relax check if present)
DO $$
BEGIN
  ALTER TABLE verification_documents DROP CONSTRAINT IF EXISTS verification_documents_doc_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
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
      'other'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
BEGIN
  SELECT
    (
      (phone IS NOT NULL AND length(trim(phone)) > 5)
      OR phone_verified_at IS NOT NULL
    ),
    (
      email_verified_at IS NOT NULL
      OR true
    )
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
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'trade_license'),
    EXISTS (SELECT 1 FROM verification_documents d
      JOIN contractor_verifications v ON v.id = d.verification_id
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'background_check')
  INTO has_identity, has_company, has_insurance, has_license, has_bg;

  -- Platinum: full trust stack + background check
  IF has_phone AND has_email AND COALESCE(v_status, '') = 'verified'
     AND has_identity AND has_company AND has_insurance AND has_license AND has_bg THEN
    RETURN 'platinum';
  END IF;

  -- Gold: verified + insurance + license
  IF has_phone AND has_email AND COALESCE(v_status, '') = 'verified'
     AND has_insurance AND has_license THEN
    RETURN 'gold';
  END IF;

  -- Silver: contacts + identity/company or verified
  IF has_phone AND has_email AND (COALESCE(v_status, '') = 'verified' OR has_identity OR has_company) THEN
    RETURN 'silver';
  END IF;

  -- Bronze: email + phone
  IF has_phone AND has_email THEN
    RETURN 'bronze';
  END IF;

  RETURN 'none';
END;
$$;

-- Recompute all
UPDATE profiles p
SET verification_level = compute_verification_level(p.id);
