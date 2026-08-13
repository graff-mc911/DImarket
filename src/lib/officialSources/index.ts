export type {
  VerificationStatus,
  FreshnessTone,
  SourceType,
  DocumentVersionLike,
} from './core'

export {
  normalizeSourceContent,
  fingerprintHash,
  sha256Hex,
  hashNormalizedContent,
  excerptNormalized,
  hashesEqual,
  detectChangeType,
  severityForChange,
  nextVerificationAt,
  isVerificationOverdue,
  resolveCurrentVersion,
  findFutureVersion,
  freshnessFromStatuses,
  trustLabelKey,
  simpleLineDiff,
  SPAIN_SOURCE_PRIORITY,
  compareSourcePriority,
  publishedVersionIdsToSupersede,
  canRollbackToVersion,
} from './core'

export {
  SPAIN_COUNTRY_SOURCES,
  GERMANY_COUNTRY_SOURCES,
  FRANCE_COUNTRY_SOURCES,
  POLAND_COUNTRY_SOURCES,
  ITALY_COUNTRY_SOURCES,
  PORTUGAL_COUNTRY_SOURCES,
  ROMANIA_COUNTRY_SOURCES,
  NETHERLANDS_COUNTRY_SOURCES,
  CZECHIA_COUNTRY_SOURCES,
  HUNGARY_COUNTRY_SOURCES,
  BULGARIA_COUNTRY_SOURCES,
  COUNTRY_SOURCES_BY_CODE,
  getCountrySources,
  listCountrySources,
  type CountrySourcesConfig,
} from './countrySources'

export {
  autoDraftVersionNumber,
  buildAutoDraftMarkdown,
  isAutoDraftVersion,
} from './autoDraft'

export {
  buildOfficialPointerMarkdown,
  POINTER_VERSION_NUMBER,
} from './pointerTemplate'

export {
  buildRentalTemplateMarkdown,
  RENTAL_DRAFT_VERSION,
} from './rentalTemplate'

export {
  formatGeneratedDocumentFooter,
  generatedDocumentFooterHtml,
  type GeneratedDocumentMeta,
} from './pdfMeta'

export {
  buildLegalDocumentPdfHtml,
  openLegalDocumentPdfPrint,
  legalDocumentPdfFilename,
  type LegalDocumentPdfInput,
} from './legalDocumentPdf'

export {
  myersLineDiff,
  summarizeLineDiff,
  lineDiffSides,
  type LineDiffOp,
} from './lineDiff'

export {
  STATIC_OFFICIAL_DOCUMENTS,
  getStaticOfficialDocument,
  type StaticOfficialDoc,
} from './staticCatalog'
