-- ============================================================
-- SCB Light dual-account linking — paste in Supabase SQL Editor
-- Project: DImarket (wjlfvajloxkevggwjgtk)
-- ============================================================

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

-- After SQL:
-- 1) Deploy edge function: npm run deploy:scb-provision
-- 2) Supabase → Edge Functions → Secrets:
--    SCB_SUPABASE_URL=https://dnqudrucyypmfuskyfjw.supabase.co
--    SCB_SUPABASE_SERVICE_ROLE_KEY=<service role from SCB Light project>
