-- Premium Membership System: plans, coupons, invoices, trials, permissions

-- Expand plan catalog
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recommended boolean NOT NULL DEFAULT false;

INSERT INTO subscription_plans (
  id, name, description, price_eur_month, price_eur_year,
  lead_credits_monthly, featured_profile, premium_profile,
  sponsored_projects_monthly, banner_ad_discount_pct, google_ads_included,
  support_tier, sort_order, audience, trial_days, permissions, recommended
) VALUES
  (
    'guest', 'Guest', 'Browse without an account',
    0, 0, 0, false, false, 0, 0, false, 'community', 0,
    'guest', 0, '[]'::jsonb, false
  ),
  (
    'customer', 'Customer', 'Free customer account',
    0, 0, 0, false, false, 0, 0, false, 'community', 1,
    'customer', 0, '[]'::jsonb, false
  ),
  (
    'customer_premium', 'Customer Premium', 'AI assistant and exclusive perks',
    9, 90, 0, false, true, 0, 5, false, 'priority', 2,
    'customer', 30,
    '["priority_support","project_templates","unlimited_saved_pros","ai_project_assistant","exclusive_discounts","premium_support"]'::jsonb,
    false
  ),
  (
    'free', 'Professional Free', 'Start winning jobs',
    0, 0, 0, false, false, 0, 0, false, 'community', 3,
    'professional', 0, '[]'::jsonb, false
  ),
  (
    'pro', 'Professional Premium', 'Verified badge, ranking, unlimited leads',
    29, 290, 20, true, true, 0, 10, false, 'email', 4,
    'professional', 30,
    '["verified_premium_badge","higher_search_ranking","unlimited_portfolio","unlimited_applications","priority_ai_matching","advanced_statistics","lead_notifications","profile_boost","premium_support","custom_profile_url"]'::jsonb,
    true
  ),
  (
    'company_premium', 'Company Premium', 'Teams, branches, featured placement',
    79, 790, 75, true, true, 2, 25, false, 'priority', 5,
    'company', 30,
    '["company_verification","unlimited_employees","unlimited_branches","featured_company","advanced_analytics","priority_support","company_badge","marketing_tools"]'::jsonb,
    false
  ),
  (
    'enterprise', 'Enterprise', 'Full platform power',
    199, 1990, 500, true, true, 10, 40, true, 'dedicated', 6,
    'enterprise', 30,
    '["gold_partner_badge","company_verification","google_ads","advanced_analytics"]'::jsonb,
    false
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
  audience = EXCLUDED.audience,
  trial_days = EXCLUDED.trial_days,
  permissions = EXCLUDED.permissions,
  recommended = EXCLUDED.recommended,
  is_active = true;

-- Keep legacy business row as alias of company_premium entitlements
INSERT INTO subscription_plans (
  id, name, description, price_eur_month, price_eur_year,
  lead_credits_monthly, featured_profile, premium_profile,
  sponsored_projects_monthly, banner_ad_discount_pct, google_ads_included,
  support_tier, sort_order, audience, trial_days, permissions, recommended, is_active
) VALUES (
  'business', 'Company Premium', 'Alias of company_premium',
  79, 790, 75, true, true, 2, 25, false, 'priority', 5,
  'company', 30,
  '["company_verification","unlimited_employees","unlimited_branches","featured_company","advanced_analytics","priority_support","company_badge","marketing_tools"]'::jsonb,
  false, true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_eur_month = EXCLUDED.price_eur_month,
  price_eur_year = EXCLUDED.price_eur_year,
  permissions = EXCLUDED.permissions,
  audience = EXCLUDED.audience,
  trial_days = EXCLUDED.trial_days;

-- Coupons / discounts
CREATE TABLE IF NOT EXISTS membership_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  percent_off integer,
  amount_off_eur numeric(10,2),
  plan_ids text[] DEFAULT NULL,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  trial_days_override integer,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (percent_off IS NOT NULL OR amount_off_eur IS NOT NULL OR trial_days_override IS NOT NULL)
);

ALTER TABLE membership_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_public_read_active" ON membership_coupons;
CREATE POLICY "coupons_public_read_active" ON membership_coupons FOR SELECT
  USING (active = true OR public.is_site_owner());

DROP POLICY IF EXISTS "coupons_owner_all" ON membership_coupons;
CREATE POLICY "coupons_owner_all" ON membership_coupons FOR ALL TO authenticated
  USING (public.is_site_owner())
  WITH CHECK (public.is_site_owner());

-- Invoice cache (synced from Stripe / local payments)
CREATE TABLE IF NOT EXISTS billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_invoice_id text UNIQUE,
  stripe_payment_intent text,
  number text,
  status text NOT NULL DEFAULT 'open',
  amount_due integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user ON billing_invoices(user_id, created_at DESC);

ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own" ON billing_invoices;
CREATE POLICY "invoices_select_own" ON billing_invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_site_owner());

DROP POLICY IF EXISTS "invoices_owner_write" ON billing_invoices;
CREATE POLICY "invoices_owner_write" ON billing_invoices FOR ALL TO authenticated
  USING (public.is_site_owner())
  WITH CHECK (public.is_site_owner());

-- Trial tracking on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS membership_badge text;

-- Extend user_subscriptions for trial
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- Normalize apply_plan_entitlements to accept company_premium
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
  v_plan_id text := p_plan_id;
BEGIN
  IF v_plan_id = 'business' THEN
    v_plan_id := 'company_premium';
  END IF;
  IF v_plan_id = 'professional_premium' THEN
    v_plan_id := 'pro';
  END IF;
  IF v_plan_id = 'professional_free' THEN
    v_plan_id := 'free';
  END IF;

  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_plan_id;
  IF NOT FOUND THEN
    SELECT * INTO v_plan FROM subscription_plans WHERE id = 'pro';
  END IF;
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
    membership_badge = CASE
      WHEN v_plan.id = 'enterprise' THEN 'enterprise'
      WHEN v_plan.premium_profile THEN 'premium'
      ELSE 'free'
    END,
    updated_at = now()
  WHERE id = p_user_id;

  IF p_grant_monthly_credits AND COALESCE(v_plan.lead_credits_monthly, 0) > 0 THEN
    v_credits := v_plan.lead_credits_monthly;
    PERFORM public.grant_lead_credits(
      p_user_id,
      v_credits,
      'plan_monthly_grant',
      v_plan.id,
      NULL
    );
  END IF;
END;
$$;

-- Admin helpers: upsert coupon
CREATE OR REPLACE FUNCTION public.admin_upsert_membership_coupon(
  p_code text,
  p_percent_off integer DEFAULT NULL,
  p_amount_off_eur numeric DEFAULT NULL,
  p_trial_days integer DEFAULT NULL,
  p_plan_ids text[] DEFAULT NULL,
  p_max_redemptions integer DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_active boolean DEFAULT true,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_site_owner() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO membership_coupons (
    code, percent_off, amount_off_eur, trial_days_override, plan_ids,
    max_redemptions, expires_at, active, description
  ) VALUES (
    upper(trim(p_code)), p_percent_off, p_amount_off_eur, p_trial_days, p_plan_ids,
    p_max_redemptions, p_expires_at, p_active, p_description
  )
  ON CONFLICT (code) DO UPDATE SET
    percent_off = EXCLUDED.percent_off,
    amount_off_eur = EXCLUDED.amount_off_eur,
    trial_days_override = EXCLUDED.trial_days_override,
    plan_ids = EXCLUDED.plan_ids,
    max_redemptions = EXCLUDED.max_redemptions,
    expires_at = EXCLUDED.expires_at,
    active = EXCLUDED.active,
    description = EXCLUDED.description,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
