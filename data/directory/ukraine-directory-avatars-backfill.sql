-- Ukraine directory avatars backfill (generated DImarket art, not third-party photos)
CREATE OR REPLACE FUNCTION public.backfill_ukraine_directory_avatars()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count int := 0;
BEGIN
  UPDATE public.profiles AS p
  SET
    avatar_url = v.url,
    profile_photo = v.url,
    updated_at = now()
  FROM (
    VALUES
      ('7e1bec0e-c81b-409e-abc7-49017f34aaff'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/7e1bec0e-c81b-409e-abc7-49017f34aaff/avatar.jpeg'),
      ('3944e717-d65d-4886-b9e6-93be691dad71'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/3944e717-d65d-4886-b9e6-93be691dad71/avatar.jpeg'),
      ('761e04a6-a727-4839-9862-f725402950d9'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/761e04a6-a727-4839-9862-f725402950d9/avatar.jpeg'),
      ('93ec17e3-77cf-4205-9dee-d0abb3a96fce'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/93ec17e3-77cf-4205-9dee-d0abb3a96fce/avatar.jpeg'),
      ('d790a279-c133-42cb-8b36-e507b9f96f2e'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/d790a279-c133-42cb-8b36-e507b9f96f2e/avatar.jpeg'),
      ('09adc71b-ba08-4ff5-8508-43e6d11bfbd6'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/09adc71b-ba08-4ff5-8508-43e6d11bfbd6/avatar.jpeg'),
      ('63126c2c-53c2-4448-9a31-455c45004d25'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/63126c2c-53c2-4448-9a31-455c45004d25/avatar.jpeg'),
      ('d67be8dc-dec4-42de-8eec-3e8f06ae66e1'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/d67be8dc-dec4-42de-8eec-3e8f06ae66e1/avatar.jpeg'),
      ('64e7d2ff-0d84-4bd1-ba79-7fb29eaf635f'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/64e7d2ff-0d84-4bd1-ba79-7fb29eaf635f/avatar.jpeg'),
      ('fc27833c-9f57-44fb-aaa7-992cdf97cb0f'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/fc27833c-9f57-44fb-aaa7-992cdf97cb0f/avatar.jpeg'),
      ('3c01420c-faec-41dc-870c-68f4449fe5e3'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/3c01420c-faec-41dc-870c-68f4449fe5e3/avatar.jpeg'),
      ('9c644620-34b9-42a1-be17-214f5224049d'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/9c644620-34b9-42a1-be17-214f5224049d/avatar.jpeg'),
      ('87cc99c4-c85b-4f17-bd5c-4f8d7f11e568'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/87cc99c4-c85b-4f17-bd5c-4f8d7f11e568/avatar.jpeg'),
      ('83f1886e-57c6-47d5-a989-7cbb02b7ef83'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/83f1886e-57c6-47d5-a989-7cbb02b7ef83/avatar.jpeg'),
      ('bb7ea519-28de-4774-85df-bedfbc1abb6a'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/bb7ea519-28de-4774-85df-bedfbc1abb6a/avatar.jpeg'),
      ('83ac72f9-f65e-437f-baed-293b13aebed4'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/83ac72f9-f65e-437f-baed-293b13aebed4/avatar.jpeg')
  ) AS v(id, url)
  WHERE p.id = v.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'updated', updated_count);
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_ukraine_directory_avatars() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_ukraine_directory_avatars() TO anon, authenticated, service_role;
