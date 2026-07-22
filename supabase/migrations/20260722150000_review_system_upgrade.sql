-- Review system upgrade: media, likes, replies, verified customer, like_count

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE reviews ADD COLUMN media_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN like_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_verified_customer'
  ) THEN
    ALTER TABLE reviews ADD COLUMN is_verified_customer boolean NOT NULL DEFAULT false;
  END IF;
END $$;

UPDATE reviews
SET is_verified_customer = true
WHERE listing_id IS NOT NULL AND is_verified_customer = false;

-- Allow reviews with media even when comment is empty (still require identity + rating)
DROP POLICY IF EXISTS "Users can create reviews with identification" ON reviews;
CREATE POLICY "Users can create reviews with identification"
  ON reviews FOR INSERT
  TO public
  WITH CHECK (
    reviewer_name IS NOT NULL
    AND reviewer_name <> ''
    AND reviewer_email IS NOT NULL
    AND reviewer_email <> ''
    AND rating >= 1
    AND rating <= 5
    AND (
      (comment IS NOT NULL AND comment <> '')
      OR jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) > 0
    )
  );

CREATE TABLE IF NOT EXISTS review_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(review_id);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_likes_select" ON review_likes;
CREATE POLICY "review_likes_select" ON review_likes FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "review_likes_insert" ON review_likes;
CREATE POLICY "review_likes_insert" ON review_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "review_likes_delete" ON review_likes;
CREATE POLICY "review_likes_delete" ON review_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.refresh_review_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid uuid;
BEGIN
  rid := COALESCE(NEW.review_id, OLD.review_id);
  UPDATE reviews
  SET like_count = (SELECT count(*)::int FROM review_likes WHERE review_id = rid)
  WHERE id = rid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_likes_count ON review_likes;
CREATE TRIGGER trg_review_likes_count
  AFTER INSERT OR DELETE ON review_likes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_review_like_count();

CREATE TABLE IF NOT EXISTS review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review ON review_replies(review_id, created_at);

ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_replies_select" ON review_replies;
CREATE POLICY "review_replies_select" ON review_replies FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "review_replies_insert" ON review_replies;
CREATE POLICY "review_replies_insert" ON review_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND length(trim(body)) > 0
  );

DROP POLICY IF EXISTS "review_replies_delete" ON review_replies;
CREATE POLICY "review_replies_delete" ON review_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Storage for review images/videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  true,
  104857600,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "review_media_read" ON storage.objects;
CREATE POLICY "review_media_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "review_media_upload" ON storage.objects;
CREATE POLICY "review_media_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "review_media_update" ON storage.objects;
CREATE POLICY "review_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "review_media_delete" ON storage.objects;
CREATE POLICY "review_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);
