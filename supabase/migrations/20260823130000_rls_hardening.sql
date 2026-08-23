-- RLS hardening (H8, M1, M3)
--
-- Drops client-side INSERT policies on tables that should only be written by
-- trusted server-side code (edge functions / cron using service_role), and
-- enables RLS on tables that currently have no RLS at all.
--
-- NOTE on `match_scores`: the frontend (src/lib/matching/persistMatches.ts)
-- still upserts match scores client-side, so its authenticated INSERT policy
-- is KEPT here. Tightening it to service_role-only is a follow-up that
-- requires moving persistMatches behind an edge function. Tracked in PR.

-- H8a: ai_translations — drop client INSERT (no client writes; service_role only).
DROP POLICY IF EXISTS "ai_translations_insert" ON public.ai_translations;
-- Re-create as a no-op-protected deny: only service_role (which bypasses RLS)
-- can insert. Leaving no policy = default-deny for authenticated/anon.
-- (No replacement policy is created.)

-- H8b: ai_review_analysis — drop client INSERT (no client writes; service_role only).
DROP POLICY IF EXISTS "ai_review_insert" ON public.ai_review_analysis;

-- M1: enable RLS on tables that currently have none (default-deny for clients;
-- service_role still bypasses RLS).
ALTER TABLE public.geo_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osm_weekly_digest_runs ENABLE ROW LEVEL SECURITY;

-- geo_catalog is public reference data read by the frontend (adGeoCatalog.ts).
-- Re-create an explicit public SELECT policy so enabling RLS does not break reads.
DROP POLICY IF EXISTS "Public read geo_catalog" ON public.geo_catalog;
CREATE POLICY "Public read geo_catalog" ON public.geo_catalog
  FOR SELECT TO public USING (true);

-- Authenticated users may add reference geo points (best-effort client fallback
-- in adGeoCatalog.ts after the RPC path). Require non-null country/region/city.
DROP POLICY IF EXISTS "Authenticated insert geo_catalog" ON public.geo_catalog;
CREATE POLICY "Authenticated insert geo_catalog" ON public.geo_catalog
  FOR INSERT TO authenticated
  WITH CHECK (
    country IS NOT NULL AND country <> ''
    AND region IS NOT NULL AND region <> ''
    AND city IS NOT NULL AND city <> ''
  );

-- M3: tighten profile_view_events INSERT — require a non-null profile_id
-- (viewer_id may be NULL for anonymous views, matching the record_profile_view
-- RPC which inserts NULL viewer_id for anonymous visitors).
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_view_events;
CREATE POLICY "Anyone can insert profile views" ON public.profile_view_events
  FOR INSERT TO public
  WITH CHECK (profile_id IS NOT NULL);
