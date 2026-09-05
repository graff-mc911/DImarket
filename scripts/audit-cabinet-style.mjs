/**
 * Audits the app against the owner cabinet design language.
 *
 * For every route it reports surfaces that are still translucent or rounded,
 * page-body blocks that are still dark, and text that would be unreadable on
 * its own background. Header, footer and mobile chrome are excluded because
 * they intentionally keep the Amazon navy treatment.
 *
 * Usage: node scripts/audit-cabinet-style.mjs [baseUrl]
 */
import { chromium } from '@playwright/test'

const BASE = process.argv[2] || 'http://127.0.0.1:4173'

const ROUTES = [
  '/',
  '/categories',
  '/professionals',
  '/companies',
  '/listings',
  '/search',
  '/pricing',
  '/contact',
  '/advertise',
  '/login',
  '/register',
  '/commercial-agents',
  '/cost-estimator',
  '/legal-documents',
  '/for-professionals',
  '/projects',
  '/map',
]

const audit = () => {
  const CHROME = [
    '.site-header-fixed',
    '.site-header-spacer',
    '.premium-footer',
    '.mobile-bottom-nav',
    '.mobile-nav-more__sheet',
    '.mega-menu',
  ]

  const inChrome = (el) => CHROME.some((sel) => el.closest(sel))

  const parseRgb = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const [r, g, b, a = '1'] = m[1].split(',').map((s) => parseFloat(s))
    return { r, g, b, a }
  }

  const luminance = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }

  const contrast = (fg, bg) => {
    const a = luminance(fg)
    const b = luminance(bg)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }

  const describe = (el) =>
    `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : ''}`

  const translucent = []
  const rounded = []
  const darkBlocks = []
  const lowContrast = []

  for (const el of document.querySelectorAll('body *')) {
    if (inChrome(el)) continue
    const rect = el.getBoundingClientRect()
    if (rect.width < 8 || rect.height < 8) continue

    const cs = getComputedStyle(el)
    const bg = parseRgb(cs.backgroundColor)

    if (bg && bg.a > 0.02 && bg.a < 0.999 && bg.r > 200 && bg.g > 200 && bg.b > 200) {
      translucent.push({ el: describe(el), bg: cs.backgroundColor })
    }

    const radii = [
      cs.borderTopLeftRadius,
      cs.borderTopRightRadius,
      cs.borderBottomLeftRadius,
      cs.borderBottomRightRadius,
    ]
    if (rect.width >= 120 && rect.height >= 60) {
      const nonZero = radii.filter((r) => r !== '0px' && r !== '')
      if (nonZero.length) rounded.push({ el: describe(el), radii: nonZero.join(' ') })
    }

    // Large dark fills in page content read as "not cabinet".
    if (bg && bg.a > 0.9 && rect.width >= 200 && rect.height >= 80) {
      if (luminance(bg) < 0.12) darkBlocks.push({ el: describe(el), bg: cs.backgroundColor })
    }

    // Text readability against the nearest painted ancestor background.
    const text = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1,
    )
    if (!text) continue

    const fg = parseRgb(cs.color)
    if (!fg) continue

    let node = el
    let painted = null
    while (node && node !== document.documentElement) {
      const nbg = parseRgb(getComputedStyle(node).backgroundColor)
      if (nbg && nbg.a > 0.85) {
        painted = nbg
        break
      }
      node = node.parentElement
    }
    if (!painted) continue
    if (node && inChrome(node)) continue

    const ratio = contrast(fg, painted)
    if (ratio < 2.2) {
      lowContrast.push({
        el: describe(el),
        color: cs.color,
        on: `rgb(${painted.r},${painted.g},${painted.b})`,
        ratio: Number(ratio.toFixed(2)),
        text: el.textContent.trim().slice(0, 48),
      })
    }
  }

  const dedupe = (list, key) => {
    const seen = new Map()
    for (const item of list) {
      const k = key(item)
      if (!seen.has(k)) seen.set(k, { ...item, count: 0 })
      seen.get(k).count += 1
    }
    return [...seen.values()].sort((a, b) => b.count - a.count)
  }

  return {
    translucent: dedupe(translucent, (i) => `${i.el}|${i.bg}`).slice(0, 12),
    rounded: dedupe(rounded, (i) => `${i.el}|${i.radii}`).slice(0, 12),
    darkBlocks: dedupe(darkBlocks, (i) => `${i.el}|${i.bg}`).slice(0, 8),
    lowContrast: dedupe(lowContrast, (i) => `${i.el}|${i.color}|${i.on}`).slice(0, 12),
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

let problems = 0

for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(1200)

  const result = await page.evaluate(audit)
  const found =
    result.translucent.length +
    result.rounded.length +
    result.darkBlocks.length +
    result.lowContrast.length

  problems += found
  console.log(`\n=== ${route} ${found === 0 ? '(clean)' : ''}`)
  for (const [label, list] of Object.entries(result)) {
    if (!list.length) continue
    console.log(`  ${label}:`)
    for (const item of list) console.log(`    ${JSON.stringify(item)}`)
  }
}

await browser.close()
console.log(`\nTotal findings: ${problems}`)
