import type { AdCampaign } from './types'
import { BRAND_ADVERTISER_BY_CAMPAIGN_ID } from './partnerAdvertisers'

/** Центральний герой — GREE */
export const CENTER_HERO_CAMPAIGN_ID = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8'

/** Верхні бокові слоти — інструмент / матеріали */
export const SIDE_TOP_PARTNER_IDS = [
  'f81e653d-ca9e-4081-a4ca-2a17395e9924', // Knauf
  '89623059-83ca-4151-9f09-8fcfcb8ed889', // DEWALT
  '0431275c-451e-47ed-a7a7-44167a577a29', // Festool
  '1ec41ada-4feb-4a36-b1a9-8494622ea30f', // Hilti
  'a1000001-0001-4001-8001-000000000001', // Rockwool
] as const

/** Нижні бокові слоти — сантехніка, вікна, плитка */
export const SIDE_BOTTOM_PARTNER_IDS = [
  '807b9715-ddcd-4d1f-b651-711a880a2c77', // Uponor
  '6097ef50-bb68-4041-b83f-32ecee542aad', // VELUX
  '69df3b9f-c702-4028-b998-fc3734dc76ed', // Geberit
  'a1000002-0002-4002-8002-000000000002', // Ceresit
  'a1000003-0003-4003-8003-000000000003', // Weber
  'a1000004-0004-4004-8004-000000000004', // Sika
] as const

/** @deprecated */
export const SIDE_TOP_VIDEO_IDS = SIDE_TOP_PARTNER_IDS
/** @deprecated */
export const SIDE_BOTTOM_VIDEO_IDS = SIDE_BOTTOM_PARTNER_IDS

export type PartnerMediaPatch = Pick<
  AdCampaign,
  'id' | 'title' | 'description' | 'image_url' | 'media_url' | 'media_type' | 'link_url' | 'placements'
>

/** Локальні банери брендів (public/ads/brands/*.png, ~16:9) */
function brandBanner(slug: string) {
  return img(`/ads/brands/${slug}.png`)
}

/** Статичне фото (без відео / YouTube) */
function img(url: string) {
  return {
    image_url: url,
    media_url: url,
    media_type: 'image' as const,
  }
}

export const PARTNER_MEDIA_BY_ID: Record<string, PartnerMediaPatch> = {
  'f81e653d-ca9e-4081-a4ca-2a17395e9924': {
    id: 'f81e653d-ca9e-4081-a4ca-2a17395e9924',
    title: 'Knauf — BUILD ON US',
    description:
      'Системи гіпсокартону, утеплення та універсальна штукатурка MP 75 для будь-якого об\'єкта. Будуйте на надійних матеріалах Knauf — знайдіть на DImarket.app.',
    ...brandBanner('knauf'),
    link_url: 'https://www.knauf.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '89623059-83ca-4151-9f09-8fcfcb8ed889': {
    id: '89623059-83ca-4151-9f09-8fcfcb8ed889',
    title: 'DEWALT — GUARANTEED TOUGH',
    description:
      'Високопродуктивний акумуляторний інструмент XR для найважчих задач на об\'єкті: потужність, міцність і витривалість. Доступно на DImarket.app.',
    ...brandBanner('dewalt'),
    link_url: 'https://www.dewalt.com',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '0431275c-451e-47ed-a7a7-44167a577a29': {
    id: '0431275c-451e-47ed-a7a7-44167a577a29',
    title: 'Festool — BUILT BETTER TO BUILD BETTER',
    description:
      'Преміальні інструменти та системи Systainer: точність, сумісність, довговічність і чиста робоча зона. Знайдіть на DImarket.app.',
    ...brandBanner('festool'),
    link_url: 'https://www.festool.com',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '1ec41ada-4feb-4a36-b1a9-8494622ea30f': {
    id: '1ec41ada-4feb-4a36-b1a9-8494622ea30f',
    title: 'Hilti — OUTPERFORM. OUTLAST.',
    description:
      'Інструмент і сервіс для професіоналів: перфоратори TE 6-22, анкери та інновації Hilti на будмайданчику. Дивіться пропозиції на DImarket.app.',
    ...brandBanner('hilti'),
    link_url: 'https://www.hilti.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '28885e84-4be9-4ba7-8fa8-fac766c5f1f8': {
    id: CENTER_HERO_CAMPAIGN_ID,
    title: 'GREE — PERFECT CLIMATE',
    description:
      'Клімат-контроль нового рівня: енергозбереження, тиха робота, розумне керування Wi‑Fi та швидке охолодження. Комфорт цілий рік — на DImarket.app.',
    ...brandBanner('gree'),
    link_url: 'https://www.gree.com',
    placements: ['home', 'home_center', 'sidebar', 'listings', 'footer'],
  },
  '807b9715-ddcd-4d1f-b651-711a880a2c77': {
    id: '807b9715-ddcd-4d1f-b651-711a880a2c77',
    title: 'Uponor — BUILD ON RELIABILITY',
    description:
      'Інтелектуальні рішення для водопостачання, опалення та охолодження: колектори, труби та монтажні системи Uponor. Знайдіть на DImarket.app.',
    ...brandBanner('uponor'),
    link_url: 'https://www.uponor.com',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  '6097ef50-bb68-4041-b83f-32ecee542aad': {
    id: '6097ef50-bb68-4041-b83f-32ecee542aad',
    title: 'VELUX — MORE DAYLIGHT. BETTER LIVING.',
    description:
      'Мансардні вікна та світлові рішення для більшого денного світла, комфорту та енергоефективності вдома. Обирайте на DImarket.app.',
    ...brandBanner('velux'),
    link_url: 'https://www.velux.com',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  '69df3b9f-c702-4028-b998-fc3734dc76ed': {
    id: '69df3b9f-c702-4028-b998-fc3734dc76ed',
    title: 'Geberit — THE ART OF BATHROOM PERFECTION',
    description:
      'Інноваційні інсталяції, зливні системи та дизайн ванних кімнат: функціональність, естетика та економія води. Деталі на DImarket.app.',
    ...brandBanner('geberit'),
    link_url: 'https://www.geberit.com',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  'a1000001-0001-4001-8001-000000000001': {
    id: 'a1000001-0001-4001-8001-000000000001',
    title: 'ROCKWOOL — енергоефективність і вогнестійкість',
    description:
      'Кам\'яна вата для фасадів, дахів і акустики: негорюча теплоізоляція та комфорт у будинку. Дивіться на DImarket.app.',
    ...brandBanner('rockwool'),
    link_url: 'https://www.rockwool.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  'a1000002-0002-4002-8002-000000000002': {
    id: 'a1000002-0002-4002-8002-000000000002',
    title: 'Ceresit — системи облицювання та фасадів',
    description:
      'Клеї, затирки, гідроізоляція та ETICS Ceresit (Henkel) для професійного ремонту й фасадів. Знайдіть на DImarket.app.',
    ...brandBanner('ceresit'),
    link_url: 'https://www.ceresit.ua',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  'a1000003-0003-4003-8003-000000000003': {
    id: 'a1000003-0003-4003-8003-000000000003',
    title: 'Weber — сухі будівельні суміші',
    description:
      'Штукатурки, клеї та фасадні рішення Weber (Saint-Gobain) для професійного будівництва.',
    ...img('https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=560&fit=crop&q=85'),
    link_url: 'https://www.weber.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  'a1000004-0004-4004-8004-000000000004': {
    id: 'a1000004-0004-4004-8004-000000000004',
    title: 'Sika — надійні будівельні системи',
    description:
      'Гідроізоляція, добавки в бетон, герметики та рішення для фундаментів і промислових підлог. Деталі на DImarket.app.',
    ...brandBanner('sika'),
    link_url: 'https://www.sika.com/ua',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
}

const FALLBACK_OWNER_ID = 'b64a9350-4f7e-46bf-8697-d39c02491ad0'

function advertiserIdForCampaign(campaignId: string): string {
  return BRAND_ADVERTISER_BY_CAMPAIGN_ID[campaignId]?.profileId ?? FALLBACK_OWNER_ID
}

export const EXTRA_PARTNER_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'a1000001-0001-4001-8001-000000000001',
    advertiser_id: advertiserIdForCampaign('a1000001-0001-4001-8001-000000000001'),
    ...PARTNER_MEDIA_BY_ID['a1000001-0001-4001-8001-000000000001'],
    placement: 'sidebar',
    geo_scope: 'global',
    country_code: 'UA',
    country_name: 'Україна',
    city_name: null,
    cities: null,
    region_name: null,
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    ends_at: new Date(Date.now() + 120 * 86400000).toISOString(),
    status: 'active',
    impressions: 2100,
    clicks: 68,
    stripe_payment_id: 'presence_free_a1000001',
    price_paid: 135,
    currency_paid: 'eur',
    approved_by: FALLBACK_OWNER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner — image',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
  {
    id: 'a1000002-0002-4002-8002-000000000002',
    advertiser_id: advertiserIdForCampaign('a1000002-0002-4002-8002-000000000002'),
    ...PARTNER_MEDIA_BY_ID['a1000002-0002-4002-8002-000000000002'],
    placement: 'home',
    geo_scope: 'global',
    country_code: 'UA',
    country_name: 'Україна',
    city_name: null,
    cities: null,
    region_name: null,
    starts_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 120 * 86400000).toISOString(),
    status: 'active',
    impressions: 1780,
    clicks: 55,
    stripe_payment_id: 'presence_free_a1000002',
    price_paid: 125,
    currency_paid: 'eur',
    approved_by: FALLBACK_OWNER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
  {
    id: 'a1000003-0003-4003-8003-000000000003',
    advertiser_id: advertiserIdForCampaign('a1000003-0003-4003-8003-000000000003'),
    ...PARTNER_MEDIA_BY_ID['a1000003-0003-4003-8003-000000000003'],
    placement: 'listings',
    geo_scope: 'global',
    country_code: 'UA',
    country_name: 'Україна',
    city_name: null,
    cities: null,
    region_name: null,
    starts_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 120 * 86400000).toISOString(),
    status: 'active',
    impressions: 1650,
    clicks: 49,
    stripe_payment_id: 'presence_free_a1000003',
    price_paid: 115,
    currency_paid: 'eur',
    approved_by: FALLBACK_OWNER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
  {
    id: 'a1000004-0004-4004-8004-000000000004',
    advertiser_id: advertiserIdForCampaign('a1000004-0004-4004-8004-000000000004'),
    ...PARTNER_MEDIA_BY_ID['a1000004-0004-4004-8004-000000000004'],
    placement: 'home',
    geo_scope: 'global',
    country_code: 'UA',
    country_name: 'Україна',
    city_name: null,
    cities: null,
    region_name: null,
    starts_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 120 * 86400000).toISOString(),
    status: 'active',
    impressions: 1920,
    clicks: 61,
    stripe_payment_id: 'presence_free_a1000004',
    price_paid: 105,
    currency_paid: 'eur',
    approved_by: FALLBACK_OWNER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
]

export function applyPartnerMediaOverride<T extends AdCampaign>(campaign: T): T {
  const patch = PARTNER_MEDIA_BY_ID[campaign.id]
  const brandAdvertiser = BRAND_ADVERTISER_BY_CAMPAIGN_ID[campaign.id]
  if (!patch) return campaign
  return {
    ...campaign,
    ...patch,
    advertiser_id: brandAdvertiser?.profileId ?? campaign.advertiser_id,
    placement: campaign.placement,
    placements: patch.placements ?? campaign.placements,
  }
}

export function mergeExtraPartnerCampaigns<T extends AdCampaign>(campaigns: T[]): T[] {
  const ids = new Set(campaigns.map((c) => c.id))
  const extras = EXTRA_PARTNER_CAMPAIGNS.filter((c) => !ids.has(c.id)) as T[]
  return [...campaigns.map(applyPartnerMediaOverride), ...extras.map(applyPartnerMediaOverride)]
}
