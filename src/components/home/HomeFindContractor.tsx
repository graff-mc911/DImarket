import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'

// Top cities by real professional/company count in the DImarket database.
// Kept as a static list (rather than a live query) since this is a low-churn
// SEO/browse block — update periodically if the served regions change.
const TOP_CITIES = [
  'Madrid',
  'Barcelona',
  'Alicante',
  'Darmstadt',
  'Valencia',
  'Kyiv',
  'Lviv',
  'Munich',
  'Wrocław',
  'Cologne',
  'Málaga',
  'Berlin',
  'Bilbao',
  'Düsseldorf',
  'Kharkiv',
  'Łódź',
]

export function HomeFindContractor() {
  const { t } = useApp()

  return (
    <section className="home-find-contractor layout-page-gutter" aria-labelledby="home-find-contractor-title">
      <h2 id="home-find-contractor-title" className="home-find-contractor__title">
        {t('homePremium.findContractorPrefix')} <strong>{t('homePremium.findContractorHighlight')}</strong>
      </h2>

      <div className="home-find-contractor__grid">
        {TOP_CITIES.map((city) => (
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

      <div className="home-find-contractor__footer">
        <button type="button" className="home-btn home-btn--ghost" onClick={() => navigateTo('/map')}>
          {t('homePremium.findContractorViewAll')}
        </button>
      </div>
    </section>
  )
}
