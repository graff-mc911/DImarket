-- Lead Marketplace MVP: project wizard fields, applications, quotes, verification tiers

-- =============================================================================
-- 1. LISTINGS — project fields
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'budget_min') THEN
    ALTER TABLE listings ADD COLUMN budget_min numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'budget_max') THEN
    ALTER TABLE listings ADD COLUMN budget_max numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'deadline_type') THEN
    ALTER TABLE listings ADD COLUMN deadline_type text CHECK (deadline_type IN ('flexible', 'asap', 'date'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'deadline_at') THEN
    ALTER TABLE listings ADD COLUMN deadline_at date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'urgency') THEN
    ALTER TABLE listings ADD COLUMN urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'preferred_language') THEN
    ALTER TABLE listings ADD COLUMN preferred_language text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'wizard_completed') THEN
    ALTER TABLE listings ADD COLUMN wizard_completed boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'postal_code') THEN
    ALTER TABLE listings ADD COLUMN postal_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'country_name') THEN
    ALTER TABLE listings ADD COLUMN country_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'city_name') THEN
    ALTER TABLE listings ADD COLUMN city_name text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_wizard_active
  ON listings (status, listing_type, created_at DESC)
  WHERE listing_type = 'service_request' AND status = 'active';

-- =============================================================================
-- 2. PROJECT FILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  mime_type text,
  file_name text,
  kind text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video', 'pdf', 'plan', 'other')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_listing ON project_files(listing_id);

-- =============================================================================
-- 3. PROJECT APPLICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'withdrawn', 'accepted', 'rejected')),
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

-- =============================================================================
-- 4. QUOTES
-- =============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES project_applications(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  labor jsonb NOT NULL DEFAULT '[]'::jsonb,
  vat_percent numeric(5,2) NOT NULL DEFAULT 20,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  signed_at timestamptz,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_application ON quotes(application_id);
CREATE INDEX IF NOT EXISTS idx_quotes_professional ON quotes(professional_id, status);

-- =============================================================================
-- 5. PROFILES — verification_level
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_level') THEN
    ALTER TABLE profiles ADD COLUMN verification_level text NOT NULL DEFAULT 'none'
      CHECK (verification_level IN ('none', 'bronze', 'silver', 'gold'));
  END IF;
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
BEGIN
  SELECT
    (phone IS NOT NULL AND length(trim(phone)) > 5),
    true
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
      WHERE v.profile_id = p_profile_id AND d.doc_type = 'trade_license')
  INTO has_identity, has_company, has_insurance, has_license;

  IF has_phone AND has_email AND COALESCE(v_status, '') = 'verified'
     AND has_insurance AND has_license THEN
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

CREATE OR REPLACE FUNCTION refresh_profile_verification_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    pid := NEW.id;
  ELSIF TG_TABLE_NAME = 'contractor_verifications' THEN
    pid := NEW.profile_id;
  ELSIF TG_TABLE_NAME = 'verification_documents' THEN
    SELECT profile_id INTO pid FROM contractor_verifications WHERE id = NEW.verification_id;
  END IF;

  IF pid IS NOT NULL THEN
    UPDATE profiles
    SET verification_level = compute_verification_level(pid),
        updated_at = now()
    WHERE id = pid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_verification_level ON profiles;
CREATE TRIGGER trg_profiles_verification_level
  AFTER INSERT OR UPDATE OF phone ON profiles
  FOR EACH ROW EXECUTE FUNCTION refresh_profile_verification_level();

DROP TRIGGER IF EXISTS trg_contractor_verifications_level ON contractor_verifications;
CREATE TRIGGER trg_contractor_verifications_level
  AFTER INSERT OR UPDATE OF status ON contractor_verifications
  FOR EACH ROW EXECUTE FUNCTION refresh_profile_verification_level();

DROP TRIGGER IF EXISTS trg_verification_documents_level ON verification_documents;
CREATE TRIGGER trg_verification_documents_level
  AFTER INSERT OR DELETE ON verification_documents
  FOR EACH ROW EXECUTE FUNCTION refresh_profile_verification_level();

UPDATE profiles p
SET verification_level = compute_verification_level(p.id)
WHERE p.is_professional = true OR p.user_role IN ('professional', 'company');

-- =============================================================================
-- 6. STORAGE bucket for project files
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. RLS
-- =============================================================================
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_files_select" ON project_files;
CREATE POLICY "project_files_select" ON project_files FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND (l.status = 'active' OR l.author_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "project_files_insert" ON project_files;
CREATE POLICY "project_files_insert" ON project_files FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_files_delete" ON project_files;
CREATE POLICY "project_files_delete" ON project_files FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_applications_select" ON project_applications;
CREATE POLICY "project_applications_select" ON project_applications FOR SELECT TO authenticated
  USING (
    professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_applications_insert" ON project_applications;
CREATE POLICY "project_applications_insert" ON project_applications FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "project_applications_update" ON project_applications;
CREATE POLICY "project_applications_update" ON project_applications FOR UPDATE TO authenticated
  USING (
    professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "quotes_select" ON quotes;
CREATE POLICY "quotes_select" ON quotes FOR SELECT TO authenticated
  USING (
    professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "quotes_insert" ON quotes;
CREATE POLICY "quotes_insert" ON quotes FOR INSERT TO authenticated
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "quotes_update" ON quotes;
CREATE POLICY "quotes_update" ON quotes FOR UPDATE TO authenticated
  USING (professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid()));

DROP POLICY IF EXISTS "project_files_storage_read" ON storage.objects;
CREATE POLICY "project_files_storage_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "project_files_storage_upload" ON storage.objects;
CREATE POLICY "project_files_storage_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "project_files_storage_delete" ON storage.objects;
CREATE POLICY "project_files_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
