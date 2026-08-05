-- One-shot SECURITY DEFINER backfill for Germany directory map coordinates.
-- Safe to re-run. Only fills missing service_latitude/longitude for known directory names.

CREATE OR REPLACE FUNCTION public.backfill_germany_directory_coords()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
  n integer;
BEGIN
  UPDATE profiles SET service_latitude = 49.8582, service_longitude = 8.6415
  WHERE is_professional AND full_name = 'Stark Elektro' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  UPDATE profiles SET service_latitude = 49.8912, service_longitude = 8.6408
  WHERE is_professional AND full_name = 'Heinrich Schmid GmbH & Co. KG — Darmstadt' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  UPDATE profiles SET service_latitude = 49.8405, service_longitude = 8.6421
  WHERE is_professional AND full_name = 'Patrick Noël Malerhandwerk GmbH' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  UPDATE profiles SET service_latitude = 49.9055, service_longitude = 8.6682
  WHERE is_professional AND full_name = 'Kraft GmbH Darmstadt' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  UPDATE profiles SET service_latitude = 49.8458, service_longitude = 8.6354
  WHERE is_professional AND full_name = 'Zimmermann & Sohn GmbH' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  UPDATE profiles SET service_latitude = 49.8728, service_longitude = 8.6512
  WHERE is_professional AND full_name = 'Domenico Di Santo Malerbetrieb' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  UPDATE profiles SET service_latitude = 49.8785, service_longitude = 8.6558
  WHERE is_professional AND full_name = 'B&P Bau' AND location ILIKE '%Darmstadt%'
    AND (service_latitude IS NULL OR service_longitude IS NULL);
  GET DIAGNOSTICS n = ROW_COUNT; updated_count := updated_count + n;

  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_germany_directory_coords() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_germany_directory_coords() TO anon, authenticated, service_role;
