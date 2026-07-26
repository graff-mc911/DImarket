export {
  recordProfileView,
  fetchPlatformAnalytics,
  fetchProAnalytics,
  formatEuro,
  formatHours,
  type AnalyticsKpis,
  type AnalyticsSeries,
} from './analytics'

export {
  rangeFromPreset,
  lastNDayKeys,
  sparseLabels,
  DATE_PRESET_OPTIONS,
  type DatePreset,
  type AnalyticsDateRange,
} from './dateRange'

export {
  exportCsv,
  exportExcel,
  exportPdfPrint,
  printAnalyticsElement,
  rowsFromKpis,
} from './export'

export { recordSearchEvent } from './trackSearch'
export { useAnalyticsRealtime } from './useAnalyticsRealtime'
export { analyticsCacheGet, analyticsCacheSet, analyticsCacheInvalidate } from './cache'

export {
  fetchProfessionalBundle,
  fetchCustomerBundle,
  fetchCompanyBundle,
  fetchAdminBundle,
  fetchSearchBundle,
  fetchCategoryBundle,
  fetchMapAnalyticsPoints,
} from './bundles'
