-- Soft archive for cost estimate history
ALTER TABLE public.cost_estimates
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cost_estimates_archived
  ON public.cost_estimates(user_id, archived, created_at DESC);
