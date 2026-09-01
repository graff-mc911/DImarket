import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Homepage categories link grid', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('shows a 4-column text grid and subcategory menu on hover', async ({ page }) => {
    await gotoPath(page, '/')
    const section = page.locator('#choose-category')
    await expect(section).toBeVisible()
    await expect(section.locator('.dimarket-cat-grid')).toBeVisible()
    await expect(section.locator('.dimarket-category-card')).toHaveCount(0)
    await expect(section.locator('.dimarket-cat-item__link').first()).toBeVisible()

    const first = section.locator('.dimarket-cat-item').first()
    await first.hover()
    const menu = first.locator('.dimarket-cat-item__menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem').nth(1)).toBeVisible()
  })
})
