-- Optional fields used by professional comparison (price, experience, warranty)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'experience_years'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience_years integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hourly_rate_min'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hourly_rate_min numeric(12,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hourly_rate_max'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hourly_rate_max numeric(12,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'warranty_months'
  ) THEN
    ALTER TABLE profiles ADD COLUMN warranty_months integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'warranty_note'
  ) THEN
    ALTER TABLE profiles ADD COLUMN warranty_note text;
  END IF;
END $$;

-- Soft backfill experience from account age when empty
UPDATE profiles
SET experience_years = GREATEST(
  1,
  LEAST(40, EXTRACT(YEAR FROM age(now(), created_at))::int)
)
WHERE is_professional = true
  AND experience_years IS NULL
  AND created_at IS NOT NULL;
