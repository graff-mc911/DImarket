import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Cost estimator calculator', () => {
  test('тип, площа, опції, жива сума і пропозиції як калькулятор BuildZoom', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.getByText(/DImarket/i).first()).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Отримати пропозиції|Get quotes/i })).toBeVisible()

    const bathroom = page.locator('.estimator-intake__card', { hasText: /Ванна|Bathroom/i }).first()
    await expect(bathroom).toBeVisible()
    await bathroom.click()

    await expect(page.getByText(/Оберіть опції|Select specific features/i)).toBeVisible()
    await page.locator('.estimator-calc__input[type="number"]').fill('8')
    await page.locator('.estimator-calc__feature').first().click()

    const total = page.locator('.estimator-calc__total-value')
    await expect(total).toBeVisible()
    await expect(total).not.toHaveText(/€\s*0/)

    await page.getByRole('button', { name: /Отримати пропозиції|Get quotes/i }).click()
    await expect(page.getByText(/Орієнтовна оцінка|Reference estimate/i).first()).toBeVisible()
  })
})
