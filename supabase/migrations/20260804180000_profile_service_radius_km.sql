-- Service area for directory geo search (travel radius in km).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS service_radius_km integer;

COMMENT ON COLUMN profiles.service_radius_km IS
  'Maximum travel/service radius in km from service_latitude/longitude. NULL = no limit (admin match only).';

CREATE INDEX IF NOT EXISTS profiles_service_radius_km_idx
  ON profiles (service_radius_km)
  WHERE service_radius_km IS NOT NULL;
