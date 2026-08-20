import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Cost estimator calculator', () => {
  test('BuildZoom-style: тип, роботи, жива сума, знайти виконавця', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.locator('.estimator-page__brand')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Калькулятор вартості ремонту|Remodeling cost calculator/i }),
    ).toBeVisible()
    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toHaveCount(0)

    const basic = page.getByRole('heading', { name: /Введіть основну інформацію|Enter basic info/i })
    const features = page.getByRole('heading', { name: /Виберіть конкретні роботи|Select specific features/i })
    const project = page.getByRole('heading', { name: /Ваш проєкт|Your project/i })
    await expect(basic).toBeVisible()
    await expect(features).toBeVisible()
    await expect(project).toBeVisible()

    const typeSelect = page.locator('#estimator-project-type')
    await expect(typeSelect.getByRole('option', { name: /Ремонт ванної кімнати|Bathroom remodel/ })).toHaveCount(1)
    await expect(typeSelect.getByRole('option', { name: /Реконструкція кухні|Kitchen remodel/ })).toHaveCount(1)
    await expect(typeSelect.getByRole('option', { name: /^(Виробники|Manufacturers)$/ })).toHaveCount(0)

    await typeSelect.selectOption('bathroom_remodel')
    await page.locator('#estimator-area').fill('10')

    const add = async (name: RegExp) => {
      await page.getByRole('button', { name }).click()
    }
    await add(/Укладання плитки на підлогу|Floor tiling/)
    await add(/Укладання плитки на стіни|Wall tiling/)
    await add(/Нова душова|New shower/)
    await add(/Новий унітаз|New toilet/)
    await add(/Новий умивальник|New sink/)

    const picked = page.locator('.estimator-calc__picked')
    await expect(picked.getByText(/Укладання плитки на підлогу|Floor tiling/)).toBeVisible()
    await expect(picked.getByText(/Укладання плитки на стіни|Wall tiling/)).toBeVisible()
    await expect(picked.getByText(/Нова душова|New shower/)).toBeVisible()
    await expect(picked.getByText(/Новий унітаз|New toilet/)).toBeVisible()
    await expect(picked.getByText(/Новий умивальник|New sink/)).toBeVisible()

    const total = page.locator('.estimator-calc__total-value')
    await expect(total).toBeVisible()
    const standardText = await total.innerText()
    expect(standardText).not.toMatch(/€\s*0[,.]00/)

    await page.getByRole('button', { name: /^Економ$|^Economy$/ }).click()
    await expect(total).not.toHaveText(standardText)
    const economyText = await total.innerText()

    await page.getByRole('button', { name: /^Преміум$|^Premium$/ }).click()
    const premiumText = await total.innerText()
    expect(premiumText).not.toBe(economyText)

    await page.getByRole('button', { name: /^Ні$|^No$/ }).click()
    const laborOnlyText = await total.innerText()
    expect(laborOnlyText).not.toBe(premiumText)

    await page.locator('#estimator-area').fill('20')
    await expect(total).not.toHaveText(laborOnlyText)
    const largerAreaText = await total.innerText()

    await picked.getByRole('button', { name: /Прибрати|Remove/ }).first().click()
    await expect(total).not.toHaveText(largerAreaText)

    await page.reload()
    await expect(basic).toBeVisible()
    await expect(page.locator('.estimator-calc__total-value')).toBeVisible()

    await typeSelect.selectOption('bathroom_remodel')
    await page.locator('#estimator-area').fill('10')
    await add(/Укладання плитки на підлогу|Floor tiling/)
    await page.getByRole('button', { name: /Знайти виконавця|Find a contractor/i }).click()
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
})
