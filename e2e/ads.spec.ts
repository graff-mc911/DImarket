import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Реклама на сайті', () => {
  test('публічні сторінки без порожніх placeholder «Рекламне місце»', async ({ page }) => {
    for (const path of ['/', '/listings', '/professionals', '/contact']) {
      await gotoPath(page, path)
      await expect(page.getByText(/^Рекламне місце$|^Ad Space$/i)).toHaveCount(0)
      await expect(page.getByText(/^Рекламуйте свій бізнес тут$|^Advertise your business here$/i)).toHaveCount(
        0,
      )
    }
  })

  test('/advertising — схема розміщення та вибір слотів', async ({ page }) => {
    await gotoPath(page, '/advertising')
    await expect(
      page.getByText(/Схема розміщення на сайті|Placement map on the site/i),
    ).toBeVisible()
    await expect(page.getByText(/Де показувати рекламу|Where to show the ad/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Головна сторінка|Home page/i }).first()).toBeVisible()
  })
})
