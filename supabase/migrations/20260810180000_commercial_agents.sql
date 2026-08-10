-- Commercial Agents / Representation marketplace (Phase 1)
-- Reuses: profiles (identity), conversations/messages, notifications, saved_items

-- ---------------------------------------------------------------------------
-- Extend saved_items for B2B favorites
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'saved_items' AND constraint_name LIKE '%item_type%'
  ) THEN
    ALTER TABLE public.saved_items DROP CONSTRAINT IF EXISTS saved_items_item_type_check;
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

ALTER TABLE public.saved_items DROP CONSTRAINT IF EXISTS saved_items_item_type_check;
ALTER TABLE public.saved_items
  ADD CONSTRAINT saved_items_item_type_check
  CHECK (item_type IN (
    'listing',
    'profile',
    'manufacturer',
    'agent',
    'opportunity'
  ));

-- ---------------------------------------------------------------------------
-- Manufacturer profiles (FK → profiles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manufacturer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  company_name text NOT NULL,
  logo_url text,
  description text DEFAULT '',
  website text,
  country text,
  headquarters text,
  contact_person text,
  public_email text,
  public_phone text,
  show_public_contacts boolean NOT NULL DEFAULT false,
  categories text[] NOT NULL DEFAULT '{}',
  products text[] NOT NULL DEFAULT '{}',
  target_markets text[] NOT NULL DEFAULT '{}',
  countries_available text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  minimum_experience_years int,
  required_experience text,
  commission_model text,
  commission_min numeric,
  commission_max numeric,
  exclusive_representation boolean NOT NULL DEFAULT false,
  non_exclusive_representation boolean NOT NULL DEFAULT true,
  distributor_available boolean NOT NULL DEFAULT false,
  agent_required boolean NOT NULL DEFAULT true,
  company_size text,
  founded_year int,
  certifications text[] NOT NULL DEFAULT '{}',
  catalog_url text,
  images text[] NOT NULL DEFAULT '{}',
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manufacturer_profiles_country_idx
  ON public.manufacturer_profiles (country);
CREATE INDEX IF NOT EXISTS manufacturer_profiles_categories_idx
  ON public.manufacturer_profiles USING gin (categories);
CREATE INDEX IF NOT EXISTS manufacturer_profiles_published_idx
  ON public.manufacturer_profiles (is_published, verification_status);

-- ---------------------------------------------------------------------------
-- Commercial agent profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  profile_photo_url text,
  company_name text,
  description text DEFAULT '',
  country text,
  city text,
  service_regions text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  categories text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  years_experience int,
  previous_experience text,
  client_types text[] NOT NULL DEFAULT '{}',
  territory text,
  representation_type text,
  current_manufacturers text[] NOT NULL DEFAULT '{}',
  available_for_new_brands boolean NOT NULL DEFAULT true,
  preferred_commission text,
  portfolio_urls text[] NOT NULL DEFAULT '{}',
  website text,
  linkedin_url text,
  show_public_contacts boolean NOT NULL DEFAULT false,
  public_email text,
  public_phone text,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified')),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_profiles_country_idx ON public.agent_profiles (country);
CREATE INDEX IF NOT EXISTS agent_profiles_categories_idx
  ON public.agent_profiles USING gin (categories);
CREATE INDEX IF NOT EXISTS agent_profiles_published_idx
  ON public.agent_profiles (is_published, available_for_new_brands);

-- ---------------------------------------------------------------------------
-- Representation opportunities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.representation_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturer_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text,
  products text[] NOT NULL DEFAULT '{}',
  target_country text,
  target_regions text[] NOT NULL DEFAULT '{}',
  target_customer_types text[] NOT NULL DEFAULT '{}',
  required_experience text,
  required_languages text[] NOT NULL DEFAULT '{}',
  commission_type text,
  commission_range text,
  exclusive boolean NOT NULL DEFAULT false,
  contract_type text,
  travel_required boolean NOT NULL DEFAULT false,
  remote_possible boolean NOT NULL DEFAULT true,
  minimum_requirements text,
  application_deadline date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'paused', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS representation_opportunities_status_idx
  ON public.representation_opportunities (status, target_country);
CREATE INDEX IF NOT EXISTS representation_opportunities_manufacturer_idx
  ON public.representation_opportunities (manufacturer_id);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.representation_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.representation_opportunities(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturer_profiles(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, agent_id)
);

CREATE INDEX IF NOT EXISTS representation_applications_agent_idx
  ON public.representation_applications (agent_id, status);
CREATE INDEX IF NOT EXISTS representation_applications_mfr_idx
  ON public.representation_applications (manufacturer_id, status);

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturer_profiles(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.representation_opportunities(id) ON DELETE SET NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_invitations_agent_idx
  ON public.agent_invitations (agent_id, status);
CREATE INDEX IF NOT EXISTS agent_invitations_mfr_idx
  ON public.agent_invitations (manufacturer_id, status);

-- ---------------------------------------------------------------------------
-- Reports (safety)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commercial_entity_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('manufacturer', 'agent', 'opportunity', 'message')),
  entity_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'spam', 'fraud', 'fake_company', 'incorrect_information', 'abuse', 'other'
  )),
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commercial_entity_reports_status_idx
  ON public.commercial_entity_reports (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Analytics events (B2B funnel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commercial_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commercial_analytics_events_name_idx
  ON public.commercial_analytics_events (event_name, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manufacturer_profiles_updated_at ON public.manufacturer_profiles;
CREATE TRIGGER manufacturer_profiles_updated_at
  BEFORE UPDATE ON public.manufacturer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS agent_profiles_updated_at ON public.agent_profiles;
CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS representation_opportunities_updated_at ON public.representation_opportunities;
CREATE TRIGGER representation_opportunities_updated_at
  BEFORE UPDATE ON public.representation_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS representation_applications_updated_at ON public.representation_applications;
CREATE TRIGGER representation_applications_updated_at
  BEFORE UPDATE ON public.representation_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS agent_invitations_updated_at ON public.agent_invitations;
CREATE TRIGGER agent_invitations_updated_at
  BEFORE UPDATE ON public.agent_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.manufacturer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representation_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representation_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_entity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_analytics_events ENABLE ROW LEVEL SECURITY;

-- Manufacturers: public read published; owner full access
DROP POLICY IF EXISTS manufacturer_profiles_select ON public.manufacturer_profiles;
CREATE POLICY manufacturer_profiles_select ON public.manufacturer_profiles
  FOR SELECT USING (
    is_published = true
    OR profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS manufacturer_profiles_insert ON public.manufacturer_profiles;
CREATE POLICY manufacturer_profiles_insert ON public.manufacturer_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS manufacturer_profiles_update ON public.manufacturer_profiles;
CREATE POLICY manufacturer_profiles_update ON public.manufacturer_profiles
  FOR UPDATE USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS manufacturer_profiles_delete ON public.manufacturer_profiles;
CREATE POLICY manufacturer_profiles_delete ON public.manufacturer_profiles
  FOR DELETE USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

-- Agents
DROP POLICY IF EXISTS agent_profiles_select ON public.agent_profiles;
CREATE POLICY agent_profiles_select ON public.agent_profiles
  FOR SELECT USING (
    is_published = true
    OR profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS agent_profiles_insert ON public.agent_profiles;
CREATE POLICY agent_profiles_insert ON public.agent_profiles
  FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS agent_profiles_update ON public.agent_profiles;
CREATE POLICY agent_profiles_update ON public.agent_profiles
  FOR UPDATE USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS agent_profiles_delete ON public.agent_profiles;
CREATE POLICY agent_profiles_delete ON public.agent_profiles
  FOR DELETE USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

-- Opportunities: public read published; manufacturer owns CRUD
DROP POLICY IF EXISTS representation_opportunities_select ON public.representation_opportunities;
CREATE POLICY representation_opportunities_select ON public.representation_opportunities
  FOR SELECT USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM public.manufacturer_profiles m
      WHERE m.id = manufacturer_id AND m.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS representation_opportunities_insert ON public.representation_opportunities;
CREATE POLICY representation_opportunities_insert ON public.representation_opportunities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.manufacturer_profiles m
      WHERE m.id = manufacturer_id AND m.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS representation_opportunities_update ON public.representation_opportunities;
CREATE POLICY representation_opportunities_update ON public.representation_opportunities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.manufacturer_profiles m
      WHERE m.id = manufacturer_id AND m.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS representation_opportunities_delete ON public.representation_opportunities;
CREATE POLICY representation_opportunities_delete ON public.representation_opportunities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.manufacturer_profiles m
      WHERE m.id = manufacturer_id AND m.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

-- Applications: agent creates; manufacturer + agent can read/update own side
DROP POLICY IF EXISTS representation_applications_select ON public.representation_applications;
CREATE POLICY representation_applications_select ON public.representation_applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agent_profiles a WHERE a.id = agent_id AND a.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.manufacturer_profiles m WHERE m.id = manufacturer_id AND m.profile_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS representation_applications_insert ON public.representation_applications;
CREATE POLICY representation_applications_insert ON public.representation_applications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_profiles a WHERE a.id = agent_id AND a.profile_id = auth.uid())
  );

DROP POLICY IF EXISTS representation_applications_update ON public.representation_applications;
CREATE POLICY representation_applications_update ON public.representation_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.agent_profiles a WHERE a.id = agent_id AND a.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.manufacturer_profiles m WHERE m.id = manufacturer_id AND m.profile_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

-- Invitations
DROP POLICY IF EXISTS agent_invitations_select ON public.agent_invitations;
CREATE POLICY agent_invitations_select ON public.agent_invitations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agent_profiles a WHERE a.id = agent_id AND a.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.manufacturer_profiles m WHERE m.id = manufacturer_id AND m.profile_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS agent_invitations_insert ON public.agent_invitations;
CREATE POLICY agent_invitations_insert ON public.agent_invitations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.manufacturer_profiles m WHERE m.id = manufacturer_id AND m.profile_id = auth.uid())
  );

DROP POLICY IF EXISTS agent_invitations_update ON public.agent_invitations;
CREATE POLICY agent_invitations_update ON public.agent_invitations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.agent_profiles a WHERE a.id = agent_id AND a.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.manufacturer_profiles m WHERE m.id = manufacturer_id AND m.profile_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

-- Reports: insert own; owners read all
DROP POLICY IF EXISTS commercial_entity_reports_insert ON public.commercial_entity_reports;
CREATE POLICY commercial_entity_reports_insert ON public.commercial_entity_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS commercial_entity_reports_select ON public.commercial_entity_reports;
CREATE POLICY commercial_entity_reports_select ON public.commercial_entity_reports
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS commercial_entity_reports_update ON public.commercial_entity_reports;
CREATE POLICY commercial_entity_reports_update ON public.commercial_entity_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

-- Analytics: anyone authenticated can insert; owners read
DROP POLICY IF EXISTS commercial_analytics_events_insert ON public.commercial_analytics_events;
CREATE POLICY commercial_analytics_events_insert ON public.commercial_analytics_events
  FOR INSERT WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());

DROP POLICY IF EXISTS commercial_analytics_events_select ON public.commercial_analytics_events;
CREATE POLICY commercial_analytics_events_select ON public.commercial_analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

COMMENT ON TABLE public.manufacturer_profiles IS 'B2B manufacturer profiles for Commercial Agents module';
COMMENT ON TABLE public.agent_profiles IS 'Independent commercial agent / representative profiles';
COMMENT ON TABLE public.representation_opportunities IS 'Manufacturer mandates seeking commercial representation';
