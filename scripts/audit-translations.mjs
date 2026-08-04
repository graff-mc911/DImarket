#!/usr/bin/env node
/**
 * Translation coverage audit vs English reference.
 * Usage: node scripts/audit-translations.mjs
 */
import fs from 'fs'
import { parseTranslationFile } from './parse-translations.mjs'

const LOCALES = [
  'en', 'uk', 'es', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg',
  'sr', 'hr', 'sl', 'lt', 'lv', 'et', 'tr', 'ar', 'zh', 'ja', 'kk', 'ru',
]

const PLACEHOLDER_RE =
  /\{\{[^}]+\}\}|\{[0-9]+\}|%[sd]|\{[a-zA-Z_][a-zA-Z0-9_]*\}/g

const en = parseTranslationFile('src/lib/Translations/en.ts')
const keys = Object.keys(en)

console.log('| Language | Keys | Missing | Empty | Broken PH | Completion |')
console.log('| -------- | ---- | ------- | ----- | --------- | ---------- |')

let anyIssue = false
for (const lang of LOCALES) {
  const t = parseTranslationFile(`src/lib/Translations/${lang}.ts`)
  const missing = keys.filter((k) => !(k in t))
  const empty = keys.filter((k) => k in t && !String(t[k] || '').trim())
  const broken = []
  for (const k of keys) {
    if (!(k in t)) continue
    const a = [...(String(en[k]).match(PLACEHOLDER_RE) || [])].sort().join('|')
    const b = [...(String(t[k]).match(PLACEHOLDER_RE) || [])].sort().join('|')
    if (a !== b) broken.push(k)
  }
  const done = keys.length - missing.length - empty.length
  const completion = ((done / keys.length) * 100).toFixed(1) + '%'
  console.log(
    `| ${lang.padEnd(8)} | ${String(Object.keys(t).length).padStart(4)} | ${String(missing.length).padStart(7)} | ${String(empty.length).padStart(5)} | ${String(broken.length).padStart(9)} | ${completion.padStart(10)} |`,
  )
  if (missing.length || empty.length || broken.length) {
    anyIssue = true
    if (missing.length) console.log('  missing:', missing.slice(0, 10).join(', '))
    if (empty.length) console.log('  empty:', empty.slice(0, 10).join(', '))
    if (broken.length) console.log('  broken PH:', broken.slice(0, 10).join(', '))
  }
}

console.log('')
console.log(`Reference keys: ${keys.length}`)
console.log(`Languages: ${LOCALES.length}`)
console.log(anyIssue ? 'STATUS: ISSUES FOUND' : 'STATUS: 100% coverage, placeholders OK')
process.exit(anyIssue ? 1 : 0)
