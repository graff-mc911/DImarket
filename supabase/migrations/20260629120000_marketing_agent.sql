-- AI Marketing Agent — campaigns, posts, analytics, attribution

CREATE TABLE IF NOT EXISTS public.marketing_agent_config (
  id text PRIMARY KEY DEFAULT 'default',
  is_running boolean NOT NULL DEFAULT false,
  target_markets jsonb NOT NULL DEFAULT '[]'::jsonb,
  platforms text[] NOT NULL DEFAULT ARRAY['telegram', 'facebook', 'instagram']::text[],
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly')),
  auto_publish boolean NOT NULL DEFAULT false,
  daily_budget_usd numeric(12,2) NOT NULL DEFAULT 0,
  ab_testing_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_role_index int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.marketing_agent_config (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_target text NOT NULL CHECK (role_target IN ('client', 'master', 'company', 'advertiser')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  budget_usd numeric(12,2) NOT NULL DEFAULT 0,
  spent_usd numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  role_target text NOT NULL,
  platform text NOT NULL,
  country_code text NOT NULL DEFAULT 'UA',
  language_code text NOT NULL DEFAULT 'uk',
  content_kind text NOT NULL DEFAULT 'social_post',
  title text,
  body text NOT NULL,
  hashtags text[] NOT NULL DEFAULT '{}',
  image_prompt text,
  image_url text,
  video_script text,
  content_hash text,
  llm_provider text,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'failed')),
  ab_variant text,
  external_id text,
  publish_error text,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_posts_status_idx ON public.marketing_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS marketing_posts_hash_idx ON public.marketing_posts (content_hash);

CREATE TABLE IF NOT EXISTS public.marketing_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  variant_a_post_id uuid REFERENCES public.marketing_posts(id) ON DELETE SET NULL,
  variant_b_post_id uuid REFERENCES public.marketing_posts(id) ON DELETE SET NULL,
  winner text CHECK (winner IN ('a', 'b', 'none')),
  impressions_a int NOT NULL DEFAULT 0,
  impressions_b int NOT NULL DEFAULT 0,
  clicks_a int NOT NULL DEFAULT 0,
  clicks_b int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.marketing_posts(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_analytics_campaign_idx ON public.marketing_analytics (campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.marketing_registration_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_role text NOT NULL,
  language_code text,
  country_code text,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.marketing_posts(id) ON DELETE SET NULL,
  utm_source text,
  utm_campaign text,
  welcome_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_registration_attribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_config_admin ON public.marketing_agent_config
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

CREATE POLICY marketing_campaigns_admin ON public.marketing_campaigns
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

CREATE POLICY marketing_posts_admin ON public.marketing_posts
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

CREATE POLICY marketing_ab_admin ON public.marketing_ab_tests
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

CREATE POLICY marketing_analytics_admin ON public.marketing_analytics
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

CREATE POLICY marketing_attr_admin ON public.marketing_registration_attribution
  FOR ALL USING (public.is_ai_admin()) WITH CHECK (public.is_ai_admin());

-- Service role / edge functions bypass RLS

COMMENT ON TABLE public.marketing_agent_config IS 'Singleton config for autonomous marketing agent';
