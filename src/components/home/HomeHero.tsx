import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  CATEGORY_COVER_IMAGES,
  coverImageForCategory,
  MARKETPLACE_MAIN_COVER_SLUGS,
} from '../../lib/categoryCoverImages'
import {
  marketplaceCategoryDescription,
  marketplaceCategoryLabel,
  marketplaceCategoryPath,
  type MarketplaceCategory,
} from '../../lib/marketplaceCategories'
import { navigateTo } from '../../lib/navigation'

interface HomeHeroProps {
  categories: MarketplaceCategory[]
}

type HeroSlide = {
  id: string
  title: string
  subtitle: string
  cta: string
  path: string
  image: string
}

export function HomeHero({ categories }: HomeHeroProps) {
  const { t, language } = useApp()
  const [slide, setSlide] = useState(0)

  const slides = useMemo<HeroSlide[]>(() => {
    const fromDb = categories.filter((category) => CATEGORY_COVER_IMAGES[category.slug])
    const rows =
      fromDb.length > 0
        ? fromDb
        : MARKETPLACE_MAIN_COVER_SLUGS.map(
            (slug) =>
              ({
                id: slug,
                slug,
                name: slug,
              }) as MarketplaceCategory,
          )

    return rows.map((category) => {
      const slug = category.slug || category.id
      const title = marketplaceCategoryLabel(category, language.code)
      const description = marketplaceCategoryDescription(category, language.code)
      return {
        id: slug,
        title,
        subtitle: description || t('marketplace.viewCategory'),
        cta: t('marketplace.viewServices'),
        path: marketplaceCategoryPath(slug),
        image: coverImageForCategory(slug, category.cover_image_url),
      }
    })
  }, [categories, language.code, t])

  useEffect(() => {
    setSlide((s) => (slides.length ? s % slides.length : 0))
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setInterval(() => {
      setSlide((s) => (s + 1) % slides.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const prev = () => setSlide((s) => (s - 1 + slides.length) % slides.length)
  const next = () => setSlide((s) => (s + 1) % slides.length)

  const nearby = (index: number) => {
    const n = slides.length
    if (n === 0) return false
    if (index === slide) return true
    if (index === (slide + 1) % n) return true
    if (index === (slide - 1 + n) % n) return true
    return false
  }

  return (
    <section className="home-hero home-hero--stacked" aria-labelledby="home-hero-title">
      <div className="home-hero__bg" aria-hidden />
      <div className="home-hero__shell layout-page-gutter">
        <div className="home-hero__layout">
          <div className="home-hero__content">
            <div className="home-hero__copy">
              <p className="home-hero__eyebrow">{t('homePremium.eyebrow')}</p>
              <h1 id="home-hero-title" className="home-hero__title">
                {t('homePremium.heroTitle')}
              </h1>
              <p className="home-hero__subtitle">{t('homePremium.heroSubtitle')}</p>
            </div>
          </div>

          <div className="home-hero__showcase" aria-label={t('marketplace.categories')}>
            <div className="home-hero-carousel">
              {slides.map((item, index) => (
                <div
                  key={item.id}
                  className={`home-hero-carousel__slide${index === slide ? ' is-active' : ''}`}
                  data-category={item.id}
                  data-cover={item.image}
                  aria-hidden={index !== slide}
                >
                  {nearby(index) ? (
                    <img
                      src={item.image}
                      alt=""
                      className="home-hero-carousel__image"
                      loading={index === slide ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ) : null}
                  <div className="home-hero-carousel__veil" aria-hidden />
                  <button
                    type="button"
                    className="home-hero-carousel__copy"
                    onClick={() => navigateTo(item.path)}
                    tabIndex={index === slide ? 0 : -1}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                    <em>{item.cta}</em>
                  </button>
                </div>
              ))}

              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="home-hero-carousel__nav home-hero-carousel__nav--prev"
                    onClick={prev}
                    aria-label={t('common.previous')}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="home-hero-carousel__nav home-hero-carousel__nav--next"
                    onClick={next}
                    aria-label={t('common.next')}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
