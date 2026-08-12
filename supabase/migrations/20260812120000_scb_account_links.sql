/*
  SCB Light cross-app account linking (DImarket → scblight.com).
  Provisioned server-side via edge function; users read their own row only.
*/

CREATE TABLE IF NOT EXISTS public.scb_account_links (
  dimarket_user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  scb_user_id uuid,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'provisioned'
    CHECK (status IN ('provisioned', 'existing_email', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scb_account_links_email_lower
  ON public.scb_account_links (lower(email));

ALTER TABLE public.scb_account_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scb_account_links_select_own ON public.scb_account_links;
CREATE POLICY scb_account_links_select_own
  ON public.scb_account_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dimarket_user_id);

GRANT SELECT ON public.scb_account_links TO authenticated;
