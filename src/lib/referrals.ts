import { supabase } from './supabase'

const REFERRAL_DAYS = 14

export async function ensureReferralCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('ensure_referral_code', {
    p_user_id: userId,
  })

  if (error) {
    console.error('ensure_referral_code:', error.message)
    return null
  }

  return typeof data === 'string' ? data : null
}

export async function applyReferralCode(
  code: string,
  referredUserId: string,
): Promise<boolean> {
  const trimmed = code.trim()
  if (!trimmed) return false

  const { data, error } = await supabase.rpc('apply_referral_code', {
    p_code: trimmed,
    p_referred_user_id: referredUserId,
  })

  if (error) {
    console.error('apply_referral_code:', error.message)
    return false
  }

  return data === true
}

export function buildReferralLink(code: string, role: 'professional' | 'company' = 'professional'): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://dimarket.app'
  return `${origin}/register?role=${role}&ref=${encodeURIComponent(code)}`
}

export function referralBoostDays(): number {
  return REFERRAL_DAYS
}

export async function fetchReferralStats(userId: string): Promise<{
  code: string | null
  inviteCount: number
}> {
  const { data: codeRow } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .maybeSingle()

  const { count } = await supabase
    .from('referral_redemptions')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId)

  return {
    code: codeRow?.code ?? null,
    inviteCount: count ?? 0,
  }
}
