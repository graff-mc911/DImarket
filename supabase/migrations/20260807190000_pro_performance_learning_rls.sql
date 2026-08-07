-- Allow project owners (and the professional) to upsert learned performance
-- so complete + review can refresh matcher signals from the client session.

DROP POLICY IF EXISTS pro_performance_upsert ON public.pro_performance_profiles;
CREATE POLICY pro_performance_upsert ON public.pro_performance_profiles
  FOR ALL TO authenticated
  USING (
    professional_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.hired_professional_id = professional_id
        AND l.author_id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.hired_professional_id = professional_id
        AND l.author_id = auth.uid()
    )
  );

-- Optional SECURITY DEFINER upsert for edge cases (service / failed RLS)
CREATE OR REPLACE FUNCTION public.upsert_pro_performance_profile(
  p_professional_id uuid,
  p_jobs_completed int,
  p_avg_quote_total numeric,
  p_avg_duration_days numeric,
  p_on_time_rate numeric,
  p_satisfaction_rate numeric,
  p_return_rate numeric,
  p_recommend_rate numeric,
  p_specialty_slugs text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF auth.uid() IS DISTINCT FROM p_professional_id
     AND NOT EXISTS (
       SELECT 1 FROM public.listings l
       WHERE l.hired_professional_id = p_professional_id
         AND l.author_id = auth.uid()
     ) THEN
    RAISE EXCEPTION 'not allowed to update performance for this professional';
  END IF;

  INSERT INTO public.pro_performance_profiles AS p (
    professional_id,
    jobs_completed,
    avg_quote_total,
    avg_duration_days,
    on_time_rate,
    satisfaction_rate,
    return_rate,
    recommend_rate,
    specialty_slugs,
    last_computed_at,
    updated_at
  ) VALUES (
    p_professional_id,
    COALESCE(p_jobs_completed, 0),
    p_avg_quote_total,
    p_avg_duration_days,
    p_on_time_rate,
    p_satisfaction_rate,
    p_return_rate,
    p_recommend_rate,
    COALESCE(p_specialty_slugs, '{}'),
    now(),
    now()
  )
  ON CONFLICT (professional_id) DO UPDATE SET
    jobs_completed = EXCLUDED.jobs_completed,
    avg_quote_total = EXCLUDED.avg_quote_total,
    avg_duration_days = EXCLUDED.avg_duration_days,
    on_time_rate = EXCLUDED.on_time_rate,
    satisfaction_rate = EXCLUDED.satisfaction_rate,
    return_rate = EXCLUDED.return_rate,
    recommend_rate = EXCLUDED.recommend_rate,
    specialty_slugs = EXCLUDED.specialty_slugs,
    last_computed_at = EXCLUDED.last_computed_at,
    updated_at = EXCLUDED.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_pro_performance_profile(
  uuid, int, numeric, numeric, numeric, numeric, numeric, numeric, text[]
) TO authenticated;
