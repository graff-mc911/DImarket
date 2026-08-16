import { test, expect, type Locator, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow, gotoPath } from './helpers'

const DESKTOP_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
] as const

function locationTrigger(page: Page) {
  return page.locator('.header-location button[aria-haspopup="dialog"]')
}

function locationPanel(page: Page) {
  return page.locator('.header-location__panel[role="dialog"]')
}

async function openLocationPanel(page: Page) {
  const trigger = locationTrigger(page)
  await expect(trigger).toBeVisible()
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
    await trigger.click()
  }
  const panel = locationPanel(page)
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('option', { name: /Усі країни|All countries/i })).toBeVisible({
    timeout: 15_000,
  })
  return panel
}

async function assertUnclippedInViewport(locator: Locator, label: string) {
  await expect(locator, label).toBeVisible()
  const metrics = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const inner = r.height - padY
    const fontSize = parseFloat(cs.fontSize)
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      inner,
      fontSize,
      overflow: `${cs.overflowX}/${cs.overflowY}`,
      inViewport:
        r.top >= -1 &&
        r.bottom <= window.innerHeight + 1 &&
        r.left >= -1 &&
        r.right <= window.innerWidth + 1,
      textClipped: inner + 0.5 < fontSize,
    }
  })
  expect(metrics.inViewport, `${label} off-viewport ${JSON.stringify(metrics)}`).toBeTruthy()
  expect(metrics.textClipped, `${label} glyph clip ${JSON.stringify(metrics)}`).toBeFalsy()
}

test.describe('Header location selector — desktop overflow', () => {
  for (const viewport of DESKTOP_VIEWPORTS) {
    test(`panel is fully usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await gotoPath(page, '/')
      const panel = await openLocationPanel(page)

      const countryList = panel.locator('.geo-filter-listbox--country')
      await expect(countryList).toBeVisible()

      const venezuela = panel.getByRole('option', { name: /^Venezuela$/i })
      await venezuela.scrollIntoViewIfNeeded()
      await expect(venezuela).toBeVisible()

      const regionLabel = panel.locator('label', { hasText: /Регіон|Region/ })
      const cityLabel = panel.locator('label', { hasText: /Місто|City/ })
      const radiusLabel = panel.locator('label', { hasText: /Радіус|Search radius/ })
      const gps = panel.getByRole('button', { name: /Моя поточна локація|Use my current location/i })

      await regionLabel.scrollIntoViewIfNeeded()
      await assertUnclippedInViewport(regionLabel, 'region label')
      await cityLabel.scrollIntoViewIfNeeded()
      await assertUnclippedInViewport(cityLabel, 'city label')
      await radiusLabel.scrollIntoViewIfNeeded()
      await assertUnclippedInViewport(radiusLabel, 'radius label')
      await gps.scrollIntoViewIfNeeded()
      await assertUnclippedInViewport(gps, 'gps button')

      await panel.getByRole('option', { name: /^Germany$/i }).click()
      const regionTrigger = panel.locator('button.geo-filter-select--trigger').first()
      await regionTrigger.click()
      await expect(panel.getByRole('option', { name: /Baden-Württemberg|Bavaria|Berlin/i }).first()).toBeVisible({
        timeout: 10_000,
      })

      const clear = panel.getByRole('button', { name: /Очистити геофільтри|Clear location filters/i })
      await clear.scrollIntoViewIfNeeded()
      await assertUnclippedInViewport(clear, 'clear geo filters')

      const panelBox = await panel.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return {
          height: r.height,
          maxHeight: cs.maxHeight,
          overflowY: cs.overflowY,
          zIndex: cs.zIndex,
          clipped: r.bottom > window.innerHeight + 1,
        }
      })
      expect(panelBox.clipped, JSON.stringify(panelBox)).toBeFalsy()
      expect(Number(panelBox.zIndex)).toBeGreaterThanOrEqual(90)
      expect(panelBox.overflowY).toMatch(/auto|scroll/)

      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe('Location filters — mobile sidebar', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('professionals geo filters keep controls readable', async ({ page }) => {
    await gotoPath(page, '/professionals')
    await page.locator('button.btn-secondary.mb-4').filter({ hasText: /Фільтри|Filters/ }).click()
    const sidebar = page.locator('.amazon-filter-sidebar')
    await expect(sidebar).toBeVisible()
    const country = sidebar.locator('select.geo-filter-select').first()
    await expect(country).toBeVisible()
    await assertUnclippedInViewport(country, 'mobile country select')
    await expect(page.getByText(/Радіус пошуку|Search radius/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Моя поточна локація|Use my current location/i })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
