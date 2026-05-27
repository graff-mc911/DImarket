-- 5 зірок = рейтинг 5.0 (шкала 0–5), не +0.5

CREATE OR REPLACE FUNCTION public.admin_boost_master_rating(
  search_name text,
  stars numeric DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.profiles%ROWTYPE;
  target_rating numeric;
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

  -- Зірки = цільовий рейтинг на шкалі 0–5 (5 зірок → 5.0)
  target_rating := greatest(0, least(5, coalesce(stars, 5)));
  new_rating := target_rating;

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
