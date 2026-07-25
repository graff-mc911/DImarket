import { MapPin } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { listingCityLabel } from '../../lib/listingLocation'
import { navigateTo } from '../../lib/navigation'
import type { ListingWithImages } from '../../lib/types'

interface CategoryLatestProjectsProps {
  projects: ListingWithImages[]
}

export function CategoryLatestProjects({ projects }: CategoryLatestProjectsProps) {
  const { t } = useApp()

  return (
    <section className="cat-section" aria-labelledby="cat-latest-projects">
      <div className="cat-section__head">
        <h2 id="cat-latest-projects">{t('catPage.latestProjects')}</h2>
        <button
          type="button"
          className="cat-section__link"
          onClick={() => navigateTo('/listings')}
        >
          {t('marketplace.viewAllProjects')}
        </button>
      </div>
      {projects.length === 0 ? (
        <p className="cat-section__empty">{t('marketplace.noProjects')}</p>
      ) : (
        <div className="cat-project-grid">
          {projects.map((project) => {
            const city = listingCityLabel(project.city_name || project.location)
            return (
              <button
                key={project.id}
                type="button"
                className="cat-project-tile"
                onClick={() => navigateTo(`/listing/${project.id}`)}
              >
                <h3>{project.title}</h3>
                {(city || project.location) && (
                  <p className="cat-project-tile__loc">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {city || project.location}
                  </p>
                )}
                <p className="cat-project-tile__cta">{t('marketplace.viewProject')}</p>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
