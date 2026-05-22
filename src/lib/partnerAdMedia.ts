import type { AdCampaign } from './types'
import { youtubePosterUrl } from './youtubeMedia'

/** Центральний герой — одна анімована картка Baumit */
export const CENTER_HERO_CAMPAIGN_ID = '28885e84-4be9-4ba7-8fa8-fac766c5f1f8'

/** Оновлення медіа партнерів — офіційні ролики YouTube + фото за темою */
export type PartnerMediaPatch = Pick<
  AdCampaign,
  'id' | 'title' | 'description' | 'image_url' | 'media_url' | 'media_type' | 'link_url' | 'placements'
>

function yt(id: string) {
  return {
    media_url: `youtube:${id}`,
    image_url: youtubePosterUrl(id),
    media_type: 'video' as const,
  }
}

export const PARTNER_MEDIA_BY_ID: Record<string, PartnerMediaPatch> = {
  'f81e653d-ca9e-4081-a4ca-2a17395e9924': {
    id: 'f81e653d-ca9e-4081-a4ca-2a17395e9924',
    title: 'Knauf — мінеральна вата та фасадні системи',
    description:
      'Теплоізоляція, гіпсокартон і ETICS для ремонту та новобудов. Офіційні системи Knauf для України.',
    ...yt('7_z3SATrJek'),
    link_url: 'https://www.knauf.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '89623059-83ca-4151-9f09-8fcfcb8ed889': {
    id: '89623059-83ca-4151-9f09-8fcfcb8ed889',
    title: 'Bosch Professional — акумуляторний інструмент',
    description:
      'Дрилі, шуруповерти, лазерні нівеліри та сервіс Bosch для монтажників на об\'єкті.',
    ...yt('aLZKM7gMUgc'),
    link_url: 'https://www.bosch-professional.com/ua/uk',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '0431275c-451e-47ed-a7a7-44167a577a29': {
    id: '0431275c-451e-47ed-a7a7-44167a577a29',
    title: 'Würth — кріплення та витратні матеріали',
    description:
      'Анкери, дюбелі, хімічні кріплення та доставка на будмайданчик одним постачальником.',
    ...yt('Zu7Oq8EYX18'),
    link_url: 'https://www.wurth.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '1ec41ada-4feb-4a36-b1a9-8494622ea30f': {
    id: '1ec41ada-4feb-4a36-b1a9-8494622ea30f',
    title: 'Hilti — перфоратори та алмазне свердління',
    description:
      'Професійний інструмент, анкери та оренда обладнання Hilti для підрядників.',
    ...yt('uDDY3NH903E'),
    link_url: 'https://www.hilti.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  '28885e84-4be9-4ba7-8fa8-fac766c5f1f8': {
    id: CENTER_HERO_CAMPAIGN_ID,
    title: 'Baumit — декоративні штукатурки та ETICS',
    description:
      'Фасадні системи, утеплення та фінішні покриття Baumit для житла і комерції.',
    ...yt('sDILnOsyei8'),
    link_url: 'https://www.baumit.ua',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  '807b9715-ddcd-4d1f-b651-711a880a2c77': {
    id: '807b9715-ddcd-4d1f-b651-711a880a2c77',
    title: 'Uponor — труби PEX та опалення',
    description: 'Системи водопостачання, теплої підлоги та монтажні комплекти Uponor.',
    image_url:
      'https://images.unsplash.com/photo-1585704032915-8ig20df24b8e?w=900&h=560&fit=crop&q=85',
    media_url:
      'https://images.unsplash.com/photo-1585704032915-8ig20df24b8e?w=900&h=560&fit=crop&q=85',
    media_type: 'image',
    link_url: 'https://www.uponor.com',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  '6097ef50-bb68-4041-b83f-32ecee542aad': {
    id: '6097ef50-bb68-4041-b83f-32ecee542aad',
    title: 'VELUX — мансардні вікна та світлові тунелі',
    description: 'Вікна, жалюзі та монтажні комплекти для дахів і мансард.',
    image_url:
      'https://images.unsplash.com/photo-1632776043539-6aedd71a6190?w=900&h=560&fit=crop&q=85',
    media_url:
      'https://images.unsplash.com/photo-1632776043539-6aedd71a6190?w=900&h=560&fit=crop&q=85',
    media_type: 'image',
    link_url: 'https://www.velux.com',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  '69df3b9f-c702-4028-b998-fc3734dc76ed': {
    id: '69df3b9f-c702-4028-b998-fc3734dc76ed',
    title: 'Geberit — інсталяції та зливні системи',
    description:
      'Сховані інсталяції, зливні арматури та рішення для ванних кімнат у новобудовах.',
    image_url:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=560&fit=crop&q=85',
    media_url:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&h=560&fit=crop&q=85',
    media_type: 'image',
    link_url: 'https://www.geberit.com',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  'a1000001-0001-4001-8001-000000000001': {
    id: 'a1000001-0001-4001-8001-000000000001',
    title: 'Rockwool — кам\'яна вата ROCKWOOL',
    description:
      'Негорюча теплоізоляція для фасадів, дахів і перегородок. Рішення ROCKWOOL для енергоефективності.',
    ...yt('vWpigXOjDQc'),
    link_url: 'https://www.rockwool.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  'a1000002-0002-4002-8002-000000000002': {
    id: 'a1000002-0002-4002-8002-000000000002',
    title: 'Ceresit — плиткові клеї та затирки',
    description:
      'Системи Ceresit для облицювання, гідроізоляції та фасадів. Підтримка майстрів на об\'єкті.',
    image_url:
      'https://images.unsplash.com/photo-1625296316570-025e4c02e816?w=900&h=560&fit=crop&q=85',
    media_url:
      'https://images.unsplash.com/photo-1625296316570-025e4c02e816?w=900&h=560&fit=crop&q=85',
    media_type: 'image',
    link_url: 'https://www.ceresit.ua',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
  'a1000003-0003-4003-8003-000000000003': {
    id: 'a1000003-0003-4003-8003-000000000003',
    title: 'Weber — сухі будівельні суміші',
    description:
      'Штукатурки, клеї та фасадні рішення Weber (Saint-Gobain) для професійного будівництва.',
    image_url:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=560&fit=crop&q=85',
    media_url:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=560&fit=crop&q=85',
    media_type: 'image',
    link_url: 'https://www.weber.ua',
    placements: ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer'],
  },
  'a1000004-0004-4004-8004-000000000004': {
    id: 'a1000004-0004-4004-8004-000000000004',
    title: 'Sika — гідроізоляція та добавки в бетон',
    description: 'Рішення Sika для фундаментів, підвалів, швів та промислових підлог.',
    image_url:
      'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=900&h=560&fit=crop&q=85',
    media_url:
      'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=900&h=560&fit=crop&q=85',
    media_type: 'image',
    link_url: 'https://www.sika.com/ua',
    placements: ['home', 'sidebar', 'listings', 'footer'],
  },
}

const PARTNER_ADVERTISER_ID = 'b64a9350-4f7e-46bf-8697-d39c02491ad0'

/** Додаткові бренди (якщо INSERT у БД ще не виконували) */
export const EXTRA_PARTNER_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'a1000001-0001-4001-8001-000000000001',
    advertiser_id: PARTNER_ADVERTISER_ID,
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
    approved_by: PARTNER_ADVERTISER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner — video side rail',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
  {
    id: 'a1000002-0002-4002-8002-000000000002',
    advertiser_id: PARTNER_ADVERTISER_ID,
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
    approved_by: PARTNER_ADVERTISER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
  {
    id: 'a1000003-0003-4003-8003-000000000003',
    advertiser_id: PARTNER_ADVERTISER_ID,
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
    approved_by: PARTNER_ADVERTISER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
  {
    id: 'a1000004-0004-4004-8004-000000000004',
    advertiser_id: PARTNER_ADVERTISER_ID,
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
    approved_by: PARTNER_ADVERTISER_ID,
    approved_at: new Date().toISOString(),
    review_note: 'Presence partner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as AdCampaign,
]

export function applyPartnerMediaOverride<T extends AdCampaign>(campaign: T): T {
  const patch = PARTNER_MEDIA_BY_ID[campaign.id]
  if (!patch) return campaign
  return {
    ...campaign,
    ...patch,
    placement: campaign.placement,
    placements: patch.placements ?? campaign.placements,
  }
}

export function mergeExtraPartnerCampaigns<T extends AdCampaign>(campaigns: T[]): T[] {
  const ids = new Set(campaigns.map((c) => c.id))
  const extras = EXTRA_PARTNER_CAMPAIGNS.filter((c) => !ids.has(c.id)) as T[]
  return [...campaigns.map(applyPartnerMediaOverride), ...extras.map(applyPartnerMediaOverride)]
}
