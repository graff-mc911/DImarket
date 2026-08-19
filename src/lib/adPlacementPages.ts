import { AD_PLACEMENT_CATALOG } from './adPlacementCatalog'
import type { AdPageKey } from './adPlacementSlots'
import type { TranslationKey } from './i18n'

/** Сторінки, де реально продаємо рекламу (без бокових) */
export type PlacementEditorPageId =
  | 'home'
  | 'listings'
  | 'professionals'
  | 'companies'
  | 'categories'
  | 'map'
  | 'estimator'
  | 'listing-detail'
  | 'professional-detail'

export type PlacementEditorPage = {
  id: PlacementEditorPageId
  adPageKey: AdPageKey
  /** Основний маршрут для підпису */
  route: string
  labelKey: TranslationKey
}

export const PLACEMENT_EDITOR_PAGES: PlacementEditorPage[] = [
  { id: 'home', adPageKey: 'home', route: '/', labelKey: 'advertising.places.page.home' },
  { id: 'listings', adPageKey: 'listings', route: '/listings', labelKey: 'advertising.places.page.listings' },
  { id: 'professionals', adPageKey: 'professionals', route: '/professionals', labelKey: 'advertising.places.page.professionals' },
  { id: 'companies', adPageKey: 'companies', route: '/companies', labelKey: 'advertising.places.page.companies' },
  { id: 'categories', adPageKey: 'categories', route: '/categories', labelKey: 'advertising.places.page.categories' },
  { id: 'map', adPageKey: 'map', route: '/map', labelKey: 'advertising.places.page.map' },
  { id: 'estimator', adPageKey: 'estimator', route: '/cost-estimator', labelKey: 'advertising.places.page.estimator' },
  { id: 'listing-detail', adPageKey: 'default', route: '/listing/', labelKey: 'advertising.places.page.listingDetail' },
  { id: 'professional-detail', adPageKey: 'default', route: '/professional/', labelKey: 'advertising.places.page.professionalDetail' },
]

const EDITOR_BY_ID = new Map(PLACEMENT_EDITOR_PAGES.map((p) => [p.id, p]))

export function getPlacementEditorPage(id: PlacementEditorPageId): PlacementEditorPage {
  return EDITOR_BY_ID.get(id) ?? PLACEMENT_EDITOR_PAGES[0]
}

export function adPageKeyForEditorPage(id: PlacementEditorPageId): AdPageKey {
  return getPlacementEditorPage(id).adPageKey
}

/** Слоти, які реально є на цій сторінці (за маршрутами каталогу) */
export function slotIdsForEditorPage(editorId: PlacementEditorPageId): string[] {
  const editor = getPlacementEditorPage(editorId)
  return AD_PLACEMENT_CATALOG.filter((slot) => {
    if (!slot.implemented || slot.page !== editor.adPageKey) return false
    return slot.routes.some((route) => routesMatchEditorPage(route, editor))
  }).map((s) => s.id)
}

function routesMatchEditorPage(catalogRoute: string, editor: PlacementEditorPage): boolean {
  if (editor.id === 'listings') {
    return ['/listings', '/vacancies', '/sell-rent'].includes(catalogRoute)
  }
  if (editor.id === 'categories') {
    return catalogRoute === '/categories' || catalogRoute.startsWith('/category/')
  }
  if (editor.route.endsWith('/')) {
    return catalogRoute === editor.route || catalogRoute.startsWith(editor.route)
  }
  return catalogRoute === editor.route
}

export type EditorWireframeGroup = {
  adPageKey: AdPageKey
  editorId: PlacementEditorPageId
  desktop: { left: string[]; right: string[]; center: string | null }
  mobile: { inline: string[] }
}

export function wireframeGroupForEditorPage(editorId: PlacementEditorPageId): EditorWireframeGroup {
  const editor = getPlacementEditorPage(editorId)
  const ids = slotIdsForEditorPage(editorId)
  const center = ids.find((id) => id.includes('_center')) ?? null
  const inline = ids.filter((id) => id.includes('_mob_'))
  return {
    adPageKey: editor.adPageKey,
    editorId,
    desktop: { left: [], right: [], center },
    mobile: { inline },
  }
}

export function slotCountForEditorPage(
  editorId: PlacementEditorPageId,
  selectedSlots: string[],
): number {
  const allowed = new Set(slotIdsForEditorPage(editorId))
  return selectedSlots.filter((id) => allowed.has(id)).length
}

export function editorPageFromPath(path: string): PlacementEditorPageId {
  if (path === '/') return 'home'
  if (path === '/listings' || path === '/vacancies' || path === '/sell-rent') return 'listings'
  if (path === '/professionals') return 'professionals'
  if (path === '/companies') return 'companies'
  if (path === '/categories' || path.startsWith('/category/')) return 'categories'
  if (path === '/map') return 'map'
  if (path === '/cost-estimator' || path === '/estimate') return 'estimator'
  if (path.startsWith('/listing/')) return 'listing-detail'
  if (path.startsWith('/professional/')) return 'professional-detail'
  return 'home'
}

/** Сторінка редактора, де реально є цей слот */
export function editorPageFromSlotId(slotId: string): PlacementEditorPageId {
  for (const page of PLACEMENT_EDITOR_PAGES) {
    if (slotIdsForEditorPage(page.id).includes(slotId)) {
      return page.id
    }
  }
  const prefix = slotId.split('_')[0]
  if (prefix === 'listings') return 'listings'
  if (prefix === 'professionals') return 'professionals'
  if (prefix === 'companies') return 'companies'
  if (prefix === 'categories') return 'categories'
  if (prefix === 'map') return 'map'
  if (prefix === 'estimator') return 'estimator'
  if (prefix === 'default') return 'listing-detail'
  return 'home'
}

export function editorPageFromSlots(selectedSlots: string[]): PlacementEditorPageId {
  for (const slotId of selectedSlots) {
    return editorPageFromSlotId(slotId)
  }
  return 'home'
}
