/**
 * Повний E2E: рекламодавець → кампанія на різних слотах → активація → перевірка банерів.
 * Потрібно: .env.local з VITE_SUPABASE_* та SUPABASE_SERVICE_ROLE_KEY
 *
 * node scripts/e2e-advertiser-full-flow.mjs [baseURL]
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const baseURL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'

const BANNER_A = resolve(root, 'public/ads/brands/hilti.png')
const BANNER_B = resolve(root, 'public/ads/brands/dewalt.png')
const BANNER_C = resolve(root, 'public/ads/brands/festool.png')

const SLOTS = [
  { pageId: 'home', slotId: 'home_center', file: BANNER_A },
  { pageId: 'listings', slotId: 'listings_mob_inline_1', file: BANNER_B },
  { pageId: 'professionals', slotId: 'professionals_mob_inline_1', file: BANNER_C },
]

function loadEnv() {
  const out = {}
  for (const name of ['.env', '.env.local']) {
    const p = resolve(root, name)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 1) continue
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return { ...out, ...process.env }
}

const env = loadEnv()
const supabaseUrl = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('Потрібні VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY у .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
const authStorageKey = `sb-${projectRef}-auth-token`

const stamp = Date.now()
const email = `adv-flow-${stamp}@dimarket-test.invalid`
const password = 'AdvTest2026!'

const issues = []
const log = (msg) => console.log(`▸ ${msg}`)

function fail(msg) {
  issues.push(msg)
  console.log(`✗ ${msg}`)
}
function pass(msg) {
  console.log(`✓ ${msg}`)
}

log(`Створюю рекламодавця: ${email}`)
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: 'E2E Advertiser',
    user_role: 'advertiser',
    phone: '+380501234567',
    location: 'Kyiv, Kyiv Oblast, Ukraine',
  },
})

if (createErr || !created.user) {
  console.error(createErr)
  process.exit(1)
}

const userId = created.user.id
await admin.from('profiles').upsert(
  {
    id: userId,
    full_name: 'E2E Advertiser',
    user_role: 'client',
    is_professional: false,
    phone: '+380501234567',
    location: 'Kyiv, Kyiv Oblast, Ukraine',
  },
  { onConflict: 'id' },
)
pass('Користувача створено через Admin API')

log('Отримую сесію Supabase (signInWithPassword)')
const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
  email,
  password,
})
if (signInErr || !signInData.session) {
  console.error(signInErr)
  process.exit(1)
}
pass('Сесію отримано')

const sessionPayload = JSON.stringify({
  access_token: signInData.session.access_token,
  refresh_token: signInData.session.refresh_token,
  expires_in: signInData.session.expires_in,
  expires_at: signInData.session.expires_at,
  token_type: signInData.session.token_type,
  user: signInData.session.user,
})

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'uk-UA' })
await context.addInitScript(
  ({ key, value }) => {
    window.localStorage.setItem(key, value)
  },
  { key: authStorageKey, value: sessionPayload },
)
const page = await context.newPage()

let campaignId = null
let uploadedMarkers = []

try {
  log('Відкриваю застосунок з сесією')
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(2000)
  const hasSession = await page.evaluate((key) => !!localStorage.getItem(key), authStorageKey)
  if (hasSession) pass('Сесія в localStorage застосунку')
  else fail('Сесія не потрапила в localStorage')

  log('Відкриваю /advertising')
  await page.goto(`${baseURL}/advertising`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForSelector('#ad-placements', { timeout: 30_000 })

  const editorVisible = await page.locator('#ad-placements [data-slot-id]').first().isVisible().catch(() => false)
  if (editorVisible) pass('Редактор «Де показувати рекламу» доступний після входу')
  else fail('Редактор слотів не видно після входу')

  log('Заповнюю форму кампанії')
  await page.getByTestId('ad-campaign-title').fill(`E2E кампанія ${stamp}`)
  await page.getByTestId('ad-campaign-link').fill('https://dimarket.app/')
  await page.locator('#ad-form textarea').first().fill('Автотест розміщення на кількох сторінках')

  const placements = page.locator('#ad-placements')
  const fileInput = placements.locator('input[type="file"]')

  for (const { pageId, slotId, file } of SLOTS) {
    log(`Слот: ${slotId}`)
    const slot = placements.locator(`[data-slot-id="${slotId}"]`).first()
    await slot.waitFor({ state: 'visible', timeout: 20_000 })
    if ((await slot.getAttribute('aria-pressed')) !== 'true') {
      await slot.click()
    }
    const uploadDone = page
      .waitForResponse((r) => r.url().includes('/storage/v1/object') && r.request().method() === 'POST', {
        timeout: 45_000,
      })
      .then((r) => r.ok())
      .catch(() => false)
    await fileInput.setInputFiles(file)
    const stored = await uploadDone
    await page.waitForTimeout(1500)
    const hasPreview =
      (await placements.locator(`[data-slot-id="${slotId}"]`).locator('img, video').count()) > 0
    if (stored || hasPreview) {
      pass(`Медіа завантажено для ${slotId}${hasPreview ? '' : ' (storage OK, превʼю wireframe пізніше)'}`)
      uploadedMarkers.push(file.split(/[/\\]/).pop().replace('.png', ''))
    } else {
      fail(`Завантаження не вдалось для ${slotId}`)
    }
  }

  log('Відправляю кампанію (очікується Stripe або success)')
  await page.locator('#ad-form').scrollIntoViewIfNeeded()
  const submit = page.getByTestId('ad-campaign-submit')

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('ad_campaigns') && r.request().method() === 'POST',
      { timeout: 45_000 },
    ).catch(() => null),
    submit.click(),
  ])

  await page.waitForTimeout(4000)

  if (response?.ok()) {
    const body = await response.json().catch(() => null)
    campaignId = Array.isArray(body) ? body[0]?.id : body?.id
    pass(`Кампанію збережено (API), id=${campaignId || '?'}`)
  }

  if (!campaignId) {
    const { data: rows } = await admin
      .from('ad_campaigns')
      .select('id, title, status')
      .eq('advertiser_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    campaignId = rows?.[0]?.id ?? null
    if (campaignId) pass(`Знайдено кампанію в БД: ${campaignId} (${rows[0].status})`)
    else fail('Кампанію не знайдено в БД після submit')
  }

  if (campaignId) {
    log('Активую кампанію (імітація оплати) для публічного показу')
    const slotIds = SLOTS.map((s) => s.slotId)
    const { error: actErr } = await admin
      .from('ad_campaigns')
      .update({
        status: 'active',
        price_paid: 99,
        currency_paid: 'eur',
        placements: slotIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
    if (actErr) fail(`Активація: ${actErr.message}`)
    else pass('Кампанія active у БД')
  }

  const pagesToCheck = [
    { path: '/', name: 'Головна', slot: 'home_center' },
    { path: '/listings', name: 'Оголошення', slot: 'listings_mob_inline_1' },
    { path: '/professionals', name: 'Майстри', slot: 'professionals_mob_inline_1' },
  ]

  for (const { path, name } of pagesToCheck) {
    log(`Перевіряю банери: ${name} (${path})`)
    await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForTimeout(3500)
    const state = await page.evaluate(() => {
      const imgs = Array.from(
        document.querySelectorAll(
          '[data-ad-slot] img, .ad-overlay-card img, .ad-slot-center img, .ad-slot-mobile-inline img',
        ),
      )
      return {
        count: imgs.length,
        srcs: imgs.map((i) => i.src).filter(Boolean),
        sideRails: document.querySelectorAll('.ad-side-rail').length,
      }
    })
    if (state.sideRails > 0) fail(`${name}: side rails still present (${state.sideRails})`)
    const markerHit = uploadedMarkers.some((m) => state.srcs.some((s) => s.includes(m.replace('.png', '')) || s.includes('campaigns/')))
    if (state.count > 0) {
      pass(`${name}: ${state.count} банер(ів) на сторінці`)
      if (markerHit) pass(`${name}: знайдено медіа тестової кампанії`)
    } else {
      fail(`${name}: банери не відображаються`)
    }
  }

  log('Оцінка UX структури /advertising')
  await page.goto(`${baseURL}/advertising`, { waitUntil: 'domcontentloaded' })
  const ux = await page.evaluate(() => {
    const placements = document.querySelector('#ad-placements')
    const form = document.querySelector('#ad-form')
    if (!placements || !form) return { ok: false }
    const placementsTop = placements.getBoundingClientRect().top
    const formTop = form.getBoundingClientRect().top
    return {
      ok: true,
      placementsBeforeForm: placementsTop < formTop,
      placementsInView: placementsTop < window.innerHeight,
    }
  })
  if (ux.ok && ux.placementsBeforeForm) pass('UX: блок вибору слотів вище форми оплати')
  else fail('UX: незручний порядок секцій (форма перед вибором слотів)')

  if (ux.ok && ux.placementsInView) pass('UX: секція слотів видна без довгого скролу після hero')
} catch (err) {
  fail(err instanceof Error ? err.message : String(err))
} finally {
  await browser.close()
}

console.log(`\n══ Підсумок: ${issues.length ? 'Є проблеми' : 'Усе OK'} (${issues.length} помилок) ══`)
if (issues.length) {
  for (const i of issues) console.log(' -', i)
  process.exit(1)
}
