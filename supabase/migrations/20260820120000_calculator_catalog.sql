-- Dimarket remodeling calculator catalog + saved projects.
-- Runtime currently ships a built-in catalog in src/lib/costCalculator.
-- These tables let admins replace prices later without rewriting the UI.
-- RLS: catalog is public read; prices cannot be written from the client;
-- users may only insert/select/update/delete their own calculator_projects.

CREATE TABLE IF NOT EXISTS public.calculator_project_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calculator_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type_id uuid NOT NULL REFERENCES public.calculator_project_types(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('m2', 'unit')),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calculator_feature_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid NOT NULL REFERENCES public.calculator_features(id) ON DELETE CASCADE,
  labor_price numeric,
  material_price numeric,
  low_multiplier numeric NOT NULL DEFAULT 0.85,
  medium_multiplier numeric NOT NULL DEFAULT 1,
  high_multiplier numeric NOT NULL DEFAULT 1.35,
  currency text NOT NULL DEFAULT 'EUR',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculator_feature_prices_feature
  ON public.calculator_feature_prices(feature_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.calculator_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_type_id uuid REFERENCES public.calculator_project_types(id) ON DELETE SET NULL,
  area numeric,
  budget_level text NOT NULL CHECK (budget_level IN ('low', 'medium', 'high')),
  include_materials boolean NOT NULL DEFAULT true,
  labor_total numeric,
  materials_total numeric,
  project_total numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calculator_project_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.calculator_projects(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES public.calculator_features(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL DEFAULT 1,
  labor_total numeric,
  materials_total numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculator_projects_user
  ON public.calculator_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_project_features_project
  ON public.calculator_project_features(project_id);

ALTER TABLE public.calculator_project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_feature_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_project_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calculator_project_types_read ON public.calculator_project_types;
CREATE POLICY calculator_project_types_read ON public.calculator_project_types
  FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS calculator_features_read ON public.calculator_features;
CREATE POLICY calculator_features_read ON public.calculator_features
  FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS calculator_feature_prices_read ON public.calculator_feature_prices;
CREATE POLICY calculator_feature_prices_read ON public.calculator_feature_prices
  FOR SELECT TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS calculator_projects_own ON public.calculator_projects;
CREATE POLICY calculator_projects_own ON public.calculator_projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS calculator_project_features_own ON public.calculator_project_features;
CREATE POLICY calculator_project_features_own ON public.calculator_project_features
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.calculator_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calculator_projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.calculator_project_types TO anon, authenticated;
GRANT SELECT ON public.calculator_features TO anon, authenticated;
GRANT SELECT ON public.calculator_feature_prices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculator_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculator_project_features TO authenticated;

INSERT INTO public.calculator_project_types (slug, name, active, sort_order)
VALUES
  ('bathroom_remodel', 'Bathroom remodel', true, 1),
  ('kitchen_remodel', 'Kitchen remodel', true, 2),
  ('whole_house', 'Whole-house remodel', true, 3),
  ('multi_room', 'Multi-room remodel', true, 4),
  ('addition', 'Home addition', true, 5),
  ('new_construction', 'New construction', true, 6),
  ('roofing', 'Roofing', true, 7),
  ('painting', 'Painting', true, 8),
  ('flooring', 'Flooring', true, 9),
  ('basement', 'Basement', true, 10),
  ('terrace', 'Terrace', true, 11),
  ('other', 'Other', true, 12)
ON CONFLICT (slug) DO NOTHING;
