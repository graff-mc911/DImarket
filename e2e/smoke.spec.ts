import { test, expect } from '@playwright/test'
import { clickHeaderLogo, expectAppShell, gotoPath, headerLogo, HOME_HERO } from './helpers'

test.describe('Smoke — публічні сторінки', () => {
  test('головна завантажується з hero і шапкою', async ({ page }) => {
    await gotoPath(page, '/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HOME_HERO)
    await expect(
      page
        .getByRole('navigation', { name: /Платформа|Platform/i })
        .getByRole('button', { name: /Знайти майстрів|Find professionals/i }),
    ).toBeVisible()
  })

  test('маршрути без авторизації відкриваються', async ({ page }) => {
    const routes = [
      {
        path: '/professionals',
        heading: /Будівельні майстри|Construction professionals ready/i,
      },
      {
        path: '/listings',
        heading: /Будівельні запити|Construction jobs from clients/i,
      },
      {
        path: '/advertising',
        heading: /Додайте рекламу|Add your ad and choose/i,
        extra: /Схема розміщення на сайті|Placement map on the site|Де показувати рекламу|Where to show the ad/i,
      },
      { path: '/contact', heading: /Напишіть нам|Write to us directly/i },
      { path: '/login', heading: /Вхід до DImarket|Sign In/i },
      {
        path: '/register',
        heading: /Реєстрація на DImarket|Register on DImarket|Sign up/i,
      },
    ]

    for (const route of routes) {
      await gotoPath(page, route.path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(route.heading)
      await expect(headerLogo(page)).toBeVisible()
      if ('extra' in route && route.extra) {
        await expect(page.getByRole('heading', { name: route.extra }).first()).toBeVisible()
      }
    }
  })

  test('клік по логотипу повертає на головну', async ({ page }) => {
    await gotoPath(page, '/contact')
    await clickHeaderLogo(page)
    await expect(page).toHaveURL(/\/$/)
    await expectAppShell(page)
  })
})
