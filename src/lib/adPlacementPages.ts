import { AD_PLACEMENT_CATALOG } from './adPlacementCatalog'
import { AD_PAGE_KEYS, type AdPageKey } from './adPlacementSlots'

/** Унікальні маршрути, де показуються слоти сторінки */
export function routesForAdPage(page: AdPageKey): string[] {
  const set = new Set<string>()
  for (const slot of AD_PLACEMENT_CATALOG) {
    if (slot.page === page) slot.routes.forEach((r) => set.add(r))
  }
  return Array.from(set).sort()
}

export function slotCountOnPage(page: AdPageKey, selectedSlots: string[]): number {
  return selectedSlots.filter((id) => id.startsWith(`${page}_`)).length
}

export { AD_PAGE_KEYS }
