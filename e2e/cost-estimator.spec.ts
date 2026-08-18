import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Cost estimator calculator', () => {
  test('три колонки як BuildZoom /cost: тип, опції, жива сума і пропозиції', async ({
    page,
  }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.locator('.estimator-page__brand')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Калькулятор вартості ремонту|Remodeling cost calculator/i }),
    ).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toHaveCount(0)
    await expect(page.locator('.estimator-intake__card')).toHaveCount(0)

    const basic = page.getByRole('heading', { name: /Базові дані|Enter basic info/i })
    const features = page.getByRole('heading', { name: /Оберіть опції|Select specific features/i })
    const estimate = page.getByRole('heading', { name: /Ваша оцінка|Get your estimate/i })
    await expect(basic).toBeVisible()
    await expect(features).toBeVisible()
    await expect(estimate).toBeVisible()

    const width = page.viewportSize()?.width ?? 0
    if (width >= 960) {
      await expect(basic).toBeInViewport()
      await expect(features).toBeInViewport()
      await expect(estimate).toBeInViewport()
    }

    await page.locator('#estimator-project-type').selectOption('bathroom')
    await page.locator('#estimator-area').fill('8')
    await page.locator('.estimator-calc__feature').first().click()

    const total = page.locator('.estimator-calc__total-value')
    await expect(total).toBeVisible()
    await expect(total).not.toHaveText(/€\s*0/)

    await page.getByRole('button', { name: /Отримати пропозиції|Get quotes/i }).click()
    await expect(page.getByText(/Орієнтовна оцінка|Reference estimate/i).first()).toBeVisible()
  })

  test('клік «Калькулятор вартості» — SPA без циклу перезавантаження', async ({
    page,
    viewport,
  }) => {
    await gotoPath(page, '/')

    let loads = 0
    page.on('load', () => {
      loads += 1
    })

    await clickHeaderNavButton(page, /Cost estimator|Калькулятор вартості/i, viewport)
    await expect(page).toHaveURL(/\/cost-estimator/)
    await expect(
      page.getByRole('heading', { name: /Калькулятор вартості ремонту|Remodeling cost calculator/i }),
    ).toBeVisible()

    await page.waitForTimeout(2500)
    expect(loads, 'Chrome reload loop on cost estimator').toBe(0)
    await expect(page).toHaveURL(/\/cost-estimator/)
  })
})
