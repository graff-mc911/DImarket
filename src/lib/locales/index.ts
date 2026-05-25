import { enTranslations } from '../Translations/en'
import type { TranslationKey } from '../Translations/en'
import { allAiAssistantTranslations } from '../Translations/aiAssistant'
import type { AiAssistantLocaleCode } from '../Translations/aiAssistant'
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
import { ruTranslations } from '../Translations/ru'

const withEnglishFallback = (
  localeTranslations: Partial<Record<TranslationKey, string>>,
  languageCode?: LanguageCode,
): Record<TranslationKey, string> => {
  const ai =
    languageCode && languageCode in allAiAssistantTranslations
      ? allAiAssistantTranslations[languageCode as AiAssistantLocaleCode]
      : undefined

  return {
    ...enTranslations,
    ...localeTranslations,
    ...(ai ?? {}),
  }
}

export const translations = {
  en: enTranslations,
  uk: withEnglishFallback(ukTranslations, 'uk'),
  ru: withEnglishFallback(ruTranslations, 'ru'),
  kk: withEnglishFallback(kkTranslations, 'kk'),
  pl: withEnglishFallback(plTranslations, 'pl'),
  es: withEnglishFallback(esTranslations, 'es'),
  de: withEnglishFallback(deTranslations, 'de'),
  fr: withEnglishFallback(frTranslations, 'fr'),
  it: withEnglishFallback(itTranslations, 'it'),
  pt: withEnglishFallback(ptTranslations, 'pt'),
  ro: withEnglishFallback(roTranslations, 'ro'),
  cs: withEnglishFallback(csTranslations, 'cs'),
  sk: withEnglishFallback(skTranslations, 'sk'),
  hu: withEnglishFallback(huTranslations, 'hu'),
  bg: withEnglishFallback(bgTranslations, 'bg'),
  sr: withEnglishFallback(srTranslations, 'sr'),
  hr: withEnglishFallback(hrTranslations, 'hr'),
  sl: withEnglishFallback(slTranslations, 'sl'),
  lt: withEnglishFallback(ltTranslations, 'lt'),
  lv: withEnglishFallback(lvTranslations, 'lv'),
  et: withEnglishFallback(etTranslations, 'et'),
  tr: withEnglishFallback(trTranslations, 'tr'),
  ar: withEnglishFallback(arTranslations, 'ar'),
  zh: withEnglishFallback(zhTranslations, 'zh'),
  ja: withEnglishFallback(jaTranslations, 'ja'),
} as const

export type { TranslationKey }
export type LanguageCode = keyof typeof translations

export function getTranslation(
  languageCode: LanguageCode,
  key: TranslationKey,
): string {
  return translations[languageCode]?.[key] ?? enTranslations[key] ?? key
}
