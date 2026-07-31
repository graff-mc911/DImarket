-- P0 prod schema apply (idempotent)
-- Paste into Supabase SQL Editor for project wjlfvajloxkevggwjgtk
-- Generated for: wizard cols, geo, AI profile fields, reviews, homepage_metrics, category RPC, completed_projects

-- ========== 1) 20260720120000_create_project_wizard_ensure.sql ==========
-- Ensure customer project wizard storage + tables (idempotent)

-- Listing project fields (if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'budget_min') THEN
    ALTER TABLE listings ADD COLUMN budget_min numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'budget_max') THEN
    ALTER TABLE listings ADD COLUMN budget_max numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'deadline_type') THEN
    ALTER TABLE listings ADD COLUMN deadline_type text CHECK (deadline_type IN ('flexible', 'asap', 'date'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'deadline_at') THEN
    ALTER TABLE listings ADD COLUMN deadline_at date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'urgency') THEN
    ALTER TABLE listings ADD COLUMN urgency text DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'preferred_language') THEN
    ALTER TABLE listings ADD COLUMN preferred_language text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'wizard_completed') THEN
    ALTER TABLE listings ADD COLUMN wizard_completed boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'postal_code') THEN
    ALTER TABLE listings ADD COLUMN postal_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'country_name') THEN
    ALTER TABLE listings ADD COLUMN country_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'city_name') THEN
    ALTER TABLE listings ADD COLUMN city_name text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  mime_type text,
  file_name text,
  kind text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video', 'pdf', 'plan', 'other')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_listing ON project_files(listing_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_files_select" ON project_files;
CREATE POLICY "project_files_select" ON project_files FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
        AND (l.status = 'active' OR l.author_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "project_files_insert" ON project_files;
CREATE POLICY "project_files_insert" ON project_files FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_files_delete" ON project_files;
CREATE POLICY "project_files_delete" ON project_files FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.author_id = auth.uid())
  );

DROP POLICY IF EXISTS "project_files_storage_read" ON storage.objects;
CREATE POLICY "project_files_storage_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "project_files_storage_upload" ON storage.objects;
CREATE POLICY "project_files_storage_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "project_files_storage_delete" ON storage.objects;
CREATE POLICY "project_files_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ========== 2) 20260720140000_project_feed_geo_realtime.sql ==========
-- Project feed: coordinates for distance + saved application status + realtime

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE listings ADD COLUMN latitude double precision;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE listings ADD COLUMN longitude double precision;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_geo
  ON listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Allow save-without-apply on project_applications
DO $$
BEGIN
  ALTER TABLE project_applications DROP CONSTRAINT IF EXISTS project_applications_status_check;
  ALTER TABLE project_applications
    ADD CONSTRAINT project_applications_status_check
    CHECK (status IN ('saved', 'applied', 'withdrawn', 'accepted', 'rejected'));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Realtime for incoming project feed
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE listings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE project_files;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ========== 3) 20260720150000_ai_match_profile_fields.sql ==========
-- AI Match: profile fields for scoring dimensions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'completed_jobs'
  ) THEN
    ALTER TABLE profiles ADD COLUMN completed_jobs integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages text[] NOT NULL DEFAULT '{}'::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'availability_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN availability_status text NOT NULL DEFAULT 'available'
      CHECK (availability_status IN ('available', 'busy', 'limited', 'unavailable'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'service_latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN service_latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'service_longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN service_longitude double precision;
  END IF;
END $$;

-- Backfill languages from preferred_language when empty
UPDATE profiles
SET languages = ARRAY[preferred_language]
WHERE preferred_language IS NOT NULL
  AND preferred_language <> ''
  AND (languages IS NULL OR cardinality(languages) = 0);

-- Backfill completed_jobs from reviews when zero
UPDATE profiles
SET completed_jobs = GREATEST(completed_jobs, COALESCE(total_reviews, 0))
WHERE COALESCE(completed_jobs, 0) = 0
  AND COALESCE(total_reviews, 0) > 0;

CREATE INDEX IF NOT EXISTS idx_profiles_availability
  ON profiles (availability_status)
  WHERE is_professional = true;

CREATE INDEX IF NOT EXISTS idx_profiles_service_geo
  ON profiles (service_latitude, service_longitude)
  WHERE service_latitude IS NOT NULL AND service_longitude IS NOT NULL;

-- ========== 4) 20260722150000_review_system_upgrade.sql ==========
-- Review system upgrade: media, likes, replies, verified customer, like_count

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE reviews ADD COLUMN media_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN like_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_verified_customer'
  ) THEN
    ALTER TABLE reviews ADD COLUMN is_verified_customer boolean NOT NULL DEFAULT false;
  END IF;
END $$;

UPDATE reviews
SET is_verified_customer = true
WHERE listing_id IS NOT NULL AND is_verified_customer = false;

-- Allow reviews with media even when comment is empty (still require identity + rating)
DROP POLICY IF EXISTS "Users can create reviews with identification" ON reviews;
CREATE POLICY "Users can create reviews with identification"
  ON reviews FOR INSERT
  TO public
  WITH CHECK (
    reviewer_name IS NOT NULL
    AND reviewer_name <> ''
    AND reviewer_email IS NOT NULL
    AND reviewer_email <> ''
    AND rating >= 1
    AND rating <= 5
    AND (
      (comment IS NOT NULL AND comment <> '')
      OR jsonb_array_length(COALESCE(media_urls, '[]'::jsonb)) > 0
    )
  );

CREATE TABLE IF NOT EXISTS review_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(review_id);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_likes_select" ON review_likes;
CREATE POLICY "review_likes_select" ON review_likes FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "review_likes_insert" ON review_likes;
CREATE POLICY "review_likes_insert" ON review_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "review_likes_delete" ON review_likes;
CREATE POLICY "review_likes_delete" ON review_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.refresh_review_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid uuid;
BEGIN
  rid := COALESCE(NEW.review_id, OLD.review_id);
  UPDATE reviews
  SET like_count = (SELECT count(*)::int FROM review_likes WHERE review_id = rid)
  WHERE id = rid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_likes_count ON review_likes;
CREATE TRIGGER trg_review_likes_count
  AFTER INSERT OR DELETE ON review_likes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_review_like_count();

CREATE TABLE IF NOT EXISTS review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review ON review_replies(review_id, created_at);

ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_replies_select" ON review_replies;
CREATE POLICY "review_replies_select" ON review_replies FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "review_replies_insert" ON review_replies;
CREATE POLICY "review_replies_insert" ON review_replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND length(trim(body)) > 0
  );

DROP POLICY IF EXISTS "review_replies_delete" ON review_replies;
CREATE POLICY "review_replies_delete" ON review_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Storage for review images/videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  true,
  104857600,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "review_media_read" ON storage.objects;
CREATE POLICY "review_media_read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "review_media_upload" ON storage.objects;
CREATE POLICY "review_media_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "review_media_update" ON storage.objects;
CREATE POLICY "review_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "review_media_delete" ON storage.objects;
CREATE POLICY "review_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ========== 5) 20260725180000_homepage_metrics.sql ==========
-- Homepage display metrics (marketing KPIs + store URLs)
CREATE TABLE IF NOT EXISTS public.homepage_metrics (
  key text PRIMARY KEY,
  value_num numeric,
  value_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_metrics_public_read" ON public.homepage_metrics;
CREATE POLICY "homepage_metrics_public_read" ON public.homepage_metrics
  FOR SELECT USING (true);

INSERT INTO public.homepage_metrics (key, value_num, value_text) VALUES
  ('professionals', 52000, NULL),
  ('reviews', 1800000, NULL),
  ('countries', 27, NULL),
  ('projects', 950000, NULL),
  ('app_store_url', NULL, ''),
  ('play_store_url', NULL, '')
ON CONFLICT (key) DO UPDATE SET
  value_num = COALESCE(EXCLUDED.value_num, homepage_metrics.value_num),
  value_text = COALESCE(NULLIF(EXCLUDED.value_text, ''), homepage_metrics.value_text),
  updated_at = now();

CREATE OR REPLACE FUNCTION public.get_homepage_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_object_agg(
      key,
      jsonb_build_object(
        'value_num', value_num,
        'value_text', value_text
      )
    ),
    '{}'::jsonb
  )
  FROM homepage_metrics;
$$;

GRANT EXECUTE ON FUNCTION public.get_homepage_metrics() TO anon, authenticated;

-- ========== 6) get_marketplace_category_page (after city_name exists) ==========
CREATE OR REPLACE FUNCTION public.get_marketplace_category_page(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat categories%ROWTYPE;
  services jsonb;
  pros jsonb;
  projects jsonb;
BEGIN
  SELECT * INTO cat FROM categories WHERE slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT coalesce(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.sort_order), '[]'::jsonb)
  INTO services
  FROM (
    SELECT id, name, slug, icon, icon_key, name_i18n, description_i18n, sort_order, parent_id
    FROM categories
    WHERE parent_id = cat.id AND coalesce(is_service, true) = true
    ORDER BY sort_order, name
  ) s;

  -- If this is a main category with no services, try children that are mains? no — services only

  SELECT coalesce(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
  INTO pros
  FROM (
    SELECT
      pr.id, pr.full_name, pr.profile_photo, pr.avatar_url, pr.location,
      pr.rating, pr.total_reviews, pr.is_verified, pr.is_premium, pr.is_featured,
      pr.work_subcategory_slugs
    FROM profiles pr
    WHERE pr.is_professional = true
      AND (
        EXISTS (
          SELECT 1 FROM unnest(coalesce(pr.work_subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
      )
    ORDER BY pr.is_featured DESC NULLS LAST, pr.is_premium DESC NULLS LAST, pr.rating DESC NULLS LAST
    LIMIT 12
  ) p;

  SELECT coalesce(jsonb_agg(row_to_json(l)::jsonb), '[]'::jsonb)
  INTO projects
  FROM (
    SELECT
      li.id, li.title, li.description, li.location, li.city_name, li.created_at,
      li.urgency, li.budget_min, li.budget_max
    FROM listings li
    WHERE li.listing_type = 'service_request'
      AND coalesce(li.status, 'active') = 'active'
      AND (
        EXISTS (
          SELECT 1 FROM unnest(coalesce(li.subcategory_slugs, '{}'::text[])) w
          WHERE w LIKE cat.slug || '-%' OR w = cat.slug
        )
        OR EXISTS (
          SELECT 1 FROM categories sc
          WHERE sc.id = li.category_id
            AND (sc.id = cat.id OR sc.parent_id = cat.id OR sc.slug = cat.slug)
        )
      )
    ORDER BY li.created_at DESC
    LIMIT 8
  ) l;

  RETURN jsonb_build_object(
    'ok', true,
    'category', row_to_json(cat),
    'services', services,
    'professionals', pros,
    'projects', projects
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_main_categories() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_category_page(text) TO anon, authenticated;

-- ========== 7) 20260725190000_category_completed_projects.sql ==========
-- Extend marketplace categories with completed projects cache
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS completed_projects_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.refresh_marketplace_category_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s
      WHERE s.parent_id = c.id AND coalesce(s.is_service, false) = true
    ),
    professionals_count = (
      SELECT COUNT(DISTINCT p.id)
      FROM profiles p
      WHERE p.is_professional = true
        AND (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
          OR EXISTS (
            SELECT 1
            FROM professional_categories pc
            JOIN categories sc ON sc.id = pc.category_id
            WHERE pc.profile_id = p.id
              AND (sc.id = c.id OR sc.parent_id = c.id OR sc.slug LIKE c.slug || '-%')
          )
        )
    ),
    avg_rating = (
      SELECT ROUND(AVG(p.rating)::numeric, 2)
      FROM profiles p
      WHERE p.is_professional = true
        AND coalesce(p.total_reviews, 0) > 0
        AND (
          EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
        )
    ),
    completed_projects_count = GREATEST(
      COALESCE((
        SELECT COUNT(*)::integer
        FROM listings li
        WHERE li.listing_type = 'service_request'
          AND (
            EXISTS (
              SELECT 1 FROM unnest(coalesce(li.subcategory_slugs, '{}'::text[])) w
              WHERE w LIKE c.slug || '-%' OR w = c.slug
            )
            OR EXISTS (
              SELECT 1 FROM categories sc
              WHERE sc.id = li.category_id
                AND (sc.id = c.id OR sc.parent_id = c.id OR sc.slug = c.slug)
            )
          )
      ), 0),
      COALESCE((
        SELECT SUM(coalesce(p.completed_jobs, 0))::integer
        FROM profiles p
        WHERE p.is_professional = true
          AND EXISTS (
            SELECT 1 FROM unnest(coalesce(p.work_subcategory_slugs, '{}'::text[])) w
            WHERE w LIKE c.slug || '-%' OR w = c.slug
          )
      ), 0)
    ),
    updated_at = now()
  WHERE c.is_main = true;

  UPDATE categories c SET
    services_count = (
      SELECT COUNT(*) FROM categories s WHERE s.parent_id = c.id
    )
  WHERE c.slug = 'construction';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketplace_main_categories()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.sort_order), '[]'::jsonb)
  FROM (
    SELECT
      id, name, slug, icon, icon_key, cover_image_url, description,
      name_i18n, description_i18n, sort_order,
      services_count, professionals_count, avg_rating, completed_projects_count
    FROM categories
    WHERE is_main = true
    ORDER BY sort_order, name
  ) t;
$$;

SELECT public.refresh_marketplace_category_stats();
