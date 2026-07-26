-- Premium Professional Profile: slug URLs and extended public profile fields

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'slug'
  ) THEN
    ALTER TABLE profiles ADD COLUMN slug text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cover_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profession'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profession text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'country_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE profiles ADD COLUMN years_experience integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'response_time_hours'
  ) THEN
    ALTER TABLE profiles ADD COLUMN response_time_hours numeric(6,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'travel_radius_km'
  ) THEN
    ALTER TABLE profiles ADD COLUMN travel_radius_km integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'service_countries'
  ) THEN
    ALTER TABLE profiles ADD COLUMN service_countries text[] NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'service_cities'
  ) THEN
    ALTER TABLE profiles ADD COLUMN service_cities text[] NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'working_hours'
  ) THEN
    ALTER TABLE profiles ADD COLUMN working_hours jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'emergency_available'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_available boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'weekend_available'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weekend_available boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'insurance_info'
  ) THEN
    ALTER TABLE profiles ADD COLUMN insurance_info text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'warranty_info'
  ) THEN
    ALTER TABLE profiles ADD COLUMN warranty_info text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN whatsapp text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'telegram'
  ) THEN
    ALTER TABLE profiles ADD COLUMN telegram text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'social_links'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_links jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'recommendation_rate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN recommendation_rate numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'repeat_customers'
  ) THEN
    ALTER TABLE profiles ADD COLUMN repeat_customers integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_public text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug_unique
  ON profiles (slug)
  WHERE slug IS NOT NULL AND slug <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_slug_lookup
  ON profiles (slug)
  WHERE is_professional = true AND slug IS NOT NULL;

-- Backfill slugs for professionals
UPDATE profiles p
SET slug = trim(both '-' from lower(
    regexp_replace(
      regexp_replace(coalesce(nullif(trim(p.full_name), ''), 'pro'), '[^a-zA-Z0-9]+', '-', 'g'),
      '-+',
      '-',
      'g'
    )
  )) || '-' || substr(replace(p.id::text, '-', ''), 1, 8)
WHERE p.is_professional = true
  AND (p.slug IS NULL OR p.slug = '');

CREATE TABLE IF NOT EXISTS professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_slug text,
  name text NOT NULL,
  description text,
  price_from numeric(12,2),
  price_to numeric(12,2),
  currency text NOT NULL DEFAULT 'EUR',
  unit text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professional_services_profile
  ON professional_services(profile_id, sort_order);

CREATE TABLE IF NOT EXISTS professional_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_slug text,
  location text,
  budget numeric(12,2),
  currency text NOT NULL DEFAULT 'EUR',
  duration_days integer,
  completed_at date,
  customer_review text,
  customer_rating integer CHECK (customer_rating IS NULL OR (customer_rating BETWEEN 1 AND 5)),
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professional_projects_profile
  ON professional_projects(profile_id, completed_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS professional_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('certificate', 'license')),
  title text NOT NULL,
  issuer text,
  credential_number text,
  year integer,
  expires_at date,
  document_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_professional_credentials_profile
  ON professional_credentials(profile_id, kind, sort_order);

CREATE TABLE IF NOT EXISTS profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_reports_profile ON profile_reports(profile_id, created_at DESC);

ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pro_services_select" ON professional_services;
CREATE POLICY "pro_services_select" ON professional_services FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "pro_services_write" ON professional_services;
CREATE POLICY "pro_services_write" ON professional_services FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  ))
  WITH CHECK (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  ));

DROP POLICY IF EXISTS "pro_projects_select" ON professional_projects;
CREATE POLICY "pro_projects_select" ON professional_projects FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "pro_projects_write" ON professional_projects;
CREATE POLICY "pro_projects_write" ON professional_projects FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  ))
  WITH CHECK (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  ));

DROP POLICY IF EXISTS "pro_credentials_select" ON professional_credentials;
CREATE POLICY "pro_credentials_select" ON professional_credentials FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "pro_credentials_write" ON professional_credentials;
CREATE POLICY "pro_credentials_write" ON professional_credentials FOR ALL TO authenticated
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  ))
  WITH CHECK (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
  ));

DROP POLICY IF EXISTS "profile_reports_insert" ON profile_reports;
CREATE POLICY "profile_reports_insert" ON profile_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND length(trim(reason)) > 0);

DROP POLICY IF EXISTS "profile_reports_select_admin" ON profile_reports;
CREATE POLICY "profile_reports_select_admin" ON profile_reports FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );
