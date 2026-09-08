import { useApp } from '../../contexts/AppContext'

const FEATURED_COMPANIES = [
  {
    id: 'knauf',
    name: 'Knauf',
    image: '/media/brands/knauf.png',
    website: 'https://www.knauf.com',
  },
  {
    id: 'festool',
    name: 'Festool',
    image: '/media/brands/festool.png',
    website: 'https://www.festool.com',
  },
  {
    id: 'hilti',
    name: 'Hilti',
    image: '/media/brands/hilti.png',
    website: 'https://www.hilti.com',
  },
  {
    id: 'velux',
    name: 'VELUX',
    image: '/media/brands/velux.png',
    website: 'https://www.velux.com',
  },
  {
    id: 'geberit',
    name: 'Geberit',
    image: '/media/brands/geberit.png',
    website: 'https://www.geberit.com',
  },
  {
    id: 'wurth',
    name: 'Würth',
    image: '/media/brands/wurth.png',
    website: 'https://www.wuerth.com',
  },
] as const

export function HomeFeaturedCompanies() {
  const { t } = useApp()

  return (
    <section
      className="home-section home-section--muted home-section--tight layout-page-gutter"
      aria-labelledby="home-brands-title"
    >
      <div className="cabinet-sheet">
        <div className="cabinet-sheet__head">
          <div className="dimarket-categories__head mb-0" style={{ textAlign: 'center' }}>
            <p className="dimarket-categories__eyebrow">{t('homePremium.companiesEyebrow')}</p>
            <h2 id="home-brands-title" className="dimarket-categories__title">
              {t('homePremium.companiesTitle')}
            </h2>
            <p className="home-section__subtitle" style={{ marginTop: '0.35rem' }}>
              {t('homePremium.companiesSubtitle')}
            </p>
          </div>
        </div>

        <ul className="cabinet-sheet__grid cabinet-sheet__grid--brands">
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
                  alt={c.name}
                  width={1024}
                  height={576}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
