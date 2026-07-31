-- Professional Reviews module: verified projects, helpful votes, before/after, metadata

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewer_avatar_url'
  ) THEN
    ALTER TABLE reviews ADD COLUMN reviewer_avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'reviewer_country_code'
  ) THEN
    ALTER TABLE reviews ADD COLUMN reviewer_country_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'project_category'
  ) THEN
    ALTER TABLE reviews ADD COLUMN project_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'project_completed_at'
  ) THEN
    ALTER TABLE reviews ADD COLUMN project_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_verified_project'
  ) THEN
    ALTER TABLE reviews ADD COLUMN is_verified_project boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'before_media_urls'
  ) THEN
    ALTER TABLE reviews ADD COLUMN before_media_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'after_media_urls'
  ) THEN
    ALTER TABLE reviews ADD COLUMN after_media_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN helpful_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'not_helpful_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN not_helpful_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN booking_id uuid;
  END IF;
END $$;

-- Optional FK to bookings when that table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'reviews'
      AND constraint_name = 'reviews_booking_id_fkey'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE reviews
SET helpful_count = COALESCE(like_count, 0)
WHERE COALESCE(helpful_count, 0) = 0 AND COALESCE(like_count, 0) > 0;

UPDATE reviews
SET is_verified_project = true
WHERE is_verified_project = false
  AND (listing_id IS NOT NULL OR is_verified_customer = true);

CREATE INDEX IF NOT EXISTS idx_reviews_professional_created
  ON reviews(professional_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_professional_rating
  ON reviews(professional_id, rating DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_professional_helpful
  ON reviews(professional_id, helpful_count DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_verified_project
  ON reviews(professional_id, is_verified_project)
  WHERE is_verified_project = true;

-- Helpful / Not helpful votes (one vote per user per review)
CREATE TABLE IF NOT EXISTS review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('helpful', 'not_helpful')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_votes_select" ON review_votes;
CREATE POLICY "review_votes_select" ON review_votes FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "review_votes_insert" ON review_votes;
CREATE POLICY "review_votes_insert" ON review_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "review_votes_update" ON review_votes;
CREATE POLICY "review_votes_update" ON review_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "review_votes_delete" ON review_votes;
CREATE POLICY "review_votes_delete" ON review_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.refresh_review_vote_counts()
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
  SET
    helpful_count = (
      SELECT count(*)::int FROM review_votes
      WHERE review_id = rid AND vote = 'helpful'
    ),
    not_helpful_count = (
      SELECT count(*)::int FROM review_votes
      WHERE review_id = rid AND vote = 'not_helpful'
    ),
    like_count = (
      SELECT count(*)::int FROM review_votes
      WHERE review_id = rid AND vote = 'helpful'
    )
  WHERE id = rid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_votes_count ON review_votes;
CREATE TRIGGER trg_review_votes_count
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_review_vote_counts();

-- Backfill votes from legacy likes (helpful)
INSERT INTO review_votes (review_id, user_id, vote)
SELECT rl.review_id, rl.user_id, 'helpful'
FROM review_likes rl
ON CONFLICT (review_id, user_id) DO NOTHING;

-- Completed projects a customer may review for a professional
CREATE OR REPLACE FUNCTION public.get_reviewable_projects(
  p_customer_id uuid,
  p_professional_id uuid
)
RETURNS TABLE (
  source text,
  listing_id uuid,
  booking_id uuid,
  project_title text,
  project_category text,
  project_completed_at timestamptz,
  country_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF p_customer_id IS NULL OR p_professional_id IS NULL THEN
    RETURN;
  END IF;
  IF p_customer_id = p_professional_id THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_customer_id THEN
    RETURN;
  END IF;

  -- Completed bookings
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    RETURN QUERY
    SELECT
      'booking'::text AS source,
      NULL::uuid AS listing_id,
      b.id AS booking_id,
      COALESCE(b.notes, 'Completed booking')::text AS project_title,
      NULL::text AS project_category,
      COALESCE(b.updated_at, b.ends_at, b.created_at) AS project_completed_at,
      NULL::text AS country_name
    FROM bookings b
    WHERE b.customer_id = p_customer_id
      AND b.professional_id = p_professional_id
      AND b.status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM reviews r
        WHERE r.reviewer_id = p_customer_id
          AND r.professional_id = p_professional_id
          AND r.booking_id = b.id
      );
  END IF;

  -- Sold / completed listings with accepted application or accepted quote
  RETURN QUERY
  SELECT
    'listing'::text AS source,
    l.id AS listing_id,
    NULL::uuid AS booking_id,
    l.title::text AS project_title,
    COALESCE(c.name, l.subcategory_slugs[1], 'Project')::text AS project_category,
    COALESCE(l.updated_at, l.created_at) AS project_completed_at,
    l.country_name::text AS country_name
  FROM listings l
  LEFT JOIN categories c ON c.id = l.category_id
  WHERE l.author_id = p_customer_id
    AND l.status = 'sold'
    AND (
      EXISTS (
        SELECT 1 FROM project_applications pa
        WHERE pa.listing_id = l.id
          AND pa.professional_id = p_professional_id
          AND pa.status = 'accepted'
      )
      OR EXISTS (
        SELECT 1 FROM quotes q
        WHERE q.listing_id = l.id
          AND q.professional_id = p_professional_id
          AND q.status = 'accepted'
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.reviewer_id = p_customer_id
        AND r.professional_id = p_professional_id
        AND r.listing_id = l.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reviewable_projects(uuid, uuid) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.customer_can_review_professional(
  p_customer_id uuid,
  p_professional_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_reviewable_projects(p_customer_id, p_professional_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.customer_can_review_professional(uuid, uuid) TO authenticated, anon;

-- Tighten insert: authenticated reviewer, completed project relation, content required.
DROP POLICY IF EXISTS "Users can create reviews with identification" ON reviews;
CREATE POLICY "Users can create reviews with identification"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND reviewer_name IS NOT NULL
    AND reviewer_name <> ''
    AND rating >= 1
    AND rating <= 5
    AND professional_id <> auth.uid()
    AND (
      (comment IS NOT NULL AND btrim(comment) <> '')
      OR jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) > 0
      OR jsonb_array_length(COALESCE(before_media_urls, '[]'::jsonb)) > 0
      OR jsonb_array_length(COALESCE(after_media_urls, '[]'::jsonb)) > 0
    )
    AND (
      (
        listing_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.get_reviewable_projects(auth.uid(), professional_id) g
          WHERE g.listing_id = listing_id
        )
      )
      OR (
        booking_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.get_reviewable_projects(auth.uid(), professional_id) g
          WHERE g.booking_id = booking_id
        )
      )
    )
  );
