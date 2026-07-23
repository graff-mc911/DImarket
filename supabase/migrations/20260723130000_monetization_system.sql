-- ============================================================
-- Monetization System: plans, Stripe subscriptions, lead credits,
-- featured profile, sponsored projects, Google Ads requests
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  );
$$;

-- Profile billing fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_id text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS lead_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS support_tier text NOT NULL DEFAULT 'community';

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);

-- Expand payments.payment_type
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check CHECK (
  payment_type IN (
    'ad_campaign',
    'premium_profile',
    'featured_listing',
    'verified_badge',
    'boost',
    'subscription',
    'featured_profile',
    'sponsored_project',
    'lead_credits',
    'google_ads'
  )
);

-- Plan catalog (reference + admin display; entitlements also in app code)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_eur_month numeric(10,2) NOT NULL DEFAULT 0,
  price_eur_year numeric(10,2),
  lead_credits_monthly integer NOT NULL DEFAULT 0,
  featured_profile boolean NOT NULL DEFAULT false,
  premium_profile boolean NOT NULL DEFAULT false,
  sponsored_projects_monthly integer NOT NULL DEFAULT 0,
  banner_ad_discount_pct integer NOT NULL DEFAULT 0,
  google_ads_included boolean NOT NULL DEFAULT false,
  support_tier text NOT NULL DEFAULT 'community',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read plans" ON subscription_plans;
CREATE POLICY "Anyone can read plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true OR public.is_site_owner());

INSERT INTO subscription_plans (
  id, name, description, price_eur_month, price_eur_year,
  lead_credits_monthly, featured_profile, premium_profile,
  sponsored_projects_monthly, banner_ad_discount_pct, google_ads_included,
  support_tier, sort_order
) VALUES
  (
    'free', 'Free', 'Get started on DImarket',
    0, 0, 0, false, false, 0, 0, false, 'community', 0
  ),
  (
    'pro', 'Pro', 'For active professionals who need more visibility and leads',
    29, 290, 20, true, true, 0, 10, false, 'email', 1
  ),
  (
    'business', 'Business', 'For growing teams with sponsored reach and priority support',
    79, 790, 75, true, true, 2, 25, false, 'priority', 2
  ),
  (
    'enterprise', 'Enterprise', 'Full platform power with Google Ads and dedicated support',
    199, 1990, 500, true, true, 10, 40, true, 'dedicated', 3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_eur_month = EXCLUDED.price_eur_month,
  price_eur_year = EXCLUDED.price_eur_year,
  lead_credits_monthly = EXCLUDED.lead_credits_monthly,
  featured_profile = EXCLUDED.featured_profile,
  premium_profile = EXCLUDED.premium_profile,
  sponsored_projects_monthly = EXCLUDED.sponsored_projects_monthly,
  banner_ad_discount_pct = EXCLUDED.banner_ad_discount_pct,
  google_ads_included = EXCLUDED.google_ads_included,
  support_tier = EXCLUDED.support_tier,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- User subscriptions ledger
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  billing_interval text NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'none'
  )),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub
  ON user_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscriptions" ON user_subscriptions;
CREATE POLICY "Users read own subscriptions"
  ON user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_site_owner());

DROP POLICY IF EXISTS "Owner manage subscriptions" ON user_subscriptions;
CREATE POLICY "Owner manage subscriptions"
  ON user_subscriptions FOR ALL TO authenticated
  USING (public.is_site_owner())
  WITH CHECK (public.is_site_owner());

-- Lead credit ledger
CREATE TABLE IF NOT EXISTS lead_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL,
  reference_id text,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_credit_ledger_user ON lead_credit_ledger(user_id, created_at DESC);

ALTER TABLE lead_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own credit ledger" ON lead_credit_ledger;
CREATE POLICY "Users read own credit ledger"
  ON lead_credit_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_site_owner());

-- Sponsored projects (boost a customer project in pro feeds)
CREATE TABLE IF NOT EXISTS sponsored_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sponsor_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'canceled')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_projects_active
  ON sponsored_projects(status, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsored_projects_listing ON sponsored_projects(listing_id);

ALTER TABLE sponsored_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read active sponsored projects" ON sponsored_projects;
CREATE POLICY "Anyone read active sponsored projects"
  ON sponsored_projects FOR SELECT
  USING (
    status = 'active'
    OR sponsor_user_id = auth.uid()
    OR public.is_site_owner()
  );

DROP POLICY IF EXISTS "Users insert own sponsored projects" ON sponsored_projects;
CREATE POLICY "Users insert own sponsored projects"
  ON sponsored_projects FOR INSERT TO authenticated
  WITH CHECK (sponsor_user_id = auth.uid());

DROP POLICY IF EXISTS "Owner manage sponsored projects" ON sponsored_projects;
CREATE POLICY "Owner manage sponsored projects"
  ON sponsored_projects FOR ALL TO authenticated
  USING (public.is_site_owner())
  WITH CHECK (public.is_site_owner());

-- Google Ads campaign requests / managed campaigns
CREATE TABLE IF NOT EXISTS google_ads_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text,
  website_url text,
  monthly_budget_eur numeric(12,2),
  goals text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_review', 'active', 'paused', 'rejected', 'completed'
  )),
  notes text,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_google_ads_requests_user ON google_ads_requests(user_id);

ALTER TABLE google_ads_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own google ads requests" ON google_ads_requests;
CREATE POLICY "Users manage own google ads requests"
  ON google_ads_requests FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_site_owner())
  WITH CHECK (user_id = auth.uid() OR public.is_site_owner());

-- Grant / consume lead credits
CREATE OR REPLACE FUNCTION public.grant_lead_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text DEFAULT NULL,
  p_payment_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bal integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  UPDATE profiles
  SET lead_credits = COALESCE(lead_credits, 0) + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING lead_credits INTO v_bal;

  IF v_bal IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  INSERT INTO lead_credit_ledger (user_id, delta, balance_after, reason, reference_id, payment_id)
  VALUES (p_user_id, p_amount, v_bal, p_reason, p_reference_id, p_payment_id);

  RETURN v_bal;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_lead_credit(
  p_user_id uuid,
  p_amount integer DEFAULT 1,
  p_reason text DEFAULT 'lead_unlock',
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bal integer;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND NOT public.is_site_owner() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  UPDATE profiles
  SET lead_credits = lead_credits - p_amount,
      updated_at = now()
  WHERE id = p_user_id
    AND COALESCE(lead_credits, 0) >= p_amount
  RETURNING lead_credits INTO v_bal;

  IF v_bal IS NULL THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO lead_credit_ledger (user_id, delta, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_amount, v_bal, p_reason, p_reference_id);

  RETURN v_bal;
END;
$$;

-- Apply plan entitlements (called from webhook / admin)
CREATE OR REPLACE FUNCTION public.apply_plan_entitlements(
  p_user_id uuid,
  p_plan_id text,
  p_period_end timestamptz DEFAULT NULL,
  p_grant_monthly_credits boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_credits integer;
BEGIN
  SELECT * INTO v_plan FROM subscription_plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown plan %', p_plan_id;
  END IF;

  UPDATE profiles SET
    plan_id = v_plan.id,
    support_tier = v_plan.support_tier,
    is_premium = CASE WHEN v_plan.premium_profile THEN true ELSE is_premium END,
    premium_expires_at = CASE
      WHEN v_plan.premium_profile THEN COALESCE(p_period_end, premium_expires_at, now() + interval '32 days')
      ELSE premium_expires_at
    END,
    is_featured = CASE WHEN v_plan.featured_profile THEN true ELSE is_featured END,
    featured_expires_at = CASE
      WHEN v_plan.featured_profile THEN COALESCE(p_period_end, featured_expires_at, now() + interval '32 days')
      ELSE featured_expires_at
    END,
    subscription_period_end = p_period_end,
    updated_at = now()
  WHERE id = p_user_id;

  IF p_grant_monthly_credits AND v_plan.lead_credits_monthly > 0 THEN
    v_credits := public.grant_lead_credits(
      p_user_id,
      v_plan.lead_credits_monthly,
      'plan_monthly_' || v_plan.id,
      v_plan.id
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_plan_to_free(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET
    plan_id = 'free',
    support_tier = 'community',
    subscription_status = 'canceled',
    stripe_subscription_id = NULL,
    subscription_period_end = NULL,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_lead_credits(uuid, integer, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_lead_credit(uuid, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_plan_entitlements(uuid, text, timestamptz, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_plan_to_free(uuid) TO service_role;

-- Owner: list subscriptions for admin
CREATE OR REPLACE FUNCTION public.admin_list_subscriptions(p_limit integer DEFAULT 80)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  plan_id text,
  billing_interval text,
  status text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  lead_credits integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_site_owner() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    us.id,
    us.user_id,
    p.full_name,
    us.plan_id,
    us.billing_interval,
    us.status,
    us.stripe_subscription_id,
    us.current_period_end,
    COALESCE(p.lead_credits, 0),
    us.created_at
  FROM user_subscriptions us
  JOIN profiles p ON p.id = us.user_id
  ORDER BY us.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 80), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions(integer) TO authenticated;
