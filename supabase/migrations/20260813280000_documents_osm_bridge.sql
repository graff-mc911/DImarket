-- Bridge Documents & Procedures ↔ Official Source Monitor
-- Apply AFTER official_source_monitor phases + documents_procedures_catalog.

CREATE OR REPLACE FUNCTION public.sync_documents_catalog_from_legal_doc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_status text;
BEGIN
  next_status := CASE
    WHEN NEW.verification_status IN ('outdated', 'unavailable') THEN 'outdated'
    WHEN NEW.verification_status = 'verified' AND COALESCE(NEW.is_published, false) IS TRUE THEN 'active'
    ELSE 'under_review'
  END;

  UPDATE public.documents_catalog dc
  SET
    status = next_status,
    last_verified_at = CASE
      WHEN NEW.verification_status = 'verified' THEN NEW.last_verified_at
      ELSE NULL
    END,
    updated_at = now()
  WHERE dc.legal_document_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_documents_catalog_from_legal ON public.legal_documents;
CREATE TRIGGER trg_sync_documents_catalog_from_legal
  AFTER UPDATE OF verification_status, last_verified_at, is_published
  ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_documents_catalog_from_legal_doc();

-- Seed form portal sources + legal_documents + documents_catalog (pointers only).
-- is_published=true so public can read freshness; verification_status=needs_research
-- until OSM actually verifies — never fake last_verified_at.

WITH form_seeds(country_code, slug, source_name, source_url, title) AS (
  VALUES
    ('DE', 'vehicle-purchase-contract', 'KBA — Fahrzeugregister / Zulassung',
     'https://www.kba.de/DE/Themen/ZentraleRegister/ZFZR/Auskunft/zfzr_auskunft_inhalt.html',
     'Kaufvertrag Gebrauchtkraftfahrzeug (privat) — DE'),
    ('DE', 'vehicle-purchase-commercial', 'KBA — Fahrzeugregister / Zulassung',
     'https://www.kba.de/DE/Themen/ZentraleRegister/ZFZR/Auskunft/zfzr_auskunft_inhalt.html',
     'Kfz-Kaufvertrag gewerblich — DE'),
    ('FR', 'vehicle-purchase-contract', 'Service-Public / ANTS — CERFA 13703',
     'https://www.service-public.fr/particuliers/vosdroits/R2032',
     'CERFA 13703 certificat de cession — FR'),
    ('FR', 'vehicle-purchase-commercial', 'Service-Public / ANTS — CERFA 13703',
     'https://www.service-public.fr/particuliers/vosdroits/R2032',
     'CERFA 13703 cession professionnelle — FR'),
    ('ES', 'vehicle-purchase-contract', 'DGT — Transferencia de vehículos',
     'https://sede.dgt.gob.es/es/tramites-y-multas/tu-vehiculo/transferencias-de-vehiculos/',
     'Compraventa vehículo + DGT — ES'),
    ('ES', 'vehicle-purchase-commercial', 'DGT — Transferencia de vehículos',
     'https://sede.dgt.gob.es/es/tramites-y-multas/tu-vehiculo/transferencias-de-vehiculos/',
     'Compraventa vehículo empresas + DGT — ES'),
    ('PL', 'vehicle-purchase-contract', 'Historia pojazdu (CEPiK)',
     'https://www.historia-pojazdu.gov.pl/',
     'Umowa kupna-sprzedaży pojazdu — PL'),
    ('IT', 'vehicle-purchase-contract', 'ACI / Portale dell''Automobilista',
     'https://www.ilportaledellautomobilista.it/',
     'Passaggio di proprietà veicolo — IT'),
    ('PT', 'vehicle-purchase-contract', 'IMT — Registo de propriedade',
     'https://www.imt-ip.pt/',
     'Compra e venda de veículo — PT'),
    ('NL', 'vehicle-purchase-contract', 'RDW — Kenteken / OVI',
     'https://ovi.rdw.nl/',
     'Koopovereenkomst voertuig — NL'),
    ('UK', 'vehicle-purchase-contract', 'GOV.UK — Vehicle information / MOT',
     'https://www.gov.uk/get-vehicle-information-from-dvla',
     'Vehicle sale agreement — UK')
),
upsert_sources AS (
  INSERT INTO public.official_sources (
    source_key, source_name, source_url, source_type, country_code,
    jurisdiction, official_domain, trust_tier, verification_status,
    content_status, is_active, check_interval_hours, next_verification_at
  )
  SELECT
    'docs-src-' || lower(country_code) || '-' || slug,
    source_name,
    source_url,
    'national_government',
    country_code,
    country_code,
    regexp_replace(source_url, '^https?://([^/]+).*$', '\1'),
    'national_government',
    'needs_research',
    'unknown',
    true,
    24,
    now() + interval '1 day'
  FROM form_seeds
  ON CONFLICT (source_key) DO UPDATE
    SET source_url = EXCLUDED.source_url,
        source_name = EXCLUDED.source_name,
        updated_at = now()
  RETURNING id, source_key
),
upsert_legal AS (
  INSERT INTO public.legal_documents (
    doc_key, title, doc_kind, country_code, jurisdiction,
    primary_source_id, verification_status, is_published, last_verified_at
  )
  SELECT
    'docs-' || lower(fs.country_code) || '-' || fs.slug,
    fs.title,
    'official_form',
    fs.country_code,
    fs.country_code,
    s.id,
    'needs_research',
    true,
    NULL
  FROM form_seeds fs
  JOIN upsert_sources s
    ON s.source_key = 'docs-src-' || lower(fs.country_code) || '-' || fs.slug
  ON CONFLICT (doc_key) DO UPDATE
    SET primary_source_id = EXCLUDED.primary_source_id,
        title = EXCLUDED.title,
        doc_kind = EXCLUDED.doc_kind,
        is_published = true,
        updated_at = now()
  RETURNING id, doc_key, country_code
)
INSERT INTO public.documents_catalog (
  doc_key, slug, title, description, subcategory, document_type,
  country_code, jurisdiction, language, original_language,
  status, version, source_name, source_url,
  template_needs_legal_review, legal_document_id, is_published
)
SELECT
  ul.doc_key,
  substr(ul.doc_key, length('docs-' || lower(ul.country_code) || '-') + 1),
  fs.title,
  'OSM-linked form pointer — under review until official source verified',
  'vehicles',
  'contract_form',
  ul.country_code,
  ul.country_code,
  CASE lower(ul.country_code)
    WHEN 'de' THEN 'de' WHEN 'fr' THEN 'fr' WHEN 'es' THEN 'es'
    WHEN 'pl' THEN 'pl' WHEN 'it' THEN 'it' WHEN 'pt' THEN 'pt'
    WHEN 'nl' THEN 'nl' ELSE 'en'
  END,
  CASE lower(ul.country_code)
    WHEN 'de' THEN 'de' WHEN 'fr' THEN 'fr' WHEN 'es' THEN 'es'
    WHEN 'pl' THEN 'pl' WHEN 'it' THEN 'it' WHEN 'pt' THEN 'pt'
    WHEN 'nl' THEN 'nl' ELSE 'en'
  END,
  'under_review',
  '2026.08-osm-bridge',
  fs.source_name,
  fs.source_url,
  true,
  ul.id,
  false
FROM upsert_legal ul
JOIN form_seeds fs
  ON ul.doc_key = 'docs-' || lower(fs.country_code) || '-' || fs.slug
ON CONFLICT (doc_key) DO UPDATE
  SET legal_document_id = EXCLUDED.legal_document_id,
      source_url = EXCLUDED.source_url,
      source_name = EXCLUDED.source_name,
      status = 'under_review',
      last_verified_at = NULL,
      updated_at = now();

COMMENT ON FUNCTION public.sync_documents_catalog_from_legal_doc() IS
  'Keeps documents_catalog.status / last_verified_at in sync with linked legal_documents OSM status.';
