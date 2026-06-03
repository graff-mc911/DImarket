import type { AdCampaign } from './types'

/**
 * Лише явні тестові кампанії (не партнерські presence_free_* — вони показуються на сайті).
 */
export function isDemoAdCampaign(campaign: AdCampaign): boolean {
  const stripe = campaign.stripe_payment_id || ''
  if (stripe.startsWith('demo_paid_')) return true

  const note = (campaign.review_note || '').toLowerCase()
  if (note.includes('[demo_brand_advertiser]')) return true
  if (note.includes('демо-кампанія')) return true

  return false
}
