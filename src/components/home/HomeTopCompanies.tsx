import { Building2, ChevronRight, Languages, MapPin, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { HomeMetrics, HomeProfessional } from '../../lib/homeMarketplace'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import { resolveProfileAvatarUrl } from '../../lib/directoryAvatars'
import { navigateTo } from '../../lib/navigation'
import { appendLocationToPath } from '../../lib/globalLocation'
import type { GeoSearchState } from '../../lib/geoSearch'
import { ProfileAvatar } from './HomeRailAvatar'
import { HomeEmptyPanel } from './HomeEmptyPanel'

interface HomeTopCompaniesProps {
  companies: HomeProfessional[]
  loading?: boolean
  metrics?: Pick<HomeMetrics, 'countries'>
}

/** Owner-cabinet style: outer sheet + inner framed feature head + company cards. */
export function HomeTopCompanies({ companies, loading, metrics }: HomeTopCompaniesProps) {
  const { t, location, setLocation } = useApp()

  const openCompaniesCatalog = () => {
    let geo: GeoSearchState = location
    if (location.country && !location.city && !location.region && !location.province) {
      geo = { ...location, radius: 'country' }
      setLocation(geo)
    }
    navigateTo(appendLocationToPath('/companies', geo))
  }

  const companiesCount = companies.length
  const countriesCount = metrics?.countries ?? 0
  const metaLine = [
    companiesCount > 0 ? `${companiesCount} комп.` : null,
    countriesCount > 0 ? `${countriesCount} країн` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-companies-title">
      <div className="cabinet-sheet">
        <article className="cabinet-sheet__feature">
          <button
            type="button"
            className="cabinet-sheet__feature-head"
            onClick={openCompaniesCatalog}
            aria-label={t('homePremium.topCompaniesTitle')}
          >
            <span className="dimarket-category-card__icon" aria-hidden>
              <Building2 className="h-8 w-8 text-[color:var(--icon-well-ink)]" />
            </span>
            <span className="dimarket-category-card__body">
              <strong id="home-companies-title">{t('homePremium.topCompaniesTitle')}</strong>
              <span>{metaLine || t('homePremium.topCompaniesSubtitle')}</span>
            </span>
            <ChevronRight className="dimarket-category-card__chevron h-5 w-5" aria-hidden />
          </button>
        </article>

        {loading ? (
          <div className="cabinet-sheet__grid cabinet-sheet__grid--pros" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="home-pro-card home-pro-card--skeleton" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <HomeEmptyPanel
            icon={Building2}
            title={t('home.noCompanies')}
            description={t('homePremium.topCompaniesSubtitle')}
            primaryLabel={t('home.registerAsProfessional')}
            onPrimary={() => navigateTo('/register')}
            secondaryLabel={t('homePremium.seeAllCompanies')}
            onSecondary={openCompaniesCatalog}
          />
        ) : (
          <div className="cabinet-sheet__grid cabinet-sheet__grid--pros" role="list">
            {companies.map((company) => {
              const name = formatProfessionalCardTitle(company, t('professional.defaultName'))
              const avatar = resolveProfileAvatarUrl(company)
              const langs = (company.languages ?? []).slice(0, 3)
              const place = (company.location || '').trim()

              return (
                <article key={company.id} className="home-pro-card" role="listitem">
                  <button
                    type="button"
                    className="home-pro-card__hit"
                    onClick={openCompaniesCatalog}
                  >
                    <div className="home-pro-card__avatar">
                      <ProfileAvatar
                        name={name}
                        profileId={company.id}
                        src={avatar}
                        userRole={company.user_role || 'company'}
                      />
                    </div>
                    <div className="home-pro-card__info">
                      <div className="home-pro-card__name-row">
                        <h3>{name}</h3>
                        {company.is_verified ? (
                          <span className="home-pro-card__verified">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            {t('homePremium.verified')}
                          </span>
                        ) : null}
                      </div>
                      <p className="home-pro-card__rating">
                        <Star className="h-4 w-4 fill-[#ff9900] text-[#ff9900]" aria-hidden />
                        {(company.rating ?? 0) > 0
                          ? Number(company.rating).toFixed(1)
                          : t('professional.new')}
                        <span>
                          · {company.completed_jobs ?? 0} {t('homePremium.completedProjects')}
                        </span>
                      </p>
                      {place ? (
                        <p className="home-pro-card__langs">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {place}
                        </p>
                      ) : null}
                      {langs.length > 0 ? (
                        <p className="home-pro-card__langs">
                          <Languages className="h-3.5 w-3.5" aria-hidden />
                          {langs.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-4 text-center">
          {companies.length > 0 || loading ? (
            <button type="button" className="home-section__link" onClick={openCompaniesCatalog}>
              {t('homePremium.seeAllCompanies')}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
