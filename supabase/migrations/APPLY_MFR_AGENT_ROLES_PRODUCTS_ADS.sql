-- Manufacturer + Commercial Agent first-class roles + products + ad linkage
-- Does NOT recreate manufacturer_profiles / agent_profiles.

-- ---------------------------------------------------------------------------
-- 1) Widen profiles.user_role CHECK
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'profiles'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%user_role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_role_check
  CHECK (
    user_role IS NULL OR user_role IN (
      'client',
      'professional',
      'company',
      'owner',
      'manufacturer',
      'commercial_agent'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Auth trigger: map new roles (advertiser stays client)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  role_text text;
  is_prof boolean;
  display_name text;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  role_text := lower(COALESCE(meta->>'user_role', 'client'));

  IF role_text = 'advertiser' THEN
    role_text := 'client';
  ELSIF role_text NOT IN (
    'client', 'professional', 'company', 'owner', 'manufacturer', 'commercial_agent'
  ) THEN
    role_text := 'client';
  END IF;

  is_prof := role_text IN ('professional', 'company', 'manufacturer', 'commercial_agent');

  display_name := nullif(trim(meta->>'full_name'), '');
  IF display_name IS NULL THEN
    display_name := split_part(COALESCE(NEW.email, 'user'), '@', 1);
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    user_role,
    is_professional,
    phone,
    location
  )
  VALUES (
    NEW.id,
    display_name,
    role_text,
    is_prof,
    nullif(trim(meta->>'phone'), ''),
    nullif(trim(meta->>'location'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    user_role = CASE
      WHEN profiles.user_role IS NOT NULL AND profiles.user_role <> 'client' THEN profiles.user_role
      ELSE EXCLUDED.user_role
    END,
    is_professional = profiles.is_professional OR EXCLUDED.is_professional,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    location = COALESCE(EXCLUDED.location, profiles.location),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) Manufacturer products (new table — products text[] stays as tags)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manufacturer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturer_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  category text,
  subcategory text,
  description text DEFAULT '',
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_urls text[] NOT NULL DEFAULT '{}',
  document_urls text[] NOT NULL DEFAULT '{}',
  catalogue_url text,
  countries_available text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manufacturer_products_mfr_idx
  ON public.manufacturer_products (manufacturer_id);
CREATE INDEX IF NOT EXISTS manufacturer_products_published_idx
  ON public.manufacturer_products (is_published);
CREATE INDEX IF NOT EXISTS manufacturer_products_category_idx
  ON public.manufacturer_products (category);

ALTER TABLE public.manufacturer_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published manufacturer products" ON public.manufacturer_products;
CREATE POLICY "Public can view published manufacturer products"
  ON public.manufacturer_products FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM public.manufacturer_profiles mp
      WHERE mp.id = manufacturer_id AND mp.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners manage manufacturer products" ON public.manufacturer_products;
CREATE POLICY "Owners manage manufacturer products"
  ON public.manufacturer_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.manufacturer_profiles mp
      WHERE mp.id = manufacturer_id AND mp.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.manufacturer_profiles mp
      WHERE mp.id = manufacturer_id AND mp.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Ad campaign linkage + category targeting (extend, do not replace)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS manufacturer_profile_id uuid REFERENCES public.manufacturer_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_profile_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_categories text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS ad_campaigns_mfr_idx
  ON public.ad_campaigns (manufacturer_profile_id)
  WHERE manufacturer_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ad_campaigns_agent_idx
  ON public.ad_campaigns (agent_profile_id)
  WHERE agent_profile_id IS NOT NULL;

COMMENT ON COLUMN public.ad_campaigns.manufacturer_profile_id IS
  'Optional link when campaign created from manufacturer dashboard';
COMMENT ON COLUMN public.ad_campaigns.agent_profile_id IS
  'Optional link when campaign created from commercial agent dashboard';
COMMENT ON COLUMN public.ad_campaigns.target_categories IS
  'Optional category slugs for soft targeting (client-side filter)';
