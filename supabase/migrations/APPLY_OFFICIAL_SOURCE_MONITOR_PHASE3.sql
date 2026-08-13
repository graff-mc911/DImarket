-- Phase 3: IT/PT/RO sources, curated draft templates (review before publish)

-- Italy
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'IT', 'Italy',
  'https://www.normattiva.it/',
  'https://www.gov.it/',
  'https://www.agenziaentrate.gov.it/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Italy — Normattiva and gov.it as official monitor entry points.'
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
  'it-normattiva',
  'Normattiva — Portale della Normativa Vigente',
  'https://www.normattiva.it/',
  'official_gazette',
  'IT', 'Italy', 'normattiva.it', 'official_gazette', 'needs_review'
),
(
  'it-gov',
  'Gov.it — Portale dei servizi pubblici',
  'https://www.gov.it/',
  'national_government',
  'IT', 'Italy', 'gov.it', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Portugal
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'PT', 'Portugal',
  'https://dre.pt/',
  'https://www.portugal.gov.pt/',
  'https://www.portaldasfinancas.gov.pt/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Portugal — Diário da República Eletrónico and portugal.gov.pt.'
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
  'pt-dre',
  'Diário da República Eletrónico (DRE)',
  'https://dre.pt/',
  'official_gazette',
  'PT', 'Portugal', 'dre.pt', 'official_gazette', 'needs_review'
),
(
  'pt-gov',
  'Portal do Governo de Portugal',
  'https://www.portugal.gov.pt/',
  'national_government',
  'PT', 'Portugal', 'portugal.gov.pt', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Romania
INSERT INTO public.country_sources (
  country_code, country_name,
  official_gazette_url, government_portal_url, tax_portal_url,
  business_portal_url, eu_portal_url, source_priority, notes
) VALUES (
  'RO', 'Romania',
  'https://legislatie.just.ro/',
  'https://gov.ro/',
  'https://www.anaf.ro/',
  'https://europa.eu/youreurope/business/',
  'https://europa.eu/youreurope/',
  '["official_gazette","national_government","ministry","eu_official"]'::jsonb,
  'Romania — legislatie.just.ro and gov.ro as official entry points.'
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
  'ro-legislatie',
  'Portal Legislativ — legislatie.just.ro',
  'https://legislatie.just.ro/',
  'official_gazette',
  'RO', 'Romania', 'legislatie.just.ro', 'official_gazette', 'needs_review'
),
(
  'ro-gov',
  'Guvernul României — gov.ro',
  'https://gov.ro/',
  'national_government',
  'RO', 'Romania', 'gov.ro', 'national_government', 'needs_review'
)
ON CONFLICT (source_key) DO UPDATE SET source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, updated_at = now();

-- Curated draft template (Spain rental) — review_required, NOT auto-published
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, region, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT
  'es-rental-agreement-template',
  'Residential rental agreement — informational template (Spain)',
  'contract_template',
  'ES',
  'Comunidad Valenciana',
  'Spain',
  s.id,
  'needs_review',
  false,
  now()
FROM public.official_sources s
WHERE s.source_key = 'es-boe'
ON CONFLICT (doc_key) DO UPDATE SET
  title = EXCLUDED.title,
  primary_source_id = EXCLUDED.primary_source_id,
  updated_at = now();

INSERT INTO public.document_versions (
  document_id, version_number, title, body_markdown, source_id, source_url,
  effective_from, status, change_summary
)
SELECT
  d.id,
  '2026.08-draft',
  d.title,
  E'# Residential rental agreement — informational template\n\n> **Not legal advice.** Verify every clause against the official source (BOE / regional authority) before use. DImarket does not guarantee legal correctness.\n\n## Parties\n- **Landlord (arrendador):** [Full legal name, ID/NIE, address]\n- **Tenant (arrendatario):** [Full legal name, ID/NIE, address]\n\n## Property\n- **Address:** [Full address in Spain]\n- **Registry reference (if known):** [Referencia catastral / registro]\n\n## Term\n- **Start date:** [YYYY-MM-DD]\n- **End date / duration:** [Fixed term or indefinite per LAU]\n- **Notice period:** [Per current official rules — verify at source]\n\n## Rent and payments\n- **Monthly rent (EUR):** [Amount]\n- **Payment method / due date:** [Bank transfer, day of month]\n- **Deposit (fianza):** [Amount — verify legal limits at official source]\n\n## Official verification\nBefore signing, confirm current requirements at the official source linked below.\n\n---\n*Template structure for data entry only. Publish after admin review.*',
  s.id,
  s.source_url,
  NULL,
  'review_required',
  'Curated informational skeleton — requires admin review before publish. No auto-generated legal clauses.'
FROM public.legal_documents d
JOIN public.official_sources s ON s.source_key = 'es-boe'
WHERE d.doc_key = 'es-rental-agreement-template'
ON CONFLICT (document_id, version_number) DO NOTHING;

-- Pointer documents for IT/PT/RO (needs_research until curated)
INSERT INTO public.legal_documents (
  doc_key, title, doc_kind, country_code, jurisdiction,
  primary_source_id, verification_status, is_published, next_verification_at
)
SELECT v.doc_key, v.title, v.doc_kind, v.country_code, v.jurisdiction, s.id, 'needs_research', false, now()
FROM (VALUES
  ('it-legislation-entry', 'Italian official legislation — Normattiva entry', 'informational', 'IT', 'Italy', 'it-normattiva'),
  ('pt-legislation-entry', 'Portuguese official legislation — DRE entry', 'informational', 'PT', 'Portugal', 'pt-dre'),
  ('ro-legislation-entry', 'Romanian official legislation — Portal Legislativ entry', 'informational', 'RO', 'Romania', 'ro-legislatie')
) AS v(doc_key, title, doc_kind, country_code, jurisdiction, source_key)
JOIN public.official_sources s ON s.source_key = v.source_key
ON CONFLICT (doc_key) DO UPDATE SET title = EXCLUDED.title, primary_source_id = EXCLUDED.primary_source_id, updated_at = now();
