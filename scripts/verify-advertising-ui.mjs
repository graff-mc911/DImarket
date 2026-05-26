/**
 * Перевірка сторінки /advertising, секції «Де показувати рекламу» та банерів на сайті.
 * node scripts/verify-advertising-ui.mjs [baseURL]
 */
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const baseURL = process.argv[2] || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'

function loadEnv() {
  const out = {}
  for (const name of ['.env.local', '.env']) {
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

async function fetchActiveCampaigns() {
  if (!supabaseUrl || !anonKey) return { ok: false, campaigns: [], error: 'no env' }
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  const url =
    `${supabaseUrl}/rest/v1/ad_campaigns?select=id,title,status,placements,media_url,is_active&status=eq.active&is_active=eq.true&limit=12`
  const res = await fetch(url, { headers })
  if (!res.ok) return { ok: false, campaigns: [], error: `${res.status}` }
  const campaigns = await res.json()
  return { ok: true, campaigns }
}

const issues = []
const passes = []

function pass(msg) {
  passes.push(msg)
  console.log('✓', msg)
}
function fail(msg) {
  issues.push(msg)
  console.log('✗', msg)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  const api = await fetchActiveCampaigns()
  if (api.ok) {
    pass(`API: ${api.campaigns.length} active campaign(s)`)
    if (api.campaigns.length === 0) {
      fail('API: немає active кампаній — банери на сайті можуть бути порожніми')
    }
  } else {
    fail(`API campaigns: ${api.error}`)
  }

  await page.goto(`${baseURL}/advertising`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForSelector('#ad-placements', { timeout: 30_000 })

  const h1 = await page.getByRole('heading', { level: 1 }).first().textContent()
  if (/реклам|advertising|Add your ad/i.test(h1 || '')) pass(`Hero h1: "${h1?.trim()}"`)
  else fail(`Hero h1 unexpected: ${h1}`)

  const placementsTitle = page.getByRole('heading', { level: 2, name: /Де показувати|Where to show/i })
  if (await placementsTitle.isVisible()) pass('Секція «Де показувати рекламу» видима')
  else fail('Секція «Де показувати рекламу» не знайдена')

  const loggedOutEditor = await page
    .locator('#ad-placements')
    .getByText(/увійдіть|sign in|login required/i)
    .isVisible()
    .catch(() => false)
  const hasPreview = await page.locator('#ad-placements .ad-placement-preview, #ad-placements [class*="wireframe"]').count()
  const hasSlotEditor = await page.locator('#ad-placements button').filter({ hasText: /Головна|Home page/i }).count()

  if (loggedOutEditor) pass('Без логіну — підказка увійти (очікувано)')
  if (hasSlotEditor > 0) pass('Залогінений редактор слотів доступний')
  if (!loggedOutEditor && hasPreview === 0 && hasSlotEditor === 0) {
    fail('Секція placements: немає ні preview, ні login hint')
  }

  const previewSection = page.locator('#ad-placements').locator('..').locator('..')
  const pageBarButtons = await page
    .locator('#ad-placements')
    .getByRole('button')
    .filter({ hasText: /Головна|Home|listings|professionals|Професіонали/i })
    .count()
  if (pageBarButtons >= 1) {
    pass(`Картка placements: ${pageBarButtons} кнопок сторінок (редактор)`)
    const homeBtn = page
      .locator('#ad-placements')
      .getByRole('button', { name: /Головна|Home page/i })
      .first()
    if (await homeBtn.isVisible().catch(() => false)) {
      await homeBtn.click()
      pass('Клік «Головна сторінка» — перемикання preview')
    }
  }

  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(2000)

  const bannerState = await page.evaluate(() => {
    const rails = document.querySelectorAll('.ad-side-rail')
    const imgs = Array.from(document.querySelectorAll('.ad-side-rail img, [data-ad-slot] img, .ad-overlay-card img'))
    const placeholders = Array.from(document.querySelectorAll('.ad-side-rail')).filter((r) => {
      const t = r.textContent || ''
      return /рекламне місце|ad space|placeholder/i.test(t)
    })
    const links = Array.from(document.querySelectorAll('.ad-side-rail a[href]')).map((a) => a.getAttribute('href'))
    return {
      railCount: rails.length,
      imgCount: imgs.length,
      imgSrcs: imgs.slice(0, 6).map((i) => (i).src || (i).getAttribute('src')),
      placeholderRails: placeholders.length,
      adLinks: links.slice(0, 4),
    }
  })

  if (bannerState.railCount >= 2) pass(`Головна: ${bannerState.railCount} бокових рейок (резерв)`)
  else fail(`Головна: лише ${bannerState.railCount} рейок`)

  if (api.campaigns.length > 0) {
    if (bannerState.imgCount > 0) {
      pass(`Головна: ${bannerState.imgCount} зображень у банерах`)
      const hasRealUrl = bannerState.imgSrcs.some((s) => s && !s.includes('data:') && s.length > 20)
      if (hasRealUrl) pass('Банери мають URL медіа (не лише placeholder)')
      else fail('Банери без реальних URL зображень')
    } else {
      fail('Є active кампанії в API, але на головній немає img у рейках')
    }
  } else if (bannerState.imgCount === 0) {
    pass('Без active кампаній — порожні рейки (очікувано)')
  }

  if (bannerState.placeholderRails > 0) {
    fail(`Текст placeholder у ${bannerState.placeholderRails} рейках`)
  }

  const horiz = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (horiz <= 2) pass('Головна: без горизонтального overflow')
  else fail(`Головна: overflow ${horiz}px`)

  console.log('\n--- Banner detail ---')
  console.log(JSON.stringify(bannerState, null, 2))
} catch (err) {
  fail(err instanceof Error ? err.message : String(err))
} finally {
  await browser.close()
}

console.log(`\n${passes.length} passed, ${issues.length} failed`)
process.exit(issues.length > 0 ? 1 : 0)
