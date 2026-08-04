-- One-shot SECURITY DEFINER backfill for directory electrician avatars.
-- Idempotent. Safe for anon execute (only fixed profile ids + fixed public storage URLs).

CREATE OR REPLACE FUNCTION public.backfill_directory_electrician_avatars()
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
      ('89ccac50-eded-47be-9426-ae6087bd16da'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/89ccac50-eded-47be-9426-ae6087bd16da/avatar.jpeg'),
      ('0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f/avatar.jpeg'),
      ('74d22af9-67ea-4dbf-baae-7640d638ea7d'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/74d22af9-67ea-4dbf-baae-7640d638ea7d/avatar.jpeg'),
      ('37c6f253-06cb-42ca-9d72-ab8e49d51e13'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/37c6f253-06cb-42ca-9d72-ab8e49d51e13/avatar.jpeg'),
      ('27bccd1d-3309-402e-977b-86be4048fa66'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/27bccd1d-3309-402e-977b-86be4048fa66/avatar.jpeg'),
      ('6d6517d5-565a-40a7-9f80-6f8d9b9c03cf'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/6d6517d5-565a-40a7-9f80-6f8d9b9c03cf/avatar.jpeg'),
      ('b2a7e44d-128a-4cf3-9906-097efa8a7c8b'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/b2a7e44d-128a-4cf3-9906-097efa8a7c8b/avatar.png'),
      ('358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0/avatar.jpeg'),
      ('c8fe9419-9049-4a14-a440-38c44ae7be51'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/c8fe9419-9049-4a14-a440-38c44ae7be51/avatar.jpeg'),
      ('aedc48d6-dc72-4f83-b443-4987fb8ddcaf'::uuid, 'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/aedc48d6-dc72-4f83-b443-4987fb8ddcaf/avatar.jpeg')
  ) AS v(id, url)
  WHERE p.id = v.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'updated', updated_count);
END;
$$;

REVOKE ALL ON FUNCTION public.backfill_directory_electrician_avatars() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backfill_directory_electrician_avatars() TO anon, authenticated, service_role;
