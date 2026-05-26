import { AD_PLACEMENT_CATALOG } from './adPlacementCatalog'
import type { AdPageKey } from './adPlacementSlots'
import type { TranslationKey } from './i18n'

/** Окремі сторінки в редакторі розміщення (замість групи «Інші») */
export type PlacementEditorPageId =
  | 'home'
  | 'listings'
  | 'professionals'
  | 'contact'
  | 'create-ad'
  | 'advertising'
  | 'assistant-job'
  | 'login'
  | 'register'
  | 'profile'
  | 'settings'
  | 'dashboard'
  | 'messages'
  | 'favorites'
  | 'my-listings'
  | 'boost'
  | 'checkout'
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
  { id: 'contact', adPageKey: 'default', route: '/contact', labelKey: 'advertising.places.page.contact' },
  { id: 'create-ad', adPageKey: 'default', route: '/create-ad', labelKey: 'advertising.places.page.createAd' },
  { id: 'advertising', adPageKey: 'default', route: '/advertising', labelKey: 'advertising.places.page.advertising' },
  { id: 'assistant-job', adPageKey: 'default', route: '/assistant/job', labelKey: 'advertising.places.page.assistantJob' },
  { id: 'login', adPageKey: 'default', route: '/login', labelKey: 'advertising.places.page.login' },
  { id: 'register', adPageKey: 'default', route: '/register', labelKey: 'advertising.places.page.register' },
  { id: 'profile', adPageKey: 'default', route: '/profile', labelKey: 'advertising.places.page.profile' },
  { id: 'settings', adPageKey: 'default', route: '/settings', labelKey: 'advertising.places.page.settings' },
  { id: 'dashboard', adPageKey: 'default', route: '/dashboard', labelKey: 'advertising.places.page.dashboard' },
  { id: 'messages', adPageKey: 'default', route: '/messages', labelKey: 'advertising.places.page.messages' },
  { id: 'favorites', adPageKey: 'default', route: '/favorites', labelKey: 'advertising.places.page.favorites' },
  { id: 'my-listings', adPageKey: 'default', route: '/my-listings', labelKey: 'advertising.places.page.myListings' },
  { id: 'boost', adPageKey: 'default', route: '/boost', labelKey: 'advertising.places.page.boost' },
  { id: 'checkout', adPageKey: 'default', route: '/checkout', labelKey: 'advertising.places.page.checkout' },
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
  const left = ids.filter((id) => id.includes('_side_l'))
  const right = ids.filter((id) => id.includes('_side_r'))
  const center = ids.find((id) => id.includes('_center')) ?? null
  const inline = ids.filter((id) => id.includes('_mob_'))
  return {
    adPageKey: editor.adPageKey,
    editorId,
    desktop: { left, right, center },
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
  if (path.startsWith('/listing/')) return 'listing-detail'
  if (path.startsWith('/professional/')) return 'professional-detail'
  const exact = PLACEMENT_EDITOR_PAGES.find((p) => p.route === path)
  if (exact) return exact.id
  return 'contact'
}

/** Сторінка редактора, де реально є цей слот (не «перший home» у списку) */
export function editorPageFromSlotId(slotId: string): PlacementEditorPageId {
  for (const page of PLACEMENT_EDITOR_PAGES) {
    if (slotIdsForEditorPage(page.id).includes(slotId)) {
      return page.id
    }
  }
  const prefix = slotId.split('_')[0]
  if (prefix === 'home') return 'home'
  if (prefix === 'listings') return 'listings'
  if (prefix === 'professionals') return 'professionals'
  return 'create-ad'
}

/** Для завантаження кампанії — останній слот, не пріоритет home */
export function editorPageFromSlots(selectedSlots: string[]): PlacementEditorPageId {
  if (selectedSlots.length === 0) return 'home'
  return editorPageFromSlotId(selectedSlots[selectedSlots.length - 1]!)
}
