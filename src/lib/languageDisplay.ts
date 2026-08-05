/**
 * Interface-language display helpers.
 * Flags represent the UI language (not the user's country / search location).
 */

import { LANGUAGES } from './types'

export type AppLanguage = (typeof LANGUAGES)[number]

/** ISO-style display code shown in the header (e.g. UK for Ukrainian, EN for English). */
const DISPLAY_CODES: Record<string, string> = {
  en: 'EN',
  uk: 'UK',
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

export function languageDisplayCode(code: string): string {
  return DISPLAY_CODES[code] ?? code.toUpperCase()
}

export function languageFlagEmoji(code: string): string {
  return LANGUAGE_FLAGS[code] ?? '🇪🇺'
}

export function languageOptionLabel(lang: Pick<AppLanguage, 'code' | 'name'>): string {
  return `${languageFlagEmoji(lang.code)} ${lang.name} — ${languageDisplayCode(lang.code)}`
}

export function findAppLanguage(code: string): AppLanguage | undefined {
  return LANGUAGES.find((l) => l.code === code)
}

export function twemojiFlagSrc(flagEmoji: string): string {
  const codepoints = [...flagEmoji].map((char) => char.codePointAt(0)!.toString(16))
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints.join('-')}.svg`
}
