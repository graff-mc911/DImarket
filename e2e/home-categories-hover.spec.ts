import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Homepage categories cabinet sheet', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('shows nested sheet with full catalog and Усі категорії', async ({ page }) => {
    await gotoPath(page, '/')
    const section = page.locator('#choose-category')
    await expect(section).toBeVisible()
    await expect(section.locator('.cabinet-sheet')).toBeVisible()
    await expect(section.locator('.cabinet-sheet__grid .dimarket-category-card')).toHaveCount(21)
    const seeAll = section.getByRole('button', { name: /Усі категорії|Browse all|Все категории/i })
    await expect(seeAll).toBeVisible()
    await seeAll.click()
    await expect(page).toHaveURL(/\/categories$/)
  })

  test('expands subcategory chips on card click', async ({ page }) => {
    await gotoPath(page, '/')
    const section = page.locator('#choose-category')
    await expect(section).toBeVisible()

    const first = section.locator('.cabinet-sheet__grid .dimarket-category-card').first()
    await first.locator('.dimarket-category-card__button').click()
    await expect(first.locator('.dimarket-subcategories')).toBeVisible()
    const chip = first.locator('.dimarket-subcategory-chip').nth(1)
    await expect(chip).toBeVisible()
    await chip.click()
    await expect(page).not.toHaveURL(/\/$/)
  })

  test('uses nested sheet on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoPath(page, '/')
    await expect(page.locator('#choose-category .cabinet-sheet')).toBeVisible()
    await expect(page.locator('#choose-category .dimarket-category-card').first()).toBeVisible()
  })
})
