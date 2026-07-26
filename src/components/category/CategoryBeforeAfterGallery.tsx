import { Images } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { CategoryGalleryItem } from '../../lib/marketplaceCategories'

interface CategoryBeforeAfterGalleryProps {
  items: CategoryGalleryItem[]
}

export function CategoryBeforeAfterGallery({ items }: CategoryBeforeAfterGalleryProps) {
  const { t } = useApp()
  const visible = items.slice(0, 10)

  if (visible.length === 0) return null

  return (
    <section className="cat-section" aria-labelledby="cat-before-after">
      <div className="cat-section__head">
        <div>
          <h2 id="cat-before-after" className="cat-section__title-row">
            <Images className="h-5 w-5 text-[#c96d2c]" aria-hidden />
            {t('catPage.beforeAfterGallery')}
          </h2>
          <p>{t('catPage.beforeAfterSubtitle')}</p>
        </div>
      </div>

      <div className="cat-gallery-masonry">
        {visible.map((item, index) => {
          const before = item.before_url
          const after = item.after_url || item.image_url

          return (
            <article
              key={item.id}
              className={`cat-gallery-card ${index % 3 === 0 ? 'cat-gallery-card--tall' : ''}`}
            >
              {before && after ? (
                <div className="cat-gallery-card__split">
                  <figure>
                    <img src={before} alt={`${item.title} - ${t('catPage.before')}`} loading="lazy" />
                    <figcaption>{t('catPage.before')}</figcaption>
                  </figure>
                  <figure>
                    <img src={after} alt={`${item.title} - ${t('catPage.after')}`} loading="lazy" />
                    <figcaption>{t('catPage.after')}</figcaption>
                  </figure>
                </div>
              ) : after ? (
                <figure className="cat-gallery-card__single">
                  <img src={after} alt={item.title} loading="lazy" />
                  <figcaption>
                    {item.source === 'portfolio' ? t('catPage.after') : t('catPage.projectPhoto')}
                  </figcaption>
                </figure>
              ) : null}
              <h3>{item.title}</h3>
            </article>
          )
        })}
      </div>
    </section>
  )
}
