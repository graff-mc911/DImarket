/**
 * DImarket SEO build step (Variant A):
 * 1) Write robots.txt + sitemap.xml into dist/
 * 2) Prerender key public routes (Playwright when available)
 * 3) Fallback: inject contentful SEO HTML shells if Chromium is unavailable (e.g. some CI images)
 *
 * Does not redesign UI. Does not rewrite React components.
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs'
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

const PREVIEW_HOST = process.env.SEO_PREVIEW_HOST ?? '127.0.0.1'
const PREVIEW_PORT = Number(process.env.SEO_PREVIEW_PORT ?? 4179)
const BASE = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`
const FORCE_FALLBACK = process.env.SEO_PRERENDER_FALLBACK === '1' || process.env.VERCEL === '1'

function assertDist() {
  if (!existsSync(join(distDir, 'index.html'))) {
    throw new Error('dist/index.html missing — run `vite build` before seo-build')
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
  // Avoid writing into public/ on Vercel builds (can break the deploy output).
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

function ensureChromium() {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['playwright', 'install', 'chromium'],
    { cwd: root, encoding: 'utf8', timeout: 300000 },
  )
  if (result.status !== 0) {
    console.warn('playwright install chromium failed:', result.stderr || result.stdout)
    return false
  }
  return true
}

async function waitForPreview(timeoutMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`)
      if (res.ok) return true
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

function startPreview() {
  return spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    },
  )
}

async function hardenHead(page, route) {
  const url = absoluteUrl(route.path)
  const blocks = jsonLdForRoute(route)
  await page.evaluate(
    ({ title, description, url, blocks, ogImage }) => {
      document.title = title
      const upsert = (attr, key, content) => {
        let el = document.head.querySelector(`meta[${attr}="${key}"]`)
        if (!el) {
          el = document.createElement('meta')
          el.setAttribute(attr, key)
          document.head.appendChild(el)
        }
        el.setAttribute('content', content)
      }
      upsert('name', 'description', description)
      upsert('property', 'og:title', title)
      upsert('property', 'og:description', description)
      upsert('property', 'og:url', url)
      upsert('property', 'og:type', 'website')
      upsert('property', 'og:image', ogImage)
      upsert('name', 'twitter:card', 'summary_large_image')
      upsert('name', 'twitter:title', title)
      upsert('name', 'twitter:description', description)
      upsert('name', 'twitter:image', ogImage)
      let canonical = document.head.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', url)
      document.head.querySelectorAll('script[data-dimarket-seo="1"]').forEach((n) => n.remove())
      for (const data of blocks) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-dimarket-seo', '1')
        script.textContent = JSON.stringify(data)
        document.head.appendChild(script)
      }
    },
    {
      title: route.title,
      description: route.description,
      url,
      blocks,
      ogImage: `${SITE_ORIGIN}/og-image.png`,
    },
  )
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
  out = out
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script[^>]*data-dimarket-seo=["']1["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${metaBlock}\n  </head>`)
  return out
}

function fallbackRootHtml(route) {
  const cats = CATEGORY_SLUGS.map(
    (slug) =>
      `<li><a href="/category/${slug}">${escapeHtml(slug.replace(/-/g, ' '))}</a></li>`,
  ).join('')
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
  <h1>${escapeHtml(route.title.replace(/\s*\|\s*DImarket$/, '').replace(/^DImarket —\s*/, ''))}</h1>
  <p>${escapeHtml(route.description)}</p>
  <section aria-labelledby="seo-categories">
    <h2 id="seo-categories">Service categories</h2>
    <ul>${cats}</ul>
  </section>
</main>
<footer><p>© DImarket · <a href="/robots.txt">robots</a> · <a href="/sitemap.xml">sitemap</a></p></footer>
</div>`
}

function writeFallbackRoutes() {
  const shellPath = join(distDir, '_spa-shell.html')
  const shell = readFileSync(shellPath, 'utf8')

  for (const route of prerenderRoutes()) {
    let html = shell
    if (!/<div id="root"><\/div>/i.test(html)) {
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>')
    }
    html = html.replace('<div id="root"></div>', fallbackRootHtml(route))
    html = applyHeadToHtml(html, route)
    const out = outPathForRoute(route.path)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html, 'utf8')
    console.log(`fallback prerender ${route.path}`)
  }
}

async function prerenderWithPlaywright() {
  const { chromium } = await import('playwright')
  const preview = startPreview()
  let closed = false
  const shutdown = async () => {
    if (closed) return
    closed = true
    try {
      preview.kill('SIGTERM')
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 250))
    try {
      preview.kill('SIGKILL')
    } catch {
      /* ignore */
    }
  }

  try {
    const ready = await waitForPreview()
    if (!ready) throw new Error('preview server not ready')

    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; DImarketSeoPrerender/1.0; +https://dimarket.app/)',
      viewport: { width: 1280, height: 900 },
    })

    try {
      for (const route of prerenderRoutes()) {
        const page = await context.newPage()
        console.log(`prerender ${route.path}`)
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 90000 })
        await page.waitForSelector('#root', { timeout: 30000 })
        await page
          .waitForFunction(
            () => {
              const root = document.getElementById('root')
              if (!root || !root.innerText || root.innerText.trim().length < 40) return false
              return Boolean(document.querySelector('h1, h2, header'))
            },
            { timeout: 45000 },
          )
          .catch(() => console.warn(`  warn: content wait timed out for ${route.path}`))
        await new Promise((r) => setTimeout(r, 400))
        await hardenHead(page, route)
        const html = await page.content()
        const out = outPathForRoute(route.path)
        mkdirSync(dirname(out), { recursive: true })
        writeFileSync(out, html, 'utf8')
        console.log(`  saved ${route.path}`)
        await page.close()
      }
    } finally {
      await browser.close()
    }
  } finally {
    await shutdown()
  }
}

async function main() {
  assertDist()
  writeRobots()
  writeSitemap()

  // Preserve pristine SPA shell before overwriting index.html
  const shellPath = join(distDir, '_spa-shell.html')
  copyFileSync(join(distDir, 'index.html'), shellPath)

  let mode = 'fallback'
  const preferPlaywright = !FORCE_FALLBACK && process.env.VERCEL !== '1'
  if (preferPlaywright) {
    try {
      const installed = ensureChromium()
      if (!installed) throw new Error('chromium install failed')
      await prerenderWithPlaywright()
      mode = 'playwright'
    } catch (err) {
      console.warn('Playwright prerender failed, using HTML fallback:', err?.message || err)
      writeFallbackRoutes()
      mode = 'fallback'
    }
  } else {
    writeFallbackRoutes()
  }

  const home = readFileSync(join(distDir, 'index.html'), 'utf8')
  if (!/<h1[\s>]/i.test(home)) {
    throw new Error('SEO build produced homepage without <h1>')
  }
  if (!existsSync(join(distDir, 'robots.txt')) || !existsSync(join(distDir, 'sitemap.xml'))) {
    throw new Error('robots.txt or sitemap.xml missing in dist/')
  }

  console.log(`seo-build complete (mode=${mode})`)
}

main().catch((err) => {
  // Never fail the production deploy after robots/sitemap are written.
  console.error('seo-build error (non-fatal):', err)
  try {
    writeRobots()
    writeSitemap()
    if (existsSync(join(distDir, 'index.html')) && !existsSync(join(distDir, '_spa-shell.html'))) {
      copyFileSync(join(distDir, 'index.html'), join(distDir, '_spa-shell.html'))
    }
    writeFallbackRoutes()
    console.log('seo-build recovered via fallback')
  } catch (err2) {
    console.error('seo-build recovery failed:', err2)
  }
  process.exit(0)
})
