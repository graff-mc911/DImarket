import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Cost estimator calculator', () => {
  test('три колонки: тип обʼєкта, види робіт по черзі, жива сума', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.locator('.estimator-page__brand')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Калькулятор вартості ремонту|Remodeling cost calculator/i }),
    ).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toHaveCount(0)
    await expect(page.locator('.estimator-intake__card')).toHaveCount(0)

    const basic = page.getByRole('heading', { name: /Базові дані|Enter basic info/i })
    const features = page.getByRole('heading', { name: /Опції кожного виду робіт|Options for each work type/i })
    const estimate = page.getByRole('heading', { name: /Ваша оцінка|Get your estimate/i })
    await expect(basic).toBeVisible()
    await expect(features).toBeVisible()
    await expect(estimate).toBeVisible()
    await expect(page.locator('#estimator-works-label')).toBeVisible()

    const width = page.viewportSize()?.width ?? 0
    if (width >= 960) {
      await expect(basic).toBeInViewport()
      await expect(features).toBeInViewport()
      await expect(estimate).toBeInViewport()
    }

    const objectSelect = page.locator('#estimator-project-type')
    await expect(objectSelect.getByRole('option', { name: /Будинок|House/ })).toHaveCount(1)
    await expect(objectSelect.getByRole('option', { name: /Квартира|Apartment/ })).toHaveCount(1)
    await expect(objectSelect.getByRole('option', { name: /Ангар|Hangar/ })).toHaveCount(1)
    await expect(objectSelect.getByRole('option', { name: /Навіс|Canopy/ })).toHaveCount(1)
    await expect(objectSelect.getByRole('option', { name: /Ферма|Farm/ })).toHaveCount(1)
    await objectSelect.selectOption('house')
    await page.locator('#estimator-area').fill('80')

    await expect(page.locator('.estimator-calc__work')).toHaveCount(0)
    await expect(page.locator('.estimator-calc__stage')).toHaveCount(0)

    await page.locator('#estimator-work-type').selectOption('concrete')
    await page.getByRole('button', { name: /^Додати$|^Add$/ }).click()
    await expect(page.locator('#estimator-stage-concrete')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Бетонні роботи|Concrete works/ })).toBeVisible()
    await expect(page.getByText(/Опалубка|Formwork/)).toBeVisible()
    await page.locator('#estimator-stage-concrete .estimator-calc__feature').first().click()

    await page.locator('#estimator-work-type').selectOption('masonry')
    await page.getByRole('button', { name: /^Додати$|^Add$/ }).click()
    await expect(page.locator('#estimator-stage-masonry')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Мурувальні роботи|Masonry/ })).toBeVisible()
    await expect(page.getByText(/Кладка цегли|Brickwork/)).toBeVisible()
    await page.locator('#estimator-stage-masonry .estimator-calc__feature').first().click()

    await expect(page.locator('.estimator-calc__stage')).toHaveCount(2)
    await expect(page.locator('#estimator-stage-concrete')).toBeVisible()
    await expect(page.locator('#estimator-stage-masonry')).toBeVisible()

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
    test.skip((viewport?.width ?? 1280) < 1024, 'Dept-nav click is desktop Chrome')

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

  test('тип проєкту — обʼєкт, не Виробники і не окрема робота', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')
    const select = page.locator('#estimator-project-type')
    await expect(select).toBeVisible()
    await expect.poll(async () => select.locator('option').count()).toBeGreaterThan(3)
    await expect(select.getByRole('option', { name: /^(Виробники|Manufacturers)$/ })).toHaveCount(0)
    await expect(select.getByRole('option', { name: /^(Ванна|Bathroom)$/ })).toHaveCount(0)
    await expect(select.getByRole('option', { name: /Будинок|House/ })).toHaveCount(1)
    await expect(select.getByRole('option', { name: /Ферма|Farm/ })).toHaveCount(1)
    await expect(page.locator('#estimator-work-type')).toBeVisible()
    await expect(page.locator('#estimator-works-label')).toBeVisible()
  })
})
