/**
 * Наповнення geo_catalog з офіційних дампів GeoNames (без API / без ліміту demo).
 * Джерело: https://download.geonames.org/export/dump/
 *
 * .env.local: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 *   node scripts/sync-geo-catalog-dump.mjs
 *   node scripts/sync-geo-catalog-dump.mjs --country=Germany
 *   node scripts/sync-geo-catalog-dump.mjs --dry-run
 */
import {
  readFileSync,
  existsSync,
  mkdirSync,
  createWriteStream,
} from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { pipeline } from 'stream/promises'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const CACHE = resolve(root, '.geonames-cache')

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
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const countryArg = args.find((a) => a.startsWith('--country='))?.split('=')[1]

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
  Ecuador: 'EC',
  Venezuela: 'VE',
  Uruguay: 'UY',
  Paraguay: 'PY',
  Bolivia: 'BO',
  China: 'CN',
  Japan: 'JP',
  'South Korea': 'KR',
  India: 'IN',
  Indonesia: 'ID',
  Thailand: 'TH',
  Vietnam: 'VN',
  Philippines: 'PH',
  Malaysia: 'MY',
  Singapore: 'SG',
  Turkey: 'TR',
  Israel: 'IL',
  Egypt: 'EG',
  Morocco: 'MA',
  Tunisia: 'TN',
  Algeria: 'DZ',
  Nigeria: 'NG',
  Kenya: 'KE',
  'South Africa': 'ZA',
  Australia: 'AU',
  'New Zealand': 'NZ',
}

const REGISTRATION_COUNTRIES = Object.keys(COUNTRY_NAME_TO_ISO2).sort((a, b) =>
  a.localeCompare(b),
)

async function download(url, dest) {
  if (existsSync(dest)) return
  mkdirSync(dirname(dest), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`)
  await pipeline(res.body, createWriteStream(dest))
}

function ensureAdmin1Map() {
  const dest = resolve(CACHE, 'admin1CodesASCII.txt')
  if (!existsSync(dest)) {
    console.log('Завантаження admin1CodesASCII.txt…')
  }
  return download(
    'https://download.geonames.org/export/dump/admin1CodesASCII.txt',
    dest,
  ).then(() => {
    const map = new Map()
    for (const line of readFileSync(dest, 'utf8').split('\n')) {
      if (!line.trim()) continue
      const [code, name] = line.split('\t')
      if (code && name) map.set(code.trim(), name.trim())
    }
    return map
  })
}

async function ensureCountryTxt(iso2) {
  const txtPath = resolve(CACHE, `${iso2}.txt`)
  if (existsSync(txtPath)) return txtPath

  mkdirSync(CACHE, { recursive: true })
  const zipPath = resolve(CACHE, `${iso2}.zip`)
  const url = `https://download.geonames.org/export/dump/${iso2}.zip`
  console.log(`  Завантаження ${url}…`)
  await download(url, zipPath)
  execSync(`tar -xf "${zipPath}" -C "${CACHE}"`, { stdio: 'inherit', cwd: CACHE })
  if (!existsSync(txtPath)) {
    throw new Error(`Після розпакування немає ${iso2}.txt`)
  }
  return txtPath
}

function parseCountryDump(txtPath, countryName, iso2, adminMap) {
  const rows = new Map()
  let adm1Count = 0
  const adminSeen = new Set()

  for (const line of readFileSync(txtPath, 'utf8').split('\n')) {
    if (!line) continue
    const cols = line.split('\t')
    const fClass = cols[6]
    const fCode = cols[7] || ''

    if (fClass === 'A' && fCode.startsWith('ADM1')) {
      const code = `${iso2}.${cols[10] || ''}`
      const name = cols[1]?.trim()
      if (name && cols[10]) {
        adminMap.set(code, name)
        adminSeen.add(code)
        adm1Count++
      }
      continue
    }

    if (fClass !== 'P') continue

    const city = cols[1]?.trim()
    if (!city) continue

    const admin1 = cols[10]?.trim()
    const regionKey = admin1 ? `${iso2}.${admin1}` : ''
    const region =
      (regionKey && adminMap.get(regionKey)) || admin1 || 'Інші'

    const key = `${countryName}|${region}|${city}`
    rows.set(key, { country: countryName, region, city })
  }

  return { rows: [...rows.values()], adm1Count: adminSeen.size || adm1Count }
}

async function syncCountry(countryName, iso2, adminMap, supabase) {
  console.log(`\n▶ ${countryName} (${iso2})`)
  const txtPath = await ensureCountryTxt(iso2)
  const { rows, adm1Count } = parseCountryDump(
    txtPath,
    countryName,
    iso2,
    adminMap,
  )
  console.log(`  ADM1 у дампі: ${adm1Count}, населених пунктів: ${rows.length}`)

  if (dryRun) {
    console.log('  (dry-run — у БД не записано)')
    return rows.length
  }

  const BATCH = 500
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
    `GeoNames dump sync — ${countries.length} країн, dryRun=${dryRun}`,
  )

  const adminMap = await ensureAdmin1Map()
  const supabase = dryRun ? null : createClient(SUPABASE_URL, SERVICE_KEY)

  let grandTotal = 0
  for (const countryName of countries) {
    const iso2 = COUNTRY_NAME_TO_ISO2[countryName]
    try {
      grandTotal += await syncCountry(countryName, iso2, adminMap, supabase)
    } catch (err) {
      console.error(`  ✗ ${countryName}:`, err.message)
    }
  }

  console.log(`\n✓ Готово. Унікальних міст у прогоні: ~${grandTotal}`)
  if (!dryRun) {
    console.log('Перезавантаж /advertising — каталог з geo_catalog + довідник.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
