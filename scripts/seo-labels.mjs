/**
 * Human category/trade labels for sitemap + prerender.
 * Reads the existing UI maps — does not invent a second taxonomy.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Landing / plural URL slugs → canonical keys in DIMARKET_CATEGORY_I18N */
const SLUG_ALIASES = {
  electricians: 'electrician',
  plumbers: 'plumber',
  painters: 'painter',
  lawyers: 'lawyer',
  accountants: 'accountant',
  elektriker: 'electrician',
  sanitaer: 'plumber',
  maler: 'painter',
  fliesenleger: 'tiler',
  electricista: 'electrician',
  fontanero: 'plumber',
  pintor: 'painter',
  alicatador: 'tiler',
  'architect-designer': 'architect-and-designer',
  abogado: 'lawyer',
  contador: 'accountant',
  elektrik: 'electrician',
  santekhnik: 'plumber',
  maliar: 'painter',
  malyar: 'painter',
  elektryk: 'electrician',
  hydraulik: 'plumber',
  malarz: 'painter',
  handwerker: 'handyman',
  reformas: 'renovation',
}

let cachedMaps = null

function skipQuoted(source, start) {
  const quote = source[start]
  let i = start + 1
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2
      continue
    }
    if (source[i] === quote) return i + 1
    i += 1
  }
  return source.length
}

function extractObjectBody(source, openBraceIndex) {
  let depth = 1
  let i = openBraceIndex + 1
  while (i < source.length && depth > 0) {
    const ch = source[i]
    if (ch === "'" || ch === '"') {
      i = skipQuoted(source, i)
      continue
    }
    if (ch === '{') depth += 1
    else if (ch === '}') depth -= 1
    i += 1
  }
  return { body: source.slice(openBraceIndex + 1, i - 1), end: i }
}

function parseLocaleValue(body, locale) {
  const re = new RegExp(`(?:^|[\\s,{])${locale}\\s*:\\s*(['"])`, 'm')
  const match = body.match(re)
  if (!match) return ''
  const quote = match[1]
  const start = body.indexOf(match[0]) + match[0].length
  let i = start
  let out = ''
  while (i < body.length) {
    const ch = body[i]
    if (ch === '\\' && i + 1 < body.length) {
      out += body[i + 1]
      i += 2
      continue
    }
    if (ch === quote) break
    out += ch
    i += 1
  }
  return out.trim()
}

function parseLabelFile(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const maps = {}
  const re = /['"]([a-z0-9-]+)['"]\s*:\s*\{/g
  let match
  while ((match = re.exec(source))) {
    const slug = match[1]
    const braceIndex = source.indexOf('{', match.index + match[0].length - 1)
    if (braceIndex < 0) continue
    const { body, end } = extractObjectBody(source, braceIndex)
    re.lastIndex = end
    const en = parseLocaleValue(body, 'en')
    const uk = parseLocaleValue(body, 'uk')
    const de = parseLocaleValue(body, 'de')
    const es = parseLocaleValue(body, 'es')
    const pl = parseLocaleValue(body, 'pl')
    const ru = parseLocaleValue(body, 'ru')
    if (!en && !uk) continue
    maps[slug] = { en: en || uk, uk: uk || en, de, es, pl, ru }
  }
  return maps
}

function loadMaps() {
  if (cachedMaps) return cachedMaps
  cachedMaps = {
    ...parseLabelFile(join(root, 'src/lib/categoryLabelI18n.ts')),
    ...parseLabelFile(join(root, 'src/config/categoriesI18n.ts')),
  }
  return cachedMaps
}

export function canonicalSeoSlug(slug) {
  const raw = String(slug || '')
    .trim()
    .toLowerCase()
  return SLUG_ALIASES[raw] || raw
}

export function humanLabel(slug, locale = 'uk') {
  const maps = loadMaps()
  const canonical = canonicalSeoSlug(slug)
  const entry = maps[canonical] || maps[slug]
  if (entry) {
    const loc = String(locale || 'uk').toLowerCase().split('-')[0]
    return (
      entry[loc] ||
      entry.uk ||
      entry.en ||
      titleCaseSlug(canonical)
    )
  }
  return titleCaseSlug(canonical)
}

export function titleCaseSlug(slug) {
  return String(slug || '')
    .split(/[-_/]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
