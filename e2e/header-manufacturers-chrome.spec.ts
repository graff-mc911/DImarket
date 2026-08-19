import { test, expect } from '@playwright/test'
import { gotoPath, headerDeptNav } from './helpers'

const DESKTOP = [
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
] as const

test.describe('Chrome header: Виробники ≠ калькулятор', () => {
  for (const vp of DESKTOP) {
    test(`Виробники opens /category/manufacturers at ${vp.width}px`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== 'chromium', 'Hit-testing overlap was Chrome-only')
      test.skip((page.viewportSize()?.width ?? vp.width) < 1024, 'Dept bar is desktop')

      await page.setViewportSize(vp)
      await gotoPath(page, '/')

      const nav = headerDeptNav(page)
      const manufacturers = nav.locator('[data-nav-id="manufacturers"]')
      const estimator = nav.locator('[data-nav-id="cost-estimator"]')
      await expect(manufacturers).toBeVisible()
      await expect(estimator).toBeVisible()

      const geometry = await page.evaluate(() => {
        const a = document.querySelector('[data-nav-id="manufacturers"]')
        const b = document.querySelector('[data-nav-id="cost-estimator"]')
        if (!(a instanceof HTMLElement) || !(b instanceof HTMLElement)) {
          return { error: 'missing' }
        }
        const ar = a.getBoundingClientRect()
        const br = b.getBoundingClientRect()
        const overlapX = Math.min(ar.right, br.right) - Math.max(ar.left, br.left)
        const overlapY = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top)
        const hit = document.elementFromPoint(
          ar.left + ar.width / 2,
          ar.top + ar.height / 2,
        )
        return {
          overlapX,
          overlapY,
          hitNavId: hit?.closest('[data-nav-id]')?.getAttribute('data-nav-id') ?? null,
          manufacturers: { x: ar.x, w: ar.width, r: ar.right },
          estimator: { x: br.x, w: br.width, l: br.left },
        }
      })

      expect(geometry.hitNavId, JSON.stringify(geometry)).toBe('manufacturers')
      expect(geometry.overlapX ?? 1, JSON.stringify(geometry)).toBeLessThanOrEqual(0)

      await manufacturers.click()
      await expect(page).toHaveURL(/\/category\/manufacturers\/?$/)
      await expect(page).not.toHaveURL(/cost-estimator/)
      await expect(
        page.getByRole('heading', {
          name: /Калькулятор вартості ремонту|Remodeling cost calculator|Оцініть вартість проєкту/i,
        }),
      ).toHaveCount(0)
    })
  }
})
