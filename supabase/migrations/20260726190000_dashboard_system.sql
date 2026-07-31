-- Dashboard system: project lifecycle + company workspace

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'lifecycle_status'
  ) THEN
    ALTER TABLE listings ADD COLUMN lifecycle_status text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS company_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  employees jsonb NOT NULL DEFAULT '[]'::jsonb,
  branches jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  certificates jsonb NOT NULL DEFAULT '[]'::jsonb,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_workspaces_user ON company_workspaces(user_id);

ALTER TABLE company_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_workspace_select" ON company_workspaces;
CREATE POLICY "company_workspace_select" ON company_workspaces FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_site_owner = true
  ));

DROP POLICY IF EXISTS "company_workspace_upsert" ON company_workspaces;
CREATE POLICY "company_workspace_insert" ON company_workspaces FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "company_workspace_update" ON company_workspaces;
CREATE POLICY "company_workspace_update" ON company_workspaces FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "company_workspace_delete" ON company_workspaces;
CREATE POLICY "company_workspace_delete" ON company_workspaces FOR DELETE TO authenticated
  USING (user_id = auth.uid());
