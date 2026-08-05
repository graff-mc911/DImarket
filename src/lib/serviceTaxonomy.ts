/**
 * Hierarchical service taxonomy: Serviya marketing categories ↔ DImarket work slugs.
 * Powers expand → subcategory → results URLs without changing visual design.
 */

import { serviceCategories, type ServiceCategory, type ServiceSubcategory } from '../config/categories'

/** Work-slug prefixes (or exact slugs) that match a Serviya subcategory. */
export type WorkMatcher = {
  /** Prefix match: work slug starts with `${prefix}-` or equals prefix */
  prefixes?: string[]
  /** Exact work_subcategory_slugs */
  exact?: string[]
  /** Free-text needles matched against bio / category names (fallback) */
  keywords?: string[]
}

/**
 * Map Serviya subcategory slug → DB work matchers.
 * Keep in sync with profiles.work_subcategory_slugs used in directory imports.
 */
export const SUBCATEGORY_WORK_MATCHERS: Record<string, WorkMatcher> = {
  // Specialists
  electrician: {
    prefixes: ['electro'],
    keywords: [
      'electrician',
      'electrical',
      'electricista',
      'elektriker',
      'електрик',
      'электрик',
      'elektryk',
      'électricien',
    ],
  },
  plumber: {
    prefixes: ['plumbing'],
    keywords: [
      'plumber',
      'plumbing',
      'fontaner',
      'fontanero',
      'klempner',
      'сантехнік',
      'сантехник',
      'hydraulik',
      'plombier',
    ],
  },
  installer: { prefixes: ['windows', 'drywall', 'carpentry'], keywords: ['installer', 'installation'] },
  mason: { prefixes: ['masonry'], keywords: ['mason', 'brick', 'albañil'] },
  'concrete-worker': { prefixes: ['concrete'], keywords: ['concrete', 'бетон'] },
  welder: { prefixes: ['welding', 'metal'], keywords: ['welder', 'welding', 'soldador'] },
  roofer: { prefixes: ['roofing'], keywords: ['roof', 'roofer', 'tejados'] },
  painter: {
    prefixes: ['painting'],
    keywords: [
      'painter',
      'painting',
      'pintor',
      'maler',
      'маляр',
      'малярщик',
      'peintre',
    ],
  },
  tiler: {
    prefixes: ['tiling'],
    keywords: ['tiler', 'tiling', 'alicat', 'плиточник', 'fliesenleger'],
  },
  carpenter: { prefixes: ['carpentry'], keywords: ['carpenter', 'carpentry', 'carpinter'] },
  'architect-designer': {
    prefixes: ['design-engineering'],
    keywords: ['architect', 'interior design', 'designer'],
  },

  // Renovation
  'home-renovation': {
    prefixes: ['masonry', 'plumbing', 'electro', 'painting', 'tiling', 'drywall'],
    keywords: ['renovation', 'reforma'],
  },
  bathroom: { prefixes: ['plumbing', 'tiling'], keywords: ['bathroom', 'baño'] },
  kitchen: { prefixes: ['tiling', 'carpentry', 'plumbing'], keywords: ['kitchen', 'cocina'] },
  office: { prefixes: ['drywall', 'painting', 'electro'], keywords: ['office', 'oficina'] },
  pool: { keywords: ['pool', 'piscina'] },
  facade: { prefixes: ['facade', 'painting'], keywords: ['facade', 'fachada'] },
  'full-renovation': {
    prefixes: ['masonry', 'plumbing', 'electro', 'painting', 'tiling', 'drywall', 'demolition'],
    keywords: ['full renovation', 'reforma integral'],
  },

  // Construction
  'house-construction': { prefixes: ['masonry', 'concrete', 'roofing'], keywords: ['construction', 'construcción'] },
  'commercial-construction': { prefixes: ['masonry', 'concrete'], keywords: ['commercial construction'] },
  foundations: { prefixes: ['concrete', 'masonry'], keywords: ['foundation', 'ciment'] },
  'concrete-works': { prefixes: ['concrete'], keywords: ['concrete'] },
  earthworks: { prefixes: ['excavation', 'earth'], keywords: ['earthwork', 'excav'] },
  demolition: { prefixes: ['demolition'], keywords: ['demolition', 'demolición'] },
  'modular-houses': { keywords: ['modular'] },

  // HVAC
  'air-conditioning': { prefixes: ['hvac-ac'], exact: ['hvac-ac', 'hvac-ac-cleaning'], keywords: ['air conditioning', 'a/c', 'climat'] },
  'heat-pumps': { prefixes: ['hvac-heat'], exact: ['hvac-heat-pumps'], keywords: ['heat pump'] },
  ventilation: { prefixes: ['hvac-ventilation'], exact: ['hvac-ventilation', 'hvac-recuperation'], keywords: ['ventilation'] },
  'underfloor-heating': { prefixes: ['hvac-heating'], keywords: ['underfloor', 'suelo radiante'] },
  'hvac-service': { prefixes: ['hvac'], keywords: ['hvac', 'climatización'] },

  // Garden
  landscaping: { keywords: ['landscape', 'jardín', 'garden'] },
  lawn: { keywords: ['lawn', 'césped'] },
  irrigation: { keywords: ['irrigation', 'riego'] },
  'tree-care': { keywords: ['tree', 'arbor'] },
  pools: { keywords: ['pool', 'piscina'] },
  'garden-maintenance': { keywords: ['garden', 'jardiner'] },

  // Cleaning
  'house-cleaning': { prefixes: ['cleaning'], keywords: ['cleaning', 'limpieza'] },
  'office-cleaning': { prefixes: ['cleaning'], keywords: ['office cleaning'] },
  'post-construction-cleaning': {
    prefixes: ['cleaning'],
    exact: ['cleaning-post-renovation', 'cleaning-construction'],
    keywords: ['post construction', 'post-renovation'],
  },
  'window-cleaning': { prefixes: ['cleaning'], keywords: ['window cleaning'] },
  'waste-removal': { prefixes: ['cleaning', 'logistics'], keywords: ['waste', 'escombro'] },

  // Security
  cctv: { prefixes: ['electro-cameras'], keywords: ['cctv', 'camera', 'seguridad'] },
  'alarm-systems': { keywords: ['alarm'] },
  'fire-protection': { keywords: ['fire protection', 'incendio'] },
  'access-control': { keywords: ['access control'] },

  // Moving
  'apartment-moving': { prefixes: ['logistics'], keywords: ['moving', 'mudanza'] },
  'office-moving': { prefixes: ['logistics'], keywords: ['office moving', 'mudanza'] },
  movers: { prefixes: ['logistics'], exact: ['logistics-movers'], keywords: ['movers', 'porte'] },
  transport: { prefixes: ['logistics', 'transport'], keywords: ['transport'] },

  // Stores / manufacturers — soft keyword match
  'building-materials': { keywords: ['building materials', 'materials'] },
  'electrical-supplies': { keywords: ['electrical supplies'] },
  'plumbing-supplies': { keywords: ['plumbing supplies'] },
  tools: { keywords: ['tools', 'herramient'] },
  furniture: { prefixes: ['furniture'], keywords: ['furniture', 'muebles'] },
  lighting: { prefixes: ['electro-lighting'], keywords: ['lighting'] },
  'garden-equipment': { keywords: ['garden equipment'] },
  'furniture-manufacturers': { prefixes: ['furniture'], keywords: ['furniture manufacturer'] },
  'window-manufacturers': { prefixes: ['windows'], keywords: ['window manufacturer'] },
  'door-manufacturers': { prefixes: ['carpentry'], keywords: ['door manufacturer'] },
  'metal-structures': { keywords: ['metal structure'] },
  'concrete-products': { prefixes: ['concrete'], keywords: ['concrete product'] },

  // Rentals
  'construction-equipment': {
    prefixes: ['rent-'],
    exact: ['rent-excavator', 'rent-mini-excavator', 'rent-scaffolding', 'rent-lifts'],
    keywords: ['equipment rental', 'alquiler de maquinaria'],
  },
  'tool-rental': { exact: ['rent-tools'], prefixes: ['rent-'], keywords: ['tool rental'] },
  'car-rental': { keywords: ['car rental'] },
  'trailer-rental': { keywords: ['trailer rental'] },
  'generator-rental': { exact: ['rent-generators'], keywords: ['generator'] },

  // Buy & Sell (marketplace listings)
  'buy-sell-for-sale': {
    prefixes: ['sell-', 'rent-'],
    keywords: ['for sale', 'buy', 'sell', 'marketplace', 'item_sale'],
  },
  'buy-sell-wanted': {
    prefixes: ['sell-', 'rent-'],
    keywords: ['wanted', 'looking for', 'item_wanted'],
  },
  'buy-sell-equipment-rental': {
    prefixes: ['rent-'],
    exact: ['rent-excavator', 'rent-mini-excavator', 'rent-scaffolding', 'rent-lifts', 'rent-tools', 'rent-generators'],
    keywords: ['equipment rental', 'tool rental'],
  },
  'buy-sell-property': {
    prefixes: ['sell-property', 'rent-property'],
    keywords: ['property', 'real estate', 'apartment for sale'],
  },

  // Jobs / vacancies
  'jobs-vacancies': {
    prefixes: ['vacancies'],
    keywords: ['vacancy', 'vacancies', 'job', 'hiring', 'employment'],
  },
  'jobs-hiring': {
    prefixes: ['vacancies'],
    keywords: ['hiring', 'job offer', 'we are hiring', 'vacancy'],
  },

  // Automotive
  'auto-repair': { prefixes: ['electrical-auto'], exact: ['electrical-auto-repair'], keywords: ['auto repair', 'taller'] },
  'auto-electrician': {
    exact: ['electrical-auto-electrician'],
    prefixes: ['electrical-auto'],
    keywords: ['auto electrician'],
  },
  'body-repair': { keywords: ['body repair', 'chapa'] },
  'tire-service': { exact: ['electrical-tires'], keywords: ['tire', 'neumático'] },
  towing: { exact: ['electrical-towing'], keywords: ['towing', 'grúa'] },

  // Home services
  handyman: { prefixes: ['handyman'], keywords: ['handyman', 'manitas'] },
  'furniture-assembly': {
    prefixes: ['furniture', 'handyman-assembly'],
    exact: ['furniture-assembly', 'handyman-assembly'],
    keywords: ['furniture assembly', 'montaje'],
  },

  // Accounting
  accountant: { prefixes: ['accounting-finance'], keywords: ['accountant', 'contab', 'asesor'] },
  'tax-consultant': {
    prefixes: ['accounting-finance'],
    exact: ['accounting-finance-tax'],
    keywords: ['tax', 'fiscal'],
  },
  auditor: { prefixes: ['accounting-finance'], keywords: ['auditor'] },
  'financial-consultant': {
    exact: ['accounting-finance-advisory'],
    prefixes: ['accounting-finance'],
    keywords: ['financial consultant'],
  },
  payroll: { exact: ['accounting-finance-payroll'], keywords: ['payroll', 'nómina'] },
  'aut-nomo-accounting': {
    exact: ['accounting-finance-autonomo'],
    prefixes: ['accounting-finance'],
    keywords: ['autónomo', 'autonomo'],
  },
  'business-consulting': { prefixes: ['accounting-finance'], keywords: ['business consulting', 'gestoría'] },

  // Real estate
  'buy-property': { exact: ['sell-property'], prefixes: ['sell-'], keywords: ['buy property', 'inmobiliaria'] },
  'sell-property': { exact: ['sell-property'], prefixes: ['sell-'], keywords: ['sell property'] },
  'rent-property': { exact: ['rent-property'], prefixes: ['rent-'], keywords: ['rent property', 'alquiler'] },
  'commercial-property': {
    exact: ['sell-commercial', 'rent-commercial'],
    keywords: ['commercial property', 'local'],
  },
  land: { keywords: ['land', 'terreno'] },

  // Architecture
  architect: { exact: ['design-engineering-architect'], prefixes: ['design-engineering'], keywords: ['architect'] },
  'interior-designer': {
    exact: ['design-engineering-interior'],
    prefixes: ['design-engineering'],
    keywords: ['interior'],
  },
  'landscape-designer': { keywords: ['landscape designer'] },
  '3d-visualization': { exact: ['design-engineering-3d'], keywords: ['3d', 'visualization'] },
  'building-design': { prefixes: ['design-engineering'], keywords: ['building design'] },
  'bim-design': { keywords: ['bim'] },

  // Engineering
  'structural-engineer': {
    exact: ['design-engineering-structural'],
    prefixes: ['design-engineering'],
    keywords: ['structural'],
  },
  surveyor: { keywords: ['surveyor', 'topógraf'] },
  geologist: { keywords: ['geologist'] },
  'energy-audit': { keywords: ['energy audit'] },
  'technical-supervision': { keywords: ['technical supervision', 'supervision'] },

  // Legal
  lawyer: { prefixes: ['legal-notary'], keywords: ['lawyer', 'abogado', 'attorney'] },
  attorney: { prefixes: ['legal-notary'], keywords: ['attorney', 'lawyer', 'abogado'] },
  notary: { exact: ['legal-notary-notary'], prefixes: ['legal-notary'], keywords: ['notary', 'notario'] },
  'immigration-lawyer': {
    exact: ['legal-notary-immigration'],
    prefixes: ['legal-notary'],
    keywords: ['immigration', 'extranjería'],
  },
  'company-registration': {
    exact: ['legal-notary-company'],
    prefixes: ['legal-notary'],
    keywords: ['company registration', 'constitución'],
  },
  'court-representation': { prefixes: ['legal-notary'], keywords: ['court', 'litigation'] },
  'tax-lawyer': { exact: ['legal-notary-tax'], prefixes: ['legal-notary'], keywords: ['tax lawyer'] },
}

/** Short top-level SEO paths that resolve to a subcategory slug. */
export const SEO_SERVICE_ALIASES: Record<string, string> = {
  electrician: 'electrician',
  plumber: 'plumber',
  painter: 'painter',
  tiler: 'tiler',
  carpenter: 'carpenter',
  roofer: 'roofer',
  drywall: 'installer',
  windows: 'installer',
  roofing: 'roofer',
  hvac: 'hvac-service',
  cleaning: 'house-cleaning',
  moving: 'apartment-moving',
  handyman: 'handyman',
  lawyer: 'lawyer',
  accountant: 'accountant',
  architect: 'architect-designer',
  renovation: 'home-renovation',
  electricista: 'electrician',
  fontanero: 'plumber',
  pintor: 'painter',
  abogado: 'lawyer',
  contador: 'accountant',
}

export type ResolvedService = {
  category: ServiceCategory
  subcategory: ServiceSubcategory
  matcher: WorkMatcher
}

export function findServiceBySlug(slug: string): ResolvedService | null {
  const normalized = slug.trim().toLowerCase()
  const aliased = SEO_SERVICE_ALIASES[normalized] ?? normalized

  for (const category of serviceCategories) {
    const subcategory = category.subcategories.find(
      (s) => s.slug === aliased || s.id === aliased || s.slug === normalized,
    )
    if (subcategory) {
      const matcher = SUBCATEGORY_WORK_MATCHERS[subcategory.slug] ?? {
        keywords: [subcategory.title.en.toLowerCase(), subcategory.slug.replace(/-/g, ' ')],
      }
      return { category, subcategory, matcher }
    }
  }
  return null
}

export function findCategoryBySlug(slug: string): ServiceCategory | null {
  return serviceCategories.find((c) => c.slug === slug || c.id === slug) ?? null
}

export function servicesPath(subcategorySlug: string, opts?: { location?: string; role?: string }): string {
  const params = new URLSearchParams()
  if (opts?.location && opts.location !== 'all-europe') params.set('location', opts.location)
  if (opts?.role && opts.role !== 'all') params.set('role', opts.role)
  const qs = params.toString()
  return qs ? `/services/${subcategorySlug}?${qs}` : `/services/${subcategorySlug}`
}

/** Prefer short SEO alias when available. */
export function serviceCanonicalPath(subcategorySlug: string): string {
  const alias = Object.entries(SEO_SERVICE_ALIASES).find(([, target]) => target === subcategorySlug)?.[0]
  if (alias && alias === subcategorySlug) return `/${alias}`
  if (alias) return `/${alias}`
  return `/services/${subcategorySlug}`
}

export function matchesWorkSlugs(workSlugs: string[] | null | undefined, matcher: WorkMatcher): boolean {
  const works = workSlugs ?? []
  if (!works.length && !matcher.keywords?.length) return false

  for (const w of works) {
    if (matcher.exact?.includes(w)) return true
    for (const prefix of matcher.prefixes ?? []) {
      if (w === prefix || w.startsWith(`${prefix}-`) || w.startsWith(prefix)) return true
    }
  }
  return false
}

export function matchesServiceProfile(
  profile: {
    work_subcategory_slugs?: string[] | null
    bio?: string | null
    full_name?: string | null
    professional_categories?: { category?: { name?: string | null; slug?: string | null } | null }[]
  },
  matcher: WorkMatcher,
): boolean {
  if (matchesWorkSlugs(profile.work_subcategory_slugs, matcher)) return true

  const keywords = matcher.keywords ?? []
  if (!keywords.length) return false

  const haystack = [
    profile.bio ?? '',
    profile.full_name ?? '',
    ...(profile.professional_categories ?? []).flatMap((pc) => [
      pc.category?.name ?? '',
      pc.category?.slug ?? '',
    ]),
  ]
    .join(' ')
    .toLowerCase()

  return keywords.some((k) => haystack.includes(k.toLowerCase()))
}

export function allSubcategorySlugs(): string[] {
  return serviceCategories.flatMap((c) => c.subcategories.map((s) => s.slug))
}

/** Normalize query for lexicon matching (lowercase, trim, collapse spaces). */
function normalizeSearchNeedle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Build a lexicon of profession / service terms from taxonomy titles + keywords.
 * Used to keep Nominatim away from service queries.
 */
export function collectServiceLexicon(): Set<string> {
  const set = new Set<string>()
  const add = (raw: string) => {
    const n = normalizeSearchNeedle(raw)
    if (n.length >= 3) set.add(n)
  }

  for (const [slug, matcher] of Object.entries(SUBCATEGORY_WORK_MATCHERS)) {
    add(slug.replace(/-/g, ' '))
    for (const k of matcher.keywords ?? []) add(k)
    for (const p of matcher.prefixes ?? []) add(p.replace(/-/g, ' '))
  }
  for (const alias of Object.keys(SEO_SERVICE_ALIASES)) add(alias)

  for (const category of serviceCategories) {
    for (const title of Object.values(category.title)) add(String(title))
    for (const sub of category.subcategories) {
      add(sub.slug.replace(/-/g, ' '))
      for (const title of Object.values(sub.title)) add(String(title))
    }
  }

  // Common multilingual profession tokens not always present in titles
  for (const extra of [
    'електрик',
    'электрик',
    'сантехнік',
    'сантехник',
    'маляр',
    'малярщик',
    'плиточник',
    'юрист',
    'адвокат',
    'бухгалтер',
  ]) {
    add(extra)
  }

  return set
}

let cachedServiceLexicon: Set<string> | null = null

/** True when the query is a known profession/service term — never geocode these. */
export function isServiceKeyword(query: string): boolean {
  const q = normalizeSearchNeedle(query)
  if (q.length < 2) return false
  if (!cachedServiceLexicon) cachedServiceLexicon = collectServiceLexicon()
  if (cachedServiceLexicon.has(q)) return true
  // Prefix / contains: "электрик в дармштадте" still starts with a profession token
  for (const term of cachedServiceLexicon) {
    if (term.length < 4) continue
    if (q === term || q.startsWith(`${term} `) || q.endsWith(` ${term}`) || q.includes(` ${term} `)) {
      return true
    }
  }
  return false
}

/**
 * Resolve a free-text service query to taxonomy entries (DB-first service index).
 * Never involves geocoding.
 */
export function resolveServiceQuery(query: string): ResolvedService[] {
  const q = normalizeSearchNeedle(query)
  if (q.length < 2) return []

  const hits: Array<ResolvedService & { score: number }> = []

  for (const category of serviceCategories) {
    for (const subcategory of category.subcategories) {
      const matcher = SUBCATEGORY_WORK_MATCHERS[subcategory.slug] ?? {
        keywords: [subcategory.title.en.toLowerCase(), subcategory.slug.replace(/-/g, ' ')],
      }
      const needles = [
        subcategory.slug.replace(/-/g, ' '),
        subcategory.id,
        ...Object.values(subcategory.title).map((t) => String(t).toLowerCase()),
        ...(matcher.keywords ?? []).map((k) => k.toLowerCase()),
        ...(SEO_SERVICE_ALIASES[subcategory.slug] ? [subcategory.slug] : []),
      ]
      // Also match SEO aliases that point to this subcategory
      for (const [alias, target] of Object.entries(SEO_SERVICE_ALIASES)) {
        if (target === subcategory.slug) needles.push(alias)
      }

      let score = 0
      for (const needle of needles) {
        const n = needle.toLowerCase()
        if (!n) continue
        if (n === q) score = Math.max(score, 100)
        else if (n.startsWith(q) || q.startsWith(n)) score = Math.max(score, 80)
        else if (n.includes(q) || q.includes(n)) score = Math.max(score, 50)
      }
      if (score > 0) {
        hits.push({ category, subcategory, matcher, score })
      }
    }
  }

  hits.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const unique: ResolvedService[] = []
  for (const hit of hits) {
    if (seen.has(hit.subcategory.slug)) continue
    seen.add(hit.subcategory.slug)
    unique.push({ category: hit.category, subcategory: hit.subcategory, matcher: hit.matcher })
  }
  return unique
}

export function isReservedAppPath(segment: string): boolean {
  const reserved = new Set([
    'services',
    'professionals',
    'companies',
    'listings',
    'category',
    'professional',
    'listing',
    'profile',
    'login',
    'register',
    'settings',
    'dashboard',
    'admin',
    'search',
    'map',
    'contact',
    'advertise',
    'advertising',
    'vacancies',
    'sell-rent',
    'jobs',
    'buy-sell',
    'api',
    'assets',
    'auth',
    'book',
    'project',
    'create-project',
    'create-ad',
    'cost-estimator',
    'estimate',
    'messages',
    'favorites',
    'notifications',
    'pricing',
    'billing',
    'checkout',
    'verification',
    'analytics',
    'ai',
  ])
  return reserved.has(segment.toLowerCase())
}
