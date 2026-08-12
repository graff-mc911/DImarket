-- Enable marketing agent with defaults + optional pg_cron (Supabase hosted)

-- Defaults: agent OFF until owner starts it in /marketing-agent.
-- Do NOT include "blog" — previously every failed social publish dumped LLM JSON into site announcements.
UPDATE public.marketing_agent_config
SET
  is_running = false,
  auto_publish = false,
  frequency = 'daily',
  daily_budget_usd = 50,
  ab_testing_enabled = true,
  target_markets = '[
    {"countryCode":"UA","languageCode":"uk","label":"Ukraine"},
    {"countryCode":"US","languageCode":"en","label":"United States"},
    {"countryCode":"DE","languageCode":"de","label":"Germany"},
    {"countryCode":"PL","languageCode":"pl","label":"Poland"},
    {"countryCode":"FR","languageCode":"fr","label":"France"},
    {"countryCode":"ES","languageCode":"es","label":"Spain"}
  ]'::jsonb,
  platforms = ARRAY['telegram']::text[],
  updated_at = now()
WHERE id = 'default';

-- Owner-managed site header messages only (Dashboard → Глобальні оголошення).
-- Marketing agent must NOT insert here — see STOP_MARKETING_JSON_BANNERS.sql.
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text CHECK (type IN ('info', 'warning', 'success', 'promo')) DEFAULT 'info',
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_public_read ON public.announcements;
CREATE POLICY announcements_public_read ON public.announcements
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS announcements_admin_all ON public.announcements;
CREATE POLICY announcements_admin_all ON public.announcements
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

-- Service role inserts from marketing agent bypass RLS
