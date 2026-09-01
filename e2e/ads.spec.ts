import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Реклама на сайті', () => {
  test('публічні сторінки без порожніх placeholder «Рекламне місце»', async ({ page }) => {
    for (const path of ['/', '/listings', '/professionals', '/companies', '/categories', '/category/manufacturers', '/create-ad', '/map', '/cost-estimator', '/contact']) {
      await gotoPath(page, path)
      await expect(page.getByText(/^Рекламне місце$|^Ad Space$/i)).toHaveCount(0)
      await expect(page.getByText(/^Рекламуйте свій бізнес тут$|^Advertise your business here$/i)).toHaveCount(
        0,
      )
    }
  })

  test('/advertising — hero та секція розміщень', async ({ page }) => {
    await gotoPath(page, '/advertising')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Додайте рекламу|Add your ad and choose/i,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: /Де показувати рекламу|Where to show the ad/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Увійти для додавання|Sign in to add advertising/i }).first(),
    ).toBeVisible()
  })

  test('homepage mid-page story banner uses project-card layout', async ({ page }) => {
    await gotoPath(page, '/')
    const story = page.locator('.ad-story').first()
    await expect(story).toBeVisible()
    await expect(story.locator('.ad-story__title')).toBeVisible()
    await expect(story.locator('.ad-story__media')).toBeVisible()

    const rel = (await story.getAttribute('rel')) ?? ''
    const isPaid = rel.includes('sponsored')
    if (isPaid) {
      // Geo targeting is not advertiser copy — paid cards must not inject Location / Worldwide.
      await expect(
        story.locator('.ad-story__meta dt').filter({ hasText: /^(Розташування|Location)$/ }),
      ).toHaveCount(0)
      await expect(
        story.locator('.ad-story__meta dd').filter({ hasText: /^(Весь світ|Worldwide)$/ }),
      ).toHaveCount(0)
    } else {
      await expect(story.getByText(/^Підрядник$|^Contractor$/)).toBeVisible()
      await expect(story.getByText(/^Європа$|^Europe$/)).toBeVisible()
    }
  })
})
