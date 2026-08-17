import { useApp } from '../../contexts/AppContext'

const FEATURED_COMPANIES = [
  {
    id: 'knauf',
    name: 'Knauf',
    image: '/ads/brands/knauf.png',
    website: 'https://www.knauf.com',
  },
  {
    id: 'bosch',
    name: 'Bosch Professional',
    image: '/ads/brands/bosch.png',
    website: 'https://www.bosch-professional.com',
  },
  {
    id: 'hilti',
    name: 'Hilti',
    image: '/ads/brands/hilti.png',
    website: 'https://www.hilti.com',
  },
  {
    id: 'velux',
    name: 'VELUX',
    image: '/ads/brands/velux.png',
    website: 'https://www.velux.com',
  },
  {
    id: 'geberit',
    name: 'Geberit',
    image: '/ads/brands/geberit.png',
    website: 'https://www.geberit.com',
  },
  {
    id: 'wurth',
    name: 'Würth',
    image: '/ads/brands/wurth.png',
    website: 'https://www.wuerth.com',
  },
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
          <li key={c.id}>
            <a
              className="home-company-logo"
              href={c.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="home-company-logo__media"
                src={c.image}
                alt=""
                width={1024}
                height={576}
                loading="lazy"
                decoding="async"
              />
              <span className="home-company-logo__name">{c.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
