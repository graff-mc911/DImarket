import { enTranslations } from '../Translations/en'
import type { TranslationKey } from '../Translations/en'
import type { AiAssistantLocaleCode } from '../Translations/aiAssistant'
import {
  clearChunkReloadFlag,
  isChunkLoadError,
  reloadOnceForStaleChunk,
} from '../chunkLoadError'

export type { TranslationKey }
export type TranslateFn = (key: TranslationKey) => string

/** Adapter when a stored catalog key is typed as string. */
export function tStored(t: TranslateFn, key: string): string {
  return t(key as TranslationKey)
}

/** All UI locale codes (must match LANGUAGES in types.ts). */
export const LANGUAGE_CODES = [
  'en',
  'uk',
  'ru',
  'kk',
  'pl',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'ro',
  'cs',
  'sk',
  'hu',
  'bg',
  'sr',
  'hr',
  'sl',
  'lt',
  'lv',
  'et',
  'tr',
  'ar',
  'zh',
  'ja',
] as const

export type LanguageCode = (typeof LANGUAGE_CODES)[number]

type LocaleTable = Record<TranslationKey, string>
type PartialLocale = Partial<Record<TranslationKey, string>>

const cache: Partial<Record<LanguageCode, LocaleTable>> = {
  en: enTranslations,
}

const inflight = new Map<LanguageCode, Promise<void>>()

const localeLoaders: Record<Exclude<LanguageCode, 'en'>, () => Promise<PartialLocale>> = {
  uk: () => import('../Translations/uk').then((m) => m.ukTranslations),
  ru: () => import('../Translations/ru').then((m) => m.ruTranslations),
  kk: () => import('../Translations/kk').then((m) => m.kkTranslations),
  pl: () => import('../Translations/pl').then((m) => m.plTranslations),
  es: () => import('../Translations/es').then((m) => m.esTranslations),
  de: () => import('../Translations/de').then((m) => m.deTranslations),
  fr: () => import('../Translations/fr').then((m) => m.frTranslations),
  it: () => import('../Translations/it').then((m) => m.itTranslations),
  pt: () => import('../Translations/pt').then((m) => m.ptTranslations),
  ro: () => import('../Translations/ro').then((m) => m.roTranslations),
  cs: () => import('../Translations/cs').then((m) => m.csTranslations),
  sk: () => import('../Translations/sk').then((m) => m.skTranslations),
  hu: () => import('../Translations/hu').then((m) => m.huTranslations),
  bg: () => import('../Translations/bg').then((m) => m.bgTranslations),
  sr: () => import('../Translations/sr').then((m) => m.srTranslations),
  hr: () => import('../Translations/hr').then((m) => m.hrTranslations),
  sl: () => import('../Translations/sl').then((m) => m.slTranslations),
  lt: () => import('../Translations/lt').then((m) => m.ltTranslations),
  lv: () => import('../Translations/lv').then((m) => m.lvTranslations),
  et: () => import('../Translations/et').then((m) => m.etTranslations),
  tr: () => import('../Translations/tr').then((m) => m.trTranslations),
  ar: () => import('../Translations/ar').then((m) => m.arTranslations),
  zh: () => import('../Translations/zh').then((m) => m.zhTranslations),
  ja: () => import('../Translations/ja').then((m) => m.jaTranslations),
}

let aiPack: Partial<Record<AiAssistantLocaleCode, PartialLocale>> | null = null

async function loadAiAssistantPack() {
  if (aiPack) return aiPack
  const mod = await import('../Translations/aiAssistant')
  aiPack = mod.allAiAssistantTranslations
  return aiPack
}

async function withEnglishFallback(
  localeTranslations: PartialLocale,
  languageCode: LanguageCode,
): Promise<LocaleTable> {
  let ai: PartialLocale | undefined
  // uk/ru/en keep AI strings in main locale files; others merge from aiAssistant pack
  if (languageCode !== 'en' && languageCode !== 'uk' && languageCode !== 'ru') {
    const pack = await loadAiAssistantPack()
    ai = pack[languageCode as AiAssistantLocaleCode]
  }

  return {
    ...enTranslations,
    ...localeTranslations,
    ...(ai ?? {}),
  }
}

/** Load a locale pack into memory (idempotent). English is always present. */
export async function ensureLanguageLoaded(code: string): Promise<void> {
  const languageCode = (LANGUAGE_CODES as readonly string[]).includes(code)
    ? (code as LanguageCode)
    : 'en'

  if (cache[languageCode]) return

  const existing = inflight.get(languageCode)
  if (existing) {
    await existing
    return
  }

  const task = (async () => {
    if (languageCode === 'en') {
      cache.en = enTranslations
      return
    }
    try {
      const partial = await localeLoaders[languageCode]()
      cache[languageCode] = await withEnglishFallback(partial, languageCode)
      clearChunkReloadFlag()
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
        await new Promise(() => {})
      }
      // Keep English fallback so boot can continue if reload already happened.
      console.warn(`[i18n] Failed to load locale "${languageCode}"`, error)
      cache[languageCode] = enTranslations
    }
  })()

  inflight.set(languageCode, task)
  try {
    await task
  } finally {
    inflight.delete(languageCode)
  }
}

/**
 * Sync lookup. Falls back to English until the locale pack is loaded.
 * Call `ensureLanguageLoaded` before first paint / on language change.
 */
export function getTranslation(languageCode: LanguageCode, key: TranslationKey): string {
  return cache[languageCode]?.[key] ?? enTranslations[key] ?? key
}

/**
 * Mutable map of loaded locale tables (grows as packs load).
 * Prefer `getTranslation` + `ensureLanguageLoaded` in app code.
 */
export const translations = cache as Record<LanguageCode, LocaleTable>
