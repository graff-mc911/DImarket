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
