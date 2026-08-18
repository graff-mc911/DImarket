import { test, expect } from '@playwright/test'
import { gotoPath } from './helpers'

test.describe('Home Europe map — desktop Chrome', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('tiles load, nothing overlays the canvas, and mouse drag pans', async ({ page }) => {
    await gotoPath(page, '/')
    const map = page.locator('#home-map-title')
    await expect(map).toBeVisible()
    const canvas = page.locator('.dimarket-map .leaflet-container').first()
    await canvas.scrollIntoViewIfNeeded()
    await expect(canvas).toBeVisible()
    await page.waitForTimeout(1800)

    const info = await page.evaluate(() => {
      const el = document.querySelector('.dimarket-map .leaflet-container') as HTMLElement | null
      const tile = document.querySelector('.dimarket-map img.leaflet-tile') as HTMLImageElement | null
      if (!el) return { error: 'no canvas' }
      const rect = el.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      const chain: Array<Record<string, string>> = []
      let node: HTMLElement | null = el
      while (node && chain.length < 14) {
        const cs = getComputedStyle(node)
        chain.push({
          cls: String(node.className || node.tagName).slice(0, 90),
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
          transform: cs.transform,
        })
        node = node.parentElement
      }
      const tcs = tile ? getComputedStyle(tile) : null
      return {
        size: { w: el.clientWidth, h: el.clientHeight },
        tileCount: document.querySelectorAll('.dimarket-map img.leaflet-tile').length,
        tile: tile && tcs
          ? {
              client: [tile.clientWidth, tile.clientHeight],
              natural: [tile.naturalWidth, tile.naturalHeight],
              maxWidth: tcs.maxWidth,
              width: tcs.width,
              height: tcs.height,
              mixBlendMode: tcs.mixBlendMode,
              complete: tile.complete,
            }
          : null,
        hit: hit
          ? { tag: hit.tagName, cls: String(hit.className || '').slice(0, 140) }
          : null,
        chain,
      }
    })

    // eslint-disable-next-line no-console
    console.log('HOME_MAP_DIAG', JSON.stringify(info, null, 2))

    expect(info.size?.w ?? 0).toBeGreaterThan(400)
    expect(info.size?.h ?? 0).toBeGreaterThan(280)
    expect(info.tileCount ?? 0).toBeGreaterThan(4)
    expect(info.tile?.client[0] ?? 0).toBeGreaterThan(100)
    expect(info.tile?.client[1] ?? 0).toBeGreaterThan(100)
    expect(String(info.hit?.cls || info.hit?.tag || '')).toMatch(
      /leaflet|home-map-pin|dimarket-map-pin/i,
    )

    const before = await page.evaluate(() => {
      const pane = document.querySelector('.dimarket-map .leaflet-map-pane') as HTMLElement | null
      return pane?.style.transform || ''
    })
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2 - 140, box!.y + box!.height / 2, { steps: 12 })
    await page.mouse.up()
    await page.waitForTimeout(400)
    const after = await page.evaluate(() => {
      const pane = document.querySelector('.dimarket-map .leaflet-map-pane') as HTMLElement | null
      return pane?.style.transform || ''
    })
    expect(after).not.toEqual(before)
  })
})
