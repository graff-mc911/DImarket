import { test, expect } from '@playwright/test'
import { clickHeaderNavButton, gotoPath } from './helpers'

test.describe('Навігація з шапки', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPath(page, '/')
  })

  test('верхнє меню — фахівці та оголошення', async ({ page, viewport }) => {
    await clickHeaderNavButton(
      page,
      /Знайти фахівц|Find Professionals/i,
      viewport,
    )
    await expect(page).toHaveURL(/\/professionals$/)

    await clickHeaderNavButton(
      page,
      /Перегляд оголошень|Переглянути оголошення|Browse Listings/i,
      viewport,
    )
    await expect(page).toHaveURL(/\/listings/)
  })

  test('центральне меню (desktop) — реклама та контакт', async ({ page, viewport }) => {
    test.skip(
      (viewport?.width ?? 0) < 1280,
      'Центральне меню видно лише на xl+',
    )

    const header = page.locator('header')
    await header.getByRole('button', { name: /Сторінка реклами|Advertising page/i }).click()
    await expect(page).toHaveURL(/\/advertising$/)

    await gotoPath(page, '/')
    await header.getByRole('button', { name: /Зв.*язатися|Contact us/i }).first().click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})
