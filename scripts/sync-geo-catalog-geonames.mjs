/**
 * Повне наповнення geo_catalog з GeoNames (країна → регіон ADM1 → населені пункти).
 *
 * 1. Зареєструй безкоштовний логін: https://www.geonames.org/login
 * 2. Додай у .env.local:
 *    GEONAMES_USERNAME=твій_логін
 *    SUPABASE_SERVICE_ROLE_KEY=...
 *    VITE_SUPABASE_URL=...
 *
 * Запуск:
 *   node scripts/sync-geo-catalog-geonames.mjs
 *   node scripts/sync-geo-catalog-geonames.mjs --country=Germany
 *   node scripts/sync-geo-catalog-geonames.mjs --dry-run
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

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env }

const GEONAMES_USER = env.GEONAMES_USERNAME || 'demo'
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const countryArg = args.find((a) => a.startsWith('--country='))?.split('=')[1]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** @type {Record<string, string>} */
const COUNTRY_NAME_TO_ISO2 = {
  Ukraine: 'UA',
  Poland: 'PL',
  Germany: 'DE',
  Spain: 'ES',
  France: 'FR',
  Italy: 'IT',
  'Czech Republic': 'CZ',
  Slovakia: 'SK',
  Hungary: 'HU',
  Romania: 'RO',
  Austria: 'AT',
  'United Kingdom': 'GB',
  Netherlands: 'NL',
  Belgium: 'BE',
  Portugal: 'PT',
  Greece: 'GR',
  Bulgaria: 'BG',
  Croatia: 'HR',
  Serbia: 'RS',
  Switzerland: 'CH',
  Kazakhstan: 'KZ',
  UAE: 'AE',
  USA: 'US',
  Canada: 'CA',
  Mexico: 'MX',
  Brazil: 'BR',
  Argentina: 'AR',
  Colombia: 'CO',
  Chile: 'CL',
  Peru: 'PE',
  Venezuela: 'VE',
  Ecuador: 'EC',
  Bolivia: 'BO',
  Paraguay: 'PY',
  Uruguay: 'UY',
  Panama: 'PA',
  'Costa Rica': 'CR',
  Guatemala: 'GT',
  Cuba: 'CU',
  'Dominican Republic': 'DO',
  'Puerto Rico': 'PR',
  Turkey: 'TR',
  Israel: 'IL',
  India: 'IN',
  China: 'CN',
  Japan: 'JP',
  'South Korea': 'KR',
  Australia: 'AU',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  Egypt: 'EG',
  Nigeria: 'NG',
  Kenya: 'KE',
  Morocco: 'MA',
  'Saudi Arabia': 'SA',
  Qatar: 'QA',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Finland: 'FI',
  Ireland: 'IE',
  Lithuania: 'LT',
  Latvia: 'LV',
  Estonia: 'EE',
  Slovenia: 'SI',
  Moldova: 'MD',
  Georgia: 'GE',
  Armenia: 'AM',
  Azerbaijan: 'AZ',
}

const REGISTRATION_COUNTRIES = Object.keys(COUNTRY_NAME_TO_ISO2).sort((a, b) =>
  a.localeCompare(b),
)

async function geonamesSearch(params) {
  const q = new URLSearchParams({
    ...params,
    username: GEONAMES_USER,
  })
  const url = `https://secure.geonames.org/searchJSON?${q}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GeoNames HTTP ${res.status}`)
  const data = await res.json()
  if (data.status?.message) {
    throw new Error(`GeoNames: ${data.status.message}`)
  }
  return data
}

/** ADM1: області / землі / штати */
async function fetchAdmin1(iso2) {
  const adminMap = new Map()
  let startRow = 0
  const maxRows = 1000
  while (true) {
    const data = await geonamesSearch({
      country: iso2,
      featureCode: 'ADM1',
      maxRows: String(maxRows),
      startRow: String(startRow),
    })
    const list = data.geonames || []
    for (const g of list) {
      const code = g.adminCode1 || g.adminId1 || ''
      const name = g.adminName1 || g.name
      if (code && name) adminMap.set(code, name)
    }
    if (list.length < maxRows) break
    startRow += maxRows
    await sleep(250)
  }
  return adminMap
}

/** Усі населені пункти (featureClass=P) */
async function fetchPopulatedPlaces(iso2, countryName, adminMap) {
  const rows = new Map()
  let startRow = 0
  const maxRows = 1000
  let totalFetched = 0

  while (true) {
    const data = await geonamesSearch({
      country: iso2,
      featureClass: 'P',
      maxRows: String(maxRows),
      startRow: String(startRow),
    })
    const list = data.geonames || []
    for (const g of list) {
      const city = g.name?.trim()
      if (!city) continue
      const code = g.adminCode1 || ''
      const region =
        (code && adminMap.get(code)) || g.adminName1?.trim() || 'Інші'
      const key = `${countryName}|${region}|${city}`
      rows.set(key, { country: countryName, region, city })
    }
    totalFetched += list.length
    if (list.length < maxRows) break
    startRow += maxRows
    await sleep(300)
    if (startRow > 500_000) {
      console.warn(`  ⚠ зупинка на ${startRow} записах (ліміт безпеки)`)
      break
    }
  }
  return { rows: [...rows.values()], totalFetched }
}

async function syncCountry(countryName, iso2, supabase) {
  console.log(`\n▶ ${countryName} (${iso2})`)
  const adminMap = await fetchAdmin1(iso2)
  console.log(`  ADM1 регіонів: ${adminMap.size}`)
  await sleep(400)

  const { rows, totalFetched } = await fetchPopulatedPlaces(iso2, countryName, adminMap)
  console.log(`  Населених пунктів з API: ${totalFetched}, унікальних: ${rows.length}`)

  if (dryRun) {
    console.log('  (dry-run — у БД не записано)')
    return rows.length
  }

  const BATCH = 400
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((r) => ({
      country: r.country,
      region: r.region,
      city: r.city,
      sort_order: 0,
    }))
    const { error } = await supabase.from('geo_catalog').upsert(batch, {
      onConflict: 'country,region,city',
      ignoreDuplicates: true,
    })
    if (error) throw new Error(`${countryName} batch ${i}: ${error.message}`)
    inserted += batch.length
  }
  console.log(`  Записано в geo_catalog: ${inserted} рядків`)
  return rows.length
}

async function main() {
  if (!dryRun && (!SUPABASE_URL || !SERVICE_KEY)) {
    console.error('Потрібні VITE_SUPABASE_URL і SUPABASE_SERVICE_ROLE_KEY у .env.local')
    process.exit(1)
  }

  if (GEONAMES_USER === 'demo') {
    console.warn(
      '⚠ Використовується demo — для повного каталогу створіть логін на geonames.org і вкажіть GEONAMES_USERNAME',
    )
  }

  const supabase = dryRun ? null : createClient(SUPABASE_URL, SERVICE_KEY)

  const countries = countryArg
    ? REGISTRATION_COUNTRIES.filter(
        (c) => c.toLowerCase() === countryArg.toLowerCase(),
      )
    : REGISTRATION_COUNTRIES

  if (countries.length === 0) {
    console.error(`Невідома країна: ${countryArg}`)
    process.exit(1)
  }

  console.log(
    `GeoNames sync — ${countries.length} країн, user=${GEONAMES_USER}, dryRun=${dryRun}`,
  )

  let grandTotal = 0
  for (const countryName of countries) {
    const iso2 = COUNTRY_NAME_TO_ISO2[countryName]
    try {
      grandTotal += await syncCountry(countryName, iso2, supabase)
      await sleep(800)
    } catch (err) {
      console.error(`  ✗ ${countryName}:`, err.message)
    }
  }

  console.log(`\n✓ Готово. Унікальних міст у прогоні: ~${grandTotal}`)
  if (!dryRun) {
    console.log('Перезавантаж /advertising — каталог підтягнеться з geo_catalog + довідник.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
