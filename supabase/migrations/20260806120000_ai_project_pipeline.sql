-- AI Project Pipeline: pro response triad + milestones for AI Project Manager
-- Extends existing project_applications / listings — no parallel bid system.

-- 1) Expand application response statuses (Ready / Need inspection / Decline)
DO $$
BEGIN
  ALTER TABLE public.project_applications
    DROP CONSTRAINT IF EXISTS project_applications_status_check;
  ALTER TABLE public.project_applications
    ADD CONSTRAINT project_applications_status_check
    CHECK (status IN (
      'saved',
      'applied',
      'ready',
      'needs_inspection',
      'declined',
      'withdrawn',
      'accepted',
      'rejected'
    ));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE public.project_applications
  ADD COLUMN IF NOT EXISTS response_note text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

-- 2) Project milestones (AI Project Manager) — FK to listings
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  label text NOT NULL,
  trade_id text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'blocked', 'done', 'skipped')),
  labor_hours numeric,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_listing
  ON public.project_milestones(listing_id, sort_order);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_milestones_select ON public.project_milestones;
CREATE POLICY project_milestones_select ON public.project_milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.author_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.project_applications pa
          WHERE pa.listing_id = l.id
            AND pa.professional_id = auth.uid()
            AND pa.status = 'accepted'
        ))
    )
  );

DROP POLICY IF EXISTS project_milestones_write ON public.project_milestones;
CREATE POLICY project_milestones_write ON public.project_milestones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.author_id = auth.uid()
    )
  );

-- Hired professional on listing (optional denormalized pointer)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS hired_professional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'intake';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
