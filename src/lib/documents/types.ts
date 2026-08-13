/**
 * Documents & Procedures — shared types.
 * Jurisdiction-first: never one universal legal body for all countries.
 */

export type DocumentStatus = 'active' | 'outdated' | 'draft' | 'under_review'

export type DocumentType =
  | 'contract_form'
  | 'license'
  | 'permit'
  | 'procedure'
  | 'checklist'
  | 'informational'

export type LicenseRequirementLevel =
  | 'required'
  | 'not_required'
  | 'depends_on_activity'
  | 'depends_on_region'
  | 'depends_on_qualification'
  | 'unknown'

export type DocumentsSubcategorySlug =
  | 'contracts-forms'
  | 'licenses-permits'
  | 'start-business'
  | 'docs-real-estate'
  | 'vehicles'
  | 'construction-repair'
  | 'work-professions'
  | 'legal-matters'
  | 'taxes-finance'
  | 'migration-residence'
  | 'government-procedures'
  | 'banks-finance'
  | 'personal-documents'

export type FormFieldType = 'text' | 'textarea' | 'date' | 'number' | 'email' | 'phone' | 'select'

export type FormFieldDef = {
  id: string
  labelKey: string
  type: FormFieldType
  required?: boolean
  /** Autofill from signed-in DImarket profile */
  profileKey?:
    | 'full_name'
    | 'phone'
    | 'email'
    | 'location'
    | 'company_name'
  options?: Array<{ value: string; labelKey: string }>
  placeholderKey?: string
}

export type OfficialSourceRef = {
  name: string
  url: string
  lastVerified: string | null
}

export type ProcedureStep = {
  id: string
  titleKey: string
  bodyKey: string
  whatIsKey?: string
  whatNeededKey?: string
  whereKey?: string
  source?: OfficialSourceRef
}

export type SpecialistLink = {
  labelKey: string
  searchQuery: string
  categorySlug?: string
}

export type DocumentRecord = {
  id: string
  slug: string
  titleKey: string
  descriptionKey: string
  subcategory: DocumentsSubcategorySlug
  countryCode: string
  countrySlug: string
  region: string | null
  province: string | null
  city: string | null
  jurisdiction: string
  language: string
  availableLanguages: string[]
  originalLanguage: string
  documentType: DocumentType
  status: DocumentStatus
  version: string
  effectiveDate: string | null
  lastVerified: string | null
  source: OfficialSourceRef
  requirementsKeys: string[]
  formFields?: FormFieldDef[]
  /** true = fillable skeleton only; body is not verified legal text */
  templateNeedsLegalReview: boolean
  licenseRequirement?: LicenseRequirementLevel
  issuerKey?: string
  costKey?: string
  durationKey?: string
  procedureSteps?: ProcedureStep[]
  specialists: SpecialistLink[]
  monetizationTier: 'free' | 'premium_document' | 'professional_assistance' | 'legal_review' | 'business_setup'
  seoTitleKey: string
  seoDescriptionKey: string
  /** Optional localized display (for generated EU packs) */
  titleEn?: string
  titleUk?: string
  descriptionEn?: string
  descriptionUk?: string
}

export function documentSeoPath(doc: Pick<DocumentRecord, 'countrySlug' | 'city' | 'slug'>): string {
  const city = doc.city ? `/${slugifyPart(doc.city)}` : ''
  return `/documents/${doc.countrySlug}${city}/${doc.slug}`
}

export function slugifyPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
