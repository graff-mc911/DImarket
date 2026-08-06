-- AI Operating System for Construction
-- Extends listings / milestones / matching — no parallel marketplace.

-- Project phase media (before / during / after)
CREATE TABLE IF NOT EXISTS public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phase text NOT NULL CHECK (phase IN ('before', 'during', 'after')),
  milestone_id uuid REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  url text NOT NULL,
  storage_path text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_media_listing
  ON public.project_media(listing_id, phase, created_at DESC);

ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_media_select ON public.project_media;
CREATE POLICY project_media_select ON public.project_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (
          l.author_id = auth.uid()
          OR l.hired_professional_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS project_media_insert ON public.project_media;
CREATE POLICY project_media_insert ON public.project_media
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.author_id = auth.uid() OR l.hired_professional_id = auth.uid())
    )
  );

-- Generated project documents (acts, invoices, warranty)
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('act', 'invoice', 'warranty', 'payment_note')),
  title text NOT NULL,
  body_html text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'signed', 'paid')),
  amount numeric,
  currency text DEFAULT 'EUR',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_listing
  ON public.project_documents(listing_id, doc_type);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_documents_all ON public.project_documents;
CREATE POLICY project_documents_all ON public.project_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.author_id = auth.uid() OR l.hired_professional_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.author_id = auth.uid() OR l.hired_professional_id = auth.uid())
    )
  );

-- Procurement shortlist (client-confirmed material orders intent)
CREATE TABLE IF NOT EXISTS public.project_procurement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  cost_estimate_id uuid REFERENCES public.cost_estimates(id) ON DELETE SET NULL,
  material_name text NOT NULL,
  category text,
  quantity numeric,
  unit text,
  chosen_listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  chosen_price numeric,
  delivery_estimate text,
  status text NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'compared', 'approved', 'ordered', 'delivered', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_procurement_listing
  ON public.project_procurement_items(listing_id, status);

ALTER TABLE public.project_procurement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_procurement_all ON public.project_procurement_items;
CREATE POLICY project_procurement_all ON public.project_procurement_items
  FOR ALL TO authenticated
  USING (
    listing_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.author_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.author_id = auth.uid()
    )
  );

-- Learned professional performance (never exposes private client PII)
CREATE TABLE IF NOT EXISTS public.pro_performance_profiles (
  professional_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  jobs_completed int NOT NULL DEFAULT 0,
  avg_quote_total numeric,
  avg_duration_days numeric,
  on_time_rate numeric,
  satisfaction_rate numeric,
  return_rate numeric,
  recommend_rate numeric,
  specialty_slugs text[] DEFAULT '{}',
  last_computed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pro_performance_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pro_performance_select ON public.pro_performance_profiles;
CREATE POLICY pro_performance_select ON public.pro_performance_profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pro_performance_upsert ON public.pro_performance_profiles;
CREATE POLICY pro_performance_upsert ON public.pro_performance_profiles
  FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- Milestone reminder tracking
ALTER TABLE public.project_milestones
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS pipeline_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_prompted_at timestamptz;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_procurement_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pro_performance_profiles TO authenticated;
