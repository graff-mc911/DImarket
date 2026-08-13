import { supabase } from './supabase'

/** Public URL of the SCB Light app (invoices, field calculator). */
export const SCB_LIGHT_URL =
  (import.meta.env.VITE_SCB_LIGHT_URL as string | undefined)?.trim() ||
  'https://scblight.com'

export type ScbLinkStatus = 'provisioned' | 'existing_email' | 'failed' | null

export type ScbLinkRecord = {
  status: ScbLinkStatus
  scb_user_id: string | null
}

/** Whether auto-provision applies (masters & companies only). */
export function shouldProvisionScbAccount(role: string | null | undefined): boolean {
  return role === 'professional' || role === 'company'
}

/** Fire-and-forget: create mirror account on SCB Light Supabase (same email + password when provided). */
export function provisionScbAccount(payload: {
  password?: string
  fullName?: string
}): void {
  void supabase.functions
    .invoke<{ ok: boolean; error?: string }>('provision-scb-account', {
      body: payload,
    })
    .catch(() => {})
}

/** Call after register/login for masters & companies. */
export function triggerScbProvisionForPro(
  role: string | null | undefined,
  payload: { password?: string; fullName?: string },
): void {
  if (!shouldProvisionScbAccount(role)) return
  provisionScbAccount(payload)
}

export async function fetchScbLinkStatus(userId: string): Promise<ScbLinkRecord | null> {
  const { data, error } = await supabase
    .from('scb_account_links')
    .select('status, scb_user_id')
    .eq('dimarket_user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return {
    status: data.status as ScbLinkStatus,
    scb_user_id: data.scb_user_id,
  }
}
