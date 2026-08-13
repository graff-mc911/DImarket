-- Paste in Supabase SQL editor after Phase 4
-- Phase 5: publish EU legislation pointers, DE/FR/PL docs, AT/SK/IE/SE/DK/FI/GR/BE/LU seeds

-- Germany / France / Poland legislation entries (sources exist since phase 2)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, v.doc_kind, v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('de-legislation-entry', 'German official legislation — Gesetze im Internet entry', 'informational', 'DE', 'Germany', 'de-gesetze'),
  ('fr-legislation-entry', 'French official legislation — Légifrance entry', 'informational', 'FR', 'France', 'fr-legifrance'),
  ('pl-legislation-entry', 'Polish official legislation — ISAP entry', 'informational', 'PL', 'Poland', 'pl-isap')
) AS v(doc_key, title, doc_kind, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();

-- Austria
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'AT', 'Austria',
  'https://www.ris.bka.gv.at/',
  'https://www.oesterreich.gv.at/',
  'https://www.bmf.gv.at/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Austria — RIS and oesterreich.gv.at as official entry points.'
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
  'at-ris',
  'RIS — Rechtsinformationssystem',
  'https://www.ris.bka.gv.at/',
  'official_gazette',
  'AT', 'Austria', 'ris.bka.gv.at', 'official_gazette', 'needs_review'
),
(
  'at-oesterreich',
  'Oesterreich.gv.at',
  'https://www.oesterreich.gv.at/',
  'national_government',
  'AT', 'Austria', 'oesterreich.gv.at', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Slovakia
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'SK', 'Slovakia',
  'https://www.slov-lex.sk/',
  'https://www.gov.sk/',
  'https://www.financnasprava.sk/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Slovakia — Slov-Lex and gov.sk as official entry points.'
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
  'sk-slovlex',
  'Slov-Lex — Právny a informačný systém',
  'https://www.slov-lex.sk/',
  'official_gazette',
  'SK', 'Slovakia', 'slov-lex.sk', 'official_gazette', 'needs_review'
),
(
  'sk-gov',
  'Gov.sk',
  'https://www.gov.sk/',
  'national_government',
  'SK', 'Slovakia', 'gov.sk', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Ireland
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'IE', 'Ireland',
  'https://www.irishstatutebook.ie/',
  'https://www.gov.ie/',
  'https://www.revenue.ie/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Ireland — Irish Statute Book and gov.ie as official entry points.'
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
  'ie-statutebook',
  'Irish Statute Book',
  'https://www.irishstatutebook.ie/',
  'official_gazette',
  'IE', 'Ireland', 'irishstatutebook.ie', 'official_gazette', 'needs_review'
),
(
  'ie-gov',
  'Gov.ie',
  'https://www.gov.ie/',
  'national_government',
  'IE', 'Ireland', 'gov.ie', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Sweden
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'SE', 'Sweden',
  'https://www.riksdagen.se/sv/dokument-lagar/',
  'https://www.government.se/',
  'https://www.skatteverket.se/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Sweden — Riksdagen and government.se as official entry points.'
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
  'se-riksdagen',
  'Riksdagen — Laws and documents',
  'https://www.riksdagen.se/sv/dokument-lagar/',
  'official_gazette',
  'SE', 'Sweden', 'riksdagen.se', 'official_gazette', 'needs_review'
),
(
  'se-government',
  'Swedish Government — government.se',
  'https://www.government.se/',
  'national_government',
  'SE', 'Sweden', 'government.se', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Denmark
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'DK', 'Denmark',
  'https://www.retsinformation.dk/',
  'https://www.borger.dk/',
  'https://skat.dk/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Denmark — Retsinformation and borger.dk as official entry points.'
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
  'dk-retsinformation',
  'Retsinformation.dk',
  'https://www.retsinformation.dk/',
  'official_gazette',
  'DK', 'Denmark', 'retsinformation.dk', 'official_gazette', 'needs_review'
),
(
  'dk-borger',
  'Borger.dk',
  'https://www.borger.dk/',
  'national_government',
  'DK', 'Denmark', 'borger.dk', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Finland
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'FI', 'Finland',
  'https://www.finlex.fi/',
  'https://www.suomi.fi/',
  'https://www.vero.fi/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Finland — Finlex and suomi.fi as official entry points.'
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
  'fi-finlex',
  'Finlex — Finnish legislation',
  'https://www.finlex.fi/',
  'official_gazette',
  'FI', 'Finland', 'finlex.fi', 'official_gazette', 'needs_review'
),
(
  'fi-suomi',
  'Suomi.fi',
  'https://www.suomi.fi/',
  'national_government',
  'FI', 'Finland', 'suomi.fi', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Greece
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'GR', 'Greece',
  'https://www.et.gr/',
  'https://www.gov.gr/',
  'https://www.aade.gr/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Greece — ET and gov.gr as official entry points.'
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
  'gr-et',
  'Εθνικό Τυπογραφείο — et.gr',
  'https://www.et.gr/',
  'official_gazette',
  'GR', 'Greece', 'et.gr', 'official_gazette', 'needs_review'
),
(
  'gr-gov',
  'Gov.gr',
  'https://www.gov.gr/',
  'national_government',
  'GR', 'Greece', 'gov.gr', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Belgium
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'BE', 'Belgium',
  'https://www.ejustice.just.fgov.be/',
  'https://www.belgium.be/',
  'https://finance.belgium.be/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Belgium — Moniteur/ejustice and belgium.be as official entry points.'
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
  'be-ejustice',
  'Belgian Official Gazette — ejustice',
  'https://www.ejustice.just.fgov.be/',
  'official_gazette',
  'BE', 'Belgium', 'ejustice.just.fgov.be', 'official_gazette', 'needs_review'
),
(
  'be-belgium',
  'Belgium.be',
  'https://www.belgium.be/',
  'national_government',
  'BE', 'Belgium', 'belgium.be', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Luxembourg
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'LU', 'Luxembourg',
  'https://legilux.public.lu/',
  'https://guichet.public.lu/',
  'https://impotsdirects.public.lu/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Luxembourg — Legilux and guichet.public.lu as official entry points.'
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
  'lu-legilux',
  'Legilux — Mémorial',
  'https://legilux.public.lu/',
  'official_gazette',
  'LU', 'Luxembourg', 'legilux.public.lu', 'official_gazette', 'needs_review'
),
(
  'lu-guichet',
  'Guichet.lu',
  'https://guichet.public.lu/',
  'national_government',
  'LU', 'Luxembourg', 'guichet.public.lu', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- New country legislation entries
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, v.doc_kind, v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('at-legislation-entry', 'Austrian official legislation — RIS entry', 'informational', 'AT', 'Austria', 'at-ris'),
  ('sk-legislation-entry', 'Slovak official legislation — Slov-Lex entry', 'informational', 'SK', 'Slovakia', 'sk-slovlex'),
  ('ie-legislation-entry', 'Irish official legislation — Statute Book entry', 'informational', 'IE', 'Ireland', 'ie-statutebook'),
  ('se-legislation-entry', 'Swedish official legislation — Riksdagen entry', 'informational', 'SE', 'Sweden', 'se-riksdagen'),
  ('dk-legislation-entry', 'Danish official legislation — Retsinformation entry', 'informational', 'DK', 'Denmark', 'dk-retsinformation'),
  ('fi-legislation-entry', 'Finnish official legislation — Finlex entry', 'informational', 'FI', 'Finland', 'fi-finlex'),
  ('gr-legislation-entry', 'Greek official legislation — ET entry', 'informational', 'GR', 'Greece', 'gr-et'),
  ('be-legislation-entry', 'Belgian official legislation — ejustice entry', 'informational', 'BE', 'Belgium', 'be-ejustice'),
  ('lu-legislation-entry', 'Luxembourg official legislation — Legilux entry', 'informational', 'LU', 'Luxembourg', 'lu-legilux')
) AS v(doc_key, title, doc_kind, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();

-- Published pointer versions for all *-legislation-entry docs without a current version
INSERT INTO public.document_versions (
  document_id, version_number, title, body_markdown, source_id, source_url,
  published_at, effective_from, status, change_summary
)
SELECT
  d.id,
  '2026.08-pointer',
  d.title,
  E'# Official source pointer\n\nDImarket does **not** host the full legal text. Open the official source below for the authoritative version.\n\n## Official source\n- Link on this page (see button below)\n\nAlways verify against the official publication on the date you rely on this information.\n\n> Informational entry point only — not legal advice.',
  s.id,
  s.source_url,
  now(),
  now(),
  'published',
  'Published pointer — informational entry only, no legal rewrite.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.id = d.primary_source_id
WHERE d.doc_key LIKE '%-legislation-entry'
  AND d.current_version_id IS NULL
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
  AND d.doc_key LIKE '%-legislation-entry'
  AND d.current_version_id IS NULL;
