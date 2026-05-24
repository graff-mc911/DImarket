import type { AdCampaign } from './types'

/** Фіксовані UUID демо-кампаній з seed-міграцій */
export const DEMO_CAMPAIGN_IDS = new Set([
  'f81e653d-ca9e-4081-a4ca-2a17395e9924',
  '89623059-83ca-4151-9f09-8fcfcb8ed889',
  '0431275c-451e-47ed-a7a7-44167a577a29',
  '1ec41ada-4feb-4a36-b1a9-8494622ea30f',
  '28885e84-4be9-4ba7-8fa8-fac766c5f1f8',
  '807b9715-ddcd-4d1f-b651-711a880a2c77',
  '6097ef50-bb68-4041-b83f-32ecee542aad',
  '69df3b9f-c702-4028-b998-fc3734dc76ed',
  'a1000001-0001-4001-8001-000000000001',
  'a1000002-0002-4002-8002-000000000002',
  'a1000003-0003-4003-8003-000000000003',
  'a1000004-0004-4004-8004-000000000004',
  'a1000005-0005-4005-8005-000000000005',
])

export function isDemoAdCampaign(campaign: AdCampaign): boolean {
  if (DEMO_CAMPAIGN_IDS.has(campaign.id)) return true

  const stripe = campaign.stripe_payment_id || ''
  if (stripe.startsWith('presence_free_') || stripe.startsWith('demo_paid_')) return true

  const note = (campaign.review_note || '').toLowerCase()
  if (note.includes('[demo_brand_advertiser]')) return true
  if (note.includes('presence partner')) return true
  if (note.includes('демо-кампанія')) return true

  return false
}
