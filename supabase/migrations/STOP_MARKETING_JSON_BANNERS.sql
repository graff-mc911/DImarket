-- ============================================================
-- Stop AI marketing agent from flooding site header banners
-- Paste into Supabase SQL Editor → Run
-- Safe / idempotent — run this whenever JSON "Акція" junk reappears
-- ============================================================

-- 1) Stop autonomous agent (cron will no-op while is_running = false)
UPDATE public.marketing_agent_config
SET
  is_running = false,
  auto_publish = false,
  platforms = ARRAY(
    SELECT p FROM unnest(COALESCE(platforms, ARRAY[]::text[])) AS p
    WHERE p <> 'blog'
  ),
  updated_at = now()
WHERE id = 'default';

-- If platforms became empty, keep telegram only (no site banners)
UPDATE public.marketing_agent_config
SET platforms = ARRAY['telegram']::text[]
WHERE id = 'default'
  AND (platforms IS NULL OR cardinality(platforms) = 0);

-- 2) Delete ALL AI junk promo banners (marketing agent output)
DELETE FROM public.announcements
WHERE type = 'promo'
   OR message ILIKE '%```json%'
   OR message ILIKE '%``` %'
   OR message ILIKE '%"post"%'
   OR message ILIKE '%"content"%'
   OR message ILIKE '%"introduction"%'
   OR message ILIKE '%Unlocking the Power of Advertising%'
   OR message ILIKE '%Unlocking Opportunities%'
   OR message ILIKE '%Unlock Your Brand%'
   OR message ILIKE '%Unlock Your Potential%'
   OR message ILIKE '%Découvrez DiMarket%'
   OR message ILIKE '%Unlocking the Power of DiMarket%'
   OR message ILIKE '%Transformez vos projets%'
   OR message ILIKE '%Zwiększ swoją widoczność%'
   OR message ILIKE '%Entdecken Sie die Zukunft%'
   OR message ILIKE '%¡Bienvenido a DiMarket!%';

-- 3) Best-effort: unschedule pg_cron job if extension exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'marketing_agent_hourly';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron unschedule skipped: %', SQLERRM;
END $$;

-- 4) Redeploy edge function marketing-agent after merging fix PR (code change required)

-- Verify
SELECT id, is_running, auto_publish, platforms, updated_at
FROM public.marketing_agent_config
WHERE id = 'default';

SELECT id, type, is_active, left(message, 80) AS preview, created_at
FROM public.announcements
ORDER BY created_at DESC
LIMIT 10;
