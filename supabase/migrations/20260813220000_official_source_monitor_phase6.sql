-- Phase 6: LT/LV/EE/HR/SI, rental draft templates (DE/FR/IT/PL/NL), webhook + weekly digest

ALTER TABLE public.source_changes
  ADD COLUMN IF NOT EXISTS webhook_alert_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.osm_weekly_digest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_key text NOT NULL UNIQUE,
  pending_count int NOT NULL DEFAULT 0,
  recent_count int NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'email'
);

COMMENT ON TABLE public.osm_weekly_digest_runs IS
  'Dedupe weekly OSM admin digest emails (one per ISO week key).';

-- Lithuania
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'LT', 'Lithuania',
  'https://www.e-tar.lt/',
  'https://www.lrv.lt/',
  'https://www.vmi.lt/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Lithuania — e-TAR and lrv.lt as official entry points.'
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
  'lt-etar',
  'e-TAR — Teisės aktų registras',
  'https://www.e-tar.lt/',
  'official_gazette',
  'LT', 'Lithuania', 'e-tar.lt', 'official_gazette', 'needs_review'
),
(
  'lt-lrv',
  'Lietuvos Respublikos Vyriausybė — lrv.lt',
  'https://www.lrv.lt/',
  'national_government',
  'LT', 'Lithuania', 'lrv.lt', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Latvia
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'LV', 'Latvia',
  'https://www.likumi.lv/',
  'https://www.mk.gov.lv/',
  'https://www.vid.gov.lv/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Latvia — Likumi.lv and mk.gov.lv as official entry points.'
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
  'lv-likumi',
  'Likumi.lv — Latvijas Republikas tiesību akti',
  'https://www.likumi.lv/',
  'official_gazette',
  'LV', 'Latvia', 'likumi.lv', 'official_gazette', 'needs_review'
),
(
  'lv-mk',
  'Latvijas Republikas Ministru kabinets — mk.gov.lv',
  'https://www.mk.gov.lv/',
  'national_government',
  'LV', 'Latvia', 'mk.gov.lv', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Estonia
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'EE', 'Estonia',
  'https://www.riigiteataja.ee/',
  'https://www.valitsus.ee/',
  'https://www.emta.ee/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Estonia — Riigi Teataja and valitsus.ee as official entry points.'
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
  'ee-riigiteataja',
  'Riigi Teataja',
  'https://www.riigiteataja.ee/',
  'official_gazette',
  'EE', 'Estonia', 'riigiteataja.ee', 'official_gazette', 'needs_review'
),
(
  'ee-valitsus',
  'Eesti Vabariigi Valitsus — valitsus.ee',
  'https://www.valitsus.ee/',
  'national_government',
  'EE', 'Estonia', 'valitsus.ee', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Croatia
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'HR', 'Croatia',
  'https://narodne-novine.nn.hr/',
  'https://gov.hr/',
  'https://www.porezna-uprava.hr/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Croatia — Narodne novine and gov.hr as official entry points.'
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
  'hr-nn',
  'Narodne novine',
  'https://narodne-novine.nn.hr/',
  'official_gazette',
  'HR', 'Croatia', 'narodne-novine.nn.hr', 'official_gazette', 'needs_review'
),
(
  'hr-gov',
  'Vlada Republike Hrvatske — gov.hr',
  'https://gov.hr/',
  'national_government',
  'HR', 'Croatia', 'gov.hr', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Slovenia
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'SI', 'Slovenia',
  'https://www.pisrs.si/',
  'https://www.gov.si/',
  'https://www.fu.gov.si/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Slovenia — PISRS and gov.si as official entry points.'
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
  'si-pisrs',
  'PISRS — Pravno-informacijski sistem',
  'https://www.pisrs.si/',
  'official_gazette',
  'SI', 'Slovenia', 'pisrs.si', 'official_gazette', 'needs_review'
),
(
  'si-gov',
  'Vlada Republike Slovenije — gov.si',
  'https://www.gov.si/',
  'national_government',
  'SI', 'Slovenia', 'gov.si', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Legislation entry documents
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, v.doc_kind, v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('lt-legislation-entry', 'Lithuanian official legislation — e-TAR entry', 'informational', 'LT', 'Lithuania', 'lt-etar'),
  ('lv-legislation-entry', 'Latvian official legislation — Likumi entry', 'informational', 'LV', 'Latvia', 'lv-likumi'),
  ('ee-legislation-entry', 'Estonian official legislation — Riigi Teataja entry', 'informational', 'EE', 'Estonia', 'ee-riigiteataja'),
  ('hr-legislation-entry', 'Croatian official legislation — Narodne novine entry', 'informational', 'HR', 'Croatia', 'hr-nn'),
  ('si-legislation-entry', 'Slovenian official legislation — PISRS entry', 'informational', 'SI', 'Slovenia', 'si-pisrs')
) AS v(doc_key, title, doc_kind, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();

-- Publish pointers for new legislation entries
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
  'lt-legislation-entry', 'lv-legislation-entry', 'ee-legislation-entry',
  'hr-legislation-entry', 'si-legislation-entry'
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
    'lt-legislation-entry', 'lv-legislation-entry', 'ee-legislation-entry',
    'hr-legislation-entry', 'si-legislation-entry'
  )
  AND d.current_version_id IS NULL;

-- Rental draft templates (review_required — NOT published)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, 'contract_template', v.country_code, v.jurisdiction, s.id, 'needs_review', false, now()
FROM (VALUES
  ('de-rental-agreement-template', 'Residential rental agreement — informational template (Germany)', 'DE', 'Germany', 'de-gesetze'),
  ('fr-rental-agreement-template', 'Residential rental agreement — informational template (France)', 'FR', 'France', 'fr-legifrance'),
  ('it-rental-agreement-template', 'Residential rental agreement — informational template (Italy)', 'IT', 'Italy', 'it-normattiva'),
  ('pl-rental-agreement-template', 'Residential rental agreement — informational template (Poland)', 'PL', 'Poland', 'pl-isap'),
  ('nl-rental-agreement-template', 'Residential rental agreement — informational template (Netherlands)', 'NL', 'Netherlands', 'nl-wetten')
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
  E'# Residential rental agreement — informational template\n\n> **Not legal advice.** Verify every clause against the official source before use.\n\n## Parties\n- **Landlord:** [Full legal name, ID, address]\n- **Tenant:** [Full legal name, ID, address]\n\n## Property\n- **Address:** [Full address]\n\n## Term\n- **Start date:** [YYYY-MM-DD]\n- **End date / duration:** [Verify at official source]\n\n## Rent\n- **Monthly rent:** [Amount]\n- **Deposit:** [Verify legal limits at official source]\n\n---\n*Publish after admin review only.*',
  s.id,
  s.source_url,
  NULL,
  'review_required',
  'Curated informational skeleton — admin review before publish.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.id = d.primary_source_id
WHERE d.doc_key IN (
  'de-rental-agreement-template', 'fr-rental-agreement-template', 'it-rental-agreement-template',
  'pl-rental-agreement-template', 'nl-rental-agreement-template'
)
ON CONFLICT (document_id, version_number) DO NOTHING;
