/*
  # DImarket — повна схема для реклами, Stripe, гео та допоміжних таблиць

  Доповнює існуючі міграції Buildster/DImarket:
  - розширює ad_campaigns під Advertising.tsx
  - profiles: premium, verified, user_role
  - listings: is_promoted
  - payments, announcements, saved_items, geo_catalog
  - view active_geo
  - storage bucket ad-media
*/

-- =============================================================================
-- PROFILES — преміум, верифікація, роль
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_role') THEN
    ALTER TABLE profiles ADD COLUMN user_role text
      CHECK (user_role IS NULL OR user_role IN ('client', 'professional', 'company', 'owner'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_at') THEN
    ALTER TABLE profiles ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN premium_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_featured') THEN
    ALTER TABLE profiles ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'featured_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN featured_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'client_rating') THEN
    ALTER TABLE profiles ADD COLUMN client_rating numeric(3,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'client_total_reviews') THEN
    ALTER TABLE profiles ADD COLUMN client_total_reviews integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'response_rate') THEN
    ALTER TABLE profiles ADD COLUMN response_rate numeric(5,2);
  END IF;
END $$;

-- =============================================================================
-- LISTINGS — виділені оголошення
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_promoted') THEN
    ALTER TABLE listings ADD COLUMN is_promoted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'promoted_expires_at') THEN
    ALTER TABLE listings ADD COLUMN promoted_expires_at timestamptz;
  END IF;
END $$;

-- =============================================================================
-- AD_CAMPAIGNS — розширення під self-serve рекламу
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'media_url') THEN
    ALTER TABLE ad_campaigns ADD COLUMN media_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'media_type') THEN
    ALTER TABLE ad_campaigns ADD COLUMN media_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'placements') THEN
    ALTER TABLE ad_campaigns ADD COLUMN placements text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'countries') THEN
    ALTER TABLE ad_campaigns ADD COLUMN countries text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'regions') THEN
    ALTER TABLE ad_campaigns ADD COLUMN regions text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'cities') THEN
    ALTER TABLE ad_campaigns ADD COLUMN cities text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'impressions') THEN
    ALTER TABLE ad_campaigns ADD COLUMN impressions bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'clicks') THEN
    ALTER TABLE ad_campaigns ADD COLUMN clicks bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'stripe_payment_id') THEN
    ALTER TABLE ad_campaigns ADD COLUMN stripe_payment_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'price_paid') THEN
    ALTER TABLE ad_campaigns ADD COLUMN price_paid numeric(12,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'currency_paid') THEN
    ALTER TABLE ad_campaigns ADD COLUMN currency_paid text DEFAULT 'eur';
  END IF;
END $$;

-- Знімаємо старі CHECK-обмеження на ad_campaigns (geo_scope, status)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'ad_campaigns' AND c.contype = 'c'
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

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'pending_payment',
    'active', 'paused', 'rejected', 'expired', 'deleted'
  ));

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_media_type_check
  CHECK (media_type IS NULL OR media_type IN ('image', 'gif', 'video'));

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placements ON ad_campaigns USING gin (placements);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_cities ON ad_campaigns USING gin (cities);

-- =============================================================================
-- PAYMENTS — журнал Stripe-транзакцій
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN (
    'ad_campaign', 'premium_profile', 'featured_listing', 'verified_badge', 'boost'
  )),
  reference_id uuid,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  stripe_payment_intent_id text,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id);

-- =============================================================================
-- ANNOUNCEMENTS — банери в шапці
-- =============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'promo')),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active announcements" ON announcements;
CREATE POLICY "Anyone can read active announcements"
  ON announcements FOR SELECT TO public
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "Site owners manage announcements" ON announcements;
CREATE POLICY "Site owners manage announcements"
  ON announcements FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true)
  );

-- =============================================================================
-- SAVED_ITEMS — обране
-- =============================================================================

CREATE TABLE IF NOT EXISTS saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('listing', 'profile')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved items" ON saved_items;
CREATE POLICY "Users manage own saved items"
  ON saved_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);

-- =============================================================================
-- GEO_CATALOG + ACTIVE_GEO — геотаргетинг реклами
-- location у profiles: "місто, регіон, країна"
-- =============================================================================

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

-- Парсинг location "city, region, country"
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

GRANT SELECT ON geo_catalog TO anon, authenticated;
GRANT SELECT ON active_geo TO anon, authenticated;

-- =============================================================================
-- STORAGE — bucket ad-media для рекламних медіа
-- =============================================================================

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
