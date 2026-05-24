-- Ensure geo_catalog exists and is readable for ad targeting UI

CREATE TABLE IF NOT EXISTS geo_catalog (
  id serial PRIMARY KEY,
  country text NOT NULL,
  region text NOT NULL DEFAULT 'Інші',
  city text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'geo_catalog_country_region_city_key'
  ) THEN
    ALTER TABLE geo_catalog
      ADD CONSTRAINT geo_catalog_country_region_city_key UNIQUE (country, region, city);
  END IF;
END $$;

INSERT INTO geo_catalog (country, region, city, sort_order) VALUES
  ('Україна', 'Київська', 'Київ', 1),
  ('Україна', 'Львівська', 'Львів', 2),
  ('Україна', 'Харківська', 'Харків', 3),
  ('Україна', 'Одеська', 'Одеса', 4),
  ('Україна', 'Дніпропетровська', 'Дніпро', 5),
  ('Польща', 'Мазовецьке', 'Варшава', 10),
  ('Польща', 'Малопольське', 'Краків', 11),
  ('Польща', 'Нижньосілезьке', 'Вроцлав', 12),
  ('Німеччина', 'Баварія', 'Мюнхен', 20),
  ('Німеччина', 'Берлін', 'Берлін', 21),
  ('Німеччина', 'Північний Рейн-Вестфалія', 'Кельн', 22),
  ('Чехія', 'Прага', 'Прага', 30),
  ('Словаччина', 'Братиславський', 'Братислава', 40),
  ('Румунія', 'Бухарест', 'Бухарест', 50)
ON CONFLICT (country, region, city) DO NOTHING;

GRANT SELECT ON geo_catalog TO anon, authenticated;

-- Recreate active_geo so the ad form can fall back to this view
CREATE OR REPLACE VIEW active_geo AS
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
  SELECT country, region, city, count(*)::int AS user_count
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
  GREATEST(COALESCE(a.user_count, 0), 1) AS user_count
FROM geo_catalog g
LEFT JOIN aggregated a
  ON a.country = g.country AND a.region = g.region AND a.city = g.city
UNION
SELECT a.country, a.region, a.city, a.user_count
FROM aggregated a
WHERE NOT EXISTS (
  SELECT 1 FROM geo_catalog g
  WHERE g.country = a.country AND g.region = a.region AND g.city = a.city
);

GRANT SELECT ON active_geo TO anon, authenticated;
