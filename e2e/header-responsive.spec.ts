import { test, expect, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow, gotoPath } from './helpers'

const DESKTOP = [
  { width: 1640, height: 900 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1200, height: 800 },
  { width: 1024, height: 768 },
] as const

const MOBILE = [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
] as const

const DEPT_ITEMS = [
  /Categories|Категорії/i,
  /Today'?s Deals|Актуальні запити/i,
  /^Map$|^Карта$/i,
  /Find Professionals|Знайти майстр/i,
  /^Companies$|^Компан/i,
  /Manufacturers|Виробник/i,
  /Commercial Agents|Комерційн/i,
  /^Jobs$|^Вакансії$/i,
  /Post a job|Опублікувати запит/i,
  /Cost estimator|Калькулятор вартості/i,
  /^Sell$|^Опублікувати$/i,
  /Pricing|Тарифи/i,
  /AI assistant|AI-помічник/i,
  /Analytics|Аналітика/i,
  /Customer Service|Підтримка/i,
  /How It Works|Як це працює/i,
]

function bottomNav(page: Page) {
  return page.locator('nav.mobile-bottom-nav')
}

function deptNav(page: Page) {
  return page.locator('header nav.amazon-dept-scroll')
}

async function assertDeptItemReachable(page: Page, name: RegExp) {
  const item = deptNav(page).getByRole('button', { name }).first()
  await expect(item).toBeVisible()
  const box = await item.boundingBox()
  expect(box, String(name)).toBeTruthy()
  const vw = page.viewportSize()?.width ?? 0
  const vh = page.viewportSize()?.height ?? 0
  expect(box!.width, String(name)).toBeGreaterThan(8)
  expect(box!.x + box!.width, `${String(name)} still off-screen`).toBeGreaterThan(0)
  expect(box!.x, `${String(name)} still off-screen`).toBeLessThan(vw)
  expect(box!.y, `${String(name)} below viewport`).toBeLessThan(vh)
  expect(box!.y + box!.height, `${String(name)} above viewport`).toBeGreaterThan(0)
}

test.describe('Desktop header chrome (lg+)', () => {
  for (const vp of DESKTOP) {
    test(`no mobile tab bar; all dept items reachable at ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(vp)
      await gotoPath(page, '/')

      await expect(bottomNav(page)).toHaveCount(0)
      await expect(page.locator('.mobile-nav-more')).toHaveCount(0)

      await expect(page.locator('header').getByRole('img', { name: /DImarket logo/i })).toBeVisible()
      await expect(page.locator('.header-location button')).toBeVisible()
      await expect(page.locator('header input[type="search"]').first()).toBeVisible()
      await expect(page.getByRole('button', { name: /Sign in|Увійти|Hello|Вітаємо/i }).first()).toBeVisible()

      await expect(deptNav(page)).toBeVisible()
      const deptStyle = await deptNav(page).evaluate((el) => {
        const s = getComputedStyle(el)
        const rows = [...el.querySelectorAll('.amazon-dept-row')]
        const buttons = [...el.querySelectorAll('button')]
        const visualRows = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().top / 4) * 4))
        const counts = rows.map((row) => row.querySelectorAll('button').length)
        const lastRow = rows.at(-1)
        let lastRowCentered = true
        if (lastRow) {
          const lastButtons = [...lastRow.querySelectorAll('button')]
          if (lastButtons.length) {
            const first = lastButtons[0].getBoundingClientRect()
            const last = lastButtons[lastButtons.length - 1].getBoundingClientRect()
            const mid = (first.left + last.right) / 2
            lastRowCentered = Math.abs(mid - window.innerWidth / 2) < window.innerWidth * 0.22
          }
        }
        return {
          flexDirection: s.flexDirection,
          overflowX: s.overflowX,
          visualRows: visualRows.size,
          counts,
          lastRowCentered,
          justify: rows[0] ? getComputedStyle(rows[0]).justifyContent : '',
        }
      })
      expect(deptStyle.flexDirection).toBe('column')
      expect(deptStyle.overflowX).toBe('visible')
      expect(deptStyle.justify).toBe('center')
      expect(deptStyle.visualRows).toBeGreaterThanOrEqual(2)
      expect(deptStyle.visualRows).toBeLessThanOrEqual(4)
      expect(Math.abs((deptStyle.counts[0] ?? 0) - (deptStyle.counts[1] ?? 0))).toBeLessThanOrEqual(1)
      expect(deptStyle.lastRowCentered, `second row not centered ${JSON.stringify(deptStyle)}`).toBe(true)

      for (const name of DEPT_ITEMS) {
        await assertDeptItemReachable(page, name)
      }

      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe('Mobile bottom nav regression', () => {
  for (const vp of MOBILE) {
    test(`tab bar visible at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await gotoPath(page, '/')
      await expect(bottomNav(page)).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Home|Головна/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Search|Пошук/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Categories|Категор/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /Map|Карта/i })).toBeVisible()
      await expect(bottomNav(page).getByRole('button', { name: /More|Ще/i })).toBeVisible()
      await expect(deptNav(page)).toBeHidden()
      await expectNoHorizontalOverflow(page)
    })
  }
})
