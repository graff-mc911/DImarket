-- Project escrow V1: platform-held authorize-then-capture on accepted quote total.
-- Separate from ads/boost `payments` table.

CREATE TABLE IF NOT EXISTS public.project_escrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending_checkout'
    CHECK (status IN ('pending_checkout', 'authorized', 'captured', 'canceled', 'refunded')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  authorized_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_escrows_listing
  ON public.project_escrows(listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_escrows_customer
  ON public.project_escrows(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_project_escrows_session
  ON public.project_escrows(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- One active hold per listing (pending checkout or authorized)
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_escrows_active_listing
  ON public.project_escrows(listing_id)
  WHERE status IN ('pending_checkout', 'authorized');

ALTER TABLE public.project_escrows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_escrows_select ON public.project_escrows;
CREATE POLICY project_escrows_select ON public.project_escrows
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR professional_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND (l.author_id = auth.uid() OR l.hired_professional_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS project_escrows_insert ON public.project_escrows;
CREATE POLICY project_escrows_insert ON public.project_escrows
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS project_escrows_update ON public.project_escrows;
CREATE POLICY project_escrows_update ON public.project_escrows
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.author_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.author_id = auth.uid()
    )
  );

COMMENT ON TABLE public.project_escrows IS
  'V1 project payment hold: Stripe Checkout manual capture on quote total; platform holds until complete.';
