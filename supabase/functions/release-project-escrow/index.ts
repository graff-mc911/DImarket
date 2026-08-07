import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  listing_id: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return jsonResponse({ error: 'STRIPE_SECRET_KEY is not configured' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = (await req.json()) as Body
    if (!body.listing_id) {
      return jsonResponse({ error: 'listing_id is required' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: listing } = await admin
      .from('listings')
      .select('id, author_id, hired_professional_id, title')
      .eq('id', body.listing_id)
      .maybeSingle()

    if (!listing) {
      return jsonResponse({ error: 'Project not found', code: 'not_found' }, 404)
    }
    if (listing.author_id !== user.id) {
      return jsonResponse({ error: 'Only the project owner can release escrow', code: 'not_owner' }, 403)
    }

    const { data: escrow } = await admin
      .from('project_escrows')
      .select('*')
      .eq('listing_id', body.listing_id)
      .eq('status', 'authorized')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!escrow) {
      return jsonResponse({ ok: true, status: 'none', message: 'No authorized escrow to release' })
    }

    if (!escrow.stripe_payment_intent_id) {
      return jsonResponse(
        { error: 'Escrow missing payment intent', code: 'missing_pi' },
        400,
      )
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })
    const pi = await stripe.paymentIntents.retrieve(escrow.stripe_payment_intent_id)

    if (pi.status === 'requires_capture') {
      await stripe.paymentIntents.capture(escrow.stripe_payment_intent_id)
    } else if (pi.status !== 'succeeded') {
      return jsonResponse(
        {
          error: `PaymentIntent status is ${pi.status}, cannot capture`,
          code: 'invalid_pi_status',
        },
        400,
      )
    }

    const now = new Date().toISOString()
    await admin
      .from('project_escrows')
      .update({
        status: 'captured',
        released_at: now,
        updated_at: now,
      })
      .eq('id', escrow.id)

    try {
      if (listing.hired_professional_id) {
        await admin.rpc('create_notification', {
          p_user_id: listing.hired_professional_id,
          p_type: 'payment',
          p_title: 'Project payment released',
          p_body: 'Client completed the project — escrow funds were captured by the platform.',
          p_link_path: `/project/${body.listing_id}/manage`,
          p_reference_type: 'listing',
          p_reference_id: body.listing_id,
        })
      }
      await admin.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'payment',
        p_title: 'Escrow released',
        p_body: 'Held project funds were released after completion.',
        p_link_path: `/project/${body.listing_id}/manage`,
        p_reference_type: 'listing',
        p_reference_id: body.listing_id,
      })
    } catch (e) {
      console.error('release-project-escrow: notification', e)
    }

    return jsonResponse({ ok: true, status: 'captured', escrow_id: escrow.id })
  } catch (err) {
    console.error('release-project-escrow:', err)
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  }
})
