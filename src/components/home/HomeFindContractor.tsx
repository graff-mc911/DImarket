import { MapPin } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { appendLocationToPath } from '../../lib/globalLocation'
import { EMPTY_GEO_SEARCH } from '../../lib/geoSearch'
import { canonicalCountryName } from '../../lib/geoAliases'

// Top cities by real professional/company count in the DImarket database,
// grouped by country so the block matches whatever location the visitor
// has selected. Static list — low-churn SEO/browse block.
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

const DEFAULT_CITIES = [
  'Madrid', 'Barcelona', 'Alicante', 'Darmstadt', 'Valencia', 'Kyiv',
  'Lviv', 'Munich', 'Wrocław', 'Cologne', 'Málaga', 'Berlin',
  'Bilbao', 'Düsseldorf', 'Kharkiv', 'Łódź',
]

/** Homepage "find contractor" city grid — same square cabinet cards as owner UI. */
export function HomeFindContractor() {
  const { t, location, setLocation } = useApp()

  const openCityMasters = (city: string) => {
    let country = location.country || ''
    if (!country) {
      for (const [c, cities] of Object.entries(CITIES_BY_COUNTRY)) {
        if (cities.includes(city)) {
          country = c
          break
        }
      }
    }
    const next = {
      ...EMPTY_GEO_SEARCH,
      country,
      city,
      radius: '25' as const,
    }
    setLocation(next)
    navigateTo(appendLocationToPath('/professionals', next))
  }

  const cities = (() => {
    const country = canonicalCountryName(location.country || '')
    const list = country ? CITIES_BY_COUNTRY[country] : null
    return list && list.length > 0 ? list : DEFAULT_CITIES
  })()

  return (
    <section
      className="dimarket-categories layout-page-gutter py-6"
      aria-labelledby="home-find-contractor-title"
    >
      <div className="dimarket-categories__head mb-5" style={{ textAlign: 'left' }}>
        <p className="dimarket-categories__eyebrow" style={{ textAlign: 'left' }}>
          {t('header.findProfessionals')}
        </p>
        <h2 id="home-find-contractor-title" className="dimarket-categories__title" style={{ textAlign: 'left' }}>
          {t('homePremium.findContractorPrefix')}{' '}
          <strong>{t('homePremium.findContractorHighlight')}</strong>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cities.map((city) => (
          <article key={city} className="dimarket-category-card">
            <button
              type="button"
              className="dimarket-category-card__button"
              onClick={() => openCityMasters(city)}
              aria-label={`${t('header.findProfessionals')}: ${city}`}
            >
              <span className="dimarket-category-card__icon" aria-hidden>
                <MapPin className="h-8 w-8 text-[#1b4d3e]" />
              </span>
              <span className="dimarket-category-card__body">
                <strong>{city}</strong>
                <span>{t('header.findProfessionals')}</span>
              </span>
              <span className="dimarket-category-card__chevron" aria-hidden>
                ›
              </span>
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
