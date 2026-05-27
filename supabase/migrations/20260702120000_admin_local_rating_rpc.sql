-- Локальні admin-дії для AI помічника (без Edge Function): рейтинг, верифікація, топ

CREATE OR REPLACE FUNCTION public.admin_assert_site_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_boost_master_rating(
  search_name text,
  stars numeric DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles%ROWTYPE;
  bump numeric;
  new_rating numeric;
BEGIN
  PERFORM public.admin_assert_site_owner();

  SELECT * INTO target
  FROM public.profiles
  WHERE is_professional = true
    AND (
      full_name ILIKE '%' || trim(search_name) || '%'
      OR id::text = trim(search_name)
    )
  ORDER BY
    CASE WHEN lower(full_name) = lower(trim(search_name)) THEN 0 ELSE 1 END,
    rating DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'message', '❌ Майстра «' || trim(search_name) || '» не знайдено.'
    );
  END IF;

  -- Зірки = цільовий рейтинг 0–5 (5 зірок → 5.0)
  new_rating := greatest(0, least(5, coalesce(stars, 5)));

  UPDATE public.profiles
  SET rating = new_rating, updated_at = now()
  WHERE id = target.id;

  RETURN jsonb_build_object(
    'ok', true,
    'message', '✅ ' || coalesce(target.full_name, 'Майстер') ||
      ': встановлено ' || round(new_rating::numeric, 1)::text || ' / 5 зір.',
    'full_name', target.full_name,
    'rating', new_rating
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_verify_master(
  search_name text,
  verified boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles%ROWTYPE;
BEGIN
  PERFORM public.admin_assert_site_owner();

  SELECT * INTO target
  FROM public.profiles
  WHERE is_professional = true
    AND full_name ILIKE '%' || trim(search_name) || '%'
  ORDER BY rating DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', '❌ Майстра не знайдено.');
  END IF;

  UPDATE public.profiles
  SET
    is_verified = verified,
    verified_at = CASE WHEN verified THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = target.id;

  RETURN jsonb_build_object(
    'ok', true,
    'message', '✅ ' || coalesce(target.full_name, 'Майстер') ||
      CASE WHEN verified THEN ' верифіковано.' ELSE ' верифікацію знято.' END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_masters(p_limit int DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows jsonb;
BEGIN
  PERFORM public.admin_assert_site_owner();

  SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO rows
  FROM (
    SELECT
      row_number() OVER (ORDER BY rating DESC NULLS LAST) AS rank,
      full_name AS name,
      rating,
      is_verified AS verified,
      location
    FROM public.profiles
    WHERE is_professional = true
    ORDER BY rating DESC NULLS LAST
    LIMIT greatest(1, least(p_limit, 20))
  ) t;

  RETURN jsonb_build_object(
    'ok', true,
    'message', '✅ Топ ' || least(p_limit, 20) || ' майстрів.',
    'rows', rows
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_boost_master_rating(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_master(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_masters(int) TO authenticated;
