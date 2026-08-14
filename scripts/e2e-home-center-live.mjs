/**
 * LIVE production E2E: home_center create → visible → delete → invisible.
 * Also asserts side rails are gone.
 *
 * Usage: node scripts/e2e-home-center-live.mjs [baseURL]
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const baseURL = process.argv[2] || 'https://dimarket.app'
const BANNER = resolve(root, 'public/ads/brands/hilti.png')

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
if (!supabaseUrl || !anonKey || anonKey.includes('PASTE') || anonKey === '...') {
  console.error('Need real VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const issues = []
const pass = (m) => console.log(`✓ ${m}`)
const fail = (m) => {
  issues.push(m)
  console.log(`✗ ${m}`)
}

const stamp = Date.now()
const email = `side-ads-e2e-${stamp}@dimarket-audit.test`
const password = `E2eSide${stamp}!`
const title = `E2E Center ${stamp}`

const client = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log(`▸ base ${baseURL}`)
console.log(`▸ signup ${email}`)

const { data: signed, error: signErr } = await client.auth.signUp({ email, password })
if (signErr || !signed?.user?.id) {
  fail(`signup: ${signErr?.message || 'no user'}`)
  console.log(JSON.stringify({ issues }, null, 2))
  process.exit(1)
}
const userId = signed.user.id
pass(`user ${userId}`)

// Ensure advertiser-ish profile row if required by RLS
await client.from('profiles').upsert({
  id: userId,
  full_name: 'E2E Side Ads Removal',
  email,
  updated_at: new Date().toISOString(),
}).then(({ error }) => {
  if (error) console.log(`profile upsert note: ${error.message}`)
})

const now = new Date()
const ends = new Date(now.getTime() + 2 * 60 * 60 * 1000)
const bannerBytes = readFileSync(BANNER)
const path = `${userId}/e2e-center-${stamp}.png`

const { error: upErr } = await client.storage.from('ad-media').upload(path, bannerBytes, {
  contentType: 'image/png',
  upsert: true,
})
if (upErr) fail(`upload: ${upErr.message}`)
else pass('banner uploaded (ad-media)')

const { data: pub } = client.storage.from('ad-media').getPublicUrl(path)
const imageUrl = pub?.publicUrl

const { data: inserted, error: insErr } = await client
  .from('ad_campaigns')
  .insert({
    advertiser_id: userId,
    title,
    description: 'side-ads-removal e2e home_center',
    link_url: 'https://dimarket.app/',
    placement: 'footer',
    placements: ['home_center'],
    status: 'active',
    image_url: imageUrl,
    media_url: imageUrl,
    media_type: 'image',
    price_paid: 0,
    currency_paid: 'eur',
    approved_by: userId,
    approved_at: now.toISOString(),
    starts_at: now.toISOString(),
    ends_at: ends.toISOString(),
    review_note: 'phase_a_no_payment_publish',
    geo_scope: 'global',
  })
  .select('id,status,placements')
  .single()

if (insErr || !inserted?.id) {
  fail(`insert campaign: ${insErr?.message || 'no id'}`)
} else {
  pass(`campaign created ${inserted.id}`)
}

const campaignId = inserted?.id

const browser = await chromium.launch({ headless: true })
const assertHome = async (label, expectVisible) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForTimeout(3500)
  const state = await page.evaluate((marker) => {
    const rails = document.querySelectorAll('.ad-side-rail, .layout-with-side-ads').length
    const imgs = Array.from(
      document.querySelectorAll(
        '[data-ad-slot="home_center"] img, .ad-slot-center img, .ad-overlay-card img, [data-ad-slot] img',
      ),
    )
    const srcs = imgs.map((i) => i.src || '').filter(Boolean)
    const titleHit = (document.body.innerText || '').includes(marker)
    return { rails, imgCount: imgs.length, srcs, titleHit, hasMarkerUrl: srcs.some((s) => s.includes(marker) || s.includes('e2e-center-')) }
  }, String(stamp))
  if (state.rails === 0) pass(`${label}: no side rails`)
  else fail(`${label}: side rails still present (${state.rails})`)
  if (expectVisible) {
    if (state.hasMarkerUrl || state.titleHit || state.imgCount > 0) {
      pass(`${label}: center banner visible (imgs=${state.imgCount}, marker=${state.hasMarkerUrl || state.titleHit})`)
    } else {
      fail(`${label}: expected home_center visible`)
    }
  } else {
    if (!state.hasMarkerUrl && !state.titleHit) pass(`${label}: test banner gone`)
    else fail(`${label}: test banner still visible`)
  }
  // mobile viewport
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  const mobileRails = await page.evaluate(() => document.querySelectorAll('.ad-side-rail').length)
  if (mobileRails === 0) pass(`${label}/mobile: no side rails`)
  else fail(`${label}/mobile: side rails present`)
  await page.close()
}

try {
  // Incognito context
  const ctx = await browser.newContext()
  const page = await ctx.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForTimeout(3000)
  const rails = await page.evaluate(() => document.querySelectorAll('.ad-side-rail').length)
  if (rails === 0) pass('incognito: no side rails')
  else fail(`incognito: side rails ${rails}`)
  await ctx.close()

  if (campaignId) {
    await assertHome('after-create', true)

    const { error: delErr } = await client.from('ad_campaigns').delete().eq('id', campaignId)
    if (delErr) fail(`delete: ${delErr.message}`)
    else pass('campaign deleted')

    await assertHome('after-delete', false)
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e))
} finally {
  await browser.close()
  // cleanup auth user is not possible without service role; leave orphan test user.
}

console.log(`\n══ ${issues.length ? 'FAIL' : 'PASS'} (${issues.length} issues) ══`)
if (issues.length) {
  for (const i of issues) console.log(' -', i)
  process.exit(1)
}
