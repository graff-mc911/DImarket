-- Storage bucket "media" + owner-scoped RLS
-- Fixes: C3 (ad-media -> media bucket rename had no migration; DB drifted from
--        version control) and H5 (storage UPDATE/DELETE not owner-scoped).
--
-- The frontend (src/lib/adMediaStorage.ts, src/hooks/useAdBannerMediaUpload.ts)
-- now uploads to `campaigns/<user_id>/<file>` so UPDATE/DELETE can be scoped to
-- the owning user. Public read remains open for campaign creatives.
-- Legacy objects at `campaigns/<file>` (no user_id segment) remain publicly
-- readable but can no longer be mutated by anyone except the service role.

-- 1. Create the `media` bucket if it does not exist, and ensure it is public
--    even if it was previously created as private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop stale `ad-media` WRITE policies (INSERT/UPDATE/DELETE) — the bucket
--    was renamed in the frontend to `media`. KEEP the public SELECT policy so
--    any legacy objects still in `ad-media` keep loading publicly (no broken URLs).
DROP POLICY IF EXISTS "Authenticated upload ad media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update ad media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete ad media" ON storage.objects;
-- Public read on ad-media (recreate in case the next block dropped it).
DROP POLICY IF EXISTS "Public read ad media" ON storage.objects;
CREATE POLICY "Public read ad media" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ad-media');

-- 3. Drop any prior `media` policies so this migration is re-runnable.
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media" ON storage.objects;

-- 4. Public read for campaign creatives.
CREATE POLICY "Public read media" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'media');

-- 5. Authenticated users may upload into their own campaigns folder only:
--    `campaigns/<auth.uid()>/...`. The service role bypasses RLS.
CREATE POLICY "Authenticated upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 6. UPDATE / DELETE scoped to the owning user's folder. WITH CHECK on UPDATE
--    prevents path reparenting (moving an object into another user's folder).
CREATE POLICY "Authenticated update media" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Authenticated delete media" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'campaigns'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
