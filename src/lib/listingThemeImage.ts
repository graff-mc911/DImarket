/**
 * Тематичні фото-заглушки для оголошень без завантажених зображень.
 * Тільки процес роботи: руки, інструмент, матеріали. Без облич.
 * (перевірені Pexels: крупний план роботи / інструменту)
 */

const P = (id: number, w = 640) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

/** Ключ теми → URL (hands / tools / materials only — no faces) */
export const LISTING_THEME_IMAGES: Record<string, string> = {
  // Електрика: руки + плоскогубці біля розеток
  electro: P(5691588),
  // Сантехніка: труби / арматура (без людей)
  plumbing: P(6419126),
  // Малярні: пензель і фарба крупно
  painting: P(4792485),
  // Плитка: рука в рукавиці + хрестики
  tiling: P(11806486),
  // Підлога / столярка: руки з шуруповертом
  flooring: P(1249611),
  carpentry: P(1249611),
  furniture: P(1249611),
  // Штукатурка / шпаклівка / гіпс / фасад / ізоляція
  plastering: P(5691622),
  drywall: P(5691622),
  facade: P(5691622),
  insulation: P(5691622),
  wallpaper: P(5691622),
  // Демонтаж / покрівля / бетон / мурування — інструмент
  demolition: P(209235),
  roofing: P(209235),
  foundation: P(209235),
  concrete: P(209235),
  masonry: P(209235),
  earthworks: P(209235),
  // Вікна / скло
  windows: P(279719),
  glass: P(279719),
  // HVAC — інженерні труби
  hvac: P(6419126),
  // Зварювання / метал — інструменти на верстаку (без людей)
  welding: P(175039),
  metal: P(175039),
  // Сонячні панелі
  solar: P(356036),
  // Розумний дім / щиток: модулі в стіні
  'smart-home': P(5691602),
  // Ландшафт / басейн
  landscaping: P(1301856),
  pools: P(261327),
  // Прибирання: мітла / підлога (без обличчя)
  cleaning: P(4108715),
  // Креслення
  'design-engineering': P(8293778),
  // Перевезення
  transport: P(2199293),
  // Нейтральний набір інструментів
  vacancies: P(175039),
  'sell-rent': P(175039),
  construction: P(175039),
  tools: P(175039),
  default: P(175039),
}

const THEME_KEYWORDS: Array<{ key: string; words: string[] }> = [
  {
    key: 'electro',
    words: [
      'електрик', 'електро', 'розетк', 'провод', 'electrician', 'electrical', 'outlet', 'socket',
      'электрик', 'электро', 'strom', 'elektro',
    ],
  },
  {
    key: 'plumbing',
    words: [
      'сантехн', 'труб', 'змішувач', 'кран', 'протік', 'plumbing', 'plumber', 'pipe', 'faucet',
      'сантехник', 'протеч', 'wasser', 'rohr',
    ],
  },
  {
    key: 'painting',
    words: [
      'маляр', 'фарб', 'покраск', 'paint', 'painter', 'малярн', 'шпакл', 'putty',
    ],
  },
  {
    key: 'tiling',
    words: [
      'плитк', 'кафель', 'плиточн', 'tile', 'tiler', 'fliese',
    ],
  },
  {
    key: 'flooring',
    words: [
      'підлог', 'ламінат', 'паркет', 'floor', 'laminate', 'parquet', 'пол ',
    ],
  },
  {
    key: 'cleaning',
    words: [
      'прибиран', 'клінінг', 'clean', 'уборк', 'reinigung',
    ],
  },
  {
    key: 'roofing',
    words: [
      'дах', 'покрівля', 'roof', 'dach', 'крыш',
    ],
  },
  {
    key: 'hvac',
    words: [
      'кондиці', 'опален', 'вентиляц', 'hvac', 'heating', 'climate', 'климат',
    ],
  },
  {
    key: 'carpentry',
    words: [
      'столяр', 'дерев', 'мебл', 'carpenter', 'woodwork', 'furniture',
    ],
  },
  {
    key: 'drywall',
    words: [
      'гіпсокарт', 'гипс', 'drywall', 'gipskarton',
    ],
  },
  {
    key: 'wallpaper',
    words: [
      'шпалер', 'обои', 'wallpaper',
    ],
  },
  {
    key: 'demolition',
    words: [
      'демонтаж', 'злам', 'demolition', 'removal', 'снос',
    ],
  },
  {
    key: 'windows',
    words: [
      'вікн', 'окон', 'window', 'fenster',
    ],
  },
  {
    key: 'welding',
    words: [
      'звар', 'weld', 'сварк',
    ],
  },
  {
    key: 'solar',
    words: [
      'соняч', 'solar', 'фотовольта',
    ],
  },
  {
    key: 'pools',
    words: [
      'басейн', 'pool',
    ],
  },
  {
    key: 'landscaping',
    words: [
      'ландшафт', 'сад', 'газон', 'landscape', 'garden',
    ],
  },
  {
    key: 'plastering',
    words: [
      'штукатур', 'plaster',
    ],
  },
  {
    key: 'facade',
    words: [
      'фасад', 'facade',
    ],
  },
  {
    key: 'insulation',
    words: [
      'утеплен', 'ізоляц', 'insulation',
    ],
  },
  {
    key: 'masonry',
    words: [
      'муруван', 'цегл', 'кладк', 'masonry', 'brick',
    ],
  },
  {
    key: 'concrete',
    words: [
      'бетон', 'concrete',
    ],
  },
  {
    key: 'foundation',
    words: [
      'фундамент', 'foundation',
    ],
  },
]

export type ListingImageSource = {
  title?: string | null
  description?: string | null
  subcategory_slugs?: string[] | null
  category?: { slug?: string | null; name?: string | null } | null
  images?: Array<{ image_url?: string | null }> | null
}

function matchThemeKeyFromSlug(slug: string): string | null {
  const s = slug.trim().toLowerCase()
  if (!s) return null
  if (LISTING_THEME_IMAGES[s]) return s

  // electro-outlet → electro; tiling-install → tiling
  const keys = Object.keys(LISTING_THEME_IMAGES).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (key === 'default') continue
    if (s === key || s.startsWith(`${key}-`) || s.includes(`-${key}-`) || s.endsWith(`-${key}`)) {
      return key
    }
  }
  return null
}

export function resolveListingThemeKey(listing: ListingImageSource): string {
  const slugs = listing.subcategory_slugs ?? []
  for (const slug of slugs) {
    const key = matchThemeKeyFromSlug(slug)
    if (key) return key
  }

  const catSlug = listing.category?.slug?.toLowerCase()
  if (catSlug && LISTING_THEME_IMAGES[catSlug]) return catSlug

  const text = `${listing.title ?? ''} ${listing.description ?? ''} ${listing.category?.name ?? ''}`.toLowerCase()
  for (const entry of THEME_KEYWORDS) {
    if (entry.words.some((w) => text.includes(w))) return entry.key
  }

  return 'default'
}

export function getListingThemeImageUrl(
  listing: ListingImageSource,
  width: 400 | 640 | 800 | 1200 = 640,
): string {
  const key = resolveListingThemeKey(listing)
  const base = LISTING_THEME_IMAGES[key] || LISTING_THEME_IMAGES.default
  if (width === 640) return base
  return base.replace(/w=\d+/, `w=${width}`)
}

/** Реальне фото оголошення або тематична заглушка */
export function getListingDisplayImage(
  listing: ListingImageSource,
  width: 400 | 640 | 800 | 1200 = 640,
): string {
  const uploaded = listing.images?.find((img) => Boolean(img?.image_url?.trim()))?.image_url
  if (uploaded) return uploaded
  return getListingThemeImageUrl(listing, width)
}
