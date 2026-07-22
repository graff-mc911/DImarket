-- Professional Portfolio upgrade: media types, before/after, likes, categories

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN media_type text NOT NULL DEFAULT 'image'
      CHECK (media_type IN ('image', 'video', 'certificate', 'before_after'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'before_url'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN before_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'after_url'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN after_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'category_slug'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN category_slug text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN like_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'portfolio_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE portfolio_items ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Allow empty image_url for video-only (cover may be optional)
DO $$
BEGIN
  ALTER TABLE portfolio_items ALTER COLUMN image_url DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS portfolio_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (portfolio_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile
  ON portfolio_items(profile_id, display_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_likes_item
  ON portfolio_likes(portfolio_item_id);

ALTER TABLE portfolio_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_likes_select" ON portfolio_likes;
CREATE POLICY "portfolio_likes_select" ON portfolio_likes FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "portfolio_likes_insert" ON portfolio_likes;
CREATE POLICY "portfolio_likes_insert" ON portfolio_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "portfolio_likes_delete" ON portfolio_likes;
CREATE POLICY "portfolio_likes_delete" ON portfolio_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Backfill portfolio_items from legacy portfolio_images JSONB
INSERT INTO portfolio_items (profile_id, title, description, image_url, display_order, media_type)
SELECT
  p.id,
  'Work ' || (ord.ordinality)::text,
  null,
  trim(both '"' from ord.img::text),
  (ord.ordinality - 1)::int,
  'image'
FROM profiles p
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN jsonb_typeof(COALESCE(p.portfolio_images, '[]'::jsonb)) = 'array'
    THEN COALESCE(p.portfolio_images, '[]'::jsonb)
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS ord(img, ordinality)
WHERE trim(both '"' from ord.img::text) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM portfolio_items pi
    WHERE pi.profile_id = p.id AND pi.image_url = trim(both '"' from ord.img::text)
  );

-- Storage bucket for portfolio media (images + video)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media',
  'portfolio-media',
  true,
  104857600,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "portfolio_media_read" ON storage.objects;
CREATE POLICY "portfolio_media_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "portfolio_media_upload" ON storage.objects;
CREATE POLICY "portfolio_media_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolio_media_update" ON storage.objects;
CREATE POLICY "portfolio_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolio_media_delete" ON storage.objects;
CREATE POLICY "portfolio_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
