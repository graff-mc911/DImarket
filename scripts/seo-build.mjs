/**
 * DImarket SEO build step (Variant A):
 * 1) Write robots.txt + sitemap.xml into dist/
 * 2) Prerender key public routes with Playwright so curl gets real HTML
 *
 * Does not redesign UI. Does not rewrite React components.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  SITE_ORIGIN,
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
  // Also keep a copy in public for local preview of source tree
  writeFileSync(join(root, 'public', 'robots.txt'), body, 'utf8')
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
  writeFileSync(join(root, 'public', 'sitemap.xml'), xml, 'utf8')
  console.log(`wrote sitemap.xml (${allPublicRoutes().length} urls)`)
}

function outPathForRoute(path) {
  if (path === '/') return join(distDir, 'index.html')
  const clean = path.replace(/^\//, '').replace(/\/$/, '')
  return join(distDir, clean, 'index.html')
}

async function waitForPreview(timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`)
      if (res.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Preview server did not become ready at ${BASE}`)
}

function startPreview() {
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    },
  )
  child.stdout.on('data', (buf) => process.stdout.write(`[preview] ${buf}`))
  child.stderr.on('data', (buf) => process.stderr.write(`[preview] ${buf}`))
  return child
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

      // Remove previous build-injected SEO JSON-LD markers
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

async function prerenderAll() {
  const routes = prerenderRoutes()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (compatible; DImarketSeoPrerender/1.0; +https://dimarket.app/)',
    viewport: { width: 1280, height: 900 },
  })

  try {
    for (const route of routes) {
      const page = await context.newPage()
      const target = `${BASE}${route.path}`
      console.log(`prerender ${route.path}`)
      await page.goto(target, { waitUntil: 'networkidle', timeout: 90000 })

      // Wait for React shell + at least one heading / main landmark
      await page.waitForSelector('#root', { timeout: 30000 })
      await page
        .waitForFunction(
          () => {
            const root = document.getElementById('root')
            if (!root || !root.innerText || root.innerText.trim().length < 40) return false
            return Boolean(document.querySelector('h1, h2, header nav, header'))
          },
          { timeout: 45000 },
        )
        .catch(() => {
          console.warn(`  warn: content wait timed out for ${route.path}, saving best effort`)
        })

      // Give late client meta/JSON-LD a moment
      await new Promise((r) => setTimeout(r, 500))
      await hardenHead(page, route)

      const html = await page.content()
      const out = outPathForRoute(route.path)
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, html, 'utf8')

      const hasH = /<h1[\s>]|<h2[\s>]/i.test(html)
      const rootText = await page.locator('#root').innerText().catch(() => '')
      console.log(
        `  saved ${out.replace(root + '/', '')} (heading=${hasH}, rootChars=${rootText.trim().length})`,
      )
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  assertDist()
  writeRobots()
  writeSitemap()

  const preview = startPreview()
  let previewClosed = false
  const shutdown = async () => {
    if (previewClosed) return
    previewClosed = true
    try {
      preview.kill('SIGTERM')
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 300))
    try {
      preview.kill('SIGKILL')
    } catch {
      // ignore
    }
  }
  process.on('SIGINT', () => {
    void shutdown().then(() => process.exit(1))
  })

  try {
    await waitForPreview()
    await prerenderAll()
  } finally {
    await shutdown()
  }

  // Sanity: homepage must contain real content markers
  const home = readFileSync(join(distDir, 'index.html'), 'utf8')
  if (!home.includes('id="root"') || !/<h1[\s>]/i.test(home)) {
    console.warn('WARNING: prerendered homepage may lack <h1> — check selectors/data')
  }
  console.log('seo-build complete')
  // Ensure the Node process exits even if a handle remains open
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
