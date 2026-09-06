import { Languages, MapPin, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { HomeProfessional } from '../../lib/homeMarketplace'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import { resolveProfileAvatarUrl } from '../../lib/directoryAvatars'
import { navigateTo } from '../../lib/navigation'
import { ProfileAvatar } from './HomeRailAvatar'

interface HomeTopProfessionalsProps {
  professionals: HomeProfessional[]
  loading?: boolean
}

export function HomeTopProfessionals({ professionals, loading }: HomeTopProfessionalsProps) {
  const { t } = useApp()

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-pros-title">
      <div className="home-section__head home-section__head--center">
        <div>
          <h2 id="home-pros-title" className="home-section__title home-section__title--sm">
            {t('homePremium.prosTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.prosSubtitle')}</p>
          <button
            type="button"
            className="home-section__link"
            onClick={() => navigateTo('/professionals')}
          >
            {t('homePremium.seeAllPros')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="home-rail home-rail--pros home-rail--grid4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-pro-card home-pro-card--skeleton" />
          ))}
        </div>
      ) : professionals.length === 0 ? (
        <p className="home-section__empty">{t('home.noProfessionals')}</p>
      ) : (
        <div className="home-rail home-rail--pros home-rail--grid4" role="list">
          {professionals.map((pro) => {
            const name = formatProfessionalCardTitle(pro, t('professional.defaultName'))
            const avatar = resolveProfileAvatarUrl(pro)
            const langs = (pro.languages ?? []).slice(0, 3)
            const location = (pro.location || '').trim()

            return (
              <article key={pro.id} className="home-pro-card" role="listitem">
                <button
                  type="button"
                  className="home-pro-card__hit"
                  onClick={() => navigateTo(`/professional/${pro.id}`)}
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
                    {location ? (
                      <p className="home-pro-card__langs">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {location}
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
    </section>
  )
}
