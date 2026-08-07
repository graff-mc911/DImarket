// ============================================================
// projectEscrow.ts — Quote-total hold (authorize) → release (capture)
// ============================================================

import { supabase } from './supabase'
import { createCheckoutSession, eurosToCents } from './stripe'

export type EscrowStatus =
  | 'pending_checkout'
  | 'authorized'
  | 'captured'
  | 'canceled'
  | 'refunded'

export type ProjectEscrow = {
  id: string
  listing_id: string
  quote_id: string | null
  customer_id: string
  professional_id: string
  amount: number
  currency: string
  status: EscrowStatus
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  authorized_at: string | null
  released_at: string | null
  created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const ESCROW_COLS =
  'id, listing_id, quote_id, customer_id, professional_id, amount, currency, status, stripe_session_id, stripe_payment_intent_id, authorized_at, released_at, created_at'

export async function fetchActiveEscrow(listingId: string): Promise<ProjectEscrow | null> {
  const { data, error } = await db
    .from('project_escrows')
    .select(ESCROW_COLS)
    .eq('listing_id', listingId)
    .in('status', ['pending_checkout', 'authorized'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('fetchActiveEscrow:', error.message)
    return null
  }
  return data as ProjectEscrow | null
}

export async function fetchLatestEscrow(listingId: string): Promise<ProjectEscrow | null> {
  const { data, error } = await db
    .from('project_escrows')
    .select(ESCROW_COLS)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('fetchLatestEscrow:', error.message)
    return null
  }
  return data as ProjectEscrow | null
}

/** Create pending escrow row (or reuse active) and open Stripe Checkout with manual capture. */
export async function startProjectEscrowCheckout(opts: {
  listingId: string
  customerId: string
  professionalId: string
  quoteId: string
  amountEur: number
  currency?: string
  projectTitle?: string
}): Promise<{ url: string; escrowId: string } | { error: string }> {
  const amount = Number(opts.amountEur)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Invalid escrow amount' }
  }
  const currency = (opts.currency || 'EUR').toUpperCase()

  let escrow = await fetchActiveEscrow(opts.listingId)
  if (escrow?.status === 'authorized') {
    return { error: 'Funds are already held for this project' }
  }

  if (!escrow) {
    const { data: inserted, error: insErr } = await db
      .from('project_escrows')
      .insert({
        listing_id: opts.listingId,
        quote_id: opts.quoteId,
        customer_id: opts.customerId,
        professional_id: opts.professionalId,
        amount,
        currency,
        status: 'pending_checkout',
      })
      .select(ESCROW_COLS)
      .maybeSingle()

    if (insErr || !inserted) {
      escrow = await fetchActiveEscrow(opts.listingId)
      if (!escrow || escrow.status === 'authorized') {
        return { error: insErr?.message || 'Could not create escrow' }
      }
    } else {
      escrow = inserted as ProjectEscrow
    }
  }

  const origin = window.location.origin
  const title = (opts.projectTitle || 'Project').slice(0, 80)

  try {
    const session = await createCheckoutSession({
      payment_type: 'project_escrow',
      reference_id: escrow!.id,
      user_id: opts.customerId,
      amount: eurosToCents(amount),
      currency: currency.toLowerCase(),
      description: `Project escrow hold — ${title}`,
      success_url: `${origin}/checkout?escrow=1&listing=${opts.listingId}`,
      cancel_url: `${origin}/project/${opts.listingId}/manage`,
    })

    await db
      .from('project_escrows')
      .update({
        stripe_session_id: session.session_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrow!.id)

    return { url: session.url, escrowId: escrow!.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/** Capture authorized PaymentIntent after project completion. */
export async function releaseProjectEscrow(listingId: string): Promise<
  { ok: true; status: string } | { error: string; code?: string }
> {
  const { data, error } = await supabase.functions.invoke('release-project-escrow', {
    body: { listing_id: listingId },
  })

  if (error) return { error: error.message || 'Release failed' }
  if (data?.error) return { error: String(data.error), code: data.code }
  return { ok: true, status: String(data?.status || 'captured') }
}

export function escrowStatusLabel(status: EscrowStatus | string | null | undefined): string {
  switch (status) {
    case 'pending_checkout':
      return 'Awaiting card hold'
    case 'authorized':
      return 'Funds held'
    case 'captured':
      return 'Funds released'
    case 'canceled':
      return 'Canceled'
    case 'refunded':
      return 'Refunded'
    default:
      return 'No escrow'
  }
}
