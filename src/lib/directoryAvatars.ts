/**
 * Public directory avatars hosted on DImarket Supabase Storage (ad-media).
 * Used when profile_photo / avatar_url are still empty (RLS blocks anon profile updates).
 * Prefer DB fields once service-role backfill has run.
 * Germany entries are original generated art (initials) — not third-party photos.
 */
export const DIRECTORY_AVATAR_BY_PROFILE_ID: Record<string, string> = {
  '0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f/avatar.jpeg',
  '0f8d834b-a8cb-4582-b3f2-ed4957f9118f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/0f8d834b-a8cb-4582-b3f2-ed4957f9118f/avatar.jpeg',
  '18b6d473-8e8e-4287-adfc-46c2c9b47e6f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/18b6d473-8e8e-4287-adfc-46c2c9b47e6f/avatar.jpeg',
  '1e885ab8-0bbc-4574-aadd-9d3e13337a2d':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/1e885ab8-0bbc-4574-aadd-9d3e13337a2d/avatar.jpeg',
  '27bccd1d-3309-402e-977b-86be4048fa66':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/27bccd1d-3309-402e-977b-86be4048fa66/avatar.jpeg',
  '2ff88a58-64d8-4293-ae8f-d446957dc860':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/2ff88a58-64d8-4293-ae8f-d446957dc860/avatar.jpeg',
  '33ecfc72-3c07-42e4-b301-c3eaba8b945e':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/33ecfc72-3c07-42e4-b301-c3eaba8b945e/avatar.jpeg',
  '358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0/avatar.jpeg',
  '37c6f253-06cb-42ca-9d72-ab8e49d51e13':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/37c6f253-06cb-42ca-9d72-ab8e49d51e13/avatar.jpeg',
  '41e720df-5d2d-4fb7-b77a-78d87b4eeab2':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/41e720df-5d2d-4fb7-b77a-78d87b4eeab2/avatar.jpeg',
  '4e6fd39b-5486-4844-9c3e-013d73b0d180':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/4e6fd39b-5486-4844-9c3e-013d73b0d180/avatar.jpeg',
  '526d03c3-0d8e-4ab2-a9bb-d09a4f4d6c73':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/526d03c3-0d8e-4ab2-a9bb-d09a4f4d6c73/avatar.jpeg',
  '52d63da5-c98c-42e6-899e-a1deca28fa56':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/52d63da5-c98c-42e6-899e-a1deca28fa56/avatar.jpeg',
  '5bcb0ccd-7ff9-4d53-927a-7d721b0f4df3':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/5bcb0ccd-7ff9-4d53-927a-7d721b0f4df3/avatar.jpeg',
  '5fafcffa-2591-4c48-abfc-392e79c2b7ad':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/5fafcffa-2591-4c48-abfc-392e79c2b7ad/avatar.jpeg',
  '64499076-6d49-4e81-8373-a234aaaab964':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/64499076-6d49-4e81-8373-a234aaaab964/avatar.jpeg',
  '6484548b-a5ec-443a-87de-af18543f2834':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/6484548b-a5ec-443a-87de-af18543f2834/avatar.jpeg',
  '6b8e25c0-e4e1-407f-933a-f48f334ef4ad':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/6b8e25c0-e4e1-407f-933a-f48f334ef4ad/avatar.jpeg',
  '6d6517d5-565a-40a7-9f80-6f8d9b9c03cf':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/6d6517d5-565a-40a7-9f80-6f8d9b9c03cf/avatar.jpeg',
  '7449de6a-609d-4c0f-824b-2dd434f58f6b':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/7449de6a-609d-4c0f-824b-2dd434f58f6b/avatar.jpeg',
  '74d22af9-67ea-4dbf-baae-7640d638ea7d':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/74d22af9-67ea-4dbf-baae-7640d638ea7d/avatar.jpeg',
  '7b21cd37-4495-4dfc-9a0b-6d07dfe03b9f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/7b21cd37-4495-4dfc-9a0b-6d07dfe03b9f/avatar.jpeg',
  '89ccac50-eded-47be-9426-ae6087bd16da':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/89ccac50-eded-47be-9426-ae6087bd16da/avatar.jpeg',
  '8afd890a-2ea0-40d3-9ad1-675799aae2ca':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/8afd890a-2ea0-40d3-9ad1-675799aae2ca/avatar.jpeg',
  '980d36ec-4778-4fe5-a0f0-bb478f720e9f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/980d36ec-4778-4fe5-a0f0-bb478f720e9f/avatar.jpeg',
  '9c241aa8-b6a7-4f1c-b22d-455e7b6e9941':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/9c241aa8-b6a7-4f1c-b22d-455e7b6e9941/avatar.jpeg',
  'a04fbbfc-f65a-49c4-8a9e-24bebad7f787':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/a04fbbfc-f65a-49c4-8a9e-24bebad7f787/avatar.jpeg',
  'a7c84f31-3c44-4c6f-aeb3-1b996edac598':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/a7c84f31-3c44-4c6f-aeb3-1b996edac598/avatar.jpeg',
  'a9ce1027-bca8-473c-8fa5-f63849973876':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/a9ce1027-bca8-473c-8fa5-f63849973876/avatar.jpeg',
  'aedc48d6-dc72-4f83-b443-4987fb8ddcaf':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/aedc48d6-dc72-4f83-b443-4987fb8ddcaf/avatar.jpeg',
  'b121ed77-0d1f-422d-92b9-6361c2b2a822':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/b121ed77-0d1f-422d-92b9-6361c2b2a822/avatar.jpeg',
  'b232929a-eefe-4d47-9862-9dd5acaa56bb':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/b232929a-eefe-4d47-9862-9dd5acaa56bb/avatar.jpeg',
  'b2a7e44d-128a-4cf3-9906-097efa8a7c8b':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/b2a7e44d-128a-4cf3-9906-097efa8a7c8b/avatar.png',
  'c8fe9419-9049-4a14-a440-38c44ae7be51':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/c8fe9419-9049-4a14-a440-38c44ae7be51/avatar.jpeg',
  'd66cd1b7-49a7-4602-80f9-e22f00c674f5':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/d66cd1b7-49a7-4602-80f9-e22f00c674f5/avatar.jpeg',
  'd72561fd-8ee5-4b4c-9390-3ba341ec5022':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/d72561fd-8ee5-4b4c-9390-3ba341ec5022/avatar.jpeg',
  'ed6f9646-122b-46bb-820d-c439c858f736':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/ed6f9646-122b-46bb-820d-c439c858f736/avatar.jpeg',
  'ef08a110-7fbd-4f25-935c-61cba2c2ccee':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/ef08a110-7fbd-4f25-935c-61cba2c2ccee/avatar.jpeg',
  'f52fde86-97ff-41b7-a448-42548d2d0d70':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/f52fde86-97ff-41b7-a448-42548d2d0d70/avatar.jpeg',
  'f7d7ad33-733a-4531-ae57-0ccd9e01392e':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/f7d7ad33-733a-4531-ae57-0ccd9e01392e/avatar.jpeg',
  'fc2519f7-3bea-43c3-a9d6-d9a0b7c52bc7':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/fc2519f7-3bea-43c3-a9d6-d9a0b7c52bc7/avatar.jpeg',
}

export function resolveDirectoryAvatarUrl(
  profileId: string,
  profilePhoto?: string | null,
  avatarUrl?: string | null,
): string | null {
  return profilePhoto || avatarUrl || DIRECTORY_AVATAR_BY_PROFILE_ID[profileId] || null
}
