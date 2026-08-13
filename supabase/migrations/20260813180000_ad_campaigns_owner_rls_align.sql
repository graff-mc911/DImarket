-- Align ad_campaigns owner RLS with public.is_site_owner()
-- (is_site_owner OR user_role = 'owner'), matching monetization/admin helpers.
-- Also sync the known site-owner email so cabinet SELECT/UPDATE works in DB,
-- not only via the frontend email bypass.

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

-- Keep profile flag in sync with the canonical owner login email.
UPDATE public.profiles p
SET
  is_site_owner = true,
  user_role = 'owner'
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower('ivan.sovban@gmail.com');

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

-- Explicit owner insert (in addition to advertiser_id = auth.uid()).
DROP POLICY IF EXISTS "Site owners can insert ad campaigns" ON public.ad_campaigns;
CREATE POLICY "Site owners can insert ad campaigns"
  ON public.ad_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_site_owner());
