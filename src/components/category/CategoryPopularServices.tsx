import { ArrowRight } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  marketplaceCategoryLabel,
  marketplaceServiceProsPath,
  type MarketplaceCategory,
} from '../../lib/marketplaceCategories'
import { navigateTo } from '../../lib/navigation'

interface CategoryPopularServicesProps {
  services: MarketplaceCategory[]
  categorySlug: string
}

export function CategoryPopularServices({
  services,
  categorySlug,
}: CategoryPopularServicesProps) {
  const { language, t } = useApp()

  return (
    <section className="cat-section" aria-labelledby="cat-popular-services">
      <div className="cat-section__head">
        <div>
          <h2 id="cat-popular-services">{t('catPage.popularServices')}</h2>
          <p>{t('marketplace.servicesHint')}</p>
        </div>
      </div>
      {services.length === 0 ? (
        <p className="cat-section__empty">{t('marketplace.noServices')}</p>
      ) : (
        <div className="cat-services-grid">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              className="cat-service-tile"
              onClick={() =>
                navigateTo(marketplaceServiceProsPath(service.slug, categorySlug))
              }
            >
              <span>{marketplaceCategoryLabel(service, language.code)}</span>
              <ArrowRight className="h-4 w-4 opacity-45" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
