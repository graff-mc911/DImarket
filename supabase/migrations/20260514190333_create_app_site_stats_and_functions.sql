/*
  # Create app_site_stats table and related functions

  1. New Tables
    - `app_site_stats`
      - `id` (integer, primary key, always 1 - single row)
      - `total_visits` (integer) - total app visits
      - `total_listings_created` (integer) - total listings ever created
      - `total_successful_listings` (integer) - listings with status 'sold'
      - `total_professionals` (integer) - count of professional profiles
      - `country_ranking` (jsonb) - array of country stats objects
      - `updated_at` (timestamptz)

  2. Functions
    - `register_app_visit()` - increments total_visits counter
    - `refresh_app_site_stats()` - recalculates all aggregate stats

  3. Security
    - Enable RLS on app_site_stats
    - Allow anon/authenticated to read stats (id = 1)
    - Allow anon/authenticated to increment visit counter
*/

CREATE TABLE IF NOT EXISTS app_site_stats (
  id integer PRIMARY KEY DEFAULT 1,
  total_visits integer DEFAULT 0,
  total_listings_created integer DEFAULT 0,
  total_successful_listings integer DEFAULT 0,
  total_professionals integer DEFAULT 0,
  country_ranking jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT app_site_stats_single_row CHECK (id = 1)
);

-- Insert the single row if not exists
INSERT INTO app_site_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site stats"
  ON app_site_stats FOR SELECT
  TO anon, authenticated
  USING (id = 1);

CREATE POLICY "Anon and authenticated can increment visit counter"
  ON app_site_stats FOR UPDATE
  TO anon, authenticated
  USING (id = 1)
  WITH CHECK (id = 1);

-- Function to register a visit (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.register_app_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.app_site_stats
  SET total_visits = total_visits + 1
  WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_app_visit() TO anon;
GRANT EXECUTE ON FUNCTION public.register_app_visit() TO authenticated;

-- Function to refresh aggregate stats (SECURITY DEFINER for cross-table reads)
CREATE OR REPLACE FUNCTION public.refresh_app_site_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_listings integer;
  v_successful_listings integer;
  v_total_professionals integer;
  v_country_ranking jsonb;
BEGIN
  SELECT COUNT(*) INTO v_total_listings FROM public.listings WHERE status != 'deleted';
  SELECT COUNT(*) INTO v_successful_listings FROM public.listings WHERE status = 'sold';
  SELECT COUNT(*) INTO v_total_professionals FROM public.profiles WHERE is_professional = true;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'country', country,
        'score', score,
        'professionals', professionals,
        'listings', listings,
        'responses', responses
      ) ORDER BY score DESC
    ),
    '[]'::jsonb
  )
  INTO v_country_ranking
  FROM (
    SELECT
      location AS country,
      COUNT(DISTINCT p.id) * 10 + COUNT(DISTINCT l.id) * 5 AS score,
      COUNT(DISTINCT p.id) AS professionals,
      COUNT(DISTINCT l.id) AS listings,
      0 AS responses
    FROM public.profiles p
    FULL OUTER JOIN public.listings l ON l.location = p.location
    WHERE p.location IS NOT NULL OR l.location IS NOT NULL
    GROUP BY location
    HAVING location IS NOT NULL AND location != ''
    ORDER BY score DESC
    LIMIT 20
  ) ranked;

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

REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM authenticated;
