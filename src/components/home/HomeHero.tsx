import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import type { HomeMetrics } from '../../lib/homeMarketplace'
import { navigateTo } from '../../lib/navigation'
import { AnimatedStat } from './AnimatedStat'

interface HomeHeroProps {
  metrics: HomeMetrics
}

type HeroSlide = {
  id: string
  title: string
  subtitle: string
  cta: string
  path: string
  image: string
}

const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80',
]

export function HomeHero({ metrics }: HomeHeroProps) {
  const { t } = useApp()
  const [slide, setSlide] = useState(0)

  const slides = useMemo<HeroSlide[]>(
    () => [
      {
        id: 'trust',
        title: t('home.heroTrustTitle'),
        subtitle: t('home.heroTrustSubtitle'),
        cta: t('home.search'),
        path: '/professionals',
        image: SLIDE_IMAGES[0],
      },
      {
        id: 'post',
        title: t('home.postJobFree'),
        subtitle: t('homePremium.heroSubtitle'),
        cta: t('header.postJob'),
        path: '/create-project',
        image: SLIDE_IMAGES[1],
      },
      {
        id: 'pros',
        title: t('home.topProsInCity').replace('{city}', 'Europe'),
        subtitle: t('home.heroSocialProof')
          .replace('{rating}', '4.8')
          .replace('{pros}', String(Math.max(metrics.professionals, 120))),
        cta: t('home.allPros'),
        path: '/professionals',
        image: SLIDE_IMAGES[2],
      },
    ],
    [t, metrics.professionals],
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((s) => (s + 1) % slides.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [slides.length])

  const prev = () => setSlide((s) => (s - 1 + slides.length) % slides.length)
  const next = () => setSlide((s) => (s + 1) % slides.length)

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

            <div className="home-hero__stats" aria-label={t('homePremium.statsLabel')}>
              <AnimatedStat value={metrics.professionals} label={t('homePremium.statPros')} />
              <AnimatedStat value={metrics.reviews} label={t('homePremium.statReviews')} />
              <AnimatedStat value={metrics.countries} label={t('homePremium.statCountries')} />
              <AnimatedStat value={metrics.projects} label={t('homePremium.statProjects')} />
            </div>
          </div>

          <div className="home-hero__showcase" aria-label={t('home.search')}>
            <div className="home-hero-carousel">
              {slides.map((item, index) => (
                <div
                  key={item.id}
                  className={`home-hero-carousel__slide${index === slide ? ' is-active' : ''}`}
                  style={{ backgroundImage: `url(${item.image})` }}
                  aria-hidden={index !== slide}
                >
                  <div className="home-hero-carousel__veil" aria-hidden />
                  <button
                    type="button"
                    className="home-hero-carousel__copy"
                    onClick={() => navigateTo(item.path)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                    <em>{item.cta}</em>
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="home-hero-carousel__nav home-hero-carousel__nav--prev"
                onClick={prev}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                className="home-hero-carousel__nav home-hero-carousel__nav--next"
                onClick={next}
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
