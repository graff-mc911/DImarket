-- ============================================================
-- Official Source Monitor + Document Version Control
-- Auto-check official sources → detect change → review → publish
-- NEVER silently rewrite legal text.
-- ============================================================

-- Country-level portal configuration (no hardcode in React components)
CREATE TABLE IF NOT EXISTS public.country_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  official_gazette_url text,
  government_portal_url text,
  tax_portal_url text,
  business_portal_url text,
  regional_portal_url text,
  municipal_portal_url text,
  licensing_portal_url text,
  eu_portal_url text,
  source_priority jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code)
);

CREATE TABLE IF NOT EXISTS public.official_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  source_name text NOT NULL,
  source_url text NOT NULL,
  source_type text NOT NULL
    CHECK (source_type IN (
      'eu_official',
      'national_government',
      'official_gazette',
      'ministry',
      'regional_government',
      'municipal',
      'official_registry',
      'licensing_portal',
      'secondary_verified'
    )),
  country_code text NOT NULL,
  region text,
  jurisdiction text,
  official_domain text,
  check_interval_hours int NOT NULL DEFAULT 24
    CHECK (check_interval_hours >= 1 AND check_interval_hours <= 168),
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  last_success_at timestamptz,
  next_verification_at timestamptz NOT NULL DEFAULT now(),
  source_version text,
  source_hash text,
  http_status int,
  content_status text NOT NULL DEFAULT 'unknown'
    CHECK (content_status IN ('unknown', 'ok', 'redirected', 'not_found', 'error')),
  verification_status text NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN (
      'verified', 'changed', 'needs_review', 'outdated', 'unavailable', 'needs_research'
    )),
  trust_tier text NOT NULL DEFAULT 'national_government'
    CHECK (trust_tier IN (
      'eu_official',
      'official_gazette',
      'national_government',
      'ministry',
      'regional_government',
      'municipal',
      'official_registry',
      'secondary_verified'
    )),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_sources_next_check
  ON public.official_sources (next_verification_at)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_official_sources_country
  ON public.official_sources (country_code);

CREATE TABLE IF NOT EXISTS public.source_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.official_sources(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  http_status int,
  content_hash text,
  content_length int,
  normalized_excerpt text,
  fetch_ok boolean NOT NULL DEFAULT false,
  error_message text,
  duration_ms int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_source_checks_source_time
  ON public.source_checks (source_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS public.source_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.official_sources(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  old_hash text,
  new_hash text,
  change_type text NOT NULL DEFAULT 'content'
    CHECK (change_type IN (
      'content', 'http_status', 'url', 'unavailable', 'restored', 'manual'
    )),
  change_summary text,
  old_excerpt text,
  new_excerpt text,
  affected_document_ids uuid[] NOT NULL DEFAULT '{}',
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'detected'
    CHECK (status IN (
      'detected', 'review_required', 'approved', 'rejected', 'published'
    )),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_changes_status
  ON public.source_changes (status, detected_at DESC);

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key text NOT NULL UNIQUE,
  title text NOT NULL,
  doc_kind text NOT NULL
    CHECK (doc_kind IN (
      'contract_template',
      'official_form',
      'license_requirement',
      'permit_procedure',
      'government_procedure',
      'informational'
    )),
  country_code text NOT NULL,
  region text,
  jurisdiction text,
  primary_source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  verification_status text NOT NULL DEFAULT 'needs_research'
    CHECK (verification_status IN (
      'verified', 'changed', 'needs_review', 'outdated', 'unavailable', 'needs_research'
    )),
  current_version_id uuid,
  next_verification_at timestamptz NOT NULL DEFAULT now(),
  last_verified_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  title text NOT NULL,
  body_markdown text,
  body_html text,
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  source_url text,
  source_version text,
  source_hash text,
  published_at timestamptz,
  effective_from timestamptz,
  effective_until timestamptz,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'review_required', 'approved', 'published', 'superseded', 'rejected', 'outdated'
    )),
  change_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_doc_status
  ON public.document_versions (document_id, status);

ALTER TABLE public.legal_documents
  DROP CONSTRAINT IF EXISTS legal_documents_current_version_id_fkey;
ALTER TABLE public.legal_documents
  ADD CONSTRAINT legal_documents_current_version_id_fkey
  FOREIGN KEY (current_version_id) REFERENCES public.document_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.document_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.legal_documents(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.document_versions(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_audit_time
  ON public.document_audit_log (created_at DESC);

-- RLS
ALTER TABLE public.country_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_dimarket_owner()
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

-- Public read: published documents + active sources (for badges / open source)
DROP POLICY IF EXISTS country_sources_public_select ON public.country_sources;
CREATE POLICY country_sources_public_select ON public.country_sources
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS country_sources_owner_write ON public.country_sources;
CREATE POLICY country_sources_owner_write ON public.country_sources
  FOR ALL TO authenticated
  USING (public.is_dimarket_owner())
  WITH CHECK (public.is_dimarket_owner());

DROP POLICY IF EXISTS official_sources_public_select ON public.official_sources;
CREATE POLICY official_sources_public_select ON public.official_sources
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS official_sources_owner_write ON public.official_sources;
CREATE POLICY official_sources_owner_write ON public.official_sources
  FOR ALL TO authenticated
  USING (public.is_dimarket_owner())
  WITH CHECK (public.is_dimarket_owner());

DROP POLICY IF EXISTS source_checks_owner_select ON public.source_checks;
CREATE POLICY source_checks_owner_select ON public.source_checks
  FOR SELECT TO authenticated USING (public.is_dimarket_owner());

DROP POLICY IF EXISTS source_changes_owner_all ON public.source_changes;
CREATE POLICY source_changes_owner_all ON public.source_changes
  FOR ALL TO authenticated
  USING (public.is_dimarket_owner())
  WITH CHECK (public.is_dimarket_owner());

DROP POLICY IF EXISTS legal_documents_public_select ON public.legal_documents;
CREATE POLICY legal_documents_public_select ON public.legal_documents
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.is_dimarket_owner());

DROP POLICY IF EXISTS legal_documents_owner_write ON public.legal_documents;
CREATE POLICY legal_documents_owner_write ON public.legal_documents
  FOR ALL TO authenticated
  USING (public.is_dimarket_owner())
  WITH CHECK (public.is_dimarket_owner());

DROP POLICY IF EXISTS document_versions_public_select ON public.document_versions;
CREATE POLICY document_versions_public_select ON public.document_versions
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR public.is_dimarket_owner()
  );

DROP POLICY IF EXISTS document_versions_owner_write ON public.document_versions;
CREATE POLICY document_versions_owner_write ON public.document_versions
  FOR ALL TO authenticated
  USING (public.is_dimarket_owner())
  WITH CHECK (public.is_dimarket_owner());

DROP POLICY IF EXISTS document_audit_owner_select ON public.document_audit_log;
CREATE POLICY document_audit_owner_select ON public.document_audit_log
  FOR SELECT TO authenticated USING (public.is_dimarket_owner());

DROP POLICY IF EXISTS document_audit_owner_insert ON public.document_audit_log;
CREATE POLICY document_audit_owner_insert ON public.document_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_dimarket_owner());

GRANT SELECT ON public.country_sources TO anon, authenticated;
GRANT SELECT ON public.official_sources TO anon, authenticated;
GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT SELECT ON public.document_versions TO anon, authenticated;
GRANT ALL ON public.country_sources TO authenticated;
GRANT ALL ON public.official_sources TO authenticated;
GRANT SELECT ON public.source_checks TO authenticated;
GRANT ALL ON public.source_changes TO authenticated;
GRANT ALL ON public.legal_documents TO authenticated;
GRANT ALL ON public.document_versions TO authenticated;
GRANT SELECT, INSERT ON public.document_audit_log TO authenticated;

-- Seed: Spain configuration (real official portals only)
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, regional_portal_url, municipal_portal_url,
  licensing_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'ES',
  'Spain',
  'https://www.boe.es/',
  'https://administracion.gob.es/',
  'https://sede.agenciatributaria.gob.es/',
  'https://europa.eu/youreurope/business/',
  'https://www.gva.es/',
  'https://www.alicante.es/',
  'https://sede.administracionespublicas.gob.es/',
  'https://europa.eu/youreurope/',
  '[
    "official_gazette",
    "national_government",
    "ministry",
    "regional_government",
    "municipal",
    "official_registry",
    "eu_official"
  ]'::jsonb,
  'Spain-first MVP. Prefer BOE and official government portals. Consolidated BOE texts ease access but are not themselves legally binding; always link the official publication.'
)
ON CONFLICT (country_code) DO UPDATE SET
  official_gazette_url = EXCLUDED.official_gazette_url,
  government_portal_url = EXCLUDED.government_portal_url,
  tax_portal_url = EXCLUDED.tax_portal_url,
  business_portal_url = EXCLUDED.business_portal_url,
  regional_portal_url = EXCLUDED.regional_portal_url,
  municipal_portal_url = EXCLUDED.municipal_portal_url,
  licensing_portal_url = EXCLUDED.licensing_portal_url,
  eu_portal_url = EXCLUDED.eu_portal_url,
  source_priority = EXCLUDED.source_priority,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.official_sources (
  source_key, source_name, source_url, source_type,
  country_code, region, jurisdiction, official_domain,
  check_interval_hours, trust_tier, verification_status, content_status
) VALUES
(
  'es-boe',
  'BOE — Boletín Oficial del Estado',
  'https://www.boe.es/',
  'official_gazette',
  'ES', NULL, 'Spain', 'boe.es',
  24, 'official_gazette', 'needs_review', 'unknown'
),
(
  'es-gov',
  'Administración — Portal de la Administración General del Estado',
  'https://administracion.gob.es/',
  'national_government',
  'ES', NULL, 'Spain', 'administracion.gob.es',
  24, 'national_government', 'needs_review', 'unknown'
),
(
  'es-aeat',
  'Agencia Tributaria (Sede Electrónica)',
  'https://sede.agenciatributaria.gob.es/',
  'ministry',
  'ES', NULL, 'Spain', 'agenciatributaria.gob.es',
  24, 'ministry', 'needs_review', 'unknown'
),
(
  'eu-youreurope-business',
  'Your Europe — Business',
  'https://europa.eu/youreurope/business/',
  'eu_official',
  'EU', NULL, 'European Union', 'europa.eu',
  24, 'eu_official', 'needs_review', 'unknown'
),
(
  'es-gva',
  'Generalitat Valenciana',
  'https://www.gva.es/',
  'regional_government',
  'ES', 'Comunidad Valenciana', 'Comunidad Valenciana', 'gva.es',
  24, 'regional_government', 'needs_review', 'unknown'
),
(
  'es-alicante',
  'Ajuntament d''Alacant / Ayuntamiento de Alicante',
  'https://www.alicante.es/',
  'municipal',
  'ES', 'Alicante', 'Alicante (municipality)', 'alicante.es',
  24, 'municipal', 'needs_review', 'unknown'
)
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  source_type = EXCLUDED.source_type,
  official_domain = EXCLUDED.official_domain,
  check_interval_hours = EXCLUDED.check_interval_hours,
  trust_tier = EXCLUDED.trust_tier,
  updated_at = now();

-- Procedure pointers only — no invented legal contract text (needs_research until curated)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, region, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT
  v.doc_key, v.title, v.doc_kind, v.country_code, v.region, v.jurisdiction,
  s.id, 'needs_research', false, now()
FROM (VALUES
  (
    'es-start-business-overview',
    'Starting a business in Spain — official overview (pointer)',
    'government_procedure',
    'ES', NULL, 'Spain',
    'eu-youreurope-business'
  ),
  (
    'es-boe-legislation-entry',
    'Spanish official legislation — BOE entry point',
    'informational',
    'ES', NULL, 'Spain',
    'es-boe'
  ),
  (
    'es-cv-regional-procedures',
    'Comunidad Valenciana — regional administration entry',
    'government_procedure',
    'ES', 'Comunidad Valenciana', 'Comunidad Valenciana',
    'es-gva'
  ),
  (
    'es-alicante-municipal',
    'Alicante municipality — official procedures entry',
    'government_procedure',
    'ES', 'Alicante', 'Alicante (municipality)',
    'es-alicante'
  )
) AS v(doc_key, title, doc_kind, country_code, region, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET
  title = EXCLUDED.title,
  primary_source_id = EXCLUDED.primary_source_id,
  updated_at = now();

COMMENT ON TABLE public.official_sources IS
  'Official government/EU sources monitored for freshness. No blog/forum as primary legal source.';
COMMENT ON TABLE public.source_changes IS
  'Detected source changes awaiting human review before legal publish.';
COMMENT ON TABLE public.document_versions IS
  'Versioned legal/admin documents. Current = published + effective window. No silent AI rewrite.';
