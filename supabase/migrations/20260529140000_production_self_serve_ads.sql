-- Production fix: self-serve ads (upload bucket, regions column, status, geo)

ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}';

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'ad_campaigns' AND c.contype = 'c' AND c.conname LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'pending_payment',
    'active', 'paused', 'rejected', 'expired', 'deleted'
  ));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'ad_campaigns' AND c.contype = 'c' AND c.conname LIKE '%geo_scope%'
  LOOP
    EXECUTE format('ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_geo_scope_check
  CHECK (geo_scope IN (
    'global', 'countries', 'regions', 'cities',
    'country', 'region', 'city'
  ));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-media',
  'ad-media',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ad media" ON storage.objects;
CREATE POLICY "Public read ad media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ad-media');

DROP POLICY IF EXISTS "Authenticated upload ad media" ON storage.objects;
CREATE POLICY "Authenticated upload ad media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ad-media'
    AND (storage.foldername(name))[1] = 'campaigns'
  );

DROP POLICY IF EXISTS "Authenticated update ad media" ON storage.objects;
CREATE POLICY "Authenticated update ad media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');

DROP POLICY IF EXISTS "Authenticated delete ad media" ON storage.objects;
CREATE POLICY "Authenticated delete ad media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');
