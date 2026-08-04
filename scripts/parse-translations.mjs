import fs from 'fs'

export function parseTranslationFile(filePath) {
  const s = fs.readFileSync(filePath, 'utf8')
  // Prefer the translations object after `export const … = {`
  // (locale files start with `import type { TranslationKey } …`).
  const exportMatch = s.match(/export const \w+[^=]*=\s*\{/)
  const objStart = exportMatch
    ? exportMatch.index + exportMatch[0].length - 1
    : s.indexOf('{')
  const tail = s.slice(objStart)
  // Scan string-aware to the matching closing brace of the object.
  let depth = 0
  let inStr = false
  let end = -1
  for (let i = 0; i < tail.length; i++) {
    const ch = tail[i]
    if (inStr) {
      if (ch === '\\') {
        i++
        continue
      }
      if (ch === "'") inStr = false
      continue
    }
    if (ch === "'") {
      inStr = true
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end = objStart + i
        break
      }
    }
  }
  if (end < 0) throw new Error(`Could not parse translations object in ${filePath}`)
  const body = s.slice(objStart, end + 1)
  // Prefer regex extraction — avoids Function() choking on odd escapes.
  const out = {}
  const re = /'((?:\\'|[^'])*)'\s*:\s*'((?:\\'|[^'])*)'/g
  let m
  while ((m = re.exec(body))) {
    out[m[1].replace(/\\'/g, "'")] = m[2]
      .replace(/\\'/g, "'")
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\')
  }
  return out
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
