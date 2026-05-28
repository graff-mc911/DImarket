-- Prevent duplicate payment records for same Stripe checkout session.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_session_id
  ON public.payments(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
