-- AI Cost Estimator history + anonymised learning hooks
CREATE TABLE IF NOT EXISTS public.cost_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  project_type text,
  location_label text,
  area_sqm numeric,
  currency text NOT NULL DEFAULT 'EUR',
  total_economy numeric,
  total_standard numeric,
  total_premium numeric,
  confidence numeric(5,2),
  estimate_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_estimates_user ON public.cost_estimates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_type ON public.cost_estimates(project_type);

ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cost_estimates_own ON public.cost_estimates;
CREATE POLICY cost_estimates_own ON public.cost_estimates
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Optional anonymised outcomes for future model training (user consent required in app)
CREATE TABLE IF NOT EXISTS public.cost_estimate_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_estimate_id uuid REFERENCES public.cost_estimates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  project_type text,
  country text,
  region text,
  area_sqm numeric,
  estimated_standard numeric,
  actual_total numeric,
  currency text DEFAULT 'EUR',
  consented boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_estimate_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cost_estimate_outcomes_own ON public.cost_estimate_outcomes;
CREATE POLICY cost_estimate_outcomes_own ON public.cost_estimate_outcomes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND consented = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_estimates TO authenticated;
GRANT SELECT, INSERT ON public.cost_estimate_outcomes TO authenticated;
