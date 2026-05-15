import { enTranslations } from '../Translations/en'
import type { TranslationKey } from '../Translations/en'
import { ukTranslations } from '../Translations/uk'
import { kkTranslations } from '../Translations/kk'
import { plTranslations } from '../Translations/pl'
import { esTranslations } from '../Translations/es'
import { deTranslations } from '../Translations/de'
import { frTranslations } from '../Translations/fr'
import { itTranslations } from '../Translations/it'
import { ptTranslations } from '../Translations/pt'
import { roTranslations } from '../Translations/ro'
import { csTranslations } from '../Translations/cs'
import { skTranslations } from '../Translations/sk'
import { huTranslations } from '../Translations/hu'
import { bgTranslations } from '../Translations/bg'
import { srTranslations } from '../Translations/sr'
import { hrTranslations } from '../Translations/hr'
import { slTranslations } from '../Translations/sl'
import { ltTranslations } from '../Translations/lt'
import { lvTranslations } from '../Translations/lv'
import { etTranslations } from '../Translations/et'
import { trTranslations } from '../Translations/tr'
import { arTranslations } from '../Translations/ar'
import { zhTranslations } from '../Translations/zh'
import { jaTranslations } from '../Translations/ja'

const withEnglishFallback = (
  localeTranslations: Partial<Record<TranslationKey, string>>,
): Record<TranslationKey, string> => ({
  ...enTranslations,
  ...localeTranslations,
})

export const translations = {
  en: enTranslations,
  uk: withEnglishFallback(ukTranslations),
  kk: withEnglishFallback(kkTranslations),
  pl: withEnglishFallback(plTranslations),
  es: withEnglishFallback(esTranslations),
  de: withEnglishFallback(deTranslations),
  fr: withEnglishFallback(frTranslations),
  it: withEnglishFallback(itTranslations),
  pt: withEnglishFallback(ptTranslations),
  ro: withEnglishFallback(roTranslations),
  cs: withEnglishFallback(csTranslations),
  sk: withEnglishFallback(skTranslations),
  hu: withEnglishFallback(huTranslations),
  bg: withEnglishFallback(bgTranslations),
  sr: withEnglishFallback(srTranslations),
  hr: withEnglishFallback(hrTranslations),
  sl: withEnglishFallback(slTranslations),
  lt: withEnglishFallback(ltTranslations),
  lv: withEnglishFallback(lvTranslations),
  et: withEnglishFallback(etTranslations),
  tr: withEnglishFallback(trTranslations),
  ar: withEnglishFallback(arTranslations),
  zh: withEnglishFallback(zhTranslations),
  ja: withEnglishFallback(jaTranslations),
} as const

export type { TranslationKey }
export type LanguageCode = keyof typeof translations

export function getTranslation(
  languageCode: LanguageCode,
  key: TranslationKey,
): string {
  return translations[languageCode]?.[key] ?? enTranslations[key] ?? key
}
