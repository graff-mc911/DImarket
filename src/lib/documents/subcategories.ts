import type { DocumentsSubcategorySlug } from './types'

export const DOCUMENTS_SUBCATEGORY_SLUGS: readonly DocumentsSubcategorySlug[] = [
  'contracts-forms',
  'licenses-permits',
  'start-business',
  'docs-real-estate',
  'vehicles',
  'construction-repair',
  'work-professions',
  'legal-matters',
  'taxes-finance',
  'migration-residence',
  'government-procedures',
  'banks-finance',
  'personal-documents',
] as const

export function isDocumentsSubcategorySlug(value: string): value is DocumentsSubcategorySlug {
  return (DOCUMENTS_SUBCATEGORY_SLUGS as readonly string[]).includes(value)
}
