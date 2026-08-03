/**
 * Merge /tmp/i18n/{lang}.json into src/lib/Translations/{lang}.ts
 * ensuring 100% en.ts key coverage.
 */
import fs from 'fs'
import path from 'path'

const ROOT = 'src/lib/Translations'
const EXPORTS = {
  uk: 'ukTranslations',
  ru: 'ruTranslations',
  kk: 'kkTranslations',
  pl: 'plTranslations',
  es: 'esTranslations',
  de: 'deTranslations',
  fr: 'frTranslations',
  it: 'itTranslations',
  pt: 'ptTranslations',
  ro: 'roTranslations',
  cs: 'csTranslations',
  sk: 'skTranslations',
  hu: 'huTranslations',
  bg: 'bgTranslations',
  sr: 'srTranslations',
  hr: 'hrTranslations',
  sl: 'slTranslations',
  lt: 'ltTranslations',
  lv: 'lvTranslations',
  et: 'etTranslations',
  tr: 'trTranslations',
  ar: 'arTranslations',
  zh: 'zhTranslations',
  ja: 'jaTranslations',
}

function parse(filePath) {
  const s = fs.readFileSync(filePath, 'utf8')
  const assignIdx = s.search(/=\s*\{/)
  const objStart = s.indexOf('{', assignIdx)
  const asConst = s.lastIndexOf('} as const')
  const objEnd = asConst >= 0 ? asConst : s.lastIndexOf('}')
  return Function(`"use strict"; return (${s.slice(objStart, objEnd + 1)});`)()
}

function escapeTsString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
}

function writeLocale(lang, exportName, translations, keyOrder) {
  const lines = [
    "import type { TranslationKey } from './en'",
    '',
    `// Complete ${lang} UI translations — full TranslationKey coverage.`,
    `export const ${exportName}: Partial<Record<TranslationKey, string>> = {`,
  ]
  for (const key of keyOrder) {
    if (translations[key] == null) continue
    lines.push(`  '${key}': '${escapeTsString(translations[key])}',`)
  }
  lines.push('}', '')
  fs.writeFileSync(path.join(ROOT, `${lang}.ts`), lines.join('\n'))
}

const en = parse(path.join(ROOT, 'en.ts'))
const keyOrder = Object.keys(en)
const langs = process.argv.slice(2)
const targets = langs.length ? langs : Object.keys(EXPORTS)

for (const lang of targets) {
  const existingPath = path.join(ROOT, `${lang}.ts`)
  const existing = fs.existsSync(existingPath) ? parse(existingPath) : {}
  const patchPath = `/tmp/i18n/${lang}.json`
  const patch = fs.existsSync(patchPath) ? JSON.parse(fs.readFileSync(patchPath, 'utf8')) : {}
  const merged = { ...existing, ...patch }
  let filled = 0
  for (const key of keyOrder) {
    if (!merged[key]) {
      merged[key] = en[key]
      filled++
    }
  }
  writeLocale(lang, EXPORTS[lang], merged, keyOrder)
  const identical = keyOrder.filter((k) => merged[k] === en[k]).length
  console.log(
    `${lang}: wrote ${keyOrder.length} keys (patched=${Object.keys(patch).length}, enFallback=${filled}, identical=${identical})`,
  )
}
