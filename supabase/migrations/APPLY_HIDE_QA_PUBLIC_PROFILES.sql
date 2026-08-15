-- APPLY_HIDE_QA_PUBLIC_PROFILES.sql
-- Non-destructive: sets is_professional=false for confirmed QA/test display names
-- so they leave Top Masters / Top Companies / public directories.
-- Does NOT delete auth.users or profiles.
-- Run in Supabase SQL Editor as owner/service role.
-- Review the SELECT preview first, then uncomment the UPDATE.

-- PREVIEW (run first):
SELECT id, full_name, user_role, is_professional, created_at
FROM public.profiles
WHERE
  full_name ~* '^qa([\s_\-.]|$)'
  OR full_name ~* '\yqa[\s_\-]*(smoke|chat|master|e2e|admin|client|company|mfr|mfg|pv|advertiser|final|stranger|audit|self)\y'
  OR lower(trim(full_name)) IN ('test', 'tester', 'demo', 'demo user', 'test user')
  OR full_name ~* '^investor\s+(ad|demo)'
ORDER BY created_at DESC;

-- OPTIONAL: unpublish CA directory rows with QA names
-- SELECT id, company_name, is_published FROM manufacturer_profiles
-- WHERE company_name ~* '^qa' OR company_name ~* '\yqa[\s_\-]*';
-- SELECT id, full_name, company_name, is_published FROM agent_profiles
-- WHERE full_name ~* '^qa' OR company_name ~* '^qa';

-- APPLY (uncomment after preview OK):
/*
UPDATE public.profiles
SET
  is_professional = false,
  updated_at = now()
WHERE
  full_name ~* '^qa([\s_\-.]|$)'
  OR full_name ~* '\yqa[\s_\-]*(smoke|chat|master|e2e|admin|client|company|mfr|mfg|pv|advertiser|final|stranger|audit|self)\y'
  OR lower(trim(full_name)) IN ('test', 'tester', 'demo', 'demo user', 'test user')
  OR full_name ~* '^investor\s+(ad|demo)';

UPDATE public.manufacturer_profiles
SET is_published = false, updated_at = now()
WHERE company_name ~* '^qa' OR company_name ~* '\yqa[\s_\-]*';

UPDATE public.agent_profiles
SET is_published = false, updated_at = now()
WHERE full_name ~* '^qa' OR company_name ~* '^qa';
*/
