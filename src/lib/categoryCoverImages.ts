/**
 * Unique Unsplash cover per marketplace / home category slug.
 * Used by the home hero carousel, category heroes, and config.image.
 */

const unsplash = (photoId: string, width = 1400) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`

/** One distinct photo per category — do not reuse IDs across slugs. */
export const CATEGORY_COVER_IMAGES: Record<string, string> = {
  // Marketplace mains (home hero carousel). IDs are visually verified — do not pick Unsplash IDs from memory.
  demolition: unsplash('photo-1504307651254-35680f356dfd'), // construction workers on rebar slab
  earthworks: unsplash('photo-1717011540684-a2aee1236135'), // two site workers on graded soil
  foundation: unsplash('photo-1541888946425-d81bb19240f5'), // slab + rebar grid
  concrete: unsplash('photo-1673978484091-6a743a9058cf'), // wet concrete poured onto rebar
  masonry: unsplash('photo-1701850009190-2859ba2aeea6'), // hands laying blocks with trowel
  roofing: unsplash('photo-1770149682967-5733992e49ff'), // workers laying roof tiles
  facade: unsplash('photo-1602910344216-bd2226c18d4c'), // rope-access worker on building facade
  plastering: unsplash('photo-1768839725085-829e6ac7ac26'), // plaster on taping knives
  painting: unsplash('photo-1562259949-e8e7689d7828'), // paint roller on wall
  wallpaper: unsplash('photo-1618221195710-dd6b41faaea6'), // finished interior walls / living room
  drywall: unsplash('photo-1643509867448-57001e0c333d'), // gloved hands driving screws with drill
  tiling: unsplash('photo-1584622650111-993a426fbf0a'), // tiled bathroom finish
  flooring: unsplash('photo-1643512290109-3ad082e25b92'), // driving screw into wood floor joist
  carpentry: unsplash('photo-1513467535987-fd81bc7d62f8'), // carpenter cutting lumber with circular saw
  windows: unsplash('photo-1497366216548-37526070297c'), // floor-to-ceiling glazed windows
  plumbing: unsplash('photo-1676210134188-4c05dd172f89'), // plumber working on under-sink pipes
  electro: unsplash('photo-1621905251189-08b45d6a269e'), // electrician at panel
  hvac: unsplash('photo-1558618666-fcd25c85cd64'), // technician adjusting equipment
  insulation: unsplash('photo-1589939705384-5185137a7f0f'), // site worker with tools on timber
  welding: unsplash('photo-1504328345606-18bbc8c9d7d1'), // welder with sparks
  metal: unsplash('photo-1473621038790-b778b4750efe'), // metalworker / blacksmith at forge
  glass: unsplash('photo-1776750274401-873621ce41bc'), // glazier on glazed curtain-wall facade
  landscaping: unsplash('photo-1558904541-efa843a96f01'), // lawn / courtyard
  pools: unsplash('photo-1576013551627-0cc20b96c2a7'), // villa pool
  solar: unsplash('photo-1509391366360-2e959784a276'), // solar farm
  'smart-home': unsplash('photo-1558002038-1055907df827'), // smart lock
  'design-engineering': unsplash('photo-1581092580497-e0d23cbdf1dc'), // engineer working in CAD

  // Home marketing cards (not always is_main in DB)
  specialists: unsplash('photo-1621905252507-b35492cc74b4'), // electrician portrait
  'buy-sell': unsplash('photo-1556740749-887f6717d7e4'),
  jobs: unsplash('photo-1521737711867-e3b97375f902'),
  renovation: unsplash('photo-1484154218962-a197022b5858'),
  construction: unsplash('photo-1486406146926-c627a92ad1ab'),
  garden: unsplash('photo-1416879595882-3373a0480b5b'),
  cleaning: unsplash('photo-1581578731548-c64695cc6952'),
  security: unsplash('photo-1557597774-9d273605dfa9'),
  moving: unsplash('photo-1600518464441-9154a4dea21b'),
  stores: unsplash('photo-1441986300917-64674bd600d8'),
  manufacturers: unsplash('photo-1581091226825-a6a2a5aee158'),
  'commercial-agents': unsplash('photo-1521791136064-7986c2920216'),
  rentals: unsplash('photo-1600566753190-17f0baa2a6c3'),
  automotive: unsplash('photo-1486262715619-67b85e0b08d3'),
  'home-services': unsplash('photo-1560518883-ce09059eeffa'),
  'accounting-finance': unsplash('photo-1554224155-6726b3ff858f'),
  'real-estate': unsplash('photo-1560448204-e02f11c3d0e2'),
  'architecture-design': unsplash('photo-1487958449943-2429e8be8625'),
  engineering: unsplash('photo-1600585154084-4e5fe7c39198'),
  'legal-services': unsplash('photo-1589829545856-d10d557cf95f'),
}

/** Display order for the home hero when DB mains are not loaded yet. */
export const MARKETPLACE_MAIN_COVER_SLUGS = [
  'demolition',
  'earthworks',
  'foundation',
  'concrete',
  'masonry',
  'roofing',
  'facade',
  'plastering',
  'painting',
  'wallpaper',
  'drywall',
  'tiling',
  'flooring',
  'carpentry',
  'windows',
  'plumbing',
  'electro',
  'hvac',
  'insulation',
  'welding',
  'metal',
  'glass',
  'landscaping',
  'pools',
  'solar',
  'smart-home',
  'design-engineering',
] as const

const DEFAULT_COVER = CATEGORY_COVER_IMAGES.construction

export function coverImageForCategory(slug: string, fallback?: string | null): string {
  const curated = CATEGORY_COVER_IMAGES[slug]
  if (curated) return curated
  const fromDb = fallback?.trim()
  if (fromDb) return fromDb
  return DEFAULT_COVER
}
