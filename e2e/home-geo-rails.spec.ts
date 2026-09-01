import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

const SPAIN_GEO = {
  country: 'Spain',
  region: '',
  province: '',
  city: '',
  radius: '25',
  originLat: null,
  originLng: null,
  fromGps: false,
}

async function seedHeaderCountry(page: import('@playwright/test').Page) {
  await page.addInitScript((geo) => {
    localStorage.setItem('dimarket_global_location', JSON.stringify(geo))
  }, SPAIN_GEO)
}

async function expectSectionRespectsSpain(section: import('@playwright/test').Locator) {
  await expect(section.locator('.home-pro-card--skeleton')).toHaveCount(0)
  const cards = section.locator('.home-pro-card')
  const empty = section.locator('.home-section__empty')
  const count = await cards.count()
  if (count === 0) {
    await expect(empty).toBeVisible()
    return
  }
  for (let i = 0; i < count; i++) {
    const text = await cards.nth(i).innerText()
    expect(text, text).not.toMatch(/Germany|Ukraine|Poland|Darmstadt|Lviv|Łódź|Львів/i)
  }
}

test.describe('Homepage rails follow header country', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Top майстри / Top компанії are Spain-only when header is Spain', async ({ page }) => {
    await seedHeaderCountry(page)
    await gotoPath(page, '/')
    await expect(page.locator('.header-location')).toContainText(/Spain/i)

    const pros = page.locator('section[aria-labelledby="home-pros-title"]')
    const companies = page.locator('section[aria-labelledby="home-companies-rail-title"]')
    await expect(pros).toBeVisible()
    await expect(companies).toBeVisible()
    await expect(pros.locator('.home-pro-card--skeleton')).toHaveCount(0)
    await expect(pros.locator('.home-pro-card').first()).toBeVisible({ timeout: 20_000 })
    await expect(companies.locator('.home-pro-card').first()).toBeVisible({ timeout: 20_000 })
    await expectSectionRespectsSpain(pros)
    await expectSectionRespectsSpain(companies)

    async function expectUniqueLoadedAvatars(
      section: import('@playwright/test').Locator,
      label: string,
    ) {
      const imgs = section.locator('.home-pro-card__avatar img')
      await expect(imgs.first()).toBeVisible()
      const srcs = await imgs.evaluateAll((nodes) =>
        nodes.map((node) => {
          const img = node as HTMLImageElement
          return {
            src: img.currentSrc || img.getAttribute('src') || '',
            width: img.naturalWidth,
          }
        }),
      )
      expect(srcs.length, label).toBeGreaterThan(1)
      expect(
        srcs.some((item) => item.src.includes('listing-themes')),
        `${label} still uses listing-theme stock`,
      ).toBe(false)
      expect(
        srcs.some((item) => item.src.includes('campaigns/profiles')),
        `${label} still uses unreadable campaign URLs`,
      ).toBe(false)
      expect(new Set(srcs.map((item) => item.src)).size, srcs.map((s) => s.src).join('\n')).toBe(
        srcs.length,
      )
      for (const item of srcs) {
        expect(item.width, item.src).toBeGreaterThan(0)
      }
    }

    await expectUniqueLoadedAvatars(pros, 'Top майстри')
    await expectUniqueLoadedAvatars(companies, 'Top компанії')
  })
})
