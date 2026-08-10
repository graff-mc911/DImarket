// ============================================================
// stripeConnect.ts — Express onboarding + payout readiness
// ============================================================

import { supabase } from './supabase'

export type ConnectStatus = {
  connected: boolean
  ready: boolean
  stripe_account_id: string | null
  stripe_connect_charges_enabled: boolean
  stripe_connect_payouts_enabled: boolean
  stripe_connect_details_submitted: boolean
}

export async function fetchConnectStatus(): Promise<ConnectStatus | { error: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-connect', {
    body: { action: 'status' },
  })
  if (error) return { error: error.message || 'Connect status failed' }
  if (data?.error) return { error: String(data.error) }
  return {
    connected: Boolean(data?.connected),
    ready: Boolean(data?.ready),
    stripe_account_id: data?.stripe_account_id ?? null,
    stripe_connect_charges_enabled: Boolean(data?.stripe_connect_charges_enabled),
    stripe_connect_payouts_enabled: Boolean(data?.stripe_connect_payouts_enabled),
    stripe_connect_details_submitted: Boolean(data?.stripe_connect_details_submitted),
  }
}

export async function startConnectOnboarding(opts?: {
  returnPath?: string
  refreshPath?: string
  country?: string
}): Promise<{ url: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-connect', {
    body: {
      action: 'onboard',
      return_path: opts?.returnPath || '/settings?connect=return',
      refresh_path: opts?.refreshPath || '/settings?connect=refresh',
      country: opts?.country || 'ES',
    },
  })
  if (error) return { error: error.message || 'Connect onboard failed' }
  if (data?.error) return { error: String(data.error) }
  if (!data?.url) return { error: 'No onboarding URL' }
  return { url: String(data.url) }
}

export async function openConnectDashboard(): Promise<{ url: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-connect', {
    body: { action: 'login' },
  })
  if (error) return { error: error.message || 'Connect login failed' }
  if (data?.error) return { error: String(data.error) }
  if (!data?.url) return { error: 'No login URL' }
  return { url: String(data.url) }
}

export async function retryEscrowPayout(listingId: string): Promise<
  { ok: true; payout_status: string } | { error: string }
> {
  const { data, error } = await supabase.functions.invoke('release-project-escrow', {
    body: { listing_id: listingId, retry_payout: true },
  })
  if (error) return { error: error.message || 'Retry payout failed' }
  if (data?.error) return { error: String(data.error) }
  return { ok: true, payout_status: String(data?.payout_status || 'pending') }
}

export function connectStatusLabel(status: ConnectStatus | null): string {
  if (!status?.connected) return 'Not connected'
  if (status.ready) return 'Payouts ready'
  return 'Onboarding incomplete'
}
