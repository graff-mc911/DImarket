-- Залишок prod-міграції (geo_catalog + active_geo + bucket/regions)
-- Запустіть у Supabase → SQL Editor, якщо verify-prod-ad-schema показує FAIL

-- === 1. geo_catalog + active_geo ===
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

-- === 2. ad-media bucket + regions column ===
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}';

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'ad_campaigns' AND c.contype = 'c' AND c.conname LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'pending_payment',
    'active', 'paused', 'rejected', 'expired', 'deleted'
  ));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'ad_campaigns' AND c.contype = 'c' AND c.conname LIKE '%geo_scope%'
  LOOP
    EXECUTE format('ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_geo_scope_check
  CHECK (geo_scope IN (
    'global', 'countries', 'regions', 'cities',
    'country', 'region', 'city'
  ));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-media',
  'ad-media',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ad media" ON storage.objects;
CREATE POLICY "Public read ad media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ad-media');

DROP POLICY IF EXISTS "Authenticated upload ad media" ON storage.objects;
CREATE POLICY "Authenticated upload ad media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ad-media'
    AND (storage.foldername(name))[1] = 'campaigns'
  );

DROP POLICY IF EXISTS "Authenticated update ad media" ON storage.objects;
CREATE POLICY "Authenticated update ad media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');

DROP POLICY IF EXISTS "Authenticated delete ad media" ON storage.objects;
CREATE POLICY "Authenticated delete ad media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');
