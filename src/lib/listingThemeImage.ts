/**
 * Тематичні фото-заглушки для оголошень без завантажених зображень.
 * Фокус: руки + інструмент / об'єкт роботи, без облич.
 */

const P = (id: number, w = 640) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

/** Ключ теми → URL (hands/tools/work object) */
export const LISTING_THEME_IMAGES: Record<string, string> = {
  // Електрика: розетка / проводка / інструмент у руках
  electro: P(8005397),
  // Сантехніка: труби / змішувач
  plumbing: P(8486972),
  // Малярні: валик / фарба
  painting: P(1669754),
  // Плитка: укладання плитки
  tiling: P(6585761),
  // Підлога
  flooring: P(1571463),
  // Штукатурка / шпаклівка
  plastering: P(6474471),
  // Шпалери
  wallpaper: P(1571458),
  // Гіпсокартон
  drywall: P(6474475),
  // Демонтаж
  demolition: P(5691653),
  // Покрівля
  roofing: P(2219024),
  // Фасад / утеплення
  facade: P(2219023),
  insulation: P(5691650),
  // Вікна
  windows: P(1571459),
  // Столярка
  carpentry: P(3637786),
  // HVAC
  hvac: P(4489749),
  // Зварювання
  welding: P(3692701),
  metal: P(3692701),
  // Сонячні панелі
  solar: P(9875415),
  // Розумний дім
  'smart-home': P(257736),
  // Ландшафт
  landscaping: P(1301856),
  // Басейни
  pools: P(261327),
  // Прибирання
  cleaning: P(4239091),
  // Фундамент / бетон / мурування
  foundation: P(2219025),
  concrete: P(2219025),
  masonry: P(2219026),
  earthworks: P(2219025),
  // Скло
  glass: P(1571459),
  // Проектування
  'design-engineering': P(8293778),
  // Меблі
  furniture: P(1350789),
  // Перевезення
  transport: P(2199293),
  // Вакансії / оренда — нейтральний інструмент
  vacancies: P(1249611),
  'sell-rent': P(1249611),
  construction: P(1249611),
  tools: P(1249611),
  default: P(1249611),
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
