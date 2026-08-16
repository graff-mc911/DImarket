import { test, expect } from '@playwright/test'
import { clickHeaderLogo, expectAppShell, gotoPath, headerLogo, HOME_HERO } from './helpers'

test.describe('Smoke — публічні сторінки', () => {
  test('головна завантажується з hero і шапкою', async ({ page }) => {
    await gotoPath(page, '/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HOME_HERO)
    await expectAppShell(page)
  })

  test('маршрути без авторизації відкриваються', async ({ page }) => {
    const routes = [
      {
        path: '/professionals',
        heading: /Будівельні майстри|Construction professionals ready/i,
      },
      {
        path: '/listings',
        heading: /Активні оголошення|Active listings/i,
      },
      {
        path: '/advertising',
        heading: /Додайте рекламу|Add your ad|самообслуговування|self-service|Advertising keeps/i,
        extra: /Схема розміщення|Placement map|Де показувати|Where to show|placements|Розміщення/i,
      },
      { path: '/contact', heading: /Напишіть нам|Write to us directly/i },
      { path: '/login', heading: /Вхід до DImarket|Sign In/i },
      {
        path: '/register',
        heading: /Реєстрація на DImarket|Register on DImarket|Sign up|Join DImarket/i,
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

  test('hero-карусель має унікальне фото на кожну категорію', async ({ page }) => {
    await gotoPath(page, '/')
    const carousel = page.locator('.home-hero-carousel')
    await expect(carousel).toBeVisible()

    const slides = carousel.locator('.home-hero-carousel__slide')
    const count = await slides.count()
    expect(count).toBeGreaterThan(8)

    const covers = await slides.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-cover') || ''),
    )
    expect(covers.every((src) => /images\.unsplash\.com\/photo-/.test(src))).toBe(true)
    expect(new Set(covers).size, `duplicate carousel covers: ${covers.join('\n')}`).toBe(count)

    await expect(carousel.locator('.home-hero-carousel__slide.is-active img')).toBeVisible()
    await carousel.locator('.home-hero-carousel__nav--next').click()
    await expect(carousel.locator('.home-hero-carousel__slide.is-active img')).toBeVisible()
  })

  test('клік по логотипу повертає на головну', async ({ page }) => {
    await gotoPath(page, '/contact')
    await clickHeaderLogo(page)
    await expect(page).toHaveURL(/\/$/)
    await expectAppShell(page)
  })
})
