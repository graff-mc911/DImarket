import { ChevronLeft, ChevronRight, Languages, ShieldCheck, Star } from 'lucide-react'
import { useRef } from 'react'
import { useApp } from '../../contexts/AppContext'
import type { HomeProfessional } from '../../lib/homeMarketplace'
import { formatProfessionalCardTitle } from '../../lib/professionalDisplay'
import { navigateTo } from '../../lib/navigation'

interface HomeTopProfessionalsProps {
  professionals: HomeProfessional[]
  loading?: boolean
}

export function HomeTopProfessionals({ professionals, loading }: HomeTopProfessionalsProps) {
  const { t } = useApp()
  const railRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: -1 | 1) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-pros-title">
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.prosEyebrow')}</p>
          <h2 id="home-pros-title" className="home-section__title">
            {t('homePremium.prosTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.prosSubtitle')}</p>
        </div>
        <div className="home-carousel-nav">
          <button type="button" onClick={() => scroll(-1)} aria-label={t('common.previous')}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label={t('common.next')}>
            <ChevronRight className="h-5 w-5" />
          </button>
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
        <div className="home-rail home-rail--pros" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-pro-card home-pro-card--skeleton" />
          ))}
        </div>
      ) : professionals.length === 0 ? (
        <p className="home-section__empty">{t('home.noProfessionals')}</p>
      ) : (
        <div ref={railRef} className="home-rail home-rail--pros" role="list">
          {professionals.map((pro) => {
            const name = formatProfessionalCardTitle(pro, t('professional.defaultName'))
            const avatar = pro.profile_photo || pro.avatar_url
            const langs = (pro.languages ?? []).slice(0, 3)
            const responseTime = t('homePremium.responseTypical')

            return (
              <article key={pro.id} className="home-pro-card" role="listitem">
                <button
                  type="button"
                  className="home-pro-card__hit"
                  onClick={() => navigateTo(`/professional/${pro.id}`)}
                >
                  <div className="home-pro-card__avatar">
                    {avatar ? (
                      <img src={avatar} alt="" loading="lazy" />
                    ) : (
                      <span>{name.slice(0, 1).toUpperCase()}</span>
                    )}
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
                    {langs.length > 0 ? (
                      <p className="home-pro-card__langs">
                        <Languages className="h-3.5 w-3.5" aria-hidden />
                        {langs.join(', ')}
                      </p>
                    ) : null}
                    <p className="home-pro-card__response">
                      {t('homePremium.responseTime')}: {responseTime}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  className="home-btn home-btn--primary home-btn--sm"
                  onClick={() => navigateTo(`/professional/${pro.id}`)}
                >
                  {t('homePremium.viewProfile')}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
