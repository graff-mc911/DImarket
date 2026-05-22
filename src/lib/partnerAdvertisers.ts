/**
 * Демо-рекламодавці для брендів на банерах (окремий профіль + кампанія в БД).
 * Запуск: node scripts/seed-brand-advertisers.mjs
 */

export type BrandAdvertiserSeed = {
  slug: string
  profileId: string
  campaignId: string
  email: string
  fullName: string
  website: string
  bio: string
}

export const BRAND_ADVERTISER_SEEDS: BrandAdvertiserSeed[] = [
  {
    slug: 'knauf',
    profileId: 'e1000001-0001-4001-8001-000000000001',
    campaignId: 'f81e653d-ca9e-4081-a4ca-2a17395e9924',
    email: 'knauf.ads@advertisers.dimarket.app',
    fullName: 'Knauf Україна',
    website: 'https://www.knauf.ua',
    bio: '[demo_brand_advertiser] Knauf — BUILD ON US. Гіпсокартон, утеплення, штукатурка MP 75. Кампанію можна видалити в панелі власника.',
  },
  {
    slug: 'dewalt',
    profileId: 'e1000002-0002-4002-8002-000000000002',
    campaignId: '89623059-83ca-4151-9f09-8fcfcb8ed889',
    email: 'dewalt.ads@advertisers.dimarket.app',
    fullName: 'DEWALT Україна',
    website: 'https://www.dewalt.com',
    bio: '[demo_brand_advertiser] Демо-рекламодавець DEWALT. Банер: Guaranteed Tough — інструмент для найважчих робіт.',
  },
  {
    slug: 'festool',
    profileId: 'e1000003-0003-4003-8003-000000000003',
    campaignId: '0431275c-451e-47ed-a7a7-44167a577a29',
    email: 'festool.ads@advertisers.dimarket.app',
    fullName: 'Festool',
    website: 'https://www.festool.com',
    bio: '[demo_brand_advertiser] Демо-рекламодавець Festool. Преміальні інструменти та системи Systainer.',
  },
  {
    slug: 'hilti',
    profileId: 'e1000004-0004-4004-8004-000000000004',
    campaignId: '1ec41ada-4feb-4a36-b1a9-8494622ea30f',
    email: 'hilti.ads@advertisers.dimarket.app',
    fullName: 'Hilti Україна',
    website: 'https://www.hilti.ua',
    bio: '[demo_brand_advertiser] Hilti — OUTPERFORM. OUTLAST. Інструмент, анкери, сервіс для професіоналів.',
  },
  {
    slug: 'gree',
    profileId: 'e1000005-0005-4005-8005-000000000005',
    campaignId: '28885e84-4be9-4ba7-8fa8-fac766c5f1f8',
    email: 'gree.ads@advertisers.dimarket.app',
    fullName: 'GREE Climate',
    website: 'https://www.gree.com',
    bio: '[demo_brand_advertiser] Демо-рекламодавець GREE (центральний блок). Perfect Climate — кондиціонування та комфорт.',
  },
  {
    slug: 'uponor',
    profileId: 'e1000006-0006-4006-8006-000000000006',
    campaignId: '807b9715-ddcd-4d1f-b651-711a880a2c77',
    email: 'uponor.ads@advertisers.dimarket.app',
    fullName: 'Uponor',
    website: 'https://www.uponor.com',
    bio: '[demo_brand_advertiser] Uponor — BUILD ON RELIABILITY. Водопостачання, опалення, охолодження.',
  },
  {
    slug: 'velux',
    profileId: 'e1000007-0007-4007-8007-000000000007',
    campaignId: '6097ef50-bb68-4041-b83f-32ecee542aad',
    email: 'velux.ads@advertisers.dimarket.app',
    fullName: 'VELUX',
    website: 'https://www.velux.com',
    bio: '[demo_brand_advertiser] VELUX — MORE DAYLIGHT. BETTER LIVING. Мансардні вікна та світлові рішення.',
  },
  {
    slug: 'geberit',
    profileId: 'e1000008-0008-4008-8008-000000000008',
    campaignId: '69df3b9f-c702-4028-b998-fc3734dc76ed',
    email: 'geberit.ads@advertisers.dimarket.app',
    fullName: 'Geberit',
    website: 'https://www.geberit.com',
    bio: '[demo_brand_advertiser] Geberit — мистецтво ідеальної ванної кімнати. Інсталяції та зливні системи.',
  },
  {
    slug: 'rockwool',
    profileId: 'e1000009-0009-4009-8009-000000000009',
    campaignId: 'a1000001-0001-4001-8001-000000000001',
    email: 'rockwool.ads@advertisers.dimarket.app',
    fullName: 'ROCKWOOL Україна',
    website: 'https://www.rockwool.ua',
    bio: '[demo_brand_advertiser] Демо-рекламодавець ROCKWOOL.',
  },
  {
    slug: 'ceresit',
    profileId: 'e1000010-0010-4010-8010-000000000010',
    campaignId: 'a1000002-0002-4002-8002-000000000002',
    email: 'ceresit.ads@advertisers.dimarket.app',
    fullName: 'Ceresit (Henkel)',
    website: 'https://www.ceresit.ua',
    bio: '[demo_brand_advertiser] Демо-рекламодавець Ceresit.',
  },
  {
    slug: 'weber',
    profileId: 'e1000011-0011-4011-8011-000000000011',
    campaignId: 'a1000003-0003-4003-8003-000000000003',
    email: 'weber.ads@advertisers.dimarket.app',
    fullName: 'Weber (Saint-Gobain)',
    website: 'https://www.weber.ua',
    bio: '[demo_brand_advertiser] Демо-рекламодавець Weber.',
  },
  {
    slug: 'sika',
    profileId: 'e1000012-0012-4012-8012-000000000012',
    campaignId: 'a1000004-0004-4004-8004-000000000004',
    email: 'sika.ads@advertisers.dimarket.app',
    fullName: 'Sika Україна',
    website: 'https://www.sika.com/ua',
    bio: '[demo_brand_advertiser] Демо-рекламодавець Sika.',
  },
]

export const BRAND_ADVERTISER_BY_CAMPAIGN_ID: Record<string, BrandAdvertiserSeed> = Object.fromEntries(
  BRAND_ADVERTISER_SEEDS.map((b) => [b.campaignId, b]),
)

export const DEMO_ADVERTISER_BIO_TAG = '[demo_brand_advertiser]'
