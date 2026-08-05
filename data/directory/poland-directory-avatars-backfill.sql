-- Poland directory avatars backfill (generated DImarket art, not third-party photos)
CREATE OR REPLACE FUNCTION public.backfill_poland_directory_avatars()
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
      ('ec863a50-08fa-464b-9b6b-3727feb6bfbc'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/ec863a50-08fa-464b-9b6b-3727feb6bfbc/avatar.jpeg'),
      ('9f2bafd7-1bb8-4b3e-919a-20c1fb8a35b0'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/9f2bafd7-1bb8-4b3e-919a-20c1fb8a35b0/avatar.jpeg'),
      ('95e93673-a643-4dca-bab7-a18a3ea6a124'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/95e93673-a643-4dca-bab7-a18a3ea6a124/avatar.jpeg'),
      ('756474d1-a698-42ab-b9cf-a42d7bfcc2cd'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/756474d1-a698-42ab-b9cf-a42d7bfcc2cd/avatar.jpeg'),
      ('9b04e576-fc42-47a5-b006-befaffb1b252'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/9b04e576-fc42-47a5-b006-befaffb1b252/avatar.jpeg'),
      ('a67448fa-edc8-4004-83f6-a482e9a5a498'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/a67448fa-edc8-4004-83f6-a482e9a5a498/avatar.jpeg'),
      ('0771ca76-7e9b-4ec9-b502-14a085b661d3'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/0771ca76-7e9b-4ec9-b502-14a085b661d3/avatar.jpeg'),
      ('1e8dbd9c-6254-4bf6-b223-e82659987b5d'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/1e8dbd9c-6254-4bf6-b223-e82659987b5d/avatar.jpeg'),
      ('2dc233cb-ba78-43c9-b7e1-f5e90254d030'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/2dc233cb-ba78-43c9-b7e1-f5e90254d030/avatar.jpeg'),
      ('947feed1-32eb-4390-bd35-951fabbd9792'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/947feed1-32eb-4390-bd35-951fabbd9792/avatar.jpeg'),
      ('e1b912f3-6437-41be-b4e1-9990cad09d8b'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/e1b912f3-6437-41be-b4e1-9990cad09d8b/avatar.jpeg'),
      ('489958ea-e67b-4ac5-9ff0-71622aacacaa'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/489958ea-e67b-4ac5-9ff0-71622aacacaa/avatar.jpeg'),
      ('79f618f5-7bdb-45ef-89db-5ec7c826f278'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/79f618f5-7bdb-45ef-89db-5ec7c826f278/avatar.jpeg'),
      ('e609d4b6-416d-443b-bde0-46ae3576e01b'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/e609d4b6-416d-443b-bde0-46ae3576e01b/avatar.jpeg'),
      ('137da278-5e58-4211-92fb-563ead6dff26'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/137da278-5e58-4211-92fb-563ead6dff26/avatar.jpeg')
  ) AS v(id, url)
  WHERE p.id = v.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'updated', updated_count);
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_poland_directory_avatars() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_poland_directory_avatars() TO anon, authenticated, service_role;
