-- Documents & Procedures catalog (extends OSM; does not invent legal text).
-- Apply after APPLY_OFFICIAL_SOURCE_MONITOR*.sql when ready for DB-backed catalog.
-- Frontend MVP ships with src/lib/documents/catalog.ts until this is applied.

CREATE TABLE IF NOT EXISTS public.documents_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key text NOT NULL UNIQUE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  subcategory text NOT NULL,
  document_type text NOT NULL
    CHECK (document_type IN (
      'contract_form', 'license', 'permit', 'procedure', 'checklist', 'informational'
    )),
  country_code text NOT NULL,
  region text,
  province text,
  city text,
  jurisdiction text NOT NULL,
  language text NOT NULL DEFAULT 'es',
  original_language text NOT NULL DEFAULT 'es',
  available_languages text[] NOT NULL DEFAULT ARRAY['es','en','uk'],
  status text NOT NULL DEFAULT 'under_review'
    CHECK (status IN ('active', 'outdated', 'draft', 'under_review')),
  version text NOT NULL DEFAULT '1',
  effective_date date,
  last_verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  license_requirement text
    CHECK (license_requirement IS NULL OR license_requirement IN (
      'required', 'not_required', 'depends_on_activity', 'depends_on_region',
      'depends_on_qualification', 'unknown'
    )),
  template_needs_legal_review boolean NOT NULL DEFAULT true,
  form_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  procedure_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  specialists jsonb NOT NULL DEFAULT '[]'::jsonb,
  monetization_tier text NOT NULL DEFAULT 'free'
    CHECK (monetization_tier IN (
      'free', 'premium_document', 'professional_assistance', 'legal_review', 'business_setup'
    )),
  seo_title text,
  seo_description text,
  legal_document_id uuid REFERENCES public.legal_documents(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_catalog_geo
  ON public.documents_catalog (country_code, region, city);

CREATE INDEX IF NOT EXISTS idx_documents_catalog_sub
  ON public.documents_catalog (subcategory, status);

CREATE TABLE IF NOT EXISTS public.document_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid REFERENCES public.documents_catalog(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready_pdf', 'sent_for_signature', 'archived')),
  esign_provider text,
  esign_external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_catalog_public_read ON public.documents_catalog;
CREATE POLICY documents_catalog_public_read
  ON public.documents_catalog FOR SELECT
  USING (is_published = true OR status = 'active');

DROP POLICY IF EXISTS documents_catalog_owner_all ON public.documents_catalog;
CREATE POLICY documents_catalog_owner_all
  ON public.documents_catalog FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_site_owner = true OR p.user_role = 'owner')
    )
  );

DROP POLICY IF EXISTS document_form_submissions_own ON public.document_form_submissions;
CREATE POLICY document_form_submissions_own
  ON public.document_form_submissions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.documents_catalog IS
  'Documents & Procedures catalog. Never invent legal text — under_review until human verifies official source.';
