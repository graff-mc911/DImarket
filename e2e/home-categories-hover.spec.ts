import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Homepage categories link grid', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('opens subcategory menu on click and keeps it for picking a subcategory', async ({ page }) => {
    await gotoPath(page, '/')
    const section = page.locator('#choose-category')
    await expect(section).toBeVisible()
    await expect(section.locator('.dimarket-cat-grid')).toBeVisible()
    await expect(section.locator('.dimarket-category-card')).toHaveCount(0)

    const first = section.locator('.dimarket-cat-item').first()
    const menu = first.locator('.dimarket-cat-item__menu')
    await first.hover()
    await expect(menu).toBeHidden()

    await first.locator('.dimarket-cat-item__link').click()
    await expect(menu).toBeVisible()
    const subcategory = menu.getByRole('menuitem').nth(1)
    await expect(subcategory).toBeVisible()
    await subcategory.click()
    await expect(page).not.toHaveURL(/\/$/)
  })
})
