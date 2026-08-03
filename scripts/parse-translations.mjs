import fs from 'fs'

export function parseTranslationFile(filePath) {
  const s = fs.readFileSync(filePath, 'utf8')
  const objStart = s.indexOf('{')
  const asConst = s.lastIndexOf('} as const')
  const objEnd = asConst >= 0 ? asConst : s.lastIndexOf('}')
  const body = s.slice(objStart, objEnd + 1)
  return Function(`"use strict"; return (${body});`)()
}

export function escapeTsString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
}

export function writeLocaleFile({
  filePath,
  exportName,
  commentLines,
  translations,
  keyOrder,
}) {
  const lines = []
  lines.push("import type { TranslationKey } from './en'")
  lines.push('')
  for (const c of commentLines) lines.push(c)
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

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parse-translations.mjs')) {
  const en = parseTranslationFile('src/lib/Translations/en.ts')
  console.log('en keys', Object.keys(en).length)
}
