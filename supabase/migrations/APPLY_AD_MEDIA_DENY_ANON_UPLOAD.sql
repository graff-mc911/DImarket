-- Harden ad-media: authenticated uploads only; public read OK.
-- Apply in Supabase SQL Editor if anon can currently upload.

-- Ensure bucket exists and is public-read
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-media', 'ad-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop overly permissive anon write policies if present
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname ILIKE '%ad-media%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "ad_media_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ad-media');

CREATE POLICY "ad_media_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ad-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ad_media_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ad-media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'ad-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ad_media_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ad-media' AND auth.uid()::text = (storage.foldername(name))[1]);
