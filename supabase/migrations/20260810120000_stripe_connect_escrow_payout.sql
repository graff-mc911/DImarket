-- Prompt #12: Stripe Connect Express for pros + escrow Transfer after capture.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account
  ON public.profiles(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

ALTER TABLE public.project_escrows
  ADD COLUMN IF NOT EXISTS platform_fee_bps integer NOT NULL DEFAULT 500
    CHECK (platform_fee_bps >= 0 AND platform_fee_bps <= 5000),
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric,
  ADD COLUMN IF NOT EXISTS transfer_amount numeric,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'none'
    CHECK (payout_status IN (
      'none',
      'pending',
      'transferred',
      'failed',
      'skipped_no_connect'
    )),
  ADD COLUMN IF NOT EXISTS payout_error text,
  ADD COLUMN IF NOT EXISTS paid_out_at timestamptz;

COMMENT ON COLUMN public.profiles.stripe_account_id IS
  'Stripe Connect Express account id for receiving escrow Transfers.';
COMMENT ON COLUMN public.project_escrows.payout_status IS
  'After capture: Transfer to pro Connect account minus platform fee.';
