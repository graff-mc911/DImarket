-- Phase 7: CY/MT/CH/NO/UK, more rental drafts, rental hub pointers (published informational only)

-- Cyprus
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'CY', 'Cyprus',
  'https://www.mof.gov.cy/mof/gpo/gpo.nsf/index_en/index_en',
  'https://www.gov.cy/',
  'https://www.mof.gov.cy/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Cyprus — Government Printing Office / gov.cy as official entry points.'
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
  'cy-gpo',
  'Cyprus Government Printing Office',
  'https://www.mof.gov.cy/mof/gpo/gpo.nsf/index_en/index_en',
  'official_gazette',
  'CY', 'Cyprus', 'mof.gov.cy', 'official_gazette', 'needs_review'
),
(
  'cy-gov',
  'Gov.cy',
  'https://www.gov.cy/',
  'national_government',
  'CY', 'Cyprus', 'gov.cy', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Malta
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'MT', 'Malta',
  'https://legislation.mt/',
  'https://www.gov.mt/',
  'https://cfr.gov.mt/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Malta — legislation.mt and gov.mt as official entry points.'
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
  'mt-legislation',
  'Legislation.mt',
  'https://legislation.mt/',
  'official_gazette',
  'MT', 'Malta', 'legislation.mt', 'official_gazette', 'needs_review'
),
(
  'mt-gov',
  'Gov.mt',
  'https://www.gov.mt/',
  'national_government',
  'MT', 'Malta', 'gov.mt', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Switzerland
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'CH', 'Switzerland',
  'https://www.fedlex.admin.ch/',
  'https://www.admin.ch/',
  'https://www.estv.admin.ch/',
  'https://www.admin.ch/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Switzerland — Fedlex and admin.ch as official entry points (non-EU).'
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
  'ch-fedlex',
  'Fedlex — Federal legislation',
  'https://www.fedlex.admin.ch/',
  'official_gazette',
  'CH', 'Switzerland', 'fedlex.admin.ch', 'official_gazette', 'needs_review'
),
(
  'ch-admin',
  'The Federal Council — admin.ch',
  'https://www.admin.ch/',
  'national_government',
  'CH', 'Switzerland', 'admin.ch', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Norway
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'NO', 'Norway',
  'https://lovdata.no/',
  'https://www.regjeringen.no/',
  'https://www.skatteetaten.no/',
  'https://www.regjeringen.no/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Norway — Lovdata and regjeringen.no as official entry points (EEA).'
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
  'no-lovdata',
  'Lovdata',
  'https://lovdata.no/',
  'official_gazette',
  'NO', 'Norway', 'lovdata.no', 'official_gazette', 'needs_review'
),
(
  'no-regjeringen',
  'Regjeringen.no',
  'https://www.regjeringen.no/',
  'national_government',
  'NO', 'Norway', 'regjeringen.no', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- United Kingdom
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'UK', 'United Kingdom',
  'https://www.legislation.gov.uk/',
  'https://www.gov.uk/',
  'https://www.gov.uk/government/organisations/hm-revenue-customs',
  'https://www.gov.uk/browse/business',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'United Kingdom — legislation.gov.uk and gov.uk as official entry points.'
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
  'uk-legislation',
  'Legislation.gov.uk',
  'https://www.legislation.gov.uk/',
  'official_gazette',
  'UK', 'United Kingdom', 'legislation.gov.uk', 'official_gazette', 'needs_review'
),
(
  'uk-gov',
  'GOV.UK',
  'https://www.gov.uk/',
  'national_government',
  'UK', 'United Kingdom', 'gov.uk', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Legislation entry documents
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, v.doc_kind, v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('cy-legislation-entry', 'Cypriot official legislation — GPO entry', 'informational', 'CY', 'Cyprus', 'cy-gpo'),
  ('mt-legislation-entry', 'Maltese official legislation — legislation.mt entry', 'informational', 'MT', 'Malta', 'mt-legislation'),
  ('ch-legislation-entry', 'Swiss official legislation — Fedlex entry', 'informational', 'CH', 'Switzerland', 'ch-fedlex'),
  ('no-legislation-entry', 'Norwegian official legislation — Lovdata entry', 'informational', 'NO', 'Norway', 'no-lovdata'),
  ('uk-legislation-entry', 'UK official legislation — legislation.gov.uk entry', 'informational', 'UK', 'United Kingdom', 'uk-legislation')
) AS v(doc_key, title, doc_kind, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();

-- Publish pointers
INSERT INTO public.document_versions (
  document_id, version_number, title, body_markdown, source_id, source_url,
  published_at, effective_from, status, change_summary
)
SELECT
  d.id,
  '2026.08-pointer',
  d.title,
  E'# Official source pointer\n\nDImarket does **not** host the full legal text. Open the official source below for the authoritative version.\n\nAlways verify against the official publication on the date you rely on this information.\n\n> Informational entry point only — not legal advice.',
  s.id,
  s.source_url,
  now(),
  now(),
  'published',
  'Published pointer — informational entry only.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.id = d.primary_source_id
WHERE d.doc_key IN (
  'cy-legislation-entry', 'mt-legislation-entry', 'ch-legislation-entry',
  'no-legislation-entry', 'uk-legislation-entry'
)
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
  AND d.doc_key IN (
    'cy-legislation-entry', 'mt-legislation-entry', 'ch-legislation-entry',
    'no-legislation-entry', 'uk-legislation-entry'
  )
  AND d.current_version_id IS NULL;

-- Additional rental drafts (review_required — never auto-published)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, 'contract_template', v.country_code, v.jurisdiction, s.id, 'needs_review', false, now()
FROM (VALUES
  ('at-rental-agreement-template', 'Residential rental agreement — informational template (Austria)', 'AT', 'Austria', 'at-ris'),
  ('pt-rental-agreement-template', 'Residential rental agreement — informational template (Portugal)', 'PT', 'Portugal', 'pt-dre'),
  ('ie-rental-agreement-template', 'Residential rental agreement — informational template (Ireland)', 'IE', 'Ireland', 'ie-statutebook'),
  ('be-rental-agreement-template', 'Residential rental agreement — informational template (Belgium)', 'BE', 'Belgium', 'be-ejustice'),
  ('uk-rental-agreement-template', 'Residential rental agreement — informational template (United Kingdom)', 'UK', 'United Kingdom', 'uk-legislation')
) AS v(doc_key, title, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();

INSERT INTO public.document_versions (
  document_id, version_number, title, body_markdown, source_id, source_url,
  effective_from, status, change_summary
)
SELECT
  d.id,
  '2026.08-draft',
  d.title,
  E'# Residential rental agreement — informational template\n\n> **Not legal advice.** Verify every clause against the official source before use.\n\n## Parties\n- **Landlord:** [Full legal name, ID, address]\n- **Tenant:** [Full legal name, ID, address]\n\n## Property\n- **Address:** [Full address]\n\n## Term\n- **Start date:** [YYYY-MM-DD]\n- **End date / duration:** [Verify at official source]\n\n## Rent\n- **Monthly rent:** [Amount]\n- **Deposit:** [Verify legal limits at official source]\n\n---\n*Approve then publish after admin review only. No silent AI rewrite.*',
  s.id,
  s.source_url,
  NULL,
  'review_required',
  'Curated informational skeleton — approve then publish after review.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.id = d.primary_source_id
WHERE d.doc_key IN (
  'at-rental-agreement-template', 'pt-rental-agreement-template', 'ie-rental-agreement-template',
  'be-rental-agreement-template', 'uk-rental-agreement-template'
)
ON CONFLICT (document_id, version_number) DO NOTHING;

-- Published rental HUB pointers (not full contracts — link to official source only)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, 'informational', v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('es-rental-official-hub', 'Spain — residential rental official information hub', 'ES', 'Spain', 'es-boe'),
  ('de-rental-official-hub', 'Germany — residential rental official information hub', 'DE', 'Germany', 'de-gesetze'),
  ('fr-rental-official-hub', 'France — residential rental official information hub', 'FR', 'France', 'fr-legifrance'),
  ('uk-rental-official-hub', 'UK — residential rental official information hub', 'UK', 'United Kingdom', 'uk-gov')
) AS v(doc_key, title, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();

INSERT INTO public.document_versions (
  document_id, version_number, title, body_markdown, source_id, source_url,
  published_at, effective_from, status, change_summary
)
SELECT
  d.id,
  '2026.08-hub',
  d.title,
  E'# Residential rental — official information hub\n\nDImarket publishes **pointers to official sources only**. This page is not a rental contract and is not legal advice.\n\n## What to do\n1. Open the official source linked on this page.\n2. Verify current rules for deposits, notice periods, and registration.\n3. Use a lawyer or licensed advisor for any binding agreement.\n\n> Contract templates in the admin panel stay as drafts until explicitly approved and published.',
  s.id,
  s.source_url,
  now(),
  now(),
  'published',
  'Published rental hub pointer — no contract clauses, official source only.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.id = d.primary_source_id
WHERE d.doc_key IN (
  'es-rental-official-hub', 'de-rental-official-hub', 'fr-rental-official-hub', 'uk-rental-official-hub'
)
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
  AND v.version_number = '2026.08-hub'
  AND d.doc_key IN (
    'es-rental-official-hub', 'de-rental-official-hub', 'fr-rental-official-hub', 'uk-rental-official-hub'
  )
  AND d.current_version_id IS NULL;
