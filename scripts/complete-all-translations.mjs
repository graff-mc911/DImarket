/**
 * Completes every locale file under src/lib/Translations so each language
 * has 100% of en.ts keys. Existing translations are kept; missing ones are
 * machine-translated from English (with placeholder protection).
 */
import fs from 'fs'
import path from 'path'
import { translate } from '@vitalets/google-translate-api'

const ROOT = path.resolve('src/lib/Translations')
const CACHE_PATH = path.resolve('.translation-cache.json')
const CONCURRENCY = 4
const DELAY_MS = 80

const LOCALES = [
  { code: 'uk', exportName: 'ukTranslations', comment: 'Ukrainian UI translations.' },
  { code: 'ru', exportName: 'ruTranslations', comment: 'Russian UI translations.' },
  { code: 'kk', exportName: 'kkTranslations', comment: 'Kazakh UI translations.' },
  { code: 'pl', exportName: 'plTranslations', comment: 'Polish UI translations.' },
  { code: 'es', exportName: 'esTranslations', comment: 'Spanish UI translations.' },
  { code: 'de', exportName: 'deTranslations', comment: 'German UI translations.' },
  { code: 'fr', exportName: 'frTranslations', comment: 'French UI translations.' },
  { code: 'it', exportName: 'itTranslations', comment: 'Italian UI translations.' },
  { code: 'pt', exportName: 'ptTranslations', comment: 'Portuguese UI translations.' },
  { code: 'ro', exportName: 'roTranslations', comment: 'Romanian UI translations.' },
  { code: 'cs', exportName: 'csTranslations', comment: 'Czech UI translations.' },
  { code: 'sk', exportName: 'skTranslations', comment: 'Slovak UI translations.' },
  { code: 'hu', exportName: 'huTranslations', comment: 'Hungarian UI translations.' },
  { code: 'bg', exportName: 'bgTranslations', comment: 'Bulgarian UI translations.' },
  { code: 'sr', exportName: 'srTranslations', comment: 'Serbian UI translations.' },
  { code: 'hr', exportName: 'hrTranslations', comment: 'Croatian UI translations.' },
  { code: 'sl', exportName: 'slTranslations', comment: 'Slovenian UI translations.' },
  { code: 'lt', exportName: 'ltTranslations', comment: 'Lithuanian UI translations.' },
  { code: 'lv', exportName: 'lvTranslations', comment: 'Latvian UI translations.' },
  { code: 'et', exportName: 'etTranslations', comment: 'Estonian UI translations.' },
  { code: 'tr', exportName: 'trTranslations', comment: 'Turkish UI translations.' },
  { code: 'ar', exportName: 'arTranslations', comment: 'Arabic UI translations.' },
  { code: 'zh', exportName: 'zhTranslations', comment: 'Chinese UI translations.' },
  { code: 'ja', exportName: 'jaTranslations', comment: 'Japanese UI translations.' },
]

function parseTranslationFile(filePath) {
  const s = fs.readFileSync(filePath, 'utf8')
  // Prefer the object literal after "= {", not the TS type braces.
  const assignIdx = s.search(/=\s*\{/)
  const objStart = assignIdx >= 0 ? s.indexOf('{', assignIdx) : s.indexOf('{')
  const asConst = s.lastIndexOf('} as const')
  const objEnd = asConst >= 0 ? asConst : s.lastIndexOf('}')
  if (objStart < 0 || objEnd < 0) {
    throw new Error(`Could not parse translation object in ${filePath}`)
  }
  const body = s.slice(objStart, objEnd + 1)
  return Function(`"use strict"; return (${body});`)()
}

function escapeTsString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache))
}

function protectPlaceholders(text) {
  const placeholders = []
  const protectedText = String(text).replace(/\{[^}]+\}/g, (m) => {
    const idx = placeholders.length
    placeholders.push(m)
    return `__PH_${idx}__`
  })
  return { protectedText, placeholders }
}

function restorePlaceholders(text, placeholders) {
  return String(text).replace(/__PH_(\d+)__/g, (_, n) => placeholders[Number(n)] ?? _)
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length)
  let i = 0
  async function run() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
  return results
}

const GOOGLE_LANG = {
  zh: 'zh-CN',
  pt: 'pt',
  sr: 'sr',
  kk: 'kk',
}

async function translateText(text, lang, cache) {
  const key = `${lang}::${text}`
  if (cache[key]) return cache[key]

  const target = GOOGLE_LANG[lang] || lang
  const { protectedText, placeholders } = protectPlaceholders(text)
  let lastError
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await translate(protectedText, { from: 'en', to: target })
      const restored = restorePlaceholders(result.text, placeholders).trim()
      cache[key] = restored || text
      return cache[key]
    } catch (err) {
      lastError = err
      await sleep(500 * (attempt + 1))
    }
  }
  console.warn(`  translate failed [${lang}]:`, lastError?.message || lastError)
  cache[key] = text
  return text
}

function writeLocaleFile(filePath, exportName, comment, translations, keyOrder) {
  const lines = []
  lines.push("import type { TranslationKey } from './en'")
  lines.push('')
  lines.push(`// ${comment}`)
  lines.push('// Complete coverage of TranslationKey (same keys as en.ts).')
  lines.push(`export const ${exportName}: Partial<Record<TranslationKey, string>> = {`)
  for (const key of keyOrder) {
    const value = translations[key]
    if (value == null) continue
    lines.push(`  '${key}': '${escapeTsString(value)}',`)
  }
  lines.push('}')
  lines.push('')
  fs.writeFileSync(filePath, lines.join('\n'))
}

async function completeLocale(locale, en, keyOrder, cache) {
  const filePath = path.join(ROOT, `${locale.code}.ts`)
  const existing = fs.existsSync(filePath) ? parseTranslationFile(filePath) : {}
  const missing = keyOrder.filter((k) => !existing[k] || String(existing[k]).trim() === '')

  console.log(`[${locale.code}] existing=${Object.keys(existing).length} missing=${missing.length}`)

  let done = 0
  await mapPool(missing, CONCURRENCY, async (key) => {
    const translated = await translateText(en[key], locale.code, cache)
    existing[key] = translated
    done++
    if (done % 25 === 0 || done === missing.length) {
      process.stdout.write(`  [${locale.code}] ${done}/${missing.length}\n`)
      saveCache(cache)
    }
    await sleep(DELAY_MS)
  })

  // Ensure every key present (fallback to en if somehow still missing)
  const complete = {}
  for (const key of keyOrder) {
    complete[key] = existing[key] || en[key]
  }

  writeLocaleFile(filePath, locale.exportName, locale.comment, complete, keyOrder)
  console.log(`[${locale.code}] wrote ${keyOrder.length} keys`)
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const enPath = path.join(ROOT, 'en.ts')
  const en = parseTranslationFile(enPath)
  const keyOrder = Object.keys(en)
  console.log(`English keys: ${keyOrder.length}`)

  const cache = loadCache()
  const targets = only.length
    ? LOCALES.filter((l) => only.includes(l.code))
    : LOCALES

  for (const locale of targets) {
    await completeLocale(locale, en, keyOrder, cache)
    saveCache(cache)
  }

  // Final coverage report
  console.log('\nCoverage report:')
  for (const locale of LOCALES) {
    const filePath = path.join(ROOT, `${locale.code}.ts`)
    if (!fs.existsSync(filePath)) {
      console.log(`  ${locale.code}: MISSING FILE`)
      continue
    }
    const obj = parseTranslationFile(filePath)
    const missing = keyOrder.filter((k) => !obj[k])
    console.log(
      `  ${locale.code}: ${Object.keys(obj).length}/${keyOrder.length} missing=${missing.length}`,
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
