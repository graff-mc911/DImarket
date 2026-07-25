import { useApp } from '../../contexts/AppContext'

const FEATURED_COMPANIES = [
  { id: 'knauf', name: 'Knauf', mark: 'K' },
  { id: 'bosch', name: 'Bosch Professional', mark: 'B' },
  { id: 'hilti', name: 'Hilti', mark: 'H' },
  { id: 'velux', name: 'VELUX', mark: 'V' },
  { id: 'geberit', name: 'Geberit', mark: 'G' },
  { id: 'wurth', name: 'Würth', mark: 'W' },
] as const

export function HomeFeaturedCompanies() {
  const { t } = useApp()

  return (
    <section
      className="home-section home-section--muted home-section--tight layout-page-gutter"
      aria-labelledby="home-companies-title"
    >
      <div className="home-section__head home-section__head--center">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.companiesEyebrow')}</p>
          <h2 id="home-companies-title" className="home-section__title">
            {t('homePremium.companiesTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.companiesSubtitle')}</p>
        </div>
      </div>

      <ul className="home-companies-grid">
        {FEATURED_COMPANIES.map((c) => (
          <li key={c.id} className="home-company-logo">
            <span className="home-company-logo__mark" aria-hidden>
              {c.mark}
            </span>
            <span className="home-company-logo__name">{c.name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
