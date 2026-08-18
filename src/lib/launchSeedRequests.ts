import type { ListingWithImages } from './types'
import type { TranslateFn, TranslationKey } from './i18n'
import { LAUNCH_MARKETS, locationMatchesMarket } from './launchMarkets'

const EXAMPLE_MARKER = '[launch_example]'

export function isLaunchExampleListing(listing: {
  description?: string | null
  id?: string
}): boolean {
  if (listing.id?.startsWith('launch-example-')) return true
  return (listing.description || '').includes(EXAMPLE_MARKER)
}

interface SeedRequestDef {
  id: string
  marketId: string
  titleKey: string
  descriptionKey: string
  location: string
}

export function getLaunchExampleTitleKey(listingId: string): string | null {
  return SEED_REQUESTS.find((seed) => seed.id === listingId)?.titleKey ?? null
}

const SEED_REQUESTS: SeedRequestDef[] = [
  {
    id: 'launch-example-de-darmstadt-1',
    marketId: 'de-darmstadt',
    titleKey: 'launch.seed.darmstadt.electric',
    descriptionKey: 'launch.seed.darmstadt.electricDesc',
    location: 'Darmstadt, Hessen, Germany',
  },
  {
    id: 'launch-example-de-darmstadt-2',
    marketId: 'de-darmstadt',
    titleKey: 'launch.seed.darmstadt.bathroom',
    descriptionKey: 'launch.seed.darmstadt.bathroomDesc',
    location: 'Darmstadt, Hessen, Germany',
  },
  {
    id: 'launch-example-es-alicante-1',
    marketId: 'es-alicante',
    titleKey: 'launch.seed.alicante.plumbing',
    descriptionKey: 'launch.seed.alicante.plumbingDesc',
    location: 'Alicante, Valencia, Spain',
  },
  {
    id: 'launch-example-es-alicante-2',
    marketId: 'es-alicante',
    titleKey: 'launch.seed.alicante.paint',
    descriptionKey: 'launch.seed.alicante.paintDesc',
    location: 'Alicante, Valencia, Spain',
  },
  {
    id: 'launch-example-es-madrid-1',
    marketId: 'es-madrid',
    titleKey: 'launch.seed.madrid.renovation',
    descriptionKey: 'launch.seed.madrid.renovationDesc',
    location: 'Madrid, Madrid, Spain',
  },
  {
    id: 'launch-example-es-madrid-2',
    marketId: 'es-madrid',
    titleKey: 'launch.seed.madrid.hvac',
    descriptionKey: 'launch.seed.madrid.hvacDesc',
    location: 'Madrid, Madrid, Spain',
  },
]

function buildExampleListing(
  def: SeedRequestDef,
  title: string,
  description: string,
): ListingWithImages {
  const now = new Date()
  const expires = new Date(now)
  expires.setDate(expires.getDate() + 90)

  return {
    id: def.id,
    title,
    description: `${description}\n\n${EXAMPLE_MARKER}`,
    category_id: null,
    listing_type: 'service_request',
    price: null,
    currency: 'eur',
    location: def.location,
    contact_name: 'DImarket',
    contact_phone: null,
    contact_email: null,
    author_id: null,
    duration_days: 90,
    expires_at: expires.toISOString(),
    is_premium: false,
    is_promoted: false,
    promoted_expires_at: null,
    views_count: 0,
    status: 'active',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    visibility_radius: 'city',
    subcategory_slugs: [],
    budget_min: null,
    budget_max: null,
    deadline_type: null,
    deadline_at: null,
    urgency: null,
    preferred_language: null,
    wizard_completed: false,
    postal_code: null,
    country_name: null,
    city_name: null,
    latitude: null,
    longitude: null,
    hired_professional_id: null,
    pipeline_stage: null,
    pipeline_completed_at: null,
    review_prompted_at: null,
    images: [],
    category: undefined,
  }
}

/**
 * Додає приклади запитів лише для launch-міст, де ще мало реальних оголошень.
 * Приклади завжди марковані — не підміняють реальний попит.
 */
export function mergeLaunchExampleRequests(
  realJobs: ListingWithImages[],
  translate: TranslateFn,
  minRealPerLaunchCity = 2,
  maxExamplesTotal = 4,
): ListingWithImages[] {
  const real = realJobs.filter((job) => !isLaunchExampleListing(job))
  const examples: ListingWithImages[] = []

  for (const market of LAUNCH_MARKETS) {
    const realInMarket = real.filter((job) =>
      locationMatchesMarket(job.location, market),
    )
    if (realInMarket.length >= minRealPerLaunchCity) continue

    const seeds = SEED_REQUESTS.filter((s) => s.marketId === market.id)
    const needed = Math.min(2, minRealPerLaunchCity - realInMarket.length)

    for (const seed of seeds.slice(0, needed)) {
      examples.push(
        buildExampleListing(
          seed,
          translate(seed.titleKey as TranslationKey),
          translate(seed.descriptionKey as TranslationKey),
        ),
      )
    }
  }

  const merged = [...real, ...examples.slice(0, maxExamplesTotal)]
  return merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
