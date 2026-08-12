-- Run in DImarket Supabase SQL Editor (prod) if migration not applied via CLI.
-- Creates scb_account_links for SCB Light cross-app provisioning.

\i supabase/migrations/20260812120000_scb_account_links.sql

-- Edge function secrets (Supabase Dashboard → Edge Functions → Secrets):
-- SCB_SUPABASE_URL=https://dnqudrucyypmfuskyfjw.supabase.co
-- SCB_SUPABASE_SERVICE_ROLE_KEY=<service role from SCB Light project>
