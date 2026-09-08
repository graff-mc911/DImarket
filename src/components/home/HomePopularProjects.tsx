import { Briefcase, MapPin } from 'lucide-react'
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
    <section className="home-section home-section--muted layout-page-gutter" aria-labelledby="home-projects-title">
      <div className="cabinet-sheet">
        <div className="cabinet-sheet__head">
          <div className="dimarket-categories__head mb-0" style={{ textAlign: 'left' }}>
            <p className="dimarket-categories__eyebrow" style={{ textAlign: 'left' }}>
              {t('homePremium.projectsEyebrow')}
            </p>
            <h2 id="home-projects-title" className="dimarket-categories__title" style={{ textAlign: 'left' }}>
              <Briefcase className="mr-2 inline h-6 w-6 align-text-bottom text-[color:var(--icon-well-ink)]" aria-hidden />
              {t('homePremium.projectsTitle')}
            </h2>
            <p className="home-section__subtitle" style={{ marginTop: '0.35rem' }}>
              {t('homePremium.projectsSubtitle')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="cabinet-sheet__grid cabinet-sheet__grid--pros" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="home-project-card home-project-card--skeleton" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="home-section__empty">{t('homePremium.noProjects')}</p>
        ) : (
          <div className="cabinet-sheet__grid cabinet-sheet__grid--pros" role="list">
            {projects.slice(0, 4).map((project) => {
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

        <div className="mt-4 text-center">
          <button type="button" className="home-section__link" onClick={() => navigateTo('/listings')}>
            {t('homePremium.seeAllProjects')}
          </button>
        </div>
      </div>
    </section>
  )
}
