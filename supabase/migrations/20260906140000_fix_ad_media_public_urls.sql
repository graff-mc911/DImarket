-- Fix broken ad creatives after ad-media → media bucket rename.
-- 1) Ensure media bucket is public (ON CONFLICT DO NOTHING left some private).
-- 2) Rewrite legacy ad-media public URLs stored on campaigns.
-- 3) Remap known orphaned object (metadata without blob) to a restored creative.

UPDATE storage.buckets
SET public = true
WHERE id = 'media' AND public IS DISTINCT FROM true;

-- Campaign-level image / media URLs
UPDATE public.ad_campaigns
SET
  image_url = replace(image_url, '/storage/v1/object/public/ad-media/', '/storage/v1/object/public/media/'),
  media_url = replace(media_url, '/storage/v1/object/public/ad-media/', '/storage/v1/object/public/media/'),
  updated_at = now()
WHERE
  coalesce(image_url, '') LIKE '%/object/public/ad-media/%'
  OR coalesce(media_url, '') LIKE '%/object/public/ad-media/%';

-- Slot media JSON (text replace is safe: only the bucket segment changes)
UPDATE public.ad_campaigns
SET
  slot_media = replace(slot_media::text, '/storage/v1/object/public/ad-media/', '/storage/v1/object/public/media/')::jsonb,
  updated_at = now()
WHERE slot_media::text LIKE '%/object/public/ad-media/%';

-- Orphaned Lisanov creative (storage.objects row exists, blob missing)
UPDATE public.ad_campaigns
SET
  image_url = 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/lisanov-restored-9017a15d28.jpg',
  media_url = 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/lisanov-restored-9017a15d28.jpg',
  slot_media = replace(
    replace(
      coalesce(slot_media, '{}'::jsonb)::text,
      'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/1787247240530-9i74gvnws88.png',
      'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/lisanov-restored-9017a15d28.jpg'
    ),
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/1787247240530-9i74gvnws88.png',
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/media/campaigns/lisanov-restored-9017a15d28.jpg'
  )::jsonb,
  updated_at = now()
WHERE id = '5d899979-85a9-446c-b3a6-d8293e89cf8b'
   OR coalesce(image_url, '') LIKE '%/campaigns/1787247240530-9i74gvnws88.png'
   OR coalesce(media_url, '') LIKE '%/campaigns/1787247240530-9i74gvnws88.png'
   OR slot_media::text LIKE '%/campaigns/1787247240530-9i74gvnws88.png';

-- Keep public read on media creatives (idempotent)
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'media');
