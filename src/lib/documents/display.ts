import type { DocumentRecord } from './types'

export function documentDisplayTitle(
  doc: DocumentRecord,
  langCode: string,
  t: (key: string) => string,
): string {
  if (langCode === 'uk' && doc.titleUk) return doc.titleUk
  if (doc.titleEn) return doc.titleEn
  return t(doc.titleKey)
}

export function documentDisplayDescription(
  doc: DocumentRecord,
  langCode: string,
  t: (key: string) => string,
): string {
  if (langCode === 'uk' && doc.descriptionUk) return doc.descriptionUk
  if (doc.descriptionEn) return doc.descriptionEn
  return t(doc.descriptionKey)
}
