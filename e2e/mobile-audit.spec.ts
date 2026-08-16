/**
 * Mobile UX audit harness — multi-viewport checks against live or local base URL.
 * Run: PLAYWRIGHT_BASE_URL=https://dimarket.app npx playwright test e2e/mobile-audit.spec.ts --project=chromium
 */
import { test, expect, devices, type Page } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://dimarket.app'

const VIEWPORTS = [
  { id: 'iphone-se', width: 320, height: 568, deviceScaleFactor: 2 },
  { id: 'iphone-se-3', width: 375, height: 667, deviceScaleFactor: 2 },
  { id: 'iphone-13', width: 390, height: 844, deviceScaleFactor: 3 },
  { id: 'iphone-15-pro', width: 393, height: 852, deviceScaleFactor: 3 },
  { id: 'iphone-16-pro', width: 402, height: 874, deviceScaleFactor: 3 },
  { id: 'pixel-8', width: 412, height: 915, deviceScaleFactor: 2.625 },
  { id: 'galaxy-s24', width: 360, height: 780, deviceScaleFactor: 3 },
  { id: 'iphone-14-pro-max', width: 430, height: 932, deviceScaleFactor: 3 },
  { id: 'ipad-mini', width: 768, height: 1024, deviceScaleFactor: 2 },
  { id: 'ipad-air', width: 820, height: 1180, deviceScaleFactor: 2 },
  { id: 'ipad-air-landscape', width: 1180, height: 820, deviceScaleFactor: 2 },
  { id: 'breakpoint-414', width: 414, height: 896, deviceScaleFactor: 2 },
  { id: 'breakpoint-1024', width: 1024, height: 768, deviceScaleFactor: 1 },
] as const

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/search', name: 'Global Search' },
  { path: '/professionals', name: 'Professionals' },
  { path: '/companies', name: 'Companies' },
  { path: '/listings', name: 'Listings / Projects' },
  { path: '/buy-sell', name: 'Buy & Sell', fallback: '/sell-rent' },
  { path: '/jobs', name: 'Jobs', fallback: '/vacancies' },
  { path: '/map', name: 'Map' },
  { path: '/create-ad', name: 'Create Ad' },
  { path: '/create-project', name: 'Create Project' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/contact', name: 'Contact' },
  { path: '/pricing', name: 'Pricing' },
] as const

type Finding = {
  page: string
  path: string
  device: string
  browser: string
  check: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  detail: string
  reproduction: string
}

const findings: Finding[] = []
const checkedScreens: Array<{ page: string; device: string; path: string; ok: boolean; notes: string[] }> = []

async function openPage(page: Page, path: string, fallback?: string) {
  const url = `${BASE}${path}`
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (res && res.status() >= 400 && fallback) {
    await page.goto(`${BASE}${fallback}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    return fallback
  }
  await page.waitForTimeout(800)
  return path
}

async function measureOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth)
    const clientW = doc.clientWidth
    const offenders: string[] = []
    const all = Array.from(document.querySelectorAll('body *')) as HTMLElement[]
    for (const el of all.slice(0, 2500)) {
      const r = el.getBoundingClientRect()
      if (r.width > clientW + 2 && r.left < 0 && Math.abs(r.left) + r.width > clientW + 8) {
        const cls = el.className?.toString?.().slice(0, 80) || el.tagName
        offenders.push(`${el.tagName}.${cls} w=${Math.round(r.width)} left=${Math.round(r.left)}`)
        if (offenders.length >= 8) break
      }
    }
    return {
      scrollWidth: scrollW,
      clientWidth: clientW,
      overflowPx: scrollW - clientW,
      offenders,
    }
  })
}

async function measureTapTargets(page: Page) {
  return page.evaluate(() => {
    const MIN = 44
    const selectors = [
      'header button',
      'header a',
      '.mobile-bottom-nav button',
      '.mobile-bottom-nav a',
      'form button',
      'form input',
      'form select',
      'form textarea',
      '[class*="filter"] button',
      '.listing-card button',
      '.pro-card button',
      '.directory-expert button',
      'footer a',
      'footer button',
    ]
    const small: Array<{ sel: string; w: number; h: number; text: string }> = []
    for (const sel of selectors) {
      for (const el of Array.from(document.querySelectorAll(sel))) {
        const r = (el as HTMLElement).getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.width < MIN || r.height < MIN) {
          small.push({
            sel,
            w: Math.round(r.width),
            h: Math.round(r.height),
            text: ((el as HTMLElement).innerText || (el as HTMLElement).getAttribute('aria-label') || '').slice(0, 40),
          })
        }
      }
    }
    // unique by size+text
    const seen = new Set<string>()
    return small.filter((s) => {
      const k = `${s.sel}:${s.w}x${s.h}:${s.text}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    }).slice(0, 25)
  })
}

async function measureNavPresence(page: Page) {
  return page.evaluate(() => {
    const bottom = document.querySelector('.mobile-bottom-nav')
    const hamburger = document.querySelector('header button[aria-label], header button.sm\\:hidden, .mobile-menu-button, button[aria-controls]')
    const headerButtons = Array.from(document.querySelectorAll('header button')).map((b) => {
      const r = (b as HTMLElement).getBoundingClientRect()
      return {
        label: (b.getAttribute('aria-label') || (b as HTMLElement).innerText || '').slice(0, 40),
        w: Math.round(r.width),
        h: Math.round(r.height),
        visible: r.width > 0 && r.height > 0,
      }
    })
    const locationControl = !!document.querySelector('[class*="HeaderLocation"], .header-location, [data-testid="header-location"]')
    const filtersToggle = Array.from(document.querySelectorAll('button')).find((b) =>
      /filter/i.test(b.textContent || '') || /filter/i.test(b.getAttribute('aria-label') || ''),
    )
    return {
      hasBottomNav: !!bottom && (bottom as HTMLElement).offsetParent !== null,
      headerButtons,
      hasLocationInDom: locationControl,
      hasFiltersButton: !!filtersToggle,
      hamburgerCount: headerButtons.filter((b) => b.visible && (b.w < 48 || /menu/i.test(b.label))).length,
    }
  })
}

async function measureFormInputs(page: Page) {
  return page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map((el) => {
      const i = el as HTMLInputElement
      return {
        tag: i.tagName,
        type: i.type || '',
        name: i.name || i.id || '',
        inputMode: i.inputMode || '',
        autoComplete: i.autocomplete || '',
        enterKeyHint: (i as HTMLInputElement & { enterKeyHint?: string }).enterKeyHint || '',
      }
    })
    return inputs.slice(0, 40)
  })
}

test.describe.configure({ mode: 'serial' })

test('mobile multi-viewport audit', async ({ browser }) => {
  test.setTimeout(15 * 60 * 1000)
  const outDir = resolve('docs/mobile-audit')
  mkdirSync(outDir, { recursive: true })

  // Focus on Chromium as mobile Chrome stand-in; WebKit if installed separately
  const browserName = 'Chromium (mobile emulation)'

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 1024,
      userAgent:
        vp.width < 768
          ? devices['iPhone 13'].userAgent
          : devices['Desktop Chrome'].userAgent,
    })
    const page = await context.newPage()

    for (const p of PAGES) {
      const notes: string[] = []
      let ok = true
      try {
        const usedPath = await openPage(page, p.path, 'fallback' in p ? (p as { fallback?: string }).fallback : undefined)

        const overflow = await measureOverflow(page)
        notes.push(`overflow=${overflow.overflowPx}px`)
        if (overflow.overflowPx > 8) {
          ok = false
          findings.push({
            page: p.name,
            path: usedPath,
            device: `${vp.id} (${vp.width}x${vp.height})`,
            browser: browserName,
            check: 'Horizontal overflow',
            severity: overflow.overflowPx > 40 ? 'High' : 'Medium',
            detail: `Document scrollWidth exceeds viewport by ${overflow.overflowPx}px. Offenders: ${overflow.offenders.join(' | ') || 'n/a'}`,
            reproduction: `Open ${BASE}${usedPath} at ${vp.width}px width; check document.scrollWidth vs clientWidth.`,
          })
        }

        const taps = await measureTapTargets(page)
        const criticalTaps = taps.filter((t) => t.h < 36 || t.w < 36)
        if (criticalTaps.length) {
          findings.push({
            page: p.name,
            path: usedPath,
            device: `${vp.id} (${vp.width}x${vp.height})`,
            browser: browserName,
            check: 'Touch targets < 44px',
            severity: criticalTaps.some((t) => t.h < 32) ? 'High' : 'Medium',
            detail: criticalTaps
              .slice(0, 8)
              .map((t) => `${t.sel} ${t.w}x${t.h} "${t.text}"`)
              .join('; '),
            reproduction: `Open ${BASE}${usedPath} at ${vp.width}px; inspect interactive controls size.`,
          })
        }
        notes.push(`smallTargets=${taps.length}`)

        const nav = await measureNavPresence(page)
        if (vp.width < 768 && !nav.hasBottomNav) {
          findings.push({
            page: p.name,
            path: usedPath,
            device: `${vp.id} (${vp.width}x${vp.height})`,
            browser: browserName,
            check: 'Mobile bottom navigation missing',
            severity: 'Critical',
            detail: '.mobile-bottom-nav not present in DOM/visible. Component exists in codebase but is not mounted in App.',
            reproduction: `Open ${BASE}${usedPath} on phone viewport; look for bottom tab bar.`,
          })
        }
        notes.push(`bottomNav=${nav.hasBottomNav}`)

        if (['Create Ad', 'Create Project', 'Login', 'Register', 'Contact'].includes(p.name)) {
          const inputs = await measureFormInputs(page)
          notes.push(`inputs=${inputs.length}`)
          const phonePlain = inputs.filter(
            (i) => /phone|tel/i.test(i.name) && i.type !== 'tel' && i.tag === 'INPUT',
          )
          if (phonePlain.length) {
            findings.push({
              page: p.name,
              path: usedPath,
              device: `${vp.id} (${vp.width}x${vp.height})`,
              browser: browserName,
              check: 'Phone field without type=tel',
              severity: 'High',
              detail: phonePlain.map((i) => `${i.name} type=${i.type || 'text'}`).join(', '),
              reproduction: `Open ${BASE}${usedPath}; focus phone field; expect telephone keypad.`,
            })
          }
          const missingHints = inputs.filter(
            (i) => i.tag === 'INPUT' && !i.inputMode && !i.enterKeyHint && ['text', 'search', ''].includes(i.type),
          )
          if (missingHints.length >= 3 && vp.id === 'iphone-13') {
            findings.push({
              page: p.name,
              path: usedPath,
              device: `${vp.id} (${vp.width}x${vp.height})`,
              browser: browserName,
              check: 'Missing inputMode / enterKeyHint',
              severity: 'Medium',
              detail: `${missingHints.length} text inputs lack inputMode/enterKeyHint`,
              reproduction: `Inspect form inputs on ${usedPath}.`,
            })
          }
        }

        // Capture one screenshot per key page on primary phone
        if (vp.id === 'iphone-13' && ['Home', 'Global Search', 'Map', 'Create Ad', 'Professionals', 'Buy & Sell', 'Jobs'].includes(p.name)) {
          await page.screenshot({
            path: resolve(outDir, `shot-${p.name.replace(/\s+/g, '-').toLowerCase()}-${vp.id}.png`),
            fullPage: false,
          })
        }
      } catch (err) {
        ok = false
        notes.push(`error=${err instanceof Error ? err.message : String(err)}`)
        findings.push({
          page: p.name,
          path: p.path,
          device: `${vp.id} (${vp.width}x${vp.height})`,
          browser: browserName,
          check: 'Page load / interaction failure',
          severity: 'Critical',
          detail: err instanceof Error ? err.message : String(err),
          reproduction: `Navigate to ${BASE}${p.path} at ${vp.width}x${vp.height}.`,
        })
      }
      checkedScreens.push({ page: p.name, device: vp.id, path: p.path, ok, notes })
    }

    // Landscape check on phone
    if (vp.id === 'iphone-13') {
      await page.setViewportSize({ width: 844, height: 390 })
      await openPage(page, '/')
      const overflow = await measureOverflow(page)
      if (overflow.overflowPx > 8) {
        findings.push({
          page: 'Home',
          path: '/',
          device: 'iphone-13-landscape (844x390)',
          browser: browserName,
          check: 'Horizontal overflow (landscape)',
          severity: 'Medium',
          detail: `overflow ${overflow.overflowPx}px`,
          reproduction: 'Rotate iPhone 13 to landscape on Home.',
        })
      }
      checkedScreens.push({
        page: 'Home',
        device: 'iphone-13-landscape',
        path: '/',
        ok: overflow.overflowPx <= 8,
        notes: [`overflow=${overflow.overflowPx}`],
      })
    }

    await context.close()
  }

  // Deduplicate similar findings (same page+check+severity, keep one device sample + count)
  const dedup = new Map<string, Finding & { devices: string[] }>()
  for (const f of findings) {
    const key = `${f.page}|${f.check}|${f.severity}|${f.detail.slice(0, 80)}`
    const existing = dedup.get(key)
    if (existing) existing.devices.push(f.device)
    else dedup.set(key, { ...f, devices: [f.device] })
  }
  const unique = Array.from(dedup.values()).map((f) => ({
    ...f,
    device: f.devices.length > 3 ? `${f.devices[0]} (+${f.devices.length - 1} viewports)` : f.devices.join(', '),
  }))

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    method:
      'Playwright Chromium mobile emulation across listed viewports. Not a substitute for real Safari iOS / Samsung Internet device lab, but exercises layout, overflow, tap targets, nav presence, and form input types.',
    viewports: VIEWPORTS,
    pages: PAGES,
    screensChecked: checkedScreens.length,
    screensFailed: checkedScreens.filter((s) => !s.ok).length,
    findings: unique,
    checkedScreens,
  }

  writeFileSync(resolve(outDir, 'raw-findings.json'), JSON.stringify(report, null, 2))
  console.log(`Wrote ${unique.length} unique findings; checked ${checkedScreens.length} screen×viewport combos`)
  expect(checkedScreens.length).toBeGreaterThan(50)
})
