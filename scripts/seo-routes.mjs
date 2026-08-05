/**
 * Public SEO routes for DImarket.
 * Single source for sitemap + prerender + verify.
 * Does not change UI — metadata only.
 */

export const SITE_ORIGIN = 'https://dimarket.app'

/** @typedef {{ path: string, title: string, description: string, changefreq?: string, priority?: number, schema?: 'home'|'service'|'local'|'page' }} SeoRoute */

/** Top-level category slugs used by the marketplace UI */
export const CATEGORY_SLUGS = [
  'specialists',
  'renovation',
  'construction',
  'hvac',
  'garden',
  'cleaning',
  'security',
  'moving',
  'stores',
  'manufacturers',
  'rentals',
  'automotive',
  'home-services',
  'accounting-finance',
  'real-estate',
  'architecture-design',
  'engineering',
  'legal-services',
]

/** Launch SEO city/trade landings (mirrors src/lib/seoRoutes launch set) */
export const SEO_LANDINGS = [
  '/de/darmstadt/elektriker',
  '/de/darmstadt/sanitaer',
  '/de/darmstadt/maler',
  '/de/darmstadt/fliesenleger',
  '/es/alicante/electricista',
  '/es/alicante/fontanero',
  '/es/alicante/pintor',
  '/es/alicante/alicatador',
  '/es/madrid/electricista',
  '/es/madrid/fontanero',
  '/es/madrid/pintor',
  '/es/madrid/alicatador',
]

/** @type {SeoRoute[]} */
export const STATIC_ROUTES = [
  {
    path: '/',
    title: 'DImarket — Маркетплейс для будівництва, ремонту та матеріалів',
    description:
      'Знайдіть перевірених фахівців з будівництва та якісні матеріали. Маркетплейс для будівництва, ремонту та послуг.',
    changefreq: 'daily',
    priority: 1,
    schema: 'home',
  },
  {
    path: '/professionals',
    title: 'Фахівці з будівництва та ремонту | DImarket',
    description: 'Каталог перевірених будівельних фахівців у Європі. Порівнюйте профілі та надсилайте запити.',
    changefreq: 'daily',
    priority: 0.9,
    schema: 'page',
  },
  {
    path: '/companies',
    title: 'Будівельні компанії | DImarket',
    description: 'Каталог будівельних компаній та підрядників. Знаходьте надійних партнерів для проєктів.',
    changefreq: 'daily',
    priority: 0.9,
    schema: 'page',
  },
  {
    path: '/map',
    title: 'Карта майстрів і проєктів Європи | DImarket',
    description: 'Інтерактивна карта DImarket: майстри, компанії, проєкти, Marketplace і Jobs по всій Європі.',
    changefreq: 'daily',
    priority: 0.85,
    schema: 'page',
  },
  {
    path: '/buy-sell',
    title: 'Marketplace (Buy & Sell) | DImarket',
    description:
      'Buy, sell and rent building materials, tools, equipment, vehicles and property on DImarket.',
    changefreq: 'hourly',
    priority: 0.9,
    schema: 'page',
  },
  {
    path: '/jobs',
    title: 'Jobs — Construction & Trade Vacancies | DImarket',
    description:
      'Browse job vacancies across construction, skilled trades, logistics, office roles and remote work on DImarket.',
    changefreq: 'hourly',
    priority: 0.9,
    schema: 'page',
  },
  {
    path: '/sell-rent',
    title: 'Marketplace (Buy & Sell) | DImarket',
    description:
      'Buy, sell and rent building materials, tools, equipment, vehicles and property on DImarket.',
    changefreq: 'weekly',
    priority: 0.5,
    schema: 'page',
  },
  {
    path: '/vacancies',
    title: 'Jobs | DImarket',
    description: 'Job vacancies and hiring across construction and related trades on DImarket.',
    changefreq: 'weekly',
    priority: 0.5,
    schema: 'page',
  },
  {
    path: '/listings',
    title: 'Оголошення та проєкти | DImarket',
    description: 'Актуальні оголошення, вакансії та проєкти у сфері будівництва та ремонту.',
    changefreq: 'hourly',
    priority: 0.8,
    schema: 'page',
  },
  {
    path: '/search',
    title: 'Пошук фахівців і послуг | DImarket',
    description: 'Розширений пошук будівельних послуг, фахівців і компаній на DImarket.',
    changefreq: 'weekly',
    priority: 0.7,
    schema: 'page',
  },
  {
    path: '/pricing',
    title: 'Тарифи та плани | DImarket',
    description: 'Тарифи DImarket для фахівців, компаній та рекламодавців.',
    changefreq: 'monthly',
    priority: 0.6,
    schema: 'page',
  },
  {
    path: '/contact',
    title: 'Контакти | DImarket',
    description: 'Зв’яжіться з командою DImarket — підтримка клієнтів, фахівців і партнерів.',
    changefreq: 'yearly',
    priority: 0.5,
    schema: 'page',
  },
  {
    path: '/for-professionals',
    title: 'Для фахівців | DImarket',
    description: 'Отримуйте заявки від клієнтів, розвивайте профіль і зростайте на DImarket.',
    changefreq: 'monthly',
    priority: 0.7,
    schema: 'page',
  },
  {
    path: '/for-companies',
    title: 'Для компаній | DImarket',
    description: 'Корпоративний профіль, ліди та видимість для будівельних компаній на DImarket.',
    changefreq: 'monthly',
    priority: 0.7,
    schema: 'page',
  },
  {
    path: '/for-advertisers',
    title: 'Для рекламодавців | DImarket',
    description: 'Рекламні формати DImarket для брендів будівельних матеріалів і послуг.',
    changefreq: 'monthly',
    priority: 0.6,
    schema: 'page',
  },
  {
    path: '/advertise',
    title: 'Реклама на DImarket',
    description: 'Розмістіть рекламу на маркетплейсі будівництва та ремонту DImarket.',
    changefreq: 'monthly',
    priority: 0.6,
    schema: 'page',
  },
]

export function categoryRoutes() {
  return CATEGORY_SLUGS.map((slug) => ({
    path: `/category/${slug}`,
    title: `${slug.replace(/-/g, ' ')} | DImarket`,
    description: `Знайдіть послуги та фахівців у категорії ${slug.replace(/-/g, ' ')} на DImarket.`,
    changefreq: 'weekly',
    priority: 0.8,
    schema: 'service',
  }))
}

export function landingRoutes() {
  return SEO_LANDINGS.map((path) => {
    const parts = path.split('/').filter(Boolean)
    const [locale, city, trade] = parts
    return {
      path,
      title: `${trade} — ${city} | DImarket`,
      description: `Find ${trade} professionals in ${city} on DImarket. Request quotes directly.`,
      changefreq: 'weekly',
      priority: 0.85,
      schema: 'local',
      locale,
      city,
      trade,
    }
  })
}

/** Hierarchical service SEO pages (short aliases + /services/:slug) */
export const SERVICE_SEO_SLUGS = [
  'electrician',
  'plumber',
  'painter',
  'tiler',
  'carpenter',
  'roofer',
  'handyman',
  'lawyer',
  'accountant',
  'hvac-service',
  'house-cleaning',
  'apartment-moving',
  'home-renovation',
  'architect-designer',
  'auto-repair',
]

/** Public geo landing pages: /spain/alicante/electricians */
export const GEO_SERVICE_LANDINGS = [
  '/spain/alicante/electricians',
  '/spain/alicante/plumbers',
  '/spain/valencia/electricians',
  '/spain/madrid/electricians',
  '/spain/madrid/lawyers',
  '/spain/barcelona/plumbers',
  '/spain/malaga/painters',
  '/germany/darmstadt/electricians',
  '/france/paris/painters',
]

export function serviceSeoRoutes() {
  const short = ['electrician', 'plumber', 'painter', 'tiler', 'roofer', 'handyman', 'lawyer', 'accountant']
  const routes = short.map((slug) => ({
    path: `/${slug}`,
    title: `${slug.replace(/-/g, ' ')} specialists & companies | DImarket`,
    description: `Find verified ${slug.replace(/-/g, ' ')} specialists and companies on DImarket. Compare profiles and request a free quote.`,
    changefreq: 'daily',
    priority: 0.9,
    schema: 'service',
  }))
  for (const slug of SERVICE_SEO_SLUGS) {
    routes.push({
      path: `/services/${slug}`,
      title: `${slug.replace(/-/g, ' ')} | DImarket`,
      description: `Browse ${slug.replace(/-/g, ' ')} professionals and companies on DImarket.`,
      changefreq: 'daily',
      priority: 0.85,
      schema: 'service',
    })
  }
  for (const path of GEO_SERVICE_LANDINGS) {
    const parts = path.split('/').filter(Boolean)
    const trade = parts[parts.length - 1]
    const place = parts.slice(0, -1).join(', ')
    routes.push({
      path,
      title: `${trade} in ${place} | DImarket`,
      description: `Find verified ${trade} near ${place} on DImarket. Filter by radius and request a free quote.`,
      changefreq: 'daily',
      priority: 0.9,
      schema: 'local',
    })
  }
  return routes
}

/** Marketplace (Buy & Sell) and Jobs SEO landings */
export const BUY_SELL_SEO_PATHS = [
  '/buy-sell/tools',
  '/buy-sell/building-materials',
  '/buy-sell/construction-equipment',
  '/buy-sell/houses',
  '/buy-sell/commercial-property',
  '/buy-sell/land',
  '/buy-sell/vehicles',
  '/buy-sell/machinery',
  '/buy-sell/rental-equipment',
  '/buy-sell/scaffolding',
  '/buy-sell/free-items',
  '/buy-sell/wanted-to-buy',
]

export const JOBS_SEO_PATHS = [
  '/jobs/electrician',
  '/jobs/plumber',
  '/jobs/construction-jobs',
  '/jobs/skilled-trades',
  '/jobs/drivers',
  '/jobs/office-jobs',
  '/jobs/warehouse-jobs',
  '/jobs/cleaning-jobs',
  '/jobs/accounting',
  '/jobs/legal',
  '/jobs/engineering',
  '/jobs/it',
  '/jobs/sales',
  '/jobs/design',
  '/jobs/remote-jobs',
]

export const GEO_MARKETPLACE_LANDINGS = [
  '/spain/alicante/jobs',
  '/spain/alicante/buy-sell',
  '/spain/madrid/jobs',
  '/spain/madrid/buy-sell',
  '/spain/barcelona/jobs',
  '/germany/darmstadt/jobs',
  '/germany/darmstadt/buy-sell',
  '/ukraine/kyiv/jobs',
  '/ukraine/kyiv/buy-sell',
  '/poland/warsaw/jobs',
  '/poland/warsaw/buy-sell',
]

export function marketplaceSeoRoutes() {
  const routes = []
  for (const path of BUY_SELL_SEO_PATHS) {
    const slug = path.split('/').pop()
    const label = slug.replace(/-/g, ' ')
    routes.push({
      path,
      title: `${label} — Marketplace (Buy & Sell) | DImarket`,
      description: `Browse ${label} listings on DImarket Marketplace. Buy, sell or rent across Europe.`,
      changefreq: 'daily',
      priority: 0.85,
      schema: 'service',
    })
  }
  for (const path of JOBS_SEO_PATHS) {
    const slug = path.split('/').pop()
    const label = slug.replace(/-/g, ' ')
    routes.push({
      path,
      title: `${label} jobs | DImarket`,
      description: `Find ${label} job vacancies on DImarket. Apply to construction and trade employers across Europe.`,
      changefreq: 'daily',
      priority: 0.85,
      schema: 'service',
    })
  }
  for (const path of GEO_MARKETPLACE_LANDINGS) {
    const parts = path.split('/').filter(Boolean)
    const section = parts[parts.length - 1]
    const place = parts.slice(0, -1).join(', ')
    const label = section === 'jobs' ? 'Jobs' : 'Marketplace (Buy & Sell)'
    routes.push({
      path,
      title: `${label} in ${place} | DImarket`,
      description: `Browse ${label.toLowerCase()} near ${place} on DImarket.`,
      changefreq: 'daily',
      priority: 0.9,
      schema: 'local',
      city: parts[1],
      trade: section,
    })
  }
  return routes
}

/** All indexable public routes (sitemap + prerender targets). */
export function allPublicRoutes() {
  return [
    ...STATIC_ROUTES,
    ...categoryRoutes(),
    ...landingRoutes(),
    ...serviceSeoRoutes(),
    ...marketplaceSeoRoutes(),
  ]
}

/** Routes written as dist/<path>/index.html during seo-build. */
export function prerenderRoutes() {
  const priorityPaths = new Set([
    '/',
    '/professionals',
    '/companies',
    '/map',
    '/listings',
    '/buy-sell',
    '/jobs',
    '/buy-sell/tools',
    '/buy-sell/building-materials',
    '/jobs/electrician',
    '/jobs/plumber',
    '/spain/alicante/jobs',
    '/spain/alicante/buy-sell',
    '/pricing',
    '/contact',
    '/for-professionals',
    '/for-companies',
    '/search',
    '/category/construction',
    '/category/specialists',
    '/category/renovation',
    '/category/hvac',
    '/electrician',
    '/plumber',
    '/lawyer',
    '/services/electrician',
    '/spain/alicante/electricians',
    '/spain/madrid/lawyers',
    '/de/darmstadt/elektriker',
    '/es/alicante/electricista',
    '/es/madrid/fontanero',
  ])
  return allPublicRoutes().filter((r) => priorityPaths.has(r.path))
}

export function absoluteUrl(path) {
  if (!path || path === '/') return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DImarket',
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/android-chrome-512x512.png`,
    sameAs: [],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DImarket',
    url: SITE_ORIGIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_ORIGIN}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function serviceJsonLd(route) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: route.title,
    description: route.description,
    provider: {
      '@type': 'Organization',
      name: 'DImarket',
      url: SITE_ORIGIN,
    },
    url: absoluteUrl(route.path),
    areaServed: 'Europe',
  }
}

export function localBusinessJsonLd(route) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `DImarket — ${route.trade} (${route.city})`,
    description: route.description,
    url: absoluteUrl(route.path),
    areaServed: {
      '@type': 'City',
      name: route.city,
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'DImarket',
      url: SITE_ORIGIN,
    },
  }
}

export function breadcrumbJsonLd(route) {
  const parts = route.path.split('/').filter(Boolean)
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'DImarket',
      item: `${SITE_ORIGIN}/`,
    },
  ]
  let acc = ''
  parts.forEach((part, idx) => {
    acc += `/${part}`
    items.push({
      '@type': 'ListItem',
      position: idx + 2,
      name: part.replace(/-/g, ' '),
      item: absoluteUrl(acc),
    })
  })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

export function jsonLdForRoute(route) {
  const blocks = []
  if (route.schema === 'home') {
    blocks.push(organizationJsonLd(), websiteJsonLd())
  } else if (route.schema === 'service') {
    blocks.push(serviceJsonLd(route), breadcrumbJsonLd(route))
  } else if (route.schema === 'local') {
    blocks.push(localBusinessJsonLd(route), breadcrumbJsonLd(route))
  } else {
    blocks.push(breadcrumbJsonLd(route))
  }
  return blocks
}
