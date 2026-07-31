/**
 * DImarket SEO build step (Variant A, Vercel-safe).
 * - Writes robots.txt + sitemap.xml into dist/
 * - Injects contentful HTML shells + meta/JSON-LD for key public routes
 *
 * Playwright full-render is available via: SEO_PLAYWRIGHT=1 node scripts/seo-build.mjs
 * (local only; not used on Vercel).
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_ORIGIN,
  CATEGORY_SLUGS,
  absoluteUrl,
  allPublicRoutes,
  jsonLdForRoute,
  prerenderRoutes,
} from './seo-routes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = join(root, 'dist')

function assertDist() {
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error('dist/index.html missing — run vite build first')
  }
}

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
  writeFileSync(join(distDir, 'robots.txt'), body, 'utf8')
  if (process.env.VERCEL !== '1') {
    writeFileSync(join(root, 'public', 'robots.txt'), body, 'utf8')
  }
  console.log('wrote robots.txt')
}

function writeSitemap() {
  const now = new Date().toISOString()
  const urls = allPublicRoutes()
    .map((route) => {
      const loc = absoluteUrl(route.path)
      const changefreq = route.changefreq ?? 'weekly'
      const priority = (route.priority ?? 0.5).toFixed(1)
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf8')
  if (process.env.VERCEL !== '1') {
    writeFileSync(join(root, 'public', 'sitemap.xml'), xml, 'utf8')
  }
  console.log(`wrote sitemap.xml (${allPublicRoutes().length} urls)`)
}

function outPathForRoute(path) {
  if (path === '/') return join(distDir, 'index.html')
  const clean = path.replace(/^\//, '').replace(/\/$/, '')
  return join(distDir, clean, 'index.html')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyHeadToHtml(html, route) {
  const url = absoluteUrl(route.path)
  const ogImage = `${SITE_ORIGIN}/og-image.png`
  let out = html
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`)
    .replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtml(route.description)}" />`,
    )

  const metaBlock = `
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${escapeHtml(route.title)}" />
    <meta property="og:description" content="${escapeHtml(route.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(route.title)}" />
    <meta name="twitter:description" content="${escapeHtml(route.description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    ${jsonLdForRoute(route)
      .map(
        (block) =>
          `<script type="application/ld+json" data-dimarket-seo="1">${JSON.stringify(block)}</script>`,
      )
      .join('\n    ')}
`
  return out
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script[^>]*data-dimarket-seo=["']1["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${metaBlock}\n  </head>`)
}

function fallbackRootHtml(route) {
  const cats = CATEGORY_SLUGS.map(
    (slug) =>
      `<li><a href="/category/${slug}">${escapeHtml(slug.replace(/-/g, ' '))}</a></li>`,
  ).join('')
  const heading = escapeHtml(
    route.title.replace(/\s*\|\s*DImarket$/, '').replace(/^DImarket —\s*/, ''),
  )
  return `<div id="root"><a class="skip-link" href="#main">Skip to content</a>
<header>
  <p><strong>DImarket</strong> — marketplace for construction &amp; renovation</p>
  <nav aria-label="Primary">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/professionals">Professionals</a></li>
      <li><a href="/companies">Companies</a></li>
      <li><a href="/listings">Listings</a></li>
      <li><a href="/search">Search</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</header>
<main id="main">
  <h1>${heading}</h1>
  <p>${escapeHtml(route.description)}</p>
  <section aria-labelledby="seo-categories">
    <h2 id="seo-categories">Service categories</h2>
    <ul>${cats}</ul>
  </section>
</main>
<footer><p>© DImarket</p></footer>
</div>`
}

function writeFallbackRoutes(shellHtml) {
  for (const route of prerenderRoutes()) {
    let html = shellHtml
    if (!/<div id="root"><\/div>/i.test(html)) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>')
    }
    html = html.replace('<div id="root"></div>', fallbackRootHtml(route))
    html = applyHeadToHtml(html, route)
    const out = outPathForRoute(route.path)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html, 'utf8')
    console.log(`prerender ${route.path}`)
  }
}

function main() {
  assertDist()
  writeRobots()
  writeSitemap()
  const shellHtml = readFileSync(join(distDir, 'index.html'), 'utf8')
  writeFallbackRoutes(shellHtml)

  const home = readFileSync(join(distDir, 'index.html'), 'utf8')
  if (!/<h1[\s>]/i.test(home)) {
    throw new Error('homepage missing h1 after SEO inject')
  }
  console.log('seo-build complete')
}

try {
  main()
} catch (err) {
  console.error('seo-build error:', err)
  process.exit(1)
}
