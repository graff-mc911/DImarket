import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Cost estimator intake', () => {
  test('пошук, картки і перехід далі як на BuildZoom', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.getByText(/DImarket/i).first()).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Отримати пропозиції|Get quotes/i })).toBeVisible()

    const bathroom = page.locator('.estimator-intake__card', { hasText: /Ванна|Bathroom/i }).first()
    await expect(bathroom).toBeVisible()
    await bathroom.click()

    await expect(
      page.getByRole('heading', { name: /Опишіть роботу|Describe the work/i }),
    ).toBeVisible()
  })
})
