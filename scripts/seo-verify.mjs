/**
 * CI verification for DImarket SEO infrastructure (no JS execution).
 * Checks title, description, canonical, contentful body, sitemap, robots.
 *
 * Usage:
 *   node scripts/seo-verify.mjs
 *   SEO_BASE_URL=https://dimarket.app node scripts/seo-verify.mjs
 *   SEO_BASE_URL=http://127.0.0.1:4179 node scripts/seo-verify.mjs
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allPublicRoutes, prerenderRoutes, SITE_ORIGIN } from './seo-routes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = join(root, 'dist')
const base = (process.env.SEO_BASE_URL || '').replace(/\/$/, '')

const errors = []
const warnings = []

function fail(msg) {
  errors.push(msg)
  console.error(`FAIL  ${msg}`)
}

function warn(msg) {
  warnings.push(msg)
  console.warn(`WARN  ${msg}`)
}

function ok(msg) {
  console.log(`OK    ${msg}`)
}

function extract(html, re) {
  const m = html.match(re)
  return m ? m[1].trim() : ''
}

async function loadHtml(path) {
  if (base) {
    const url = path === '/' ? `${base}/` : `${base}${path}`
    const res = await fetch(url, {
      headers: { 'user-agent': 'DImarketSeoVerify/1.0' },
    })
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
    return { html: await res.text(), contentType: res.headers.get('content-type') || '' }
  }

  const file =
    path === '/'
      ? join(distDir, 'index.html')
      : join(distDir, path.replace(/^\//, ''), 'index.html')
  if (!existsSync(file)) throw new Error(`missing file ${file}`)
  return { html: readFileSync(file, 'utf8'), contentType: 'text/html' }
}

async function loadText(path) {
  if (base) {
    const res = await fetch(`${base}${path}`, {
      headers: { 'user-agent': 'DImarketSeoVerify/1.0' },
    })
    if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`)
    return {
      text: await res.text(),
      contentType: res.headers.get('content-type') || '',
    }
  }
  const file = join(distDir, path.replace(/^\//, ''))
  if (!existsSync(file)) throw new Error(`missing file ${file}`)
  return { text: readFileSync(file, 'utf8'), contentType: '' }
}

async function verifyRoute(route) {
  const { html } = await loadHtml(route.path)
  const title = extract(html, /<title[^>]*>([^<]*)<\/title>/i)
  const description = extract(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
  ) || extract(
    html,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
  )
  const canonical = extract(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i,
  ) || extract(
    html,
    /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i,
  )

  if (!title) fail(`${route.path}: missing <title>`)
  else ok(`${route.path}: title="${title.slice(0, 80)}"`)

  if (!description) fail(`${route.path}: missing meta description`)
  else ok(`${route.path}: description ok`)

  if (!canonical) fail(`${route.path}: missing canonical`)
  else if (!canonical.startsWith(SITE_ORIGIN)) fail(`${route.path}: canonical not absolute (${canonical})`)
  else ok(`${route.path}: canonical ok`)

  if (!/<div[^>]+id=["']root["'][^>]*>[\s\S]{80,}?<\/div>/i.test(html) && !/<h1[\s>]/i.test(html)) {
    fail(`${route.path}: #root appears empty / no heading in HTML without JS`)
  } else if (!/<h1[\s>]|<h2[\s>]/i.test(html)) {
    warn(`${route.path}: no h1/h2 found in static HTML`)
  } else {
    ok(`${route.path}: contentful headings present`)
  }

  if (!html.includes('application/ld+json')) {
    warn(`${route.path}: no JSON-LD found`)
  } else {
    ok(`${route.path}: JSON-LD present`)
  }
}

async function verifyRobotsSitemap() {
  const robots = await loadText('/robots.txt')
  if (/<!doctype html>/i.test(robots.text)) {
    fail('robots.txt is returning HTML (SPA fallback)')
  } else if (!/sitemap:\s*https:\/\/dimarket\.app\/sitemap\.xml/i.test(robots.text)) {
    fail('robots.txt missing Sitemap directive')
  } else {
    ok('robots.txt ok')
  }
  if (robots.contentType && !/text\/plain/i.test(robots.contentType) && base) {
    warn(`robots.txt content-type is ${robots.contentType}`)
  }

  const sitemap = await loadText('/sitemap.xml')
  if (/<!doctype html>/i.test(sitemap.text)) {
    fail('sitemap.xml is returning HTML (SPA fallback)')
  } else if (!/<urlset[\s>]/i.test(sitemap.text) || !/<loc>/i.test(sitemap.text)) {
    fail('sitemap.xml missing urlset/loc')
  } else {
    const count = (sitemap.text.match(/<loc>/g) || []).length
    ok(`sitemap.xml ok (${count} urls)`)
    const required = [
      'https://dimarket.app/cost-estimator',
      'https://dimarket.app/map',
      'https://dimarket.app/documents',
      'https://dimarket.app/vacancies',
      'https://dimarket.app/commercial-agents',
      'https://dimarket.app/category/official-documents',
    ]
    for (const loc of required) {
      if (!sitemap.text.includes(`<loc>${loc}</loc>`)) fail(`sitemap.xml missing ${loc}`)
      else ok(`sitemap has ${loc.replace('https://dimarket.app', '')}`)
    }
  }
  if (sitemap.contentType && !/xml|text\/plain/i.test(sitemap.contentType) && base) {
    warn(`sitemap.xml content-type is ${sitemap.contentType}`)
  }
}

async function main() {
  console.log(`SEO verify base: ${base || `file://${distDir}`}`)
  await verifyRobotsSitemap()

  for (const route of allPublicRoutes()) {
    if (!route.path.startsWith('/category/') && !route.path.startsWith('/services/')) continue
    const slug = route.path.split('/').pop()
    const rawTitle = `${slug.replace(/-/g, ' ')} | DImarket`
    if (route.title === rawTitle) {
      fail(`${route.path}: title still uses raw slug (${route.title})`)
    } else {
      ok(`${route.path}: human title`)
    }
  }

  for (const route of prerenderRoutes()) {
    try {
      await verifyRoute(route)
    } catch (err) {
      fail(`${route.path}: ${err.message}`)
    }
  }

  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
  if (errors.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
