-- Phase 4: NL/CZ/HU/BG, email alert tracking, auto-draft metadata on versions

ALTER TABLE public.source_changes
  ADD COLUMN IF NOT EXISTS email_alert_sent_at timestamptz;

-- Netherlands
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'NL', 'Netherlands',
  'https://wetten.overheid.nl/',
  'https://www.rijksoverheid.nl/',
  'https://www.belastingdienst.nl/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Netherlands — wetten.overheid.nl and rijksoverheid.nl.'
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
  'nl-wetten',
  'Overheid.nl — Wetten en regelingen',
  'https://wetten.overheid.nl/',
  'official_gazette',
  'NL', 'Netherlands', 'wetten.overheid.nl', 'official_gazette', 'needs_review'
),
(
  'nl-rijksoverheid',
  'Rijksoverheid.nl',
  'https://www.rijksoverheid.nl/',
  'national_government',
  'NL', 'Netherlands', 'rijksoverheid.nl', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Czechia
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'CZ', 'Czechia',
  'https://www.e-sbirka.cz/',
  'https://www.gov.cz/',
  'https://www.mfcr.cz/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Czechia — e-Sbírka and gov.cz as official entry points.'
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
  'cz-esbirka',
  'e-Sbírka — Sbírka zákonů',
  'https://www.e-sbirka.cz/',
  'official_gazette',
  'CZ', 'Czechia', 'e-sbirka.cz', 'official_gazette', 'needs_review'
),
(
  'cz-gov',
  'Portál občana — gov.cz',
  'https://www.gov.cz/',
  'national_government',
  'CZ', 'Czechia', 'gov.cz', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Hungary
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'HU', 'Hungary',
  'https://njt.hu/',
  'https://www.kormany.hu/',
  'https://nav.gov.hu/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Hungary — NJT and kormany.hu as official monitor entry points.'
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
  'hu-njt',
  'NJT — Nemzeti Jogszabálytár',
  'https://njt.hu/',
  'official_gazette',
  'HU', 'Hungary', 'njt.hu', 'official_gazette', 'needs_review'
),
(
  'hu-kormany',
  'Kormany.hu',
  'https://www.kormany.hu/',
  'national_government',
  'HU', 'Hungary', 'kormany.hu', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Bulgaria
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'BG', 'Bulgaria',
  'https://www.lex.bg/',
  'https://www.gov.bg/',
  'https://nra.bg/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Bulgaria — lex.bg and gov.bg as official entry points.'
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
  'bg-lex',
  'Lex.bg — Държавен вестник',
  'https://www.lex.bg/',
  'official_gazette',
  'BG', 'Bulgaria', 'lex.bg', 'official_gazette', 'needs_review'
),
(
  'bg-gov',
  'Gov.bg',
  'https://www.gov.bg/',
  'national_government',
  'BG', 'Bulgaria', 'gov.bg', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Pointer documents (needs_research)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, v.doc_kind, v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('nl-legislation-entry', 'Netherlands official legislation — Overheid entry', 'informational', 'NL', 'Netherlands', 'nl-wetten'),
  ('cz-legislation-entry', 'Czechia official legislation — e-Sbírka entry', 'informational', 'CZ', 'Czechia', 'cz-esbirka'),
  ('hu-legislation-entry', 'Hungary official legislation — NJT entry', 'informational', 'HU', 'Hungary', 'hu-njt'),
  ('bg-legislation-entry', 'Bulgaria official legislation — lex.bg entry', 'informational', 'BG', 'Bulgaria', 'bg-lex')
) AS v(doc_key, title, doc_kind, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();
