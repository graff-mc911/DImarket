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
