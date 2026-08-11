-- Grants + PostgREST schema reload for Commercial Agents (Phase 1)
-- Safe to re-run.

GRANT SELECT ON TABLE public.manufacturer_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.manufacturer_profiles TO authenticated;

GRANT SELECT ON TABLE public.agent_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.agent_profiles TO authenticated;

GRANT SELECT ON TABLE public.representation_opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.representation_opportunities TO authenticated;

GRANT SELECT ON TABLE public.representation_applications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.representation_applications TO authenticated;

GRANT SELECT ON TABLE public.agent_invitations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.agent_invitations TO authenticated;

GRANT SELECT ON TABLE public.commercial_entity_reports TO authenticated;
GRANT INSERT ON TABLE public.commercial_entity_reports TO authenticated;
GRANT UPDATE ON TABLE public.commercial_entity_reports TO authenticated;

GRANT SELECT ON TABLE public.commercial_analytics_events TO authenticated;
GRANT INSERT ON TABLE public.commercial_analytics_events TO anon, authenticated;

-- Sequences / defaults (uuid) — no serial columns, but keep privileges consistent
GRANT USAGE ON SCHEMA public TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
