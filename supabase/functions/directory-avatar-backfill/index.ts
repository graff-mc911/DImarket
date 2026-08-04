import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const AVATARS: Record<string, string> = {
  '89ccac50-eded-47be-9426-ae6087bd16da':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/89ccac50-eded-47be-9426-ae6087bd16da/avatar.jpeg',
  '0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/0000b137-1ab4-48d6-8c8a-8d8f1f5d0f5f/avatar.jpeg',
  '74d22af9-67ea-4dbf-baae-7640d638ea7d':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/74d22af9-67ea-4dbf-baae-7640d638ea7d/avatar.jpeg',
  '37c6f253-06cb-42ca-9d72-ab8e49d51e13':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/37c6f253-06cb-42ca-9d72-ab8e49d51e13/avatar.jpeg',
  '27bccd1d-3309-402e-977b-86be4048fa66':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/27bccd1d-3309-402e-977b-86be4048fa66/avatar.jpeg',
  '6d6517d5-565a-40a7-9f80-6f8d9b9c03cf':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/6d6517d5-565a-40a7-9f80-6f8d9b9c03cf/avatar.jpeg',
  'b2a7e44d-128a-4cf3-9906-097efa8a7c8b':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/b2a7e44d-128a-4cf3-9906-097efa8a7c8b/avatar.png',
  '358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/358eb5f3-d7f9-4228-9b21-4d1c4f2ab3b0/avatar.jpeg',
  'c8fe9419-9049-4a14-a440-38c44ae7be51':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/c8fe9419-9049-4a14-a440-38c44ae7be51/avatar.jpeg',
  'aedc48d6-dc72-4f83-b443-4987fb8ddcaf':
    'https://wjlfvajloxkevggwjgtk.supabase.co/storage/v1/object/public/ad-media/campaigns/profiles/aedc48d6-dc72-4f83-b443-4987fb8ddcaf/avatar.jpeg',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const secret = Deno.env.get('DIRECTORY_BACKFILL_SECRET') || Deno.env.get('MIGRATION_SECRET')
  const provided = req.headers.get('x-backfill-secret') || req.headers.get('x-migration-secret')
  // Allow service-role bearer as alternative auth
  const auth = req.headers.get('Authorization') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const authedBySecret = Boolean(secret && provided === secret)
  const authedByService = Boolean(serviceKey && auth === `Bearer ${serviceKey}`)
  if (!authedBySecret && !authedByService) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const updated: string[] = []
  const failed: { id: string; error: string }[] = []
  for (const [id, photo] of Object.entries(AVATARS)) {
    const { error } = await admin
      .from('profiles')
      .update({ avatar_url: photo, profile_photo: photo })
      .eq('id', id)
    if (error) failed.push({ id, error: error.message })
    else updated.push(id)
  }

  return jsonResponse({ ok: failed.length === 0, updated: updated.length, failed })
})
