import { test, expect, type Locator, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow, gotoPath } from './helpers'

const DESKTOP_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
] as const

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
] as const

function locationTrigger(page: Page) {
  return page.locator('.header-location button[aria-haspopup="dialog"]')
}

function locationPanel(page: Page) {
  return page.locator('.header-location__panel[role="dialog"]')
}

async function useUkrainian(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('dimarket_language', 'uk')
  })
}

async function openLocationPanel(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  const trigger = locationTrigger(page)
  await expect(trigger).toBeVisible()
  const panel = locationPanel(page)
  if (!(await panel.isVisible())) {
    await trigger.click()
  }
  await expect(panel).toBeVisible()
  const country = panel.locator('select.geo-filter-select').first()
  await expect(country).toBeVisible()
  await expect(country).toBeEnabled({ timeout: 15_000 })
  await expect(country.locator('option', { hasText: /^Germany$/ })).toHaveCount(1, { timeout: 15_000 })
  return panel
}

async function assertSelectGlyphsUnclipped(locator: Locator, label: string) {
  await expect(locator, label).toBeVisible()
  const metrics = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const padTop = parseFloat(cs.paddingTop)
    const padBottom = parseFloat(cs.paddingBottom)
    const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    const fontSize = parseFloat(cs.fontSize)
    const inner = r.height - padTop - padBottom - borderY
    const lh = cs.lineHeight
    const linePx = lh === 'normal' ? fontSize * 1.2 : parseFloat(lh)
    return {
      height: r.height,
      padTop,
      padBottom,
      borderY,
      inner,
      fontSize,
      lineHeight: lh,
      linePx,
      overflow: cs.overflow,
      overflowY: cs.overflowY,
      appearance: cs.getPropertyValue('appearance') || cs.getPropertyValue('-webkit-appearance'),
      fontFamily: cs.fontFamily,
      textClipped: inner + 0.5 < Math.max(fontSize, linePx),
      paddingEatsText: padTop + padBottom > r.height * 0.65,
    }
  })
  expect(
    String(metrics.appearance),
    `${label} appearance ${JSON.stringify(metrics)}`,
  ).toMatch(/none/i)
  expect(metrics.linePx, `${label} line-height ${JSON.stringify(metrics)}`).toBeGreaterThanOrEqual(
    metrics.fontSize,
  )
  expect(metrics.padTop, `${label} padding-top ${JSON.stringify(metrics)}`).toBeGreaterThanOrEqual(8)
  expect(metrics.padBottom, `${label} padding-bottom ${JSON.stringify(metrics)}`).toBeGreaterThanOrEqual(8)
  expect(metrics.overflowY, `${label} overflow ${JSON.stringify(metrics)}`).not.toBe('hidden')
  expect(metrics.textClipped, `${label} glyph clip ${JSON.stringify(metrics)}`).toBeFalsy()
  expect(metrics.paddingEatsText, `${label} padding clip ${JSON.stringify(metrics)}`).toBeFalsy()
}

test.describe('Header location selector — native select glyphs', () => {
  for (const viewport of DESKTOP_VIEWPORTS) {
    test(`select text is fully visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await useUkrainian(page)
      await gotoPath(page, '/')
      const panel = await openLocationPanel(page)
      const selects = panel.locator('select.geo-filter-select')
      await expect(selects).toHaveCount(4)

      await selects.nth(0).selectOption('Germany')
      await expect(selects.nth(0)).toHaveValue('Germany')
      await expect(selects.nth(1)).toBeEnabled()

      await assertSelectGlyphsUnclipped(selects.nth(0), 'country')
      await assertSelectGlyphsUnclipped(selects.nth(1), 'region')
      await assertSelectGlyphsUnclipped(selects.nth(2), 'city')
      await assertSelectGlyphsUnclipped(selects.nth(3), 'radius')

      const header = page.locator('.header-location .amazon-header-block')
      const shotDir = `test-results/visual-location/${viewport.width}x${viewport.height}`
      await panel.screenshot({ path: `${shotDir}/panel.png` })
      await selects.nth(0).screenshot({ path: `${shotDir}/country.png` })
      await selects.nth(1).screenshot({ path: `${shotDir}/region.png` })
      await selects.nth(2).screenshot({ path: `${shotDir}/city.png` })
      await selects.nth(3).screenshot({ path: `${shotDir}/radius.png` })
      await header.screenshot({ path: `${shotDir}/header-trigger.png` })

      const longCountry = selects.nth(0).locator('option', { hasText: /^United Kingdom$/ })
      if ((await longCountry.count()) > 0) {
        await selects.nth(0).selectOption('United Kingdom')
        await assertSelectGlyphsUnclipped(selects.nth(0), 'long country')
        await selects.nth(0).screenshot({ path: `${shotDir}/country-long.png` })
        await selects.nth(0).selectOption('Germany')
      }

      const regionLabel = panel.locator('label', { hasText: /Регіон|Region/ })
      const cityLabel = panel.locator('label', { hasText: /Місто|City/ })
      const radiusLabel = panel.locator('label', { hasText: /Радіус|Search radius/ })
      await expect(regionLabel).toBeVisible()
      await expect(cityLabel).toBeVisible()
      await expect(radiusLabel).toBeVisible()
      await expect(panel.getByRole('button', { name: /Моя поточна локація|Use my current location/i })).toBeVisible()

      const headerMetrics = await header.evaluate((el) => {
        const cs = getComputedStyle(el)
        return { lineHeight: cs.lineHeight, fontSize: parseFloat(cs.fontSize), overflow: cs.overflow }
      })
      expect(parseFloat(headerMetrics.lineHeight)).toBeGreaterThan(parseFloat(String(headerMetrics.fontSize)) * 1.15)

      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe('Location filters — mobile native selects', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`companies geo selects at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await useUkrainian(page)
      await gotoPath(page, '/companies')
      const bottomNav = page.locator('.mobile-bottom-nav')
      if ((await bottomNav.count()) > 0) {
        await bottomNav.evaluate((el) => {
          ;(el as HTMLElement).style.visibility = 'hidden'
        })
      }
      await page.locator('button.btn-secondary.mb-4').filter({ hasText: /Фільтри|Filters/ }).click()
      const sidebar = page.locator('.amazon-filter-sidebar')
      await expect(sidebar).toBeVisible()
      const country = sidebar.locator('select.geo-filter-select').first()
      await expect(country).toBeVisible()
      await assertSelectGlyphsUnclipped(country, 'mobile country')
      const mobileSelects = sidebar.locator('select.geo-filter-select')
      const mobileCount = await mobileSelects.count()
      expect(mobileCount).toBeGreaterThanOrEqual(4)
      for (let i = 0; i < Math.min(mobileCount, 4); i++) {
        await assertSelectGlyphsUnclipped(mobileSelects.nth(i), `mobile select ${i}`)
      }
      await country.screenshot({
        path: `test-results/visual-location/mobile-${viewport.width}x${viewport.height}-country.png`,
      })
      await sidebar.locator('select.geo-filter-select').nth(3).screenshot({
        path: `test-results/visual-location/mobile-${viewport.width}x${viewport.height}-radius.png`,
      })
      await expect(page.getByText(/Радіус пошуку|Search radius/i).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /Моя поточна локація|Use my current location/i })).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })
  }
})
