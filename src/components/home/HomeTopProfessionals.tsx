import { ChevronRight, Languages, MapPin, ShieldCheck, Star, Wrench } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { HomeMetrics, HomeProfessional } from '../../lib/homeMarketplace'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import { resolveProfileAvatarUrl } from '../../lib/directoryAvatars'
import { navigateTo } from '../../lib/navigation'
import { appendLocationToPath } from '../../lib/globalLocation'
import type { GeoSearchState } from '../../lib/geoSearch'
import { ProfileAvatar } from './HomeRailAvatar'

interface HomeTopProfessionalsProps {
  professionals: HomeProfessional[]
  loading?: boolean
  metrics?: Pick<HomeMetrics, 'professionals' | 'countries'>
}

/** Owner-cabinet style: outer sheet + inner framed feature head + master cards. */
export function HomeTopProfessionals({
  professionals,
  loading,
  metrics,
}: HomeTopProfessionalsProps) {
  const { t, location, setLocation } = useApp()

  const openMastersCatalog = () => {
    let geo: GeoSearchState = location
    if (location.country && !location.city && !location.region && !location.province) {
      geo = { ...location, radius: 'country' }
      setLocation(geo)
    }
    navigateTo(appendLocationToPath('/professionals', geo))
  }

  const prosCount = metrics?.professionals ?? professionals.length
  const countriesCount = metrics?.countries ?? 0
  const metaLine = [
    prosCount > 0 ? `${prosCount} проф.` : null,
    countriesCount > 0 ? `${countriesCount} країн` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-pros-title">
      <div className="cabinet-sheet">
        <article className="cabinet-sheet__feature">
          <button
            type="button"
            className="cabinet-sheet__feature-head"
            onClick={openMastersCatalog}
            aria-label={t('homePremium.prosTitle')}
          >
            <span className="dimarket-category-card__icon" aria-hidden>
              <Wrench className="h-8 w-8 text-[color:var(--icon-well-ink)]" />
            </span>
            <span className="dimarket-category-card__body">
              <strong id="home-pros-title">{t('homePremium.prosTitle')}</strong>
              <span>{metaLine || t('homePremium.prosSubtitle')}</span>
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
        ) : professionals.length === 0 ? (
          <p className="home-section__empty">{t('home.noProfessionals')}</p>
        ) : (
          <div className="cabinet-sheet__grid cabinet-sheet__grid--pros" role="list">
            {professionals.map((pro) => {
              const name = formatProfessionalCardTitle(pro, t('professional.defaultName'))
              const avatar = resolveProfileAvatarUrl(pro)
              const langs = (pro.languages ?? []).slice(0, 3)
              const place = (pro.location || '').trim()

              return (
                <article key={pro.id} className="home-pro-card" role="listitem">
                  <button
                    type="button"
                    className="home-pro-card__hit"
                    onClick={openMastersCatalog}
                  >
                    <div className="home-pro-card__avatar">
                      <ProfileAvatar
                        name={name}
                        profileId={pro.id}
                        src={avatar}
                        userRole={pro.user_role}
                      />
                    </div>
                    <div className="home-pro-card__info">
                      <div className="home-pro-card__name-row">
                        <h3>{name}</h3>
                        {pro.is_verified ? (
                          <span className="home-pro-card__verified">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            {t('homePremium.verified')}
                          </span>
                        ) : null}
                      </div>
                      <p className="home-pro-card__rating">
                        <Star className="h-4 w-4 fill-[#ff9900] text-[#ff9900]" aria-hidden />
                        {(pro.rating ?? 0) > 0 ? Number(pro.rating).toFixed(1) : t('professional.new')}
                        <span>
                          · {pro.completed_jobs ?? 0} {t('homePremium.completedProjects')}
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
          <button type="button" className="home-section__link" onClick={openMastersCatalog}>
            {t('homePremium.seeAllPros')}
          </button>
        </div>
      </div>
    </section>
  )
}
