/**
 * DImarket SEO build step (Variant A, Vercel-safe).
 * Writes robots.txt, sitemap.xml, and contentful HTML shells for key routes.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_ORIGIN,
  CATEGORY_SLUGS,
  absoluteUrl,
  allPublicRoutes,
  buildSitemapXml,
  jsonLdForRoute,
  prerenderRoutes,
} from './seo-routes.mjs'
import { humanLabel } from './seo-labels.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
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
  console.log('wrote robots.txt')
}

function writeSitemap() {
  const xml = buildSitemapXml()
  writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf8')
  writeFileSync(join(root, 'public', 'sitemap.xml'), xml, 'utf8')
  console.log(`wrote sitemap.xml (${allPublicRoutes().length} urls)`)
}

function outPathForRoute(path) {
  if (path === '/') return join(distDir, 'index.html')
  return join(distDir, path.replace(/^\//, '').replace(/\/$/, ''), 'index.html')
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

  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`)
    .replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtml(route.description)}" />`,
    )
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script[^>]*data-dimarket-seo=["']1["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${metaBlock}\n  </head>`)
}

/**
 * SEO body for crawlers. Kept out of the visible paint path so users never see
 * the raw category list before React mounts (FOUC / "list then app" flash).
 */
function fallbackSeoShell(route) {
  const cats = CATEGORY_SLUGS.map(
    (slug) =>
      `<li><a href="/category/${slug}">${escapeHtml(humanLabel(slug, 'uk'))}</a></li>`,
  ).join('')
  const heading = escapeHtml(
    route.title.replace(/\s*\|\s*DImarket$/, '').replace(/^DImarket —\s*/, ''),
  )
  return `<div id="dimarket-seo-prerender" data-dimarket-seo-shell="1" hidden>
<a class="skip-link" href="#main">Skip to content</a>
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
</div><div id="root"></div>`
}

const BOOT_STYLE =
  '<style id="dimarket-boot">html,body,#root{margin:0;min-height:100%;background:#eaeded}</style>'

function writeRoutes(shellHtml) {
  for (const route of prerenderRoutes()) {
    let html = shellHtml
    // Strip any previous SEO shell + normalize to empty #root
    html = html.replace(
      /<div id="dimarket-seo-prerender"[\s\S]*?<\/div>\s*/i,
      '',
    )
    if (!/<div id="root"><\/div>/i.test(html)) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>')
    }
    html = html.replace('<div id="root"></div>', fallbackSeoShell(route))
    if (!html.includes('id="dimarket-boot"')) {
      html = html.replace('</head>', `${BOOT_STYLE}\n  </head>`)
    }
    html = applyHeadToHtml(html, route)
    const out = outPathForRoute(route.path)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html, 'utf8')
    console.log(`prerender ${route.path}`)
  }
}

assertDist()
writeRobots()
writeSitemap()
writeRoutes(readFileSync(join(distDir, 'index.html'), 'utf8'))

if (!/<h1[\s>]/i.test(readFileSync(join(distDir, 'index.html'), 'utf8'))) {
  console.error('homepage missing h1 after SEO inject')
  process.exit(1)
}
console.log('seo-build complete')
