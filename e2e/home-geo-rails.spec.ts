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
    await expectSectionRespectsSpain(pros)
    await expectSectionRespectsSpain(companies)

    expect(await pros.locator('.home-pro-card').count()).toBeGreaterThan(0)
    expect(await companies.locator('.home-pro-card').count()).toBeGreaterThan(0)

    const companySrcs = await companies.locator('.home-pro-card__avatar img').evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).currentSrc || img.getAttribute('src') || ''),
    )
    expect(companySrcs.length).toBeGreaterThan(1)
    expect(companySrcs.some((src) => src.includes('listing-themes'))).toBe(false)
    expect(new Set(companySrcs).size, companySrcs.join('\n')).toBe(companySrcs.length)
  })
})
