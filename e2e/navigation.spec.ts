import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Навігація з шапки', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/')
  })

  test('верхнє меню — майстри та оголошення', async ({ page, viewport }) => {
    await clickHeaderNavButton(
      page,
      /Знайти майстр|Find Professionals/i,
      viewport,
    )
    await expect(page).toHaveURL(/\/professionals$/)

    await clickHeaderNavButton(
      page,
      /Перегляд оголошень|Переглянути оголошення|Browse Listings/i,
      viewport,
    )
    await expect(page).toHaveURL(/\/listings/)
  })

  test('центральне меню (desktop) — реклама та контакт', async ({ page, viewport }) => {
    test.skip(
      (viewport?.width ?? 0) < 1280,
      'Центральне меню видно лише на xl+',
    )

    const header = page.locator('header')
    await header.getByRole('button', { name: /Сторінка реклами|Advertising page/i }).click()
    await expect(page).toHaveURL(/\/advertising$/)

    await gotoPath(page, '/')
    await header.getByRole('button', { name: /Зв.*язатися|Contact us/i }).first().click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})

test.describe('Homepage Top Masters / Companies → catalog', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('Топ майстри title and cards open /professionals', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dimarket_global_location',
        JSON.stringify({
          country: 'Spain',
          region: '',
          province: '',
          city: '',
          radius: '25',
          originLat: null,
          originLng: null,
          fromGps: false,
        }),
      )
    })
    await gotoPath(page, '/')

    const pros = page.locator('section[aria-labelledby="home-pros-title"]')
    await expect(pros).toBeVisible()
    await expect(pros.locator('.home-pro-card--skeleton')).toHaveCount(0)

    await pros.locator('.home-section__title-btn').click()
    await expect(page).toHaveURL(/\/professionals$/)

    await gotoPath(page, '/')
    await expect(pros.locator('.home-pro-card--skeleton')).toHaveCount(0)
    const card = pros.locator('.home-pro-card__hit').first()
    await expect(card).toBeVisible({ timeout: 20_000 })
    await card.click()
    await expect(page).toHaveURL(/\/professionals$/)
  })

  test('Топ компанії title and cards open /companies', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dimarket_global_location',
        JSON.stringify({
          country: 'Spain',
          region: '',
          province: '',
          city: '',
          radius: '25',
          originLat: null,
          originLng: null,
          fromGps: false,
        }),
      )
    })
    await gotoPath(page, '/')

    const companies = page.locator('section[aria-labelledby="home-companies-rail-title"]')
    await expect(companies).toBeVisible()
    await expect(companies.locator('.home-pro-card--skeleton')).toHaveCount(0)

    await companies.locator('.home-section__title-btn').click()
    await expect(page).toHaveURL(/\/companies$/)

    await gotoPath(page, '/')
    await expect(companies.locator('.home-pro-card--skeleton')).toHaveCount(0)
    const card = companies.locator('.home-pro-card__hit').first()
    await expect(card).toBeVisible({ timeout: 20_000 })
    await card.click()
    await expect(page).toHaveURL(/\/companies$/)
  })
})
