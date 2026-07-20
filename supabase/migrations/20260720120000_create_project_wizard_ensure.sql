-- Ensure customer project wizard storage + tables (idempotent)

-- Listing project fields (if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'budget_min') THEN
    ALTER TABLE listings ADD COLUMN budget_min numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'budget_max') THEN
    ALTER TABLE listings ADD COLUMN budget_max numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'deadline_type') THEN
    ALTER TABLE listings ADD COLUMN deadline_type text CHECK (deadline_type IN ('flexible', 'asap', 'date'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'deadline_at') THEN
    ALTER TABLE listings ADD COLUMN deadline_at date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'urgency') THEN
    ALTER TABLE listings ADD COLUMN urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'preferred_language') THEN
    ALTER TABLE listings ADD COLUMN preferred_language text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'wizard_completed') THEN
    ALTER TABLE listings ADD COLUMN wizard_completed boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'postal_code') THEN
    ALTER TABLE listings ADD COLUMN postal_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'country_name') THEN
    ALTER TABLE listings ADD COLUMN country_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'city_name') THEN
    ALTER TABLE listings ADD COLUMN city_name text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  mime_type text,
  file_name text,
  kind text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video', 'pdf', 'plan', 'other')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_listing ON project_files(listing_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_files_select" ON project_files;
CREATE POLICY "project_files_select" ON project_files FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND (l.status = 'active' OR l.author_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "project_files_insert" ON project_files;
CREATE POLICY "project_files_insert" ON project_files FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_files_delete" ON project_files;
CREATE POLICY "project_files_delete" ON project_files FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_files_storage_read" ON storage.objects;
CREATE POLICY "project_files_storage_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "project_files_storage_upload" ON storage.objects;
CREATE POLICY "project_files_storage_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "project_files_storage_delete" ON storage.objects;
CREATE POLICY "project_files_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
