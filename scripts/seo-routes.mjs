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

/** All indexable public routes (sitemap + prerender targets). */
export function allPublicRoutes() {
  return [...STATIC_ROUTES, ...categoryRoutes(), ...landingRoutes()]
}

/**
 * Routes prerendered into dist/**/index.html at build time.
 * Keep this list conservative on Vercel — nested locale folders have caused
 * deploy packaging failures; homepage + top-level public pages are enough
 * for the first SEO cut.
 */
export function prerenderRoutes() {
  // Phase 1 on Vercel: homepage only (validates contentful HTML in production).
  // Top-level public pages can be re-enabled after deploy packaging is confirmed.
  const priorityPaths = new Set(['/'])
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
