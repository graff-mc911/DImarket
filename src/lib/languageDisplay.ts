/**
 * Interface-language display helpers.
 * Flags represent the UI language (not the user's country / search location).
 *
 * Convention:
 * - UI locale code stays ISO 639-1 lowercase: `uk` (file uk.ts, document.lang).
 * - Visible badge / spoken-language tags for Ukrainian: **UA** (never UK — that reads as Britain).
 */

import { LANGUAGES } from './types'

export type AppLanguage = (typeof LANGUAGES)[number]

/** Display code in the header (Ukrainian → UA, not UK which reads as Britain). */
const DISPLAY_CODES: Record<string, string> = {
  en: 'EN',
  uk: 'UA',
  ru: 'RU',
  pl: 'PL',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  ro: 'RO',
  cs: 'CS',
  sk: 'SK',
  hu: 'HU',
  bg: 'BG',
  sr: 'SR',
  hr: 'HR',
  sl: 'SL',
  lt: 'LT',
  lv: 'LV',
  et: 'ET',
  tr: 'TR',
  kk: 'KK',
  ar: 'AR',
  zh: 'ZH',
  ja: 'JA',
}

/**
 * Flag emoji for the interface language (language identity, not geo location).
 * English → 🇬🇧 (language of the UI), Ukrainian → 🇺🇦, etc.
 */
const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  uk: '🇺🇦',
  ru: '🇷🇺',
  pl: '🇵🇱',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
  ro: '🇷🇴',
  cs: '🇨🇿',
  sk: '🇸🇰',
  hu: '🇭🇺',
  bg: '🇧🇬',
  sr: '🇷🇸',
  hr: '🇭🇷',
  sl: '🇸🇮',
  lt: '🇱🇹',
  lv: '🇱🇻',
  et: '🇪🇪',
  tr: '🇹🇷',
  kk: '🇰🇿',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵',
}

/** Map legacy/mistaken tags onto the UI locale code (`uk`). */
export function normalizeUiLanguageCode(code: string | null | undefined): string {
  const c = (code ?? '').trim().toLowerCase()
  if (c === 'ua' || c === 'uk') return 'uk'
  return c
}

/**
 * Spoken / profile language tag shown in chips and stored in language arrays.
 * Ukrainian is always **UA** (UK is reserved for United Kingdom as a country).
 */
export function normalizeSpokenLanguageCode(code: string | null | undefined): string {
  const raw = (code ?? '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower === 'uk' || lower === 'ua') return 'UA'
  return raw.toUpperCase()
}

export function normalizeSpokenLanguageList(
  langs: Array<string | null | undefined> | null | undefined,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const lang of langs ?? []) {
    const n = normalizeSpokenLanguageCode(lang)
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

/** Variants to match legacy DB rows that still store UK/uk for Ukrainian. */
export function spokenLanguageFilterVariants(code: string | null | undefined): string[] {
  const n = normalizeSpokenLanguageCode(code)
  if (!n) return []
  if (n === 'UA') return ['UA', 'UK', 'uk', 'ua']
  return Array.from(new Set([n, n.toLowerCase(), (code ?? '').trim()].filter(Boolean)))
}

export function languageDisplayCode(code: string): string {
  const ui = normalizeUiLanguageCode(code)
  if (ui === 'uk') return 'UA'
  return DISPLAY_CODES[ui] ?? DISPLAY_CODES[code] ?? code.toUpperCase()
}

export function languageFlagEmoji(code: string): string {
  const ui = normalizeUiLanguageCode(code)
  return LANGUAGE_FLAGS[ui] ?? LANGUAGE_FLAGS[code] ?? '🇪🇺'
}

export function languageOptionLabel(lang: Pick<AppLanguage, 'code' | 'name'>): string {
  return `${languageFlagEmoji(lang.code)} ${lang.name} — ${languageDisplayCode(lang.code)}`
}

export function findAppLanguage(code: string): AppLanguage | undefined {
  const ui = normalizeUiLanguageCode(code)
  return LANGUAGES.find((l) => l.code === ui || l.code === code)
}

export function twemojiFlagSrc(flagEmoji: string): string {
  const codepoints = [...flagEmoji].map((char) => char.codePointAt(0)!.toString(16))
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints.join('-')}.svg`
}
