-- Project Wizard upgrade: drafts, preferences, draft listing status

DO $$
BEGIN
  -- Allow draft listings for unfinished wizard projects
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'status'
  ) THEN
    ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
    ALTER TABLE listings
      ADD CONSTRAINT listings_status_check
      CHECK (status IN ('draft', 'active', 'expired', 'sold', 'deleted', 'completed', 'closed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'wizard_preferences'
  ) THEN
    ALTER TABLE listings ADD COLUMN wizard_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'budget_band'
  ) THEN
    ALTER TABLE listings ADD COLUMN budget_band text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'timeline_option'
  ) THEN
    ALTER TABLE listings ADD COLUMN timeline_option text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_wizard_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  step integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'abandoned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_wizard_drafts_user
  ON project_wizard_drafts(user_id, updated_at DESC)
  WHERE status = 'draft';

ALTER TABLE project_wizard_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wizard_drafts_select" ON project_wizard_drafts;
CREATE POLICY "wizard_drafts_select" ON project_wizard_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wizard_drafts_insert" ON project_wizard_drafts;
CREATE POLICY "wizard_drafts_insert" ON project_wizard_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wizard_drafts_update" ON project_wizard_drafts;
CREATE POLICY "wizard_drafts_update" ON project_wizard_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wizard_drafts_delete" ON project_wizard_drafts;
CREATE POLICY "wizard_drafts_delete" ON project_wizard_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_wizard_draft_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wizard_draft_updated ON project_wizard_drafts;
CREATE TRIGGER trg_wizard_draft_updated
  BEFORE UPDATE ON project_wizard_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_wizard_draft_updated_at();
