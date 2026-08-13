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
} from './core'

export {
  SPAIN_COUNTRY_SOURCES,
  COUNTRY_SOURCES_BY_CODE,
  getCountrySources,
  type CountrySourcesConfig,
} from './countrySources'

export {
  formatGeneratedDocumentFooter,
  generatedDocumentFooterHtml,
  type GeneratedDocumentMeta,
} from './pdfMeta'
