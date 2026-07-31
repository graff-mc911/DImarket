-- AI Matching Engine: persist explanations, breakdown, facet signals; notify copy; upsert RLS

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_scores' AND column_name = 'explanation'
  ) THEN
    ALTER TABLE match_scores ADD COLUMN explanation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_scores' AND column_name = 'breakdown'
  ) THEN
    ALTER TABLE match_scores ADD COLUMN breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_scores' AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE match_scores ADD COLUMN distance_km numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_scores' AND column_name = 'value_score'
  ) THEN
    ALTER TABLE match_scores ADD COLUMN value_score numeric(6,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_scores' AND column_name = 'response_score'
  ) THEN
    ALTER TABLE match_scores ADD COLUMN response_score numeric(6,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_scores' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE match_scores ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_match_scores_listing_rank
  ON match_scores (listing_id, rank_position ASC NULLS LAST, score DESC);

DROP POLICY IF EXISTS "match_scores_update" ON match_scores;
CREATE POLICY "match_scores_update" ON match_scores
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Professionals receive a clear "New AI Match" notification
CREATE OR REPLACE FUNCTION public.notify_job_match_professionals(
  p_listing_id uuid,
  p_profile_ids uuid[]
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_count int := 0;
  v_pid uuid;
  v_score numeric;
  v_title text;
  v_body text;
BEGIN
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id;
  IF v_listing.id IS NULL OR v_listing.listing_type <> 'service_request' THEN
    RETURN 0;
  END IF;

  IF p_profile_ids IS NULL OR array_length(p_profile_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH v_pid IN ARRAY p_profile_ids LOOP
    IF v_pid IS NULL OR v_pid = v_listing.author_id THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = v_pid
        AND p.is_professional = true
        AND COALESCE(p.notifications_enabled, true) = true
    ) AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = v_pid
        AND n.reference_type = 'listing'
        AND n.reference_id = p_listing_id
        AND n.type = 'match'
    ) THEN
      SELECT ms.score INTO v_score
      FROM match_scores ms
      WHERE ms.listing_id = p_listing_id
        AND ms.contractor_id = v_pid
      LIMIT 1;

      v_title := 'New AI Match';
      v_body := LEFT(
        COALESCE(
          CASE
            WHEN v_score IS NOT NULL THEN
              'AI matched you (' || ROUND(v_score)::text || '%) — ' || COALESCE(v_listing.title, 'new project')
            ELSE
              'AI matched you to a new project — ' || COALESCE(v_listing.title, 'job request')
          END,
          'New AI Match'
        ),
        180
      );

      INSERT INTO notifications (
        user_id, type, title, body, link_path, reference_type, reference_id
      )
      VALUES (
        v_pid,
        'match',
        v_title,
        v_body,
        '/listing/' || p_listing_id::text,
        'listing',
        p_listing_id
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_job_match_professionals(uuid, uuid[]) TO authenticated;
