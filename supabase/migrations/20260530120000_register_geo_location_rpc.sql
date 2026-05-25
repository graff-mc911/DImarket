-- Allow app to append registration locations into geo_catalog

CREATE OR REPLACE FUNCTION public.register_geo_location(
  p_country text,
  p_region text,
  p_city text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_country IS NULL OR length(trim(p_country)) = 0 THEN
    RETURN;
  END IF;
  IF p_city IS NULL OR length(trim(p_city)) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO geo_catalog (country, region, city, sort_order)
  VALUES (
    trim(p_country),
    COALESCE(NULLIF(trim(p_region), ''), 'Інші'),
    trim(p_city),
    0
  )
  ON CONFLICT (country, region, city) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_geo_location(text, text, text) TO anon, authenticated;
