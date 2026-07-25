import { Quote, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import type { HomeReview } from '../../lib/homeMarketplace'

interface HomeCustomerReviewsProps {
  reviews: HomeReview[]
}

export function HomeCustomerReviews({ reviews }: HomeCustomerReviewsProps) {
  const { t } = useApp()

  if (reviews.length === 0) return null

  return (
    <section className="home-section layout-page-gutter" aria-labelledby="home-reviews-title">
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.reviewsEyebrow')}</p>
          <h2 id="home-reviews-title" className="home-section__title">
            {t('homePremium.reviewsTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.reviewsSubtitle')}</p>
        </div>
      </div>

      <div className="home-reviews-grid">
        {reviews.slice(0, 6).map((review) => (
          <article key={review.id} className="home-review-card">
            <Quote className="home-review-card__quote" aria-hidden />
            <div className="home-review-card__stars" aria-label={`${review.rating} / 5`}>
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
            <p className="home-review-card__text">{review.comment}</p>
            <div className="home-review-card__author">
              <span className="home-review-card__avatar" aria-hidden>
                {(review.reviewer_name || 'C').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="home-review-card__name">{review.reviewer_name}</p>
                {review.is_verified_customer ? (
                  <p className="home-review-card__badge">
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
