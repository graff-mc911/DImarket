-- Витягує країну з location "місто, регіон, країна" або з одного значення.
CREATE OR REPLACE FUNCTION public.extract_location_country(loc text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(trim(split_part(loc, ', ', 3)), ''),
    CASE
      WHEN position(', ' IN COALESCE(loc, '')) = 0 THEN NULLIF(trim(loc), '')
      ELSE NULL
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.build_country_ranking_json()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH profile_rows AS (
    SELECT
      public.extract_location_country(p.location) AS country,
      p.id AS profile_id,
      NULL::uuid AS listing_id
    FROM public.profiles p
    WHERE p.is_professional = true
      AND p.location IS NOT NULL
      AND trim(p.location) <> ''
      AND public.extract_location_country(p.location) IS NOT NULL
  ),
  listing_rows AS (
    SELECT
      public.extract_location_country(l.location) AS country,
      NULL::uuid AS profile_id,
      l.id AS listing_id
    FROM public.listings l
    WHERE l.status IS DISTINCT FROM 'deleted'
      AND l.location IS NOT NULL
      AND trim(l.location) <> ''
      AND public.extract_location_country(l.location) IS NOT NULL
  ),
  combined AS (
    SELECT country, profile_id, listing_id FROM profile_rows
    UNION ALL
    SELECT country, profile_id, listing_id FROM listing_rows
  ),
  ranked AS (
    SELECT
      country,
      COUNT(DISTINCT profile_id) FILTER (WHERE profile_id IS NOT NULL)::int AS professionals,
      COUNT(DISTINCT listing_id) FILTER (WHERE listing_id IS NOT NULL)::int AS listings,
      (
        COUNT(DISTINCT profile_id) FILTER (WHERE profile_id IS NOT NULL) * 10
        + COUNT(DISTINCT listing_id) FILTER (WHERE listing_id IS NOT NULL) * 5
      )::int AS score,
      0::int AS responses
    FROM combined
    GROUP BY country
    ORDER BY score DESC, country ASC
    LIMIT 20
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'country', country,
        'score', score,
        'professionals', professionals,
        'listings', listings,
        'responses', responses
      )
      ORDER BY score DESC, country ASC
    ),
    '[]'::jsonb
  )
  FROM ranked;
$$;

CREATE OR REPLACE FUNCTION public.refresh_app_site_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_listings integer;
  v_successful_listings integer;
  v_total_professionals integer;
  v_country_ranking jsonb;
BEGIN
  SELECT COUNT(*)::int INTO v_total_listings
  FROM public.listings
  WHERE status IS DISTINCT FROM 'deleted';

  SELECT COUNT(*)::int INTO v_successful_listings
  FROM public.listings
  WHERE status IN ('sold', 'completed', 'closed');

  SELECT COUNT(*)::int INTO v_total_professionals
  FROM public.profiles
  WHERE is_professional = true;

  v_country_ranking := public.build_country_ranking_json();

  UPDATE public.app_site_stats
  SET
    total_listings_created = v_total_listings,
    total_successful_listings = v_successful_listings,
    total_professionals = v_total_professionals,
    country_ranking = COALESCE(v_country_ranking, '[]'::jsonb),
    updated_at = now()
  WHERE id = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_footer_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_professionals', (
      SELECT COUNT(*)::int FROM public.profiles WHERE is_professional = true
    ),
    'total_listings_created', (
      SELECT COUNT(*)::int FROM public.listings WHERE status IS DISTINCT FROM 'deleted'
    ),
    'total_successful_listings', (
      SELECT COUNT(*)::int
      FROM public.listings
      WHERE status IN ('sold', 'completed', 'closed')
    ),
    'total_visits', COALESCE((SELECT total_visits FROM public.app_site_stats WHERE id = 1), 0),
    'countries_count', (
      SELECT COUNT(DISTINCT public.extract_location_country(p.location))::int
      FROM public.profiles p
      WHERE p.is_professional = true
        AND p.location IS NOT NULL
        AND trim(p.location) <> ''
        AND public.extract_location_country(p.location) IS NOT NULL
    ),
    'country_ranking', public.build_country_ranking_json(),
    'updated_at', now()
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_footer_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_footer_stats() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM authenticated;

SELECT public.refresh_app_site_stats();
