/**
 * Unique Unsplash cover per marketplace / home category slug.
 * Used by the home hero carousel, category heroes, and config.image.
 */

const unsplash = (photoId: string, width = 1400) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`

/** One distinct photo per category — do not reuse IDs across slugs. */
export const CATEGORY_COVER_IMAGES: Record<string, string> = {
  // Marketplace mains (home hero carousel)
  demolition: unsplash('photo-1504307651254-35680f356dfd'),
  earthworks: unsplash('photo-1581094794329-c8112a89af12'),
  foundation: unsplash('photo-1541888946425-d81bb19240f5'),
  concrete: unsplash('photo-1590674899484-d5640e854abe'),
  masonry: unsplash('photo-1590086782792-42dd2350140d'),
  roofing: unsplash('photo-1513694203232-719a280e022f'),
  facade: unsplash('photo-1479839672679-a46483c0e7c8'),
  plastering: unsplash('photo-1589939705384-5185137a7f0f'),
  painting: unsplash('photo-1562259949-e8e7689d7828'),
  wallpaper: unsplash('photo-1600210492493-0946911123ea'),
  drywall: unsplash('photo-1600585154526-990dced4db0d'),
  tiling: unsplash('photo-1584622650111-993a426fbf0a'),
  flooring: unsplash('photo-1581858726788-75bc0f6a952d'),
  carpentry: unsplash('photo-1504148455328-c376907d081c'),
  windows: unsplash('photo-1497366216548-37526070297c'),
  plumbing: unsplash('photo-1552321554-5fefe8c9ef14'),
  electro: unsplash('photo-1621905251189-08b45d6a269e'),
  hvac: unsplash('photo-1581092160562-40aa08e78837'),
  insulation: unsplash('photo-1558618666-fcd25c85cd64'),
  welding: unsplash('photo-1504328345606-18bbc8c9d7d1'),
  metal: unsplash('photo-1565793298595-6a879b1d9492'),
  glass: unsplash('photo-1497366811353-6870744d04b2'),
  landscaping: unsplash('photo-1558904541-efa843a96f01'),
  pools: unsplash('photo-1576013551627-0cc20b96c2a7'),
  solar: unsplash('photo-1509391366360-2e959784a276'),
  'smart-home': unsplash('photo-1558002038-1055907df827'),
  'design-engineering': unsplash('photo-1503387762-592deb58ef4e'),

  // Home marketing cards (not always is_main in DB)
  specialists: unsplash('photo-1621905252507-b35492cc74b4'),
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
