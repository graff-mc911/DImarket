-- ============================================================
-- Ukrainian language tag: UK → UA everywhere (spoken languages)
-- UK remains valid only as United Kingdom in country fields.
-- Paste into Supabase SQL Editor → Run. Idempotent.
-- ============================================================

-- profiles.languages
UPDATE public.profiles
SET languages = array_replace(languages, 'UK', 'UA')
WHERE languages @> ARRAY['UK']::text[];

UPDATE public.profiles
SET languages = array_replace(languages, 'uk', 'UA')
WHERE languages @> ARRAY['uk']::text[];

UPDATE public.profiles
SET languages = array_replace(languages, 'ua', 'UA')
WHERE languages @> ARRAY['ua']::text[];

-- manufacturer_profiles.languages
UPDATE public.manufacturer_profiles
SET
  languages = array_replace(array_replace(array_replace(languages, 'UK', 'UA'), 'uk', 'UA'), 'ua', 'UA'),
  updated_at = now()
WHERE languages && ARRAY['UK', 'uk', 'ua']::text[];

-- agent_profiles.languages (if table exists)
DO $$
BEGIN
  IF to_regclass('public.agent_profiles') IS NOT NULL THEN
    UPDATE public.agent_profiles
    SET
      languages = array_replace(array_replace(array_replace(languages, 'UK', 'UA'), 'uk', 'UA'), 'ua', 'UA'),
      updated_at = now()
    WHERE languages && ARRAY['UK', 'uk', 'ua']::text[];
  END IF;
END $$;

-- representation_opportunities.required_languages
DO $$
BEGIN
  IF to_regclass('public.representation_opportunities') IS NOT NULL THEN
    UPDATE public.representation_opportunities
    SET
      required_languages = array_replace(
        array_replace(array_replace(required_languages, 'UK', 'UA'), 'uk', 'UA'),
        'ua',
        'UA'
      ),
      updated_at = now()
    WHERE required_languages && ARRAY['UK', 'uk', 'ua']::text[];
  END IF;
END $$;

-- Dedupe accidental duplicates after replace (UA,UA)
UPDATE public.profiles p
SET languages = (
  SELECT COALESCE(array_agg(DISTINCT x), '{}')
  FROM unnest(p.languages) AS x
)
WHERE languages IS NOT NULL;

UPDATE public.manufacturer_profiles m
SET languages = (
  SELECT COALESCE(array_agg(DISTINCT x), '{}')
  FROM unnest(m.languages) AS x
)
WHERE languages IS NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.agent_profiles') IS NOT NULL THEN
    UPDATE public.agent_profiles a
    SET languages = (
      SELECT COALESCE(array_agg(DISTINCT x), '{}')
      FROM unnest(a.languages) AS x
    )
    WHERE languages IS NOT NULL;
  END IF;
END $$;

-- Verify (should show UA, never UK as language)
SELECT 'profiles' AS src, id::text, languages
FROM public.profiles
WHERE languages && ARRAY['UA', 'UK', 'uk', 'ua']::text[]
LIMIT 20;

SELECT 'manufacturer_profiles' AS src, slug, languages
FROM public.manufacturer_profiles
WHERE languages && ARRAY['UA', 'UK', 'uk', 'ua']::text[]
ORDER BY slug;
