-- Prod one-shot: stop marketing agent + purge JSON promo banners.
-- Same as STOP_MARKETING_JSON_BANNERS.sql — run in Supabase SQL Editor.

UPDATE public.marketing_agent_config
SET
  is_running = false,
  auto_publish = false,
  platforms = ARRAY['telegram']::text[],
  updated_at = now()
WHERE id = 'default';

DELETE FROM public.announcements
WHERE type = 'promo'
   OR message ILIKE '%```json%'
   OR message ILIKE '%"post"%'
   OR message ILIKE '%"content"%'
   OR message ILIKE '%"introduction"%';
