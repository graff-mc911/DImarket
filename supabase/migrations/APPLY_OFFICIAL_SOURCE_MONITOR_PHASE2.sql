-- Phase 2: alerts dedupe, EU country seeds, pointer document versions

ALTER TABLE public.source_changes
  ADD COLUMN IF NOT EXISTS alert_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_source_changes_alert_pending
  ON public.source_changes (severity, status)
  WHERE alert_sent_at IS NULL AND severity IN ('high', 'critical');

-- Germany
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'DE', 'Germany',
  'https://www.gesetze-im-internet.de/',
  'https://www.bund.de/',
  'https://www.elster.de/eportal/start',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","regional_government","eu_official"]'::jsonb,
  'Germany config — official gazette and Bund portal only as monitor entry points.'
)
ON CONFLICT (country_code) DO UPDATE SET
  official_gazette_url = EXCLUDED.official_gazette_url,
  government_portal_url = EXCLUDED.government_portal_url,
  tax_portal_url = EXCLUDED.tax_portal_url,
  updated_at = now();

INSERT INTO public.official_sources (
  source_key, source_name, source_url, source_type,
  country_code, jurisdiction, official_domain, trust_tier, verification_status
) VALUES
(
  'de-gesetze',
  'Gesetze im Internet (Germany)',
  'https://www.gesetze-im-internet.de/',
  'official_gazette',
  'DE', 'Germany', 'gesetze-im-internet.de', 'official_gazette', 'needs_review'
),
(
  'de-bund',
  'Bund.de — Service portal of the Federal Government',
  'https://www.bund.de/',
  'national_government',
  'DE', 'Germany', 'bund.de', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  updated_at = now();

-- France
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'FR', 'France',
  'https://www.legifrance.gouv.fr/',
  'https://www.service-public.fr/',
  'https://www.impots.gouv.fr/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'France config — Légifrance and Service-Public as primary official portals.'
)
ON CONFLICT (country_code) DO UPDATE SET
  official_gazette_url = EXCLUDED.official_gazette_url,
  government_portal_url = EXCLUDED.government_portal_url,
  updated_at = now();

INSERT INTO public.official_sources (
  source_key, source_name, source_url, source_type,
  country_code, jurisdiction, official_domain, trust_tier, verification_status
) VALUES
(
  'fr-legifrance',
  'Légifrance',
  'https://www.legifrance.gouv.fr/',
  'official_gazette',
  'FR', 'France', 'legifrance.gouv.fr', 'official_gazette', 'needs_review'
),
(
  'fr-service-public',
  'Service-Public.fr',
  'https://www.service-public.fr/',
  'national_government',
  'FR', 'France', 'service-public.fr', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  updated_at = now();

-- Poland
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'PL', 'Poland',
  'https://isap.sejm.gov.pl/',
  'https://www.gov.pl/',
  'https://www.podatki.gov.pl/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Poland config — ISAP Sejm and gov.pl as official entry points.'
)
ON CONFLICT (country_code) DO UPDATE SET
  official_gazette_url = EXCLUDED.official_gazette_url,
  government_portal_url = EXCLUDED.government_portal_url,
  updated_at = now();

INSERT INTO public.official_sources (
  source_key, source_name, source_url, source_type,
  country_code, jurisdiction, official_domain, trust_tier, verification_status
) VALUES
(
  'pl-isap',
  'ISAP — Internetowy System Aktów Prawnych',
  'https://isap.sejm.gov.pl/',
  'official_gazette',
  'PL', 'Poland', 'isap.sejm.gov.pl', 'official_gazette', 'needs_review'
),
(
  'pl-gov',
  'Gov.pl',
  'https://www.gov.pl/',
  'national_government',
  'PL', 'Poland', 'gov.pl', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  updated_at = now();

-- Published pointer versions (no invented legal clauses — link to official source only)
INSERT INTO public.document_versions (
  document_id, version_number, title, body_markdown, source_id, source_url,
  published_at, effective_from, status, change_summary
)
SELECT
  d.id,
  '2026.08-pointer',
  d.title,
  E'# Official source pointer\n\nDImarket does **not** host the full legal text. Open the official source below for the authoritative version.\n\nAlways verify against the official publication on the date you rely on this information.',
  s.id,
  s.source_url,
  now(),
  now(),
  'published',
  'Initial published pointer — informational entry only, no legal rewrite.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.id = d.primary_source_id
WHERE d.doc_key IN ('es-boe-legislation-entry', 'es-start-business-overview')
ON CONFLICT (document_id, version_number) DO NOTHING;

UPDATE public.legal_documents d
SET
  current_version_id = v.id,
  is_published = true,
  verification_status = 'verified',
  last_verified_at = now(),
  updated_at = now()
FROM public.document_versions v
WHERE v.document_id = d.id
  AND v.version_number = '2026.08-pointer'
  AND d.doc_key IN ('es-boe-legislation-entry', 'es-start-business-overview')
  AND d.current_version_id IS NULL;
