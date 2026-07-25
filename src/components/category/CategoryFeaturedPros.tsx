import { ProfessionalCard } from '../ProfessionalCard'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import type { Profile } from '../../lib/types'

interface CategoryFeaturedProsProps {
  professionals: Profile[]
  categorySlug: string
}

export function CategoryFeaturedPros({
  professionals,
  categorySlug,
}: CategoryFeaturedProsProps) {
  const { t } = useApp()

  return (
    <section className="cat-section" aria-labelledby="cat-featured-pros">
      <div className="cat-section__head">
        <h2 id="cat-featured-pros">{t('marketplace.featuredProfessionals')}</h2>
        <button
          type="button"
          className="cat-section__link"
          onClick={() =>
            navigateTo(`/professionals?category=${encodeURIComponent(categorySlug)}`)
          }
        >
          {t('marketplace.viewAllPros')}
        </button>
      </div>
      {professionals.length === 0 ? (
        <p className="cat-section__empty">{t('marketplace.noPros')}</p>
      ) : (
        <div className="cat-pro-grid">
          {professionals.map((pro) => (
            <ProfessionalCard key={pro.id} professional={pro} showStatusBadges />
          ))}
        </div>
      )}
    </section>
  )
}
