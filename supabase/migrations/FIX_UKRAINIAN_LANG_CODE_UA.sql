-- Fix Ukrainian language display code: UK → UA (UK = Britain)
-- Paste into Supabase SQL Editor → Run (optional; only if manufacturer languages were seeded with UK)

UPDATE public.profiles
SET languages = array_replace(languages, 'UK', 'UA')
WHERE languages @> ARRAY['UK']::text[];

UPDATE public.manufacturer_profiles
SET languages = array_replace(languages, 'UK', 'UA'),
    updated_at = now()
WHERE languages @> ARRAY['UK']::text[];

SELECT slug, languages
FROM public.manufacturer_profiles
WHERE 'UA' = ANY(languages) OR 'UK' = ANY(languages)
ORDER BY slug;
