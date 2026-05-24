import { test, expect } from '@playwright/test'
import {
  HOME_HERO,
  expectAppShell,
  expectMainInCenterGridColumn,
  expectMainLayout,
  expectNoHorizontalOverflow,
  fetchSampleEntityIds,
  gotoPath,
} from './helpers'

const PUBLIC_WITH_RAILS: Array<{
  path: string
  heading: RegExp
}> = [
  { path: '/', heading: HOME_HERO },
  {
    path: '/professionals',
    heading: /Будівельні майстри|Construction professionals ready/i,
  },
  {
    path: '/listings',
    heading: /Будівельні запити|Construction jobs from clients/i,
  },
  {
    path: '/vacancies',
    heading: /Ваканс|Vacanc/i,
  },
  {
    path: '/sell-rent',
    heading: /Продаж|Оренд|Sell|Rent/i,
  },
  {
    path: '/contact',
    heading: /Напишіть нам|Write to us directly/i,
  },
  {
    path: '/create-ad',
    heading: /Створити оголошення|Create a construction job request|Create a listing|Post an ad/i,
  },
]

const PUBLIC_GUTTER_ONLY: Array<{
  path: string
  heading: RegExp
}> = [
  {
    path: '/advertising',
    heading: /Додайте рекламу|Add your ad and choose/i,
  },
  {
    path: '/advertise',
    heading: /Додайте рекламу|Add your ad and choose/i,
  },
  { path: '/login', heading: /Вхід до DImarket|Sign In/i },
  {
    path: '/register',
    heading: /Реєстрація на DImarket|Register on DImarket|Sign up/i,
  },
  {
    path: '/boost',
    heading: /Отримуйте більше клієнтів|Get more clients/i,
  },
]

const AUTH_REDIRECT_PATHS = [
  '/dashboard',
  '/settings',
  '/profile',
  '/my-listings',
  '/messages',
  '/favorites',
]

test.describe('Усі сторінки — desktop layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  for (const route of PUBLIC_WITH_RAILS) {
    test(`${route.path} — контент, shell, бокові рейки`, async ({ page }) => {
      await gotoPath(page, route.path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(route.heading)
      await expectMainLayout(page, 'side-rails')
      await expectMainInCenterGridColumn(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.getByText(/^Рекламне місце$|^Ad Space$/i)).toHaveCount(0)
    })
  }

  for (const route of PUBLIC_GUTTER_ONLY) {
    test(`${route.path} — контент, shell, без бокових рейок`, async ({ page }) => {
      await gotoPath(page, route.path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(route.heading)
      await expectMainLayout(page, 'gutter-only')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('/checkout без session_id — повідомлення про недоступність', async ({ page }) => {
    await gotoPath(page, '/checkout')
    await expectMainLayout(page, 'gutter-only')
    await expect(
      page.getByRole('heading', { name: /Сторінка недоступна|Page unavailable|Something went wrong/i }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  for (const path of AUTH_REDIRECT_PATHS) {
    test(`${path} — редірект на login`, async ({ page }) => {
      await page.goto(path)
      await expect
        .poll(async () => {
          const onLogin = /\/login(\?.*)?$/.test(new URL(page.url()).pathname + new URL(page.url()).search)
          if (!onLogin) return false
          const loginHeading = page.getByRole('heading', {
            level: 1,
            name: /Вхід до DImarket|Sign In/i,
          })
          return loginHeading.isVisible()
        })
        .toBe(true)
      await expectAppShell(page)
    })
  }

  test('невідомий маршрут — показує головну (SPA fallback)', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expectAppShell(page)
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(HOME_HERO)
  })
})

test.describe('Усі сторінки — mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
  })

  for (const route of [...PUBLIC_WITH_RAILS, ...PUBLIC_GUTTER_ONLY]) {
    test(`${route.path} — без горизонтального скролу`, async ({ page }) => {
      await gotoPath(page, route.path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(route.heading)
      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe('Динамічні сторінки', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('listing/:id та professional/:id', async ({ page, request }) => {
    const { listingId, profileId } = await fetchSampleEntityIds(request)
    test.skip(!listingId && !profileId, 'Немає Supabase env або даних у БД')

    if (listingId) {
      await gotoPath(page, `/listing/${listingId}`)
      await expectMainLayout(page, 'side-rails')
      await expectMainInCenterGridColumn(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.locator('h1, h2').first()).toBeVisible()
    }

    if (profileId) {
      await gotoPath(page, `/professional/${profileId}`)
      await expectMainLayout(page, 'side-rails')
      await expectMainInCenterGridColumn(page)
      await expectNoHorizontalOverflow(page)
      await expect(page.locator('h1, h2').first()).toBeVisible()
    }
  })
})
