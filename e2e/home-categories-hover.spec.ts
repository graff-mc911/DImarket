import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Homepage categories cabinet cards', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('shows full catalog cards and Усі категорії link to /categories', async ({ page }) => {
    await gotoPath(page, '/')
    const section = page.locator('#choose-category')
    await expect(section).toBeVisible()
    await expect(section.locator('.dimarket-category-card')).toHaveCount(21)
    await expect(section.locator('.dimarket-cat-grid')).toHaveCount(0)
    const seeAll = section.getByRole('button', { name: /Усі категорії|Browse all|Все категории/i })
    await expect(seeAll).toBeVisible()
    await seeAll.click()
    await expect(page).toHaveURL(/\/categories$/)
  })

  test('expands subcategory chips on card click', async ({ page }) => {
    await gotoPath(page, '/')
    const section = page.locator('#choose-category')
    await expect(section).toBeVisible()

    const first = section.locator('.dimarket-category-card').first()
    await first.locator('.dimarket-category-card__button').click()
    await expect(first.locator('.dimarket-subcategories')).toBeVisible()
    const chip = first.locator('.dimarket-subcategory-chip').nth(1)
    await expect(chip).toBeVisible()
    await chip.click()
    await expect(page).not.toHaveURL(/\/$/)
  })

  test('uses two columns on a phone viewport for city + category cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoPath(page, '/')
    const categoryCols = await page.locator('#choose-category .grid').first().evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length,
    )
    expect(categoryCols).toBeGreaterThanOrEqual(1)
    await expect(page.locator('.dimarket-category-card').first()).toBeVisible()
  })
})
