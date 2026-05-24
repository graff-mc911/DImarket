-- Fix: active_geo view (bigint user_count) — run this if you got error 42P16
-- Then run scripts/prod-ad-self-serve-part2.sql if bucket/regions still missing

DROP VIEW IF EXISTS active_geo;

CREATE VIEW active_geo AS
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
SELECT
  COALESCE(a.country, g.country) AS country,
  COALESCE(a.region, g.region) AS region,
  COALESCE(a.city, g.city) AS city,
  GREATEST(COALESCE(a.user_count, 0::bigint), 1::bigint) AS user_count
FROM geo_catalog g
LEFT JOIN aggregated a
  ON a.country = g.country AND a.region = g.region AND a.city = g.city
UNION
SELECT a.country, a.region, a.city, a.user_count::bigint
FROM aggregated a
WHERE NOT EXISTS (
  SELECT 1 FROM geo_catalog g
  WHERE g.country = a.country AND g.region = a.region AND g.city = a.city
);

GRANT SELECT ON active_geo TO anon, authenticated;
