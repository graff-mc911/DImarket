import { ChevronLeft, ChevronRight, Quote, ShieldCheck, Star } from 'lucide-react'
import { useRef } from 'react'
import { useApp } from '../../contexts/AppContext'
import type { CategoryReview } from '../../lib/marketplaceCategories'

interface CategoryCustomerReviewsProps {
  reviews: CategoryReview[]
  averageRating: number | null
}

export function CategoryCustomerReviews({
  reviews,
  averageRating,
}: CategoryCustomerReviewsProps) {
  const { t } = useApp()
  const trackRef = useRef<HTMLDivElement | null>(null)

  if (reviews.length === 0) return null

  const scroll = (direction: -1 | 1) => {
    const node = trackRef.current
    if (!node) return
    node.scrollBy({
      left: direction * Math.max(280, node.clientWidth * 0.82),
      behavior: 'smooth',
    })
  }

  return (
    <section className="cat-section" aria-labelledby="cat-reviews">
      <div className="cat-section__head">
        <div>
          <h2 id="cat-reviews">{t('catPage.customerReviews')}</h2>
          <p className="cat-section__avg">
            <Star className="h-4 w-4 fill-[#ff9900] text-[#ff9900]" aria-hidden />
            {averageRating != null && averageRating > 0
              ? averageRating.toFixed(1)
              : '—'}{' '}
            {t('marketplace.avgRating')}
          </p>
        </div>
      </div>
      <div className="cat-review-controls" aria-label={t('catPage.reviewCarouselControls')}>
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label={t('catPage.previousReview')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label={t('catPage.nextReview')}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div ref={trackRef} className="cat-reviews-carousel" role="list">
        {reviews.map((review) => (
          <article key={review.id} className="cat-review-card" role="listitem">
            <Quote className="cat-review-card__quote" aria-hidden />
            <div className="cat-review-card__stars" aria-label={`${review.rating} / 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(review.rating)
                      ? 'fill-[#ff9900] text-[#ff9900]'
                      : 'text-[#e5ddd3]'
                  }`}
                />
              ))}
            </div>
            <p className="cat-review-card__text">{review.comment}</p>
            <div className="cat-review-card__author">
              <span className="cat-review-card__avatar" aria-hidden>
                {(review.reviewer_name || 'C').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="cat-review-card__name">{review.reviewer_name}</p>
                {review.is_verified_customer ? (
                  <p className="cat-review-card__badge">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    {t('homePremium.verifiedCustomer')}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
