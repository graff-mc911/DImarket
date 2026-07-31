/**
 * DImarket SEO build step — minimal Vercel-safe injector.
 * Writes robots/sitemap and contentful homepage HTML into dist/.
 */
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_ORIGIN,
  CATEGORY_SLUGS,
  absoluteUrl,
  allPublicRoutes,
  jsonLdForRoute,
  STATIC_ROUTES,
} from './seo-routes.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const homeRoute = STATIC_ROUTES.find((r) => r.path === '/')

function writeRobots() {
  const body = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /settings
Disallow: /messages
Disallow: /notifications
Disallow: /profile
Disallow: /my-listings
Disallow: /my-projects
Disallow: /billing
Disallow: /checkout
Disallow: /auth/
Disallow: /login
Disallow: /register

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
  writeFileSync(join(distDir, 'robots.txt'), body)
  console.log('wrote robots.txt')
}

function writeSitemap() {
  const now = new Date().toISOString()
  const urls = allPublicRoutes()
    .map((route) => `  <url>
    <loc>${absoluteUrl(route.path)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq ?? 'weekly'}</changefreq>
    <priority>${(route.priority ?? 0.5).toFixed(1)}</priority>
  </url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  writeFileSync(join(distDir, 'sitemap.xml'), xml)
  console.log(`wrote sitemap.xml (${allPublicRoutes().length} urls)`)
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function injectHome() {
  const route = homeRoute
  let html = readFileSync(join(distDir, 'index.html'), 'utf8')
  const url = absoluteUrl('/')
  const cats = CATEGORY_SLUGS.map(
    (slug) => `<li><a href="/category/${slug}">${escapeHtml(slug.replace(/-/g, ' '))}</a></li>`,
  ).join('')

  const rootHtml = `<div id="root"><header><p><strong>DImarket</strong></p><nav aria-label="Primary"><ul><li><a href="/">Home</a></li><li><a href="/professionals">Professionals</a></li><li><a href="/companies">Companies</a></li><li><a href="/listings">Listings</a></li><li><a href="/pricing">Pricing</a></li><li><a href="/contact">Contact</a></li></ul></nav></header><main id="main"><h1>${escapeHtml(route.title.replace(/^DImarket —\s*/, ''))}</h1><p>${escapeHtml(route.description)}</p><section aria-labelledby="seo-categories"><h2 id="seo-categories">Service categories</h2><ul>${cats}</ul></section></main><footer><p>© DImarket</p></footer></div>`

  html = html.replace(/<div id="root"><\/div>/i, rootHtml)
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`)
  html = html.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
  )

  const metaBlock = `
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${SITE_ORIGIN}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${SITE_ORIGIN}/og-image.png" />
    ${jsonLdForRoute(route)
      .map((b) => `<script type="application/ld+json" data-dimarket-seo="1">${JSON.stringify(b)}</script>`)
      .join('\n    ')}
`
  html = html
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace('</head>', `${metaBlock}\n  </head>`)

  writeFileSync(join(distDir, 'index.html'), html)
  console.log('prerender /')
}

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('dist/index.html missing')
  process.exit(1)
}

writeRobots()
writeSitemap()
injectHome()
console.log('seo-build complete')
