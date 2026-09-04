import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { canonicalCountryName } from '../../lib/geoAliases'

// Top cities by real professional/company count in the DImarket database,
// grouped by country so the block matches whatever location the visitor
// has selected (mixing countries together looked chaotic). Kept as a
// static list rather than a live query since this is a low-churn
// SEO/browse block — update periodically if the served regions change.
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Spain: [
    'Madrid', 'Barcelona', 'Alicante', 'Valencia', 'Málaga', 'Bilbao',
    'Sevilla', 'Zaragoza', 'Pinto', 'Getafe', 'Granada', 'Murcia',
    'Algeciras', 'Motril', 'Vila-real', 'Don Benito',
  ],
  Germany: [
    'Darmstadt', 'Munich', 'Cologne', 'Berlin', 'Frankfurt', 'Düsseldorf',
    'Dresden', 'Leipzig', 'Hamburg', 'Hannover', 'Stuttgart', 'Nuremberg',
    'Bremen', 'Bielefeld', 'Remscheid', 'Steinhagen',
  ],
  Poland: [
    'Wrocław', 'Łódź', 'Warsaw', 'Gdańsk', 'Kraków', 'Poznań',
    'Nowy Sącz', 'Bielsko-Biała',
  ],
  Ukraine: ['Kyiv', 'Lviv', 'Kharkiv', 'Odesa', 'Dnipro'],
}

// Fallback shown when no country is selected yet, or the selected country
// has too little coverage of its own — a mixed overview across countries.
const DEFAULT_CITIES = [
  'Madrid', 'Barcelona', 'Alicante', 'Darmstadt', 'Valencia', 'Kyiv',
  'Lviv', 'Munich', 'Wrocław', 'Cologne', 'Málaga', 'Berlin',
  'Bilbao', 'Düsseldorf', 'Kharkiv', 'Łódź',
]

export function HomeFindContractor() {
  const { t, location } = useApp()

  const cities = (() => {
    const country = canonicalCountryName(location.country || '')
    const list = country ? CITIES_BY_COUNTRY[country] : null
    return list && list.length > 0 ? list : DEFAULT_CITIES
  })()

  return (
    <section className="home-find-contractor layout-page-gutter" aria-labelledby="home-find-contractor-title">
      <h2 id="home-find-contractor-title" className="home-find-contractor__title">
        {t('homePremium.findContractorPrefix')} <strong>{t('homePremium.findContractorHighlight')}</strong>
      </h2>

      <div className="home-find-contractor__grid">
        {cities.map((city) => (
          <a
            key={city}
            href={`/professionals?location=${encodeURIComponent(city)}`}
            onClick={(e) => {
              e.preventDefault()
              navigateTo(`/professionals?location=${encodeURIComponent(city)}`)
            }}
          >
            {city}
          </a>
        ))}
      </div>
    </section>
  )
}
