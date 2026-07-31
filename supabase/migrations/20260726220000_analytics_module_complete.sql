-- ============================================================
-- Analytics module: search events, generic events, realtime
-- ============================================================

CREATE TABLE IF NOT EXISTS search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  query text,
  category_slug text,
  city text,
  country text,
  result_count integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'search',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_category ON search_events (category_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_city ON search_events (city, created_at DESC)
  WHERE city IS NOT NULL AND city <> '';
CREATE INDEX IF NOT EXISTS idx_search_events_no_results ON search_events (created_at DESC)
  WHERE result_count = 0;

ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_events_insert" ON search_events;
CREATE POLICY "search_events_insert" ON search_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "search_events_read_owner" ON search_events;
CREATE POLICY "search_events_read_owner" ON search_events
  FOR SELECT TO authenticated
  USING (public.is_site_owner() OR user_id = auth.uid());

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_day
  ON analytics_events (event_type, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_events_insert" ON analytics_events;
CREATE POLICY "analytics_events_insert" ON analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_events_read_owner" ON analytics_events;
CREATE POLICY "analytics_events_read_owner" ON analytics_events
  FOR SELECT TO authenticated
  USING (public.is_site_owner() OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.record_search_event(
  p_query text DEFAULT NULL,
  p_category_slug text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_result_count integer DEFAULT 0,
  p_source text DEFAULT 'search'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO search_events (
    user_id, query, category_slug, city, country, result_count, source
  ) VALUES (
    auth.uid(),
    NULLIF(trim(COALESCE(p_query, '')), ''),
    NULLIF(trim(COALESCE(p_category_slug, '')), ''),
    NULLIF(trim(COALESCE(p_city, '')), ''),
    NULLIF(trim(COALESCE(p_country, '')), ''),
    GREATEST(COALESCE(p_result_count, 0), 0),
    COALESCE(NULLIF(trim(p_source), ''), 'search')
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_search_event(text, text, text, text, integer, text)
  TO anon, authenticated;

-- Extend admin series to support up to 365 days
CREATE OR REPLACE FUNCTION public.admin_analytics_series(p_days integer DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days int := LEAST(GREATEST(COALESCE(p_days, 14), 1), 366);
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
  ),
  new_users AS (
    SELECT created_at::date AS d, COUNT(*)::int AS total
    FROM profiles
    WHERE created_at >= (CURRENT_DATE - (days - 1))
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
    'new_users', (
      SELECT jsonb_agg(COALESCE(u.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN new_users u ON u.d = days.d
    ),
    'kpis', jsonb_build_object(
      'revenue_total', (SELECT COALESCE(SUM(total), 0) FROM revenue),
      'projects_total', (SELECT COALESCE(SUM(total), 0) FROM projects),
      'profile_views_total', (SELECT COALESCE(SUM(total), 0) FROM views),
      'listing_views', (
        SELECT COALESCE(SUM(views_count), 0) FROM listings
        WHERE coalesce(status, 'active') <> 'deleted'
      ),
      'avg_rating', (
        SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews
        WHERE coalesce(is_hidden, false) = false
          AND created_at >= (CURRENT_DATE - (days - 1))
      ),
      'recommend_pct', (
        SELECT ROUND(
          100.0 * COUNT(*) FILTER (WHERE would_recommend = true)
          / NULLIF(COUNT(*) FILTER (WHERE would_recommend IS NOT NULL), 0),
          1
        )
        FROM reviews
        WHERE coalesce(is_hidden, false) = false
          AND created_at >= (CURRENT_DATE - (days - 1))
      ),
      'quotes_sent', (
        SELECT COUNT(*) FROM quotes
        WHERE status IN ('sent', 'accepted', 'rejected', 'declined')
          AND created_at >= (CURRENT_DATE - (days - 1))
      ),
      'quotes_accepted', (
        SELECT COUNT(*) FROM quotes
        WHERE status = 'accepted'
          AND created_at >= (CURRENT_DATE - (days - 1))
      ),
      'payments_count', (SELECT COUNT(*) FROM payments WHERE status = 'completed'
        AND created_at >= (CURRENT_DATE - (days - 1))),
      'active_projects', (
        SELECT COUNT(*) FROM listings
        WHERE listing_type = 'service_request' AND status = 'active'
      ),
      'new_users', (SELECT COALESCE(SUM(total), 0) FROM new_users),
      'professionals', (
        SELECT COUNT(*) FROM profiles WHERE is_professional = true OR user_role = 'professional'
      ),
      'companies', (
        SELECT COUNT(*) FROM profiles WHERE user_role = 'company'
      ),
      'premium_users', (
        SELECT COUNT(*) FROM profiles WHERE coalesce(is_premium, false) = true
      ),
      'reviews_total', (
        SELECT COUNT(*) FROM reviews
        WHERE coalesce(is_hidden, false) = false
          AND created_at >= (CURRENT_DATE - (days - 1))
      )
    )
  ) INTO out;

  RETURN out;
END;
$$;

-- Pro series: allow up to 365 days
CREATE OR REPLACE FUNCTION public.pro_analytics_series(p_days integer DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days int := LEAST(GREATEST(COALESCE(p_days, 14), 1), 366);
  uid uuid := auth.uid();
  out jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  WITH days AS (
    SELECT generate_series(
      (CURRENT_DATE - (days - 1)),
      CURRENT_DATE,
      interval '1 day'
    )::date AS d
  ),
  apps AS (
    SELECT created_at::date AS d, COUNT(*)::int AS total
    FROM project_applications
    WHERE professional_id = uid
      AND created_at >= (CURRENT_DATE - (days - 1))
    GROUP BY 1
  ),
  revenue AS (
    SELECT COALESCE(updated_at, created_at)::date AS d,
           COALESCE(SUM(total), 0)::numeric AS total
    FROM quotes
    WHERE professional_id = uid
      AND status = 'accepted'
      AND COALESCE(updated_at, created_at) >= (CURRENT_DATE - (days - 1))
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
      SELECT jsonb_agg(COALESCE(a.total, 0) ORDER BY days.d)
      FROM days LEFT JOIN apps a ON a.d = days.d
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
      'revenue_total', (SELECT COALESCE(SUM(total), 0) FROM revenue),
      'projects_total', (SELECT COALESCE(SUM(total), 0) FROM apps),
      'profile_views_total', (SELECT COALESCE(profile_views, 0) FROM profiles WHERE id = uid),
      'listing_views', (
        SELECT COALESCE(SUM(views_count), 0) FROM listings WHERE author_id = uid
      ),
      'avg_rating', (SELECT rating FROM profiles WHERE id = uid),
      'quotes_sent', (
        SELECT COUNT(*) FROM quotes
        WHERE professional_id = uid
          AND status IN ('sent', 'accepted', 'rejected', 'declined')
      ),
      'quotes_accepted', (
        SELECT COUNT(*) FROM quotes WHERE professional_id = uid AND status = 'accepted'
      ),
      'apps_total', (SELECT COALESCE(SUM(total), 0) FROM apps),
      'response_rate', (SELECT response_rate FROM profiles WHERE id = uid),
      'reviews_total', (
        SELECT COUNT(*) FROM reviews
        WHERE professional_id = uid AND coalesce(is_hidden, false) = false
      )
    )
  ) INTO out;

  RETURN out;
END;
$$;

-- Realtime publication (ignore if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profile_view_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE search_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE analytics_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
