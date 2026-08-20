import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Cost estimator calculator', () => {
  test('BuildZoom homepage intake: тип, картки, отримати котирування', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.locator('.estimator-page__brand')).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()
    await expect(
      page.getByText(/Введіть, що ви хочете побудувати|Type what you’re looking to build/i),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Отримати котирування|Get quotes/i })).toBeVisible()

    await expect(page.getByRole('button', { name: /Ремонт ванної кімнати|Bathroom Remodel/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Реконструкція кухні|Kitchen Remodel/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Реконструкція кількох кімнат|Multi-room Remodel/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Добудова до будинку|Home Addition/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Будівництво нового будинку|New Home Construction/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Покрівля|Roofing/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Фарбування|Painting/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Підлогове покриття|Flooring/ })).toBeVisible()

    await page.getByRole('button', { name: /Ремонт ванної кімнати|Bathroom Remodel/ }).click()
    await expect(page.getByText(/Орієнтовна оцінка|Reference estimate/i).first()).toBeVisible()
  })

  test('клік «Калькулятор вартості» — SPA без циклу перезавантаження', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 1280) < 1024, 'Dept-nav click is desktop Chrome')

    await gotoPath(page, '/')

    let loads = 0
    page.on('load', () => {
      loads += 1
    })

    await clickHeaderNavButton(page, /Cost estimator|Калькулятор вартості/i, viewport)
    await expect(page).toHaveURL(/\/cost-estimator/)
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()

    await page.waitForTimeout(2500)
    expect(loads, 'Chrome reload loop on cost estimator').toBe(0)
    await expect(page).toHaveURL(/\/cost-estimator/)
  })
})
