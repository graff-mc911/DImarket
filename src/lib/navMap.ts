/**
 * Navigation Single Source of Truth.
 *
 * All chrome surfaces (mobile bar, More sheet, header, footer) and route
 * aliases should be defined here. Components map icons/layout only.
 *
 * Canonical paths are preferred in links; aliases stay for bookmarks/SEO.
 */

import type { TranslationKey } from './i18n'

export type NavSurface =
  | 'mobile-bar'
  | 'mobile-more'
  | 'mobile-account'
  | 'header-dept'
  | 'header-dept-extra'
  | 'header-center'
  | 'footer-company'
  | 'footer-services'
  | 'footer-professionals'
  | 'footer-support'

export type NavEntry = {
  id: string
  /** Preferred path for new links. */
  path: string
  /** Optional legacy / SEO aliases that resolve to the same page. */
  aliases?: readonly string[]
  /** Default label (mobile / shared). */
  labelKey: TranslationKey
  /** Per-surface label overrides (keeps existing Header/Footer copy). */
  labelKeyBySurface?: Partial<Record<NavSurface, TranslationKey>>
  surfaces: readonly NavSurface[]
  /** When true, path depends on auth (resolved in the surface component). */
  authAware?: boolean
  /** When true, only render for the site owner (ivan.sovban@gmail.com / is_site_owner). */
  ownerOnly?: boolean
}

/**
 * Primary app destinations. Order within each surface is preserved by filter.
 */
export const NAV_ENTRIES: readonly NavEntry[] = [
  // —— Mobile bottom bar ——
  { id: 'home', path: '/', labelKey: 'nav.home', surfaces: ['mobile-bar'] },
  {
    id: 'search',
    path: '/listings',
    aliases: ['/search'],
    labelKey: 'nav.search',
    labelKeyBySurface: {
      'footer-services': 'footer.browseListings',
      'header-dept-extra': 'header.todaysDeals',
    },
    surfaces: ['mobile-bar', 'footer-services', 'header-dept-extra'],
  },
  {
    id: 'categories',
    path: '/categories',
    labelKey: 'nav.categories',
    surfaces: ['mobile-bar'],
  },
  {
    id: 'map',
    path: '/map',
    labelKey: 'nav.map',
    labelKeyBySurface: { 'header-dept': 'header.map' },
    surfaces: ['mobile-bar'],
  },
  { id: 'more', path: '#more', labelKey: 'nav.more', surfaces: ['mobile-bar'] },

  // —— Mobile More (primary) ——
  {
    id: 'trending',
    path: '/listings',
    labelKey: 'nav.trendingRequests',
    surfaces: ['mobile-more'],
  },
  {
    id: 'professionals',
    path: '/professionals',
    labelKey: 'nav.professionals',
    labelKeyBySurface: {
      'header-dept': 'header.findProfessionals',
      'footer-professionals': 'header.findProfessionals',
    },
    surfaces: ['mobile-more', 'header-dept', 'footer-professionals'],
  },
  {
    id: 'companies',
    path: '/companies',
    labelKey: 'nav.companies',
    labelKeyBySurface: { 'header-dept': 'header.findCompanies' },
    surfaces: ['mobile-more', 'header-dept'],
  },
  {
    id: 'manufacturers',
    path: '/category/manufacturers',
    labelKey: 'nav.manufacturers',
    labelKeyBySurface: {
      'header-dept': 'header.manufacturers',
      'footer-services': 'footer.manufacturers',
      'mobile-more': 'nav.manufacturers',
    },
    surfaces: ['mobile-more', 'header-dept', 'footer-services'],
  },
  {
    id: 'commercial-agents',
    path: '/commercial-agents',
    labelKey: 'nav.commercialAgents',
    labelKeyBySurface: {
      'header-dept': 'header.commercialAgents',
      'footer-services': 'footer.commercialAgents',
      'footer-professionals': 'footer.commercialAgents',
      'mobile-more': 'nav.commercialAgents',
    },
    surfaces: ['mobile-more', 'footer-services', 'footer-professionals'],
  },
  {
    id: 'documents-procedures',
    path: '/documents',
    aliases: ['/category/documents-procedures', '/category/official-documents', '/legal-documents'],
    labelKey: 'nav.documentsProcedures',
    labelKeyBySurface: {
      'header-dept': 'header.documentsProcedures',
      'footer-support': 'footer.documentsProcedures',
      'mobile-more': 'nav.documentsProcedures',
    },
    // Not promoted in public chrome (empty 0 masters/companies card removed).
    // /documents routes and catalog remain available for deep links / future use.
    surfaces: [],
  },
  {
    id: 'jobs',
    path: '/vacancies',
    aliases: ['/jobs'],
    labelKey: 'nav.jobs',
    labelKeyBySurface: { 'header-dept': 'header.jobs' },
    surfaces: ['mobile-more', 'header-dept'],
  },
  {
    id: 'publish-request',
    path: '/create-project',
    aliases: ['/project/new'],
    labelKey: 'nav.publishRequest',
    labelKeyBySurface: {
      'footer-services': 'homePremium.postProject',
      'header-dept-extra': 'header.postJob',
    },
    surfaces: ['mobile-more', 'footer-services'],
  },
  {
    id: 'cost-estimator',
    path: '/cost-estimator',
    aliases: ['/estimate'],
    labelKey: 'nav.costEstimator',
    labelKeyBySurface: { 'header-dept-extra': 'header.costEstimator' },
    surfaces: ['mobile-more', 'header-dept-extra'],
  },
  {
    id: 'publish',
    path: '/create-ad',
    labelKey: 'nav.publish',
    labelKeyBySurface: {
      'footer-services': 'header.sell',
      'header-dept-extra': 'header.sell',
    },
    surfaces: ['mobile-more', 'footer-services', 'header-dept-extra'],
  },
  {
    id: 'pricing',
    path: '/pricing',
    aliases: ['/plans'],
    labelKey: 'nav.pricing',
    labelKeyBySurface: {
      'footer-company': 'footer.pricing',
      'header-dept-extra': 'header.pricing',
    },
    surfaces: ['mobile-more', 'footer-company'],
  },
  {
    id: 'assistant',
    path: '/assistant',
    labelKey: 'nav.aiAssistant',
    labelKeyBySurface: {
      'footer-services': 'header.aiAssistant',
      'header-dept-extra': 'header.aiAssistant',
    },
    surfaces: ['mobile-more', 'footer-services'],
  },
  {
    id: 'analytics',
    path: '/analytics',
    labelKey: 'nav.analytics',
    labelKeyBySurface: { 'header-dept-extra': 'header.analytics' },
    surfaces: ['mobile-more', 'header-dept-extra'],
  },
  {
    id: 'marketplace',
    path: '/sell-rent',
    aliases: ['/buy-sell'],
    labelKey: 'nav.marketplace',
    surfaces: ['mobile-more'],
  },
  {
    id: 'projects',
    path: '/projects',
    aliases: ['/leads'],
    labelKey: 'nav.projects',
    surfaces: ['mobile-more'],
  },

  // —— Mobile account sheet ——
  {
    id: 'owner-dashboard',
    path: '/dashboard',
    labelKey: 'header.dashboard',
    surfaces: ['mobile-account'],
    authAware: true,
    ownerOnly: true,
  },
  {
    id: 'owner-ai',
    path: '/admin/ai',
    labelKey: 'ai.admin.title',
    surfaces: ['mobile-account'],
    authAware: true,
    ownerOnly: true,
  },
  {
    id: 'owner-marketing',
    path: '/admin/marketing-agent',
    labelKey: 'header.marketingAgent',
    surfaces: ['mobile-account'],
    authAware: true,
    ownerOnly: true,
  },
  {
    id: 'owner-official-sources',
    path: '/admin/official-sources',
    labelKey: 'header.officialSources',
    surfaces: ['mobile-account'],
    authAware: true,
    ownerOnly: true,
  },
  {
    id: 'favorites',
    path: '/favorites',
    labelKey: 'nav.favorites',
    surfaces: ['mobile-account'],
    authAware: true,
  },
  {
    id: 'my-projects',
    path: '/my-projects',
    labelKey: 'header.myProjects',
    surfaces: ['mobile-account', 'mobile-more'],
    authAware: true,
  },
  {
    id: 'messages',
    path: '/messages',
    labelKey: 'nav.messages',
    surfaces: ['mobile-account'],
    authAware: true,
  },
  {
    id: 'settings',
    path: '/settings',
    labelKey: 'header.settings',
    surfaces: ['mobile-account'],
    authAware: true,
  },
  {
    id: 'profile',
    path: '/profile',
    labelKey: 'nav.profile',
    surfaces: ['mobile-account'],
    authAware: true,
  },

  // —— Header center / footer extras ——
  {
    id: 'advertising',
    path: '/advertising',
    aliases: ['/advertise'],
    labelKey: 'footer.adsButton',
    labelKeyBySurface: { 'footer-company': 'footer.advertisingLink' },
    surfaces: ['header-center', 'footer-company'],
  },
  {
    id: 'contact',
    path: '/contact',
    labelKey: 'footer.contactButton',
    labelKeyBySurface: {
      'footer-company': 'footer.contactLink',
      'header-dept-extra': 'header.customerService',
    },
    surfaces: ['header-center', 'footer-company'],
  },
  {
    id: 'login',
    path: '/login',
    labelKey: 'footer.signIn',
    surfaces: ['header-center'],
  },
  {
    id: 'register',
    path: '/register',
    labelKey: 'footer.register',
    surfaces: ['header-center', 'footer-professionals'],
  },
  {
    id: 'about',
    path: '/contact',
    labelKey: 'footer.about',
    surfaces: ['footer-company'],
  },
  {
    id: 'how-it-works-footer',
    path: '/for-professionals',
    labelKey: 'footer.howItWorks',
    surfaces: ['footer-company'],
  },
  {
    id: 'advanced-search',
    path: '/search',
    labelKey: 'advancedSearch.title',
    surfaces: ['footer-services'],
  },
  {
    id: 'for-companies',
    path: '/for-companies',
    labelKey: 'footer.forCompanies',
    surfaces: ['footer-professionals'],
  },
  {
    id: 'verification',
    path: '/verification',
    labelKey: 'footer.verification',
    surfaces: ['footer-professionals'],
  },
  {
    id: 'for-pros',
    path: '/for-professionals',
    labelKey: 'footer.forPros',
    surfaces: ['footer-professionals'],
  },
  {
    id: 'help',
    path: '/contact',
    labelKey: 'footer.helpCenter',
    surfaces: ['footer-support'],
  },
  {
    id: 'privacy',
    path: '/contact?topic=privacy',
    labelKey: 'footer.privacy',
    surfaces: ['footer-support'],
  },
  {
    id: 'cookies',
    path: '/contact?topic=cookies',
    labelKey: 'footer.cookies',
    surfaces: ['footer-support'],
  },
  {
    id: 'gdpr',
    path: '/contact?topic=gdpr',
    labelKey: 'footer.gdpr',
    surfaces: ['footer-support'],
  },
  {
    id: 'terms',
    path: '/contact?topic=terms',
    labelKey: 'footer.terms',
    surfaces: ['footer-support'],
  },
  {
    id: 'impressum',
    path: '/contact?topic=legal',
    labelKey: 'footer.impressum',
    surfaces: ['footer-support'],
  },

  // —— Routes not always in chrome but need reserved-path / alias coverage ——
  {
    id: 'pro-dashboard',
    path: '/pro/dashboard',
    aliases: ['/pro'],
    labelKey: 'nav.profile',
    surfaces: [],
  },
  {
    id: 'customer-dashboard',
    path: '/customer/dashboard',
    aliases: ['/customer', '/my'],
    labelKey: 'nav.profile',
    surfaces: [],
  },
  {
    id: 'pro-calendar',
    path: '/pro/calendar',
    aliases: ['/calendar'],
    labelKey: 'nav.profile',
    surfaces: [],
  },
  {
    id: 'admin',
    path: '/admin',
    aliases: ['/admin/panel'],
    labelKey: 'header.dashboard',
    surfaces: [],
  },
  {
    id: 'owner-dashboard-route',
    path: '/dashboard',
    labelKey: 'header.dashboard',
    surfaces: [],
  },
  {
    id: 'billing',
    path: '/billing',
    labelKey: 'nav.pricing',
    surfaces: [],
  },
  {
    id: 'boost',
    path: '/boost',
    labelKey: 'nav.profile',
    surfaces: [],
  },
  {
    id: 'checkout',
    path: '/checkout',
    labelKey: 'nav.pricing',
    surfaces: [],
  },
  {
    id: 'for-advertisers',
    path: '/for-advertisers',
    labelKey: 'footer.advertisingLink',
    surfaces: [],
  },
] as const

/** Extra first-path segments that are app routes but not in NAV_ENTRIES. */
const EXTRA_RESERVED_SEGMENTS = [
  'services',
  'category',
  'professional',
  'listing',
  'dashboard',
  'api',
  'assets',
  'auth',
  'book',
  'project',
  'my-listings',
  'my-projects',
  'notifications',
  'ai',
  'admin',
  'estimate',
  'commercial-agents',
  'categories',
] as const

export function navEntriesFor(surface: NavSurface): NavEntry[] {
  return NAV_ENTRIES.filter((e) => e.surfaces.includes(surface))
}

/**
 * Header department bar: categories (in Header) + deals + directory + estimator/publish/analytics.
 */
export const HEADER_DEPT_BEFORE_ORDER = ['search'] as const
export const HEADER_DEPT_AFTER_ORDER = [
  'cost-estimator',
  'publish',
  'analytics',
] as const

function pickNavByIds(surface: NavSurface, ids: readonly string[]): NavEntry[] {
  const byId = new Map(navEntriesFor(surface).map((e) => [e.id, e]))
  return ids.map((id) => byId.get(id)).filter(Boolean) as NavEntry[]
}

export function headerDeptBeforeEntries(): NavEntry[] {
  return pickNavByIds('header-dept-extra', HEADER_DEPT_BEFORE_ORDER)
}

export function headerDeptAfterEntries(): NavEntry[] {
  return pickNavByIds('header-dept-extra', HEADER_DEPT_AFTER_ORDER)
}

export function labelKeyFor(entry: NavEntry, surface: NavSurface): TranslationKey {
  return entry.labelKeyBySurface?.[surface] ?? entry.labelKey
}

export function canonicalPath(pathOrAlias: string): string {
  const clean = pathOrAlias.split('?')[0].split('#')[0]
  for (const entry of NAV_ENTRIES) {
    if (entry.path === clean) return entry.path
    if (entry.aliases?.includes(clean)) return entry.path
  }
  return clean
}

export function resolveNavPath(entry: NavEntry, loggedIn: boolean): string {
  if (!entry.authAware) return entry.path
  if (loggedIn) return entry.path
  return '/login'
}

/** All first-path segments reserved from SEO short aliases (/electrician, …). */
export function reservedAppPathSegments(): Set<string> {
  const reserved = new Set<string>(EXTRA_RESERVED_SEGMENTS)
  for (const entry of NAV_ENTRIES) {
    const paths = [entry.path, ...(entry.aliases ?? [])]
    for (const p of paths) {
      const seg = p.replace(/^\//, '').split(/[/?#]/)[0]
      if (seg && seg !== '') reserved.add(seg.toLowerCase())
    }
  }
  return reserved
}

export function isReservedNavPath(segment: string): boolean {
  return reservedAppPathSegments().has(segment.toLowerCase())
}
