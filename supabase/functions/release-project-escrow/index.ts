import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type Body = {
  listing_id: string
  /** Retry Transfer on already-captured escrow (skipped/failed). */
  retry_payout?: boolean
}

const DEFAULT_FEE_BPS = 500

function eurosToCents(euros: number): number {
  return Math.round(Number(euros) * 100)
}

function feeSplit(amountEur: number, feeBps: number) {
  const grossCents = eurosToCents(amountEur)
  const feeCents = Math.min(grossCents, Math.round((grossCents * feeBps) / 10000))
  const transferCents = Math.max(0, grossCents - feeCents)
  return {
    grossCents,
    feeCents,
    transferCents,
    feeEur: feeCents / 100,
    transferEur: transferCents / 100,
  }
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

    const isOwner = listing.author_id === user.id
    const isHired = listing.hired_professional_id === user.id
    if (!isOwner && !(body.retry_payout && isHired)) {
      return jsonResponse({ error: 'Only the project owner can release escrow', code: 'not_owner' }, 403)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' })

    let escrow = (
      await admin
        .from('project_escrows')
        .select('*')
        .eq('listing_id', body.listing_id)
        .eq('status', body.retry_payout ? 'captured' : 'authorized')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data

    if (!escrow && body.retry_payout) {
      // Fallback: any captured with failed/skipped payout
      escrow = (
        await admin
          .from('project_escrows')
          .select('*')
          .eq('listing_id', body.listing_id)
          .eq('status', 'captured')
          .in('payout_status', ['skipped_no_connect', 'failed', 'pending'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    }

    if (!escrow) {
      return jsonResponse({
        ok: true,
        status: 'none',
        message: body.retry_payout
          ? 'No captured escrow awaiting payout'
          : 'No authorized escrow to release',
      })
    }

    if (body.retry_payout) {
      if (escrow.payout_status === 'transferred') {
        return jsonResponse({ ok: true, status: 'captured', payout_status: 'transferred' })
      }
      const payout = await transferToProfessional(stripe, admin, escrow)
      return jsonResponse({
        ok: true,
        status: 'captured',
        escrow_id: escrow.id,
        ...payout,
      })
    }

    if (!escrow.stripe_payment_intent_id) {
      return jsonResponse(
        { error: 'Escrow missing payment intent', code: 'missing_pi' },
        400,
      )
    }

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
        payout_status: 'pending',
      })
      .eq('id', escrow.id)

    escrow = { ...escrow, status: 'captured', released_at: now, payout_status: 'pending' }
    const payout = await transferToProfessional(stripe, admin, escrow)

    try {
      if (listing.hired_professional_id) {
        const payoutLine =
          payout.payout_status === 'transferred'
            ? ` Payout of €${Number(payout.transfer_amount).toFixed(2)} sent to your Connect account.`
            : payout.payout_status === 'skipped_no_connect'
              ? ' Complete Stripe Connect in Settings to receive your payout.'
              : ''
        await admin.rpc('create_notification', {
          p_user_id: listing.hired_professional_id,
          p_type: 'payment',
          p_title: 'Project payment released',
          p_body: `Client completed the project — escrow was captured.${payoutLine}`,
          p_link_path: `/project/${body.listing_id}/manage`,
          p_reference_type: 'listing',
          p_reference_id: body.listing_id,
        })
      }
      await admin.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'payment',
        p_title: 'Escrow released',
        p_body:
          payout.payout_status === 'transferred'
            ? 'Held funds captured; professional payout Transfer sent.'
            : 'Held project funds were released after completion.',
        p_link_path: `/project/${body.listing_id}/manage`,
        p_reference_type: 'listing',
        p_reference_id: body.listing_id,
      })
    } catch (e) {
      console.error('release-project-escrow: notification', e)
    }

    return jsonResponse({
      ok: true,
      status: 'captured',
      escrow_id: escrow.id,
      ...payout,
    })
  } catch (err) {
    console.error('release-project-escrow:', err)
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  }
})

async function transferToProfessional(
  stripe: Stripe,
  admin: ReturnType<typeof createClient>,
  escrow: Record<string, unknown>,
): Promise<{
  payout_status: string
  transfer_amount?: number
  platform_fee_amount?: number
  stripe_transfer_id?: string | null
  payout_error?: string | null
}> {
  const feeBps = Number(
    Deno.env.get('ESCROW_PLATFORM_FEE_BPS') ||
      escrow.platform_fee_bps ||
      DEFAULT_FEE_BPS,
  )
  const split = feeSplit(Number(escrow.amount), feeBps)
  const currency = String(escrow.currency || 'eur').toLowerCase()
  const now = new Date().toISOString()
  const professionalId = String(escrow.professional_id || '')

  const { data: pro } = await admin
    .from('profiles')
    .select(
      'stripe_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted',
    )
    .eq('id', professionalId)
    .maybeSingle()

  const accountId = pro?.stripe_account_id as string | null | undefined
  const ready =
    Boolean(accountId) &&
    Boolean(pro?.stripe_connect_payouts_enabled || pro?.stripe_connect_charges_enabled) &&
    Boolean(pro?.stripe_connect_details_submitted)

  if (!accountId || !ready) {
    await admin
      .from('project_escrows')
      .update({
        platform_fee_bps: feeBps,
        platform_fee_amount: split.feeEur,
        transfer_amount: split.transferEur,
        payout_status: 'skipped_no_connect',
        payout_error: 'Professional has not completed Stripe Connect onboarding',
        updated_at: now,
      })
      .eq('id', escrow.id)
    return {
      payout_status: 'skipped_no_connect',
      transfer_amount: split.transferEur,
      platform_fee_amount: split.feeEur,
      payout_error: 'Professional has not completed Stripe Connect onboarding',
    }
  }

  if (split.transferCents < 1) {
    await admin
      .from('project_escrows')
      .update({
        platform_fee_bps: feeBps,
        platform_fee_amount: split.feeEur,
        transfer_amount: 0,
        payout_status: 'transferred',
        paid_out_at: now,
        updated_at: now,
        payout_error: null,
      })
      .eq('id', escrow.id)
    return {
      payout_status: 'transferred',
      transfer_amount: 0,
      platform_fee_amount: split.feeEur,
    }
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: split.transferCents,
        currency,
        destination: accountId,
        transfer_group: `escrow_${escrow.id}`,
        metadata: {
          escrow_id: String(escrow.id),
          listing_id: String(escrow.listing_id),
          professional_id: professionalId,
          platform_fee_bps: String(feeBps),
        },
      },
      { idempotencyKey: `escrow-transfer-${escrow.id}` },
    )

    await admin
      .from('project_escrows')
      .update({
        platform_fee_bps: feeBps,
        platform_fee_amount: split.feeEur,
        transfer_amount: split.transferEur,
        stripe_transfer_id: transfer.id,
        payout_status: 'transferred',
        paid_out_at: now,
        payout_error: null,
        updated_at: now,
      })
      .eq('id', escrow.id)

    return {
      payout_status: 'transferred',
      transfer_amount: split.transferEur,
      platform_fee_amount: split.feeEur,
      stripe_transfer_id: transfer.id,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('release-project-escrow: transfer failed', message)
    await admin
      .from('project_escrows')
      .update({
        platform_fee_bps: feeBps,
        platform_fee_amount: split.feeEur,
        transfer_amount: split.transferEur,
        payout_status: 'failed',
        payout_error: message.slice(0, 500),
        updated_at: now,
      })
      .eq('id', escrow.id)
    return {
      payout_status: 'failed',
      transfer_amount: split.transferEur,
      platform_fee_amount: split.feeEur,
      payout_error: message,
    }
  }
}
