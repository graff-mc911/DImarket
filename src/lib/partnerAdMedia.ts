import type { AdCampaign } from './types'
import { BRAND_ADVERTISER_BY_CAMPAIGN_ID } from './partnerAdvertisers'

/** Центральний герой — GREE */
export const CENTER_HERO_CAMPAIGN_ID = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8'

/** Верхні бокові слоти — 4 бренди з власними банерами */
export const SIDE_TOP_PARTNER_IDS = [
  'f81e653d-ca9e-4081-a4ca-2a17395e9924', // Knauf
  '89623059-83ca-4151-9f09-8fcfcb8ed889', // DEWALT
  '0431275c-451e-47ed-a7a7-44167a577a29', // Festool
  '1ec41ada-4feb-4a36-b1a9-8494622ea30f', // Hilti
] as const

/** Нижні бокові слоти (3–4 у колонці): Uponor, VELUX, Geberit, GREE */
export const SIDE_BOTTOM_PARTNER_IDS = [
  '807b9715-ddcd-4d1f-b651-711a880a2c77', // Uponor
  '6097ef50-bb68-4041-b83f-32ecee542aad', // VELUX
  '69df3b9f-c702-4028-b998-fc3734dc76ed', // Geberit
  '28885e84-4be9-4ba7-8fa8-fac766c5f1f8', // GREE
] as const

/** Горизонтальний нижній банер у контенті (не бокова колонка) */
export const FOOTER_BANNER_CAMPAIGN_ID = 'a1000005-0005-4005-8005-000000000005'

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
  'a1000005-0005-4005-8005-000000000005': {
    id: FOOTER_BANNER_CAMPAIGN_ID,
    title: 'STRAUSS — професійний одяг та взуття',
    description: 'Професійний одяг і взуття для роботи без компромісів. Доступно на DImarket.app.',
    ...img('/ads/banners/strauss-leaderboard-1200x300.png'),
    link_url: 'https://dimarket.app',
    placements: ['footer', 'home', 'listings', 'home_leaderboard'],
  },
}

const FALLBACK_OWNER_ID = 'b64a9350-4f7e-46bf-8697-d39c02491ad0'

function advertiserIdForCampaign(campaignId: string): string {
  return BRAND_ADVERTISER_BY_CAMPAIGN_ID[campaignId]?.profileId ?? FALLBACK_OWNER_ID
}

export const EXTRA_PARTNER_CAMPAIGNS: AdCampaign[] = [
  {
    id: FOOTER_BANNER_CAMPAIGN_ID,
    advertiser_id: advertiserIdForCampaign(FOOTER_BANNER_CAMPAIGN_ID),
    ...PARTNER_MEDIA_BY_ID[FOOTER_BANNER_CAMPAIGN_ID],
    placement: 'footer',
    geo_scope: 'global',
    country_code: 'UA',
    country_name: 'Україна',
    city_name: null,
    cities: null,
    region_name: null,
    starts_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 120 * 86400000).toISOString(),
    status: 'active',
    impressions: 1850,
    clicks: 58,
    stripe_payment_id: 'presence_free_a1000005',
    price_paid: 128,
    currency_paid: 'eur',
    approved_by: FALLBACK_OWNER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner — Strauss home leaderboard 1200×300',
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
