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
