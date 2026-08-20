import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Cost estimator calculator', () => {
  test('BuildZoom quote flow: головна → допомога → коли почати → пропозиції', async ({ page }) => {
    await gotoPath(page, '/cost-estimator')

    await expect(page.getByLabel(/Мені потрібна допомога з|I need help with/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Отримати котирування|Get quotes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ремонт ванної кімнати|Bathroom Remodel/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Фарбування|Painting/ })).toBeVisible()

    await page.getByRole('button', { name: /Ремонт ванної кімнати|Bathroom Remodel/ }).click()

    await expect(page.getByRole('heading', { name: /З чим вам потрібна допомога\?|What do you need help with\?/ })).toBeVisible()
    await expect(page.getByText(/Ми знаємо, хто найкращі|We know who the best/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /ПРОДОВЖУВАТИ|CONTINUE/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Сонячна установка|Solar Installation/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Нова комерційна реконструкція|New Commercial Remodel/ })).toBeVisible()

    await page.getByRole('button', { name: /ПРОДОВЖУВАТИ|CONTINUE/i }).click()

    await expect(
      page.getByRole('heading', { name: /Коли вам потрібно розпочати ваш проєкт\?|When do you need to start your project\?/ }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Я гнучкий\/гнучка|I'm flexible/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Якомога швидше|As soon as possible/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Протягом кількох місяців|Within a few months/ })).toBeVisible()

    await page.getByRole('button', { name: /Протягом кількох тижнів|Within a few weeks/ }).click()

    await expect(
      page.getByRole('heading', { name: /Скільки пропозицій|How many bids/i }),
    ).toBeVisible()
    await page.getByRole('button', { name: /^4/ }).click()

    await expect(page.getByRole('heading', { name: /Який це тип нерухомості|What type of property/i })).toBeVisible()
    await page.getByRole('button', { name: /Приватний будинок|Single Family Home/ }).click()

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
