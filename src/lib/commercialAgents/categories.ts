/**
 * B2B product / industry categories for Commercial Agents.
 * Separate from construction trade taxonomy — soft overlap only.
 */

export const COMMERCIAL_CATEGORY_SLUGS = [
  'construction-materials',
  'flooring',
  'doors-windows',
  'hvac',
  'electrical',
  'plumbing',
  'tools',
  'machinery',
  'industrial-equipment',
  'metal-products',
  'furniture',
  'lighting',
  'insulation',
  'roofing',
  'facade',
  'paints-coatings',
  'bathroom',
  'kitchen',
  'automation',
  'automotive',
  'energy',
  'solar',
  'renewable-energy',
  'chemicals',
  'packaging',
  'other',
] as const

export type CommercialCategorySlug = (typeof COMMERCIAL_CATEGORY_SLUGS)[number]

/** Label keys live in i18n as commercialAgents.cat.<slug> */
export function commercialCategoryLabelKey(slug: string): string {
  return `commercialAgents.cat.${slug}`
}

export const COMMERCIAL_FOCUS_COUNTRIES = [
  'Spain',
  'Germany',
  'France',
  'Italy',
  'Portugal',
  'Netherlands',
  'Belgium',
  'Austria',
  'Czech Republic',
  'Poland',
  'Sweden',
  'Denmark',
  'Norway',
  'Finland',
  'United Kingdom',
  'Ireland',
  'Other Europe',
] as const
