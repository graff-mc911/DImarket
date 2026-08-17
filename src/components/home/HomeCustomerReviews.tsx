import { ChevronLeft, ChevronRight, ShieldCheck, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import type { HomeReview } from '../../lib/homeMarketplace'
import {
  countryFlag,
  mergeHomeReviews,
  type DisplayHomeReview,
} from '../../lib/homeReviews'

interface HomeCustomerReviewsProps {
  reviews: HomeReview[]
}

function formatCompletedDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

function ReviewCard({ review, locale }: { review: DisplayHomeReview; locale: string }) {
  const { t } = useApp()
  const initial = (review.reviewer_name || 'C').slice(0, 1).toUpperCase()

  return (
    <article className="home-review-card home-review-card--carousel">
      <div className="home-review-card__top">
        <div className="home-review-card__author">
          {review.avatar_url ? (
            <img
              src={review.avatar_url}
              alt=""
              className="home-review-card__avatar-img"
              loading="lazy"
            />
          ) : (
            <span className="home-review-card__avatar" aria-hidden>
              {initial}
            </span>
          )}
          <div>
            <p className="home-review-card__name">
              {review.reviewer_name}{' '}
              {review.country_code ? (
                <span className="home-review-card__flag" title={review.country_name}>
                  {countryFlag(review.country_code)}
                </span>
              ) : null}
            </p>
            {review.is_verified_customer ? (
              <p className="home-review-card__badge">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {t('homePremium.verifiedCustomer')}
              </p>
            ) : review.country_name ? (
              <p className="home-review-card__meta-line">{review.country_name}</p>
            ) : null}
          </div>
        </div>
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
      </div>

      <p className="home-review-card__text">{review.comment}</p>

      <div className="home-review-card__meta">
        {review.category ? (
          <span className="home-review-card__category">{review.category}</span>
        ) : (
          <span />
        )}
        <time dateTime={review.created_at}>
          {formatCompletedDate(review.created_at, locale)}
        </time>
      </div>
    </article>
  )
}

export function HomeCustomerReviews({ reviews }: HomeCustomerReviewsProps) {
  const { t, language } = useApp()
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const cards = useMemo(() => mergeHomeReviews(reviews, 6), [reviews])
  const maxIndex = Math.max(0, cards.length - 1)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-review-slide]')
    if (!card) return
    const gap = 16
    el.scrollTo({
      left: index * (card.offsetWidth + gap),
      behavior: 'smooth',
    })
  }, [index])

  useEffect(() => {
    if (cards.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % cards.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [cards.length])

  if (cards.length === 0) return null

  return (
    <section className="home-section home-section--tight layout-page-gutter" aria-labelledby="home-reviews-title">
      <div className="home-section__head">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.reviewsEyebrow')}</p>
          <h2 id="home-reviews-title" className="home-section__title">
            {t('homePremium.reviewsTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.reviewsSubtitle')}</p>
        </div>
        <div className="home-carousel__controls">
          <button
            type="button"
            className="home-carousel__btn"
            aria-label={t('homePremium.carouselPrev')}
            onClick={() => setIndex((i) => (i <= 0 ? maxIndex : i - 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="home-carousel__btn"
            aria-label={t('homePremium.carouselNext')}
            onClick={() => setIndex((i) => (i >= maxIndex ? 0 : i + 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="home-reviews-carousel" ref={trackRef} tabIndex={0}>
        {cards.map((review) => (
          <div key={review.id} className="home-reviews-carousel__slide" data-review-slide>
            <ReviewCard review={review} locale={language.code} />
          </div>
        ))}
      </div>

      <div className="home-carousel__dots" role="tablist" aria-label={t('homePremium.reviewsTitle')}>
        {cards.map((review, i) => (
          <button
            key={review.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`home-carousel__dot ${i === index ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
