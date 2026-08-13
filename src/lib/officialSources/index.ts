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
  COUNTRY_SOURCES_BY_CODE,
  getCountrySources,
  listCountrySources,
  type CountrySourcesConfig,
} from './countrySources'

export {
  formatGeneratedDocumentFooter,
  generatedDocumentFooterHtml,
  type GeneratedDocumentMeta,
} from './pdfMeta'
