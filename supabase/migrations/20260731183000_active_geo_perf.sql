-- Perf fix: active_geo must not left-join full geo_catalog (2.7M+ rows → statement timeout).
-- App loads the full directory from geo_catalog separately; active_geo = activity signals only.

DROP VIEW IF EXISTS public.active_geo;

CREATE VIEW public.active_geo AS
WITH profile_geo AS (
  SELECT
    NULLIF(trim(split_part(p.location, ', ', 3)), '') AS country,
    COALESCE(NULLIF(trim(split_part(p.location, ', ', 2)), ''), 'Інші') AS region,
    NULLIF(trim(split_part(p.location, ', ', 1)), '') AS city
  FROM profiles p
  WHERE p.location IS NOT NULL AND length(trim(p.location)) > 0
),
listing_geo AS (
  SELECT
    NULLIF(trim(split_part(l.location, ', ', 3)), '') AS country,
    COALESCE(NULLIF(trim(split_part(l.location, ', ', 2)), ''), 'Інші') AS region,
    NULLIF(trim(split_part(l.location, ', ', 1)), '') AS city
  FROM listings l
  WHERE l.location IS NOT NULL AND length(trim(l.location)) > 0
),
aggregated AS (
  SELECT country, region, city, count(*)::bigint AS user_count
  FROM (
    SELECT * FROM profile_geo
    UNION ALL
    SELECT * FROM listing_geo
  ) u
  WHERE country IS NOT NULL AND city IS NOT NULL
  GROUP BY country, region, city
)
SELECT country, region, city, user_count
FROM aggregated;

GRANT SELECT ON public.active_geo TO anon, authenticated;
