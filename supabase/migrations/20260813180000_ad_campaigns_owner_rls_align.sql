-- Align ad_campaigns owner RLS with public.is_site_owner()
-- (is_site_owner OR user_role = 'owner'), matching monetization/admin helpers.
-- Fixes email-synced owners who have user_role='owner' but were gated only on is_site_owner.

CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_site_owner = true OR p.user_role = 'owner')
  );
$$;

DROP POLICY IF EXISTS "Site owners can view all ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Site owners can view all ad campaigns"
  ON public.ad_campaigns FOR SELECT
  TO authenticated
  USING (public.is_site_owner());

DROP POLICY IF EXISTS "Site owners can update any campaign" ON public.ad_campaigns;
CREATE POLICY "Site owners can update any campaign"
  ON public.ad_campaigns FOR UPDATE
  TO authenticated
  USING (public.is_site_owner())
  WITH CHECK (public.is_site_owner());

DROP POLICY IF EXISTS "Site owners can delete ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Site owners can delete ad campaigns"
  ON public.ad_campaigns FOR DELETE
  TO authenticated
  USING (public.is_site_owner());
