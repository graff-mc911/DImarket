import { MapPin } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { formatHomeBudget } from '../../lib/homeMarketplace'
import { listingCityLabel } from '../../lib/listingLocation'
import { navigateTo } from '../../lib/navigation'
import type { ListingWithImages } from '../../lib/types'

interface HomePopularProjectsProps {
  projects: ListingWithImages[]
  loading?: boolean
}

const URGENCY_KEYS: Record<string, string> = {
  low: 'homePremium.urgencyLow',
  normal: 'homePremium.urgencyNormal',
  high: 'homePremium.urgencyHigh',
  urgent: 'homePremium.urgencyUrgent',
}

export function HomePopularProjects({ projects, loading }: HomePopularProjectsProps) {
  const { language, t } = useApp()

  return (
    <section className="home-section home-section--muted" aria-labelledby="home-projects-title">
      <div className="layout-page-gutter">
        <div className="home-section__head">
          <div>
            <p className="home-section__eyebrow">{t('homePremium.projectsEyebrow')}</p>
            <h2 id="home-projects-title" className="home-section__title">
              {t('homePremium.projectsTitle')}
            </h2>
            <p className="home-section__subtitle">{t('homePremium.projectsSubtitle')}</p>
          </div>
          <button
            type="button"
            className="home-section__link"
            onClick={() => navigateTo('/listings')}
          >
            {t('homePremium.seeAllProjects')}
          </button>
        </div>

        {loading ? (
          <div className="home-rail" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="home-project-card home-project-card--skeleton" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="home-section__empty">{t('homePremium.noProjects')}</p>
        ) : (
          <div className="home-rail" role="list">
            {projects.map((project) => {
              const city = listingCityLabel(project.city_name || project.location)
              const budget = formatHomeBudget(
                project.budget_min,
                project.budget_max,
                project.currency || 'EUR',
                language.code,
              )
              const urgency = project.urgency || 'normal'
              const categoryName = project.category?.name || t('home.unknownCategory')

              return (
                <article key={project.id} className="home-project-card" role="listitem">
                  <div className="home-project-card__top">
                    <span className={`home-urgency home-urgency--${urgency}`}>
                      {t((URGENCY_KEYS[urgency] || URGENCY_KEYS.normal) as never)}
                    </span>
                    <span className="home-project-card__cat">{categoryName}</span>
                  </div>
                  <h3 className="home-project-card__title">{project.title}</h3>
                  <p className="home-project-card__loc">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {city || project.location || t('home.noLocation')}
                  </p>
                  <p className="home-project-card__budget">
                    {budget || t('home.budgetOnRequest')}
                  </p>
                  <button
                    type="button"
                    className="home-btn home-btn--primary home-btn--sm"
                    onClick={() => navigateTo(`/listing/${project.id}`)}
                  >
                    {t('homePremium.apply')}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
