/** Мова відповіді AI за кодом інтерфейсу (LANGUAGES у types.ts). */
const LOCALE_PROMPT_NAMES: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  pl: 'Polish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ro: 'Romanian',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  bg: 'Bulgarian',
  sr: 'Serbian',
  hr: 'Croatian',
  sl: 'Slovenian',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  tr: 'Turkish',
  kk: 'Kazakh',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
}

export function localePromptLanguage(locale: string): string {
  return LOCALE_PROMPT_NAMES[locale] ?? 'English'
}
