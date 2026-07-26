export type CompanyCategorySlug =
  | 'construction-companies'
  | 'renovation-companies'
  | 'architects'
  | 'engineering'
  | 'interior-design'
  | 'building-material-stores'
  | 'electrical-stores'
  | 'plumbing-stores'
  | 'tool-stores'
  | 'roofing-suppliers'
  | 'hvac-suppliers'
  | 'solar-companies'
  | 'window-door-companies'
  | 'furniture-companies'
  | 'landscape-companies'
  | 'pool-companies'
  | 'smart-home-companies'

export type CompanyCategory = {
  slug: CompanyCategorySlug
  labelKey: string
  icon: string
}

export const COMPANY_CATEGORIES: CompanyCategory[] = [
  { slug: 'construction-companies', labelKey: 'companiesDir.cat.construction', icon: '🏗️' },
  { slug: 'renovation-companies', labelKey: 'companiesDir.cat.renovation', icon: '🔧' },
  { slug: 'architects', labelKey: 'companiesDir.cat.architects', icon: '📐' },
  { slug: 'engineering', labelKey: 'companiesDir.cat.engineering', icon: '⚙️' },
  { slug: 'interior-design', labelKey: 'companiesDir.cat.interior', icon: '🛋️' },
  { slug: 'building-material-stores', labelKey: 'companiesDir.cat.materials', icon: '🧱' },
  { slug: 'electrical-stores', labelKey: 'companiesDir.cat.electrical', icon: '⚡' },
  { slug: 'plumbing-stores', labelKey: 'companiesDir.cat.plumbing', icon: '🚰' },
  { slug: 'tool-stores', labelKey: 'companiesDir.cat.tools', icon: '🛠️' },
  { slug: 'roofing-suppliers', labelKey: 'companiesDir.cat.roofing', icon: '🏠' },
  { slug: 'hvac-suppliers', labelKey: 'companiesDir.cat.hvac', icon: '❄️' },
  { slug: 'solar-companies', labelKey: 'companiesDir.cat.solar', icon: '☀️' },
  { slug: 'window-door-companies', labelKey: 'companiesDir.cat.windows', icon: '🪟' },
  { slug: 'furniture-companies', labelKey: 'companiesDir.cat.furniture', icon: '🪑' },
  { slug: 'landscape-companies', labelKey: 'companiesDir.cat.landscape', icon: '🌿' },
  { slug: 'pool-companies', labelKey: 'companiesDir.cat.pools', icon: '🏊' },
  { slug: 'smart-home-companies', labelKey: 'companiesDir.cat.smartHome', icon: '🏡' },
]

export function companyCategoryLabel(
  slug: string,
  t: (key: string) => string,
): string {
  const cat = COMPANY_CATEGORIES.find((c) => c.slug === slug)
  if (!cat) return slug
  const label = t(cat.labelKey)
  return label === cat.labelKey ? slug : label
}
