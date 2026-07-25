-- ============================================================
-- Analytics: profile views, daily series helpers, response metrics
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  );
$$;

CREATE TABLE IF NOT EXISTS profile_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_view_events_profile_day
  ON profile_view_events (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_view_events_created
  ON profile_view_events (created_at DESC);

ALTER TABLE profile_view_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read profile views" ON profile_view_events;
CREATE POLICY "Owners read profile views"
  ON profile_view_events FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.is_site_owner()
  );

DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_view_events;
CREATE POLICY "Anyone can insert profile views"
  ON profile_view_events FOR INSERT
  WITH CHECK (true);

-- Increment profile_views + log event (dedupe same viewer within 30 min)
CREATE OR REPLACE FUNCTION public.record_profile_view(p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer uuid := auth.uid();
  v_count integer;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Don't count self-views
  IF v_viewer IS NOT NULL AND v_viewer = p_profile_id THEN
    SELECT COALESCE(profile_views, 0) INTO v_count FROM profiles WHERE id = p_profile_id;
    RETURN COALESCE(v_count, 0);
  END IF;

  -- Dedupe: same viewer (or anon fingerprint via null) within 30 minutes
  IF v_viewer IS NOT NULL AND EXISTS (
    SELECT 1 FROM profile_view_events
    WHERE profile_id = p_profile_id
      AND viewer_id = v_viewer
      AND created_at > now() - interval '30 minutes'
  ) THEN
    SELECT COALESCE(profile_views, 0) INTO v_count FROM profiles WHERE id = p_profile_id;
    RETURN COALESCE(v_count, 0);
  END IF;

  INSERT INTO profile_view_events (profile_id, viewer_id)
  VALUES (p_profile_id, v_viewer);

  UPDATE profiles
  SET profile_views = COALESCE(profile_views, 0) + 1,
      updated_at = now()
  WHERE id = p_profile_id
  RETURNING profile_views INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_profile_view(uuid) TO anon, authenticated;

-- Platform / owner analytics series (last N days)
CREATE OR REPLACE FUNCTION public.admin_analytics_series(p_days integer DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days int := LEAST(GREATEST(COALESCE(p_days, 14), 7), 90);
  out jsonb;
BEGIN
  PERFORM public.admin_assert_site_owner();

  WITH days AS (
    SELECT generate_series(
      (CURRENT_DATE - (days - 1)),
      CURRENT_DATE,
      interval '1 day'
    )::date AS d
  ),
  revenue AS (
    SELECT created_at::date AS d, COALESCE(SUM(amount), 0)::numeric AS total
    FROM payments
    WHERE status = 'completed'
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  projects AS (
    SELECT created_at::date AS d, COUNT(*)::int AS total
    FROM listings
    WHERE listing_type = 'service_request'
      AND coalesce(status, 'active') <> 'deleted'
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  views AS (
    SELECT created_at::date AS d, COUNT(*)::int AS total
    FROM profile_view_events
    WHERE created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  reviews AS (
    SELECT created_at::date AS d,
           ROUND(AVG(rating)::numeric, 2) AS avg_rating,
           COUNT(*)::int AS total
    FROM reviews
    WHERE coalesce(is_hidden, false) = false
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'days', days,
    'labels', (SELECT jsonb_agg(to_char(d, 'Dy') ORDER BY d) FROM days),
    'dates', (SELECT jsonb_agg(d::text ORDER BY d) FROM days),
    'revenue', (
      SELECT jsonb_agg(COALESCE(r.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN revenue r ON r.d = days.d
    ),
    'projects', (
      SELECT jsonb_agg(COALESCE(p.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN projects p ON p.d = days.d
    ),
    'profile_views', (
      SELECT jsonb_agg(COALESCE(v.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN views v ON v.d = days.d
    ),
    'satisfaction', (
      SELECT jsonb_agg(COALESCE(rv.avg_rating, 0) ORDER BY days.d)
      FROM days LEFT JOIN reviews rv ON rv.d = days.d
    ),
    'kpis', jsonb_build_object(
      'revenue_total', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= (CURRENT_DATE - (days - 1))),
      'projects_total', (SELECT COUNT(*) FROM listings WHERE listing_type = 'service_request' AND coalesce(status, 'active') <> 'deleted' AND created_at >= (CURRENT_DATE - (days - 1))),
      'listing_views', (SELECT COALESCE(SUM(views_count), 0) FROM listings),
      'profile_views_total', (SELECT COUNT(*) FROM profile_view_events WHERE created_at >= (CURRENT_DATE - (days - 1))),
      'avg_rating', (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE coalesce(is_hidden, false) = false),
      'recommend_pct', (
        SELECT ROUND(
          100.0 * COUNT(*) FILTER (WHERE would_recommend = true) / NULLIF(COUNT(*), 0),
          1
        )
        FROM reviews
        WHERE coalesce(is_hidden, false) = false
          AND would_recommend IS NOT NULL
      ),
      'quotes_sent', (SELECT COUNT(*) FROM quotes WHERE status IN ('sent', 'accepted', 'rejected', 'declined') OR status = 'sent'),
      'quotes_accepted', (SELECT COUNT(*) FROM quotes WHERE status = 'accepted'),
      'payments_count', (SELECT COUNT(*) FROM payments WHERE status = 'completed' AND created_at >= (CURRENT_DATE - (days - 1))),
      'active_projects', (SELECT COUNT(*) FROM listings WHERE listing_type = 'service_request' AND status = 'active')
    )
  ) INTO out;

  RETURN out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_analytics_series(integer) TO authenticated;

-- Pro analytics series for a professional
CREATE OR REPLACE FUNCTION public.pro_analytics_series(p_days integer DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days int := LEAST(GREATEST(COALESCE(p_days, 14), 7), 90);
  uid uuid := auth.uid();
  out jsonb;
  v_response_hours numeric;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Avg hours to first reply across conversations (sample last 40)
  SELECT ROUND(AVG(EXTRACT(EPOCH FROM (first_reply - first_inbound)) / 3600.0)::numeric, 1)
  INTO v_response_hours
  FROM (
    SELECT first_inbound, first_reply
    FROM (
      SELECT
        MIN(m.created_at) FILTER (WHERE m.sender_id IS DISTINCT FROM uid) AS first_inbound,
        MIN(m.created_at) FILTER (WHERE m.sender_id = uid) AS first_reply,
        MAX(m.created_at) AS last_at
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      WHERE c.participant_a = uid OR c.participant_b = uid
      GROUP BY c.id
    ) s
    WHERE first_inbound IS NOT NULL
      AND first_reply IS NOT NULL
      AND first_reply > first_inbound
    ORDER BY last_at DESC
    LIMIT 40
  ) t;

  -- Update response_rate heuristic (faster reply => higher rate, capped)
  IF v_response_hours IS NOT NULL THEN
    UPDATE profiles SET
      response_rate = GREATEST(20, LEAST(100, ROUND(100 - (v_response_hours * 4)))),
      updated_at = now()
    WHERE id = uid;
  END IF;

  WITH days AS (
    SELECT generate_series(
      (CURRENT_DATE - (days - 1)),
      CURRENT_DATE,
      interval '1 day'
    )::date AS d
  ),
  revenue AS (
    SELECT COALESCE(updated_at, created_at)::date AS d, COALESCE(SUM(total), 0)::numeric AS total
    FROM quotes
    WHERE professional_id = uid
      AND status = 'accepted'
      AND COALESCE(updated_at, created_at) >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  projects AS (
    SELECT created_at::date AS d, COUNT(*)::int AS total
    FROM project_applications
    WHERE professional_id = uid
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  views AS (
    SELECT created_at::date AS d, COUNT(*)::int AS total
    FROM profile_view_events
    WHERE profile_id = uid
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  reviews AS (
    SELECT created_at::date AS d,
           ROUND(AVG(rating)::numeric, 2) AS avg_rating
    FROM reviews
    WHERE professional_id = uid
      AND coalesce(is_hidden, false) = false
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'days', days,
    'labels', (SELECT jsonb_agg(to_char(d, 'Dy') ORDER BY d) FROM days),
    'dates', (SELECT jsonb_agg(d::text ORDER BY d) FROM days),
    'revenue', (
      SELECT jsonb_agg(COALESCE(r.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN revenue r ON r.d = days.d
    ),
    'projects', (
      SELECT jsonb_agg(COALESCE(p.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN projects p ON p.d = days.d
    ),
    'profile_views', (
      SELECT jsonb_agg(COALESCE(v.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN views v ON v.d = days.d
    ),
    'satisfaction', (
      SELECT jsonb_agg(COALESCE(rv.avg_rating, 0) ORDER BY days.d)
      FROM days LEFT JOIN reviews rv ON rv.d = days.d
    ),
    'kpis', jsonb_build_object(
      'revenue_total', (
        SELECT COALESCE(SUM(total), 0) FROM quotes
        WHERE professional_id = uid AND status = 'accepted'
          AND COALESCE(updated_at, created_at) >= (CURRENT_DATE - (days - 1))
      ),
      'projects_total', (
        SELECT COUNT(*) FROM project_applications
        WHERE professional_id = uid AND created_at >= (CURRENT_DATE - (days - 1))
      ),
      'profile_views_total', (
        SELECT COALESCE(profile_views, 0) FROM profiles WHERE id = uid
      ),
      'listing_views', (
        SELECT COALESCE(SUM(views_count), 0) FROM listings WHERE author_id = uid
      ),
      'avg_rating', (
        SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews
        WHERE professional_id = uid AND coalesce(is_hidden, false) = false
      ),
      'recommend_pct', (
        SELECT ROUND(
          100.0 * COUNT(*) FILTER (WHERE would_recommend = true) / NULLIF(COUNT(*), 0),
          1
        )
        FROM reviews
        WHERE professional_id = uid
          AND coalesce(is_hidden, false) = false
          AND would_recommend IS NOT NULL
      ),
      'quotes_sent', (
        SELECT COUNT(*) FROM quotes
        WHERE professional_id = uid AND status IN ('sent', 'accepted', 'rejected', 'declined')
      ),
      'quotes_accepted', (
        SELECT COUNT(*) FROM quotes WHERE professional_id = uid AND status = 'accepted'
      ),
      'apps_total', (
        SELECT COUNT(*) FROM project_applications WHERE professional_id = uid
      ),
      'response_hours', v_response_hours,
      'response_rate', (SELECT response_rate FROM profiles WHERE id = uid)
    )
  ) INTO out;

  RETURN out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pro_analytics_series(integer) TO authenticated;
