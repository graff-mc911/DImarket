/**
 * Створює профілі-рекламодавців для брендів на банерах + привʼязує кампанії.
 *
 * Потрібно в .env.local:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Запуск: node scripts/seed-brand-advertisers.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

/** Дані синхронізовані з src/lib/partnerAdvertisers.ts та partnerAdMedia.ts */
const SITE = process.env.PUBLIC_SITE_URL || 'https://dimarket.app'
const brandImg = (slug) => `${SITE}/ads/brands/${slug}.png`

const BRANDS = [
  {
    slug: 'knauf',
    profileId: 'e1000001-0001-4001-8001-000000000001',
    campaignId: 'f81e653d-ca9e-4081-a4ca-2a17395e9924',
    email: 'knauf.ads@advertisers.dimarket.app',
    fullName: 'Knauf Україна',
    website: 'https://www.knauf.ua',
    title: 'Knauf — BUILD ON US',
    description:
      'Системи гіпсокартону, утеплення та універсальна штукатурка MP 75 для будь-якого об\'єкта. Будуйте на надійних матеріалах Knauf — знайдіть на DImarket.app.',
    image: brandImg('knauf'),
    link: 'https://www.knauf.ua',
    placement: 'sidebar',
  },
  {
    slug: 'dewalt',
    profileId: 'e1000002-0002-4002-8002-000000000002',
    campaignId: '89623059-83ca-4151-9f09-8fcfcb8ed889',
    email: 'dewalt.ads@advertisers.dimarket.app',
    fullName: 'DEWALT Україна',
    website: 'https://www.dewalt.com',
    title: 'DEWALT — GUARANTEED TOUGH',
    description:
      'Високопродуктивний акумуляторний інструмент XR для найважчих задач на об\'єкті: потужність, міцність і витривалість. Доступно на DImarket.app.',
    image: brandImg('dewalt'),
    link: 'https://www.dewalt.com',
    placement: 'home',
  },
  {
    slug: 'festool',
    profileId: 'e1000003-0003-4003-8003-000000000003',
    campaignId: '0431275c-451e-47ed-a7a7-44167a577a29',
    email: 'festool.ads@advertisers.dimarket.app',
    fullName: 'Festool',
    website: 'https://www.festool.com',
    title: 'Festool — BUILT BETTER TO BUILD BETTER',
    description:
      'Преміальні інструменти та системи Systainer: точність, сумісність, довговічність і чиста робоча зона. Знайдіть на DImarket.app.',
    image: brandImg('festool'),
    link: 'https://www.festool.com',
    placement: 'sidebar',
  },
  {
    slug: 'hilti',
    profileId: 'e1000004-0004-4004-8004-000000000004',
    campaignId: '1ec41ada-4feb-4a36-b1a9-8494622ea30f',
    email: 'hilti.ads@advertisers.dimarket.app',
    fullName: 'Hilti Україна',
    website: 'https://www.hilti.ua',
    title: 'Hilti — OUTPERFORM. OUTLAST.',
    description:
      'Інструмент і сервіс для професіоналів: перфоратори TE 6-22, анкери та інновації Hilti на будмайданчику. Дивіться пропозиції на DImarket.app.',
    image: brandImg('hilti'),
    link: 'https://www.hilti.ua',
    placement: 'sidebar',
  },
  {
    slug: 'gree',
    profileId: 'e1000005-0005-4005-8005-000000000005',
    campaignId: '28885e84-4be9-4ba7-8fa8-fac766c5f1f8',
    email: 'gree.ads@advertisers.dimarket.app',
    fullName: 'GREE Climate',
    website: 'https://www.gree.com',
    title: 'GREE — PERFECT CLIMATE',
    description:
      'Клімат-контроль нового рівня: енергозбереження, тиха робота, розумне керування Wi‑Fi та швидке охолодження. Комфорт цілий рік — на DImarket.app.',
    image: brandImg('gree'),
    link: 'https://www.gree.com',
    placement: 'footer',
  },
  {
    slug: 'uponor',
    profileId: 'e1000006-0006-4006-8006-000000000006',
    campaignId: '807b9715-ddcd-4d1f-b651-711a880a2c77',
    email: 'uponor.ads@advertisers.dimarket.app',
    fullName: 'Uponor',
    website: 'https://www.uponor.com',
    title: 'Uponor — BUILD ON RELIABILITY',
    description:
      'Інтелектуальні рішення для водопостачання, опалення та охолодження: колектори, труби та монтажні системи Uponor. Знайдіть на DImarket.app.',
    image: brandImg('uponor'),
    link: 'https://www.uponor.com',
    placement: 'sidebar',
  },
  {
    slug: 'velux',
    profileId: 'e1000007-0007-4007-8007-000000000007',
    campaignId: '6097ef50-bb68-4041-b83f-32ecee542aad',
    email: 'velux.ads@advertisers.dimarket.app',
    fullName: 'VELUX',
    website: 'https://www.velux.com',
    title: 'VELUX — MORE DAYLIGHT. BETTER LIVING.',
    description:
      'Мансардні вікна та світлові рішення для більшого денного світла, комфорту та енергоефективності вдома. Обирайте на DImarket.app.',
    image: brandImg('velux'),
    link: 'https://www.velux.com',
    placement: 'home',
  },
  {
    slug: 'geberit',
    profileId: 'e1000008-0008-4008-8008-000000000008',
    campaignId: '69df3b9f-c702-4028-b998-fc3734dc76ed',
    email: 'geberit.ads@advertisers.dimarket.app',
    fullName: 'Geberit',
    website: 'https://www.geberit.com',
    title: 'Geberit — THE ART OF BATHROOM PERFECTION',
    description:
      'Інноваційні інсталяції, зливні системи та дизайн ванних кімнат: функціональність, естетика та економія води. Деталі на DImarket.app.',
    image: brandImg('geberit'),
    link: 'https://www.geberit.com',
    placement: 'sidebar',
  },
  {
    slug: 'rockwool',
    profileId: 'e1000009-0009-4009-8009-000000000009',
    campaignId: 'a1000001-0001-4001-8001-000000000001',
    email: 'rockwool.ads@advertisers.dimarket.app',
    fullName: 'ROCKWOOL Україна',
    website: 'https://www.rockwool.ua',
    title: 'ROCKWOOL — більше комфорту. Краща ізоляція.',
    description:
      'Кам\'яна вата ROCKWOOL для фасадів, дахів і перегородок: вогнестійкість, акустика та енергоефективність. Знайдіть на DImarket.app.',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=560&fit=crop&q=85',
    link: 'https://www.rockwool.ua',
    placement: 'sidebar',
  },
  {
    slug: 'ceresit',
    profileId: 'e1000010-0010-4010-8010-000000000010',
    campaignId: 'a1000002-0002-4002-8002-000000000002',
    email: 'ceresit.ads@advertisers.dimarket.app',
    fullName: 'Ceresit (Henkel)',
    website: 'https://www.ceresit.ua',
    title: 'Ceresit — Build on quality',
    description:
      'Системи Ceresit (Henkel): плиткові клеї, затирки, гідроізоляція та ETICS. Надійні рішення для майстрів — DImarket.app.',
    image:
      'https://images.unsplash.com/photo-1625296316570-025e4c02e816?w=900&h=560&fit=crop&q=85',
    link: 'https://www.ceresit.ua',
    placement: 'home',
  },
  {
    slug: 'weber',
    profileId: 'e1000011-0011-4011-8011-000000000011',
    campaignId: 'a1000003-0003-4003-8003-000000000003',
    email: 'weber.ads@advertisers.dimarket.app',
    fullName: 'Weber (Saint-Gobain)',
    website: 'https://www.weber.ua',
    title: 'Weber — сухі будівельні суміші',
    description:
      'Штукатурки, клеї та фасадні рішення Weber (Saint-Gobain) для професійного будівництва.',
    image:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&h=560&fit=crop&q=85',
    link: 'https://www.weber.ua',
    placement: 'listings',
  },
  {
    slug: 'sika',
    profileId: 'e1000012-0012-4012-8012-000000000012',
    campaignId: 'a1000004-0004-4004-8004-000000000004',
    email: 'sika.ads@advertisers.dimarket.app',
    fullName: 'Sika Україна',
    website: 'https://www.sika.com/ua',
    title: 'Sika — BUILD ON RELIABILITY',
    description:
      'Гідроізоляція, добавки в бетон, герметики та інженерні рішення Sika для фундаментів і промислових підлог. DImarket.app.',
    image:
      'https://images.unsplash.com/photo-1541972664089-0221394fb162?w=900&h=560&fit=crop&q=85',
    link: 'https://www.sika.com/ua',
    placement: 'home',
  },
]

const LEGACY_PLACEMENTS = ['home', 'sidebar', 'listings', 'mobile_sticky', 'footer']

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const demoPassword = env.BRAND_ADVERTISER_DEMO_PASSWORD || 'DimarketBrandAds2026!'

if (!url || !serviceKey) {
  console.error('Потрібні VITE_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY у .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ownerId = 'b64a9350-4f7e-46bf-8697-d39c02491ad0'

async function ensureAuthUser(brand) {
  const { data: existing } = await admin.auth.admin.getUserById(brand.profileId)
  if (existing?.user) {
    console.log(`  auth: ${brand.slug} вже існує`)
    return
  }

  const { data, error } = await admin.auth.admin.createUser({
    id: brand.profileId,
    email: brand.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      full_name: brand.fullName,
      user_role: 'company',
      demo_brand_advertiser: brand.slug,
    },
  })

  if (error) throw new Error(`${brand.slug} auth: ${error.message}`)
  console.log(`  auth: створено ${brand.email}`)
  void data
}

async function upsertProfile(brand) {
  const bio = `[demo_brand_advertiser] Демо-рекламодавець ${brand.fullName}. Видаліть кампанію в панелі власника → Керування рекламою.`
  const row = {
    id: brand.profileId,
    full_name: brand.fullName,
    bio,
    website: brand.website,
    avatar_url: brand.image,
    profile_photo: brand.image,
    user_role: 'company',
    is_professional: false,
    is_site_owner: false,
    is_verified: true,
    verified_at: new Date().toISOString(),
    location: 'Україна',
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('profiles').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(`${brand.slug} profile: ${error.message}`)
  console.log(`  profile: ${brand.fullName}`)
}

async function upsertCampaign(brand) {
  const row = {
    id: brand.campaignId,
    advertiser_id: brand.profileId,
    title: brand.title,
    description: brand.description,
    image_url: brand.image,
    media_url: brand.image,
    media_type: 'image',
    link_url: brand.link,
    placement: brand.placement,
    placements: LEGACY_PLACEMENTS,
    geo_scope: 'global',
    country_code: 'UA',
    country_name: 'Україна',
    city_name: null,
    cities: null,
    region_name: null,
    countries: null,
    regions: null,
    starts_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    ends_at: new Date(Date.now() + 180 * 86400000).toISOString(),
    status: 'active',
    impressions: 1200 + Math.floor(Math.random() * 2000),
    clicks: 40 + Math.floor(Math.random() * 80),
    stripe_payment_id: `presence_demo_${brand.slug}`,
    price_paid: 99,
    currency_paid: 'eur',
    approved_by: ownerId,
    approved_at: new Date().toISOString(),
    review_note: `[demo_brand_advertiser] ${brand.slug} — демо-кампанія для банерів`,
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('ad_campaigns').upsert(row, { onConflict: 'id' })
  if (error) throw new Error(`${brand.slug} campaign: ${error.message}`)
  console.log(`  campaign: ${brand.title}`)
}

console.log('=== Seed brand advertisers (12 брендів) ===\n')
console.log(`Демо-пароль акаунтів (якщо потрібен вхід): ${demoPassword}\n`)

for (const brand of BRANDS) {
  console.log(brand.slug)
  try {
    await ensureAuthUser(brand)
    await upsertProfile(brand)
    await upsertCampaign(brand)
  } catch (e) {
    console.error('ПОМИЛКА:', e.message)
    process.exit(1)
  }
}

console.log('\nГотово. Відкрийте /dashboard → Керування рекламою — видаліть кампанії кнопкою «Видалити».')
console.log('Профілі рекламодавців позначені [demo_brand_advertiser] у bio.')
