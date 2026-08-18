import type { TranslateFn, TranslationKey } from '../i18n'
import type { DocumentRecord } from './types'

export function documentDisplayTitle(
  doc: DocumentRecord,
  langCode: string,
  t: TranslateFn,
): string {
  // Official / model blank name (native) beats generic i18n titles
  if (doc.officialForm?.modelName) return doc.officialForm.modelName
  if (langCode === 'uk' && doc.titleUk) return doc.titleUk
  if (doc.titleEn) return doc.titleEn
  return t(doc.titleKey as TranslationKey)
}

export function documentDisplayDescription(
  doc: DocumentRecord,
  langCode: string,
  t: TranslateFn,
): string {
  if (doc.officialForm) {
    return langCode === 'en' ? doc.officialForm.noticeEn : doc.officialForm.noticeLocal
  }
  if (langCode === 'uk' && doc.descriptionUk) return doc.descriptionUk
  if (doc.descriptionEn) return doc.descriptionEn
  return t(doc.descriptionKey as TranslationKey)
}
