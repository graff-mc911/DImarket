-- Allow project_escrow audit rows in payments (ads table remains SSoT for boosts;
-- escrow state lives in project_escrows; payments is optional ledger).

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_type_check CHECK (
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
    'google_ads',
    'project_escrow'
  )
);
