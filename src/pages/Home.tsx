// ============================================================
// Home.tsx — Головна сторінка (Amazon layout)
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { CategoryCircleTile } from '../components/CategoryCircleTile'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { SponsoredCompanies } from '../components/SponsoredCompanies'
import { LAUNCH_MARKETS } from '../lib/launchMarkets'
import { buildHomeCategoryGroups } from '../lib/homeCategoryTiles'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import type { Category, ListingWithImages, Profile } from '../lib/types'
import { mergeLaunchExampleRequests } from '../lib/launchSeedRequests'
import type { TranslationKey } from '../lib/i18n'
import { listingCityLabel } from '../lib/listingLocation'
import { getListingDisplayImage } from '../lib/listingThemeImage'
import { formatProfessionalCardTitle } from '../lib/professionalDisplay'

interface HomeProfessional extends Profile {
  professional_categories?: {
    category_id: string
    category?: Category | null
  }[]
}

const HERO_GRADIENTS = [
  'linear-gradient(135deg, #232f3e 0%, #37475a 50%, #1a4a5c 100%)',
  'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 50%, #232f3e 100%)',
  'linear-gradient(135deg, #3d2b1f 0%, #5c4033 50%, #232f3e 100%)',
]

export function Home() {
  const { language, t } = useApp()
  const categoryGroups = useMemo(
    () => buildHomeCategoryGroups(language.code, t),
    [language.code, t],
  )

  const [professionals, setProfessionals] = useState<HomeProfessional[]>([])
  const [rawJobs, setRawJobs] = useState<ListingWithImages[]>([])
  const [jobs, setJobs] = useState<ListingWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [heroSlide, setHeroSlide] = useState(0)

  const heroCity = LAUNCH_MARKETS[0]?.city ?? 'Darmstadt'
  const popularGroup = categoryGroups.find((g) => g.id === 'popular') ?? categoryGroups[0]

  const heroSlides = useMemo(
    () => [
      {
        title: t('home.heroTrustTitle'),
        subtitle: t('home.heroTrustSubtitle'),
        cta: t('home.search'),
        path: '/listings',
        bg: HERO_GRADIENTS[0],
      },
      {
        title: t('home.postJobFree'),
        subtitle: t('home.heroTrustSubtitle'),
        cta: t('header.postJob'),
        path: '/create-ad',
        bg: HERO_GRADIENTS[1],
      },
      {
        title: t('home.topProsInCity').replace('{city}', heroCity),
        subtitle: t('home.heroSocialProof')
          .replace('{rating}', '4.8')
          .replace('{pros}', '120+'),
        cta: t('home.allPros'),
        path: '/professionals',
        bg: HERO_GRADIENTS[2],
      },
    ],
    [t, heroCity],
  )

  useEffect(() => {
    void loadHomeData()
  }, [])

  useEffect(() => {
    setJobs(mergeLaunchExampleRequests(rawJobs, (key) => t(key as TranslationKey)))
  }, [rawJobs, language.code, t])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((s) => (s + 1) % heroSlides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  const loadHomeData = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()

      const [professionalsResult, jobsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            *,
            professional_categories(
              category_id,
              category:categories(*)
            )
          `)
          .eq('is_professional', true)
          .eq('user_role', 'professional')
          .order('rating', { ascending: false })
          .limit(4),

        supabase
          .from('listings')
          .select('*, images:listing_images(*), category:categories(*)')
          .eq('listing_type', 'service_request')
          .eq('status', 'active')
          .gte('expires_at', now)
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      setProfessionals((professionalsResult.data as HomeProfessional[] | null) ?? [])
      setRawJobs((jobsResult.data as ListingWithImages[] | null) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const prevSlide = () => setHeroSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)
  const nextSlide = () => setHeroSlide((s) => (s + 1) % heroSlides.length)

  return (
    <div className="home-page amazon-home">
      <section className="amazon-hero-carousel amazon-full-bleed" aria-label={t('home.search')}>
        {heroSlides.map((slide, index) => (
          <div
            key={slide.path}
            className={`amazon-hero-carousel__slide ${index === heroSlide ? 'amazon-hero-carousel__slide--active' : ''}`}
            style={{ background: slide.bg }}
          >
            <button
              type="button"
              onClick={() => navigateTo(slide.path)}
              className="mx-auto mb-2 max-w-lg px-6 text-center"
            >
              <p className="text-lg font-bold text-white md:text-2xl">{slide.title}</p>
              <p className="mt-1 hidden text-sm text-[#dddddd] sm:block">{slide.subtitle}</p>
              <span className="amazon-promo-card__cta mt-3 inline-block">{slide.cta}</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          className="amazon-hero-carousel__nav amazon-hero-carousel__nav--prev"
          onClick={prevSlide}
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          className="amazon-hero-carousel__nav amazon-hero-carousel__nav--next"
          onClick={nextSlide}
          aria-label="Next"
        >
          ›
        </button>
        <div className="amazon-hero-carousel__fade" aria-hidden />
      </section>

      <div className="layout-page-gutter">
        <MobileAdBanner variant="horizontal" page="home" outerClassName="mt-4 mb-2" />
        <SponsoredCompanies />
      </div>

      <div className="amazon-home-deck-wrap">
        <div className="amazon-home-deck amazon-home-deck--quad">
          <AmazonDealCard
            title={t('home.recentJobsTitle')}
            seeMore={t('home.allRequests')}
            onSeeMore={() => navigateTo('/listings')}
          >
            {loading ? (
              <LoadingText text={t('home.loading')} />
            ) : jobs.length > 0 ? (
              <div className="amazon-mini-grid">
                {jobs.slice(0, 4).map((job) => (
                  <JobMiniTile key={job.id} job={job} t={t} />
                ))}
              </div>
            ) : (
              <LoadingText text={t('home.noJobs')} />
            )}
          </AmazonDealCard>

          <AmazonDealCard
            title={t('home.topProsInCity').replace('{city}', heroCity)}
            seeMore={t('home.allPros')}
            onSeeMore={() => navigateTo('/professionals')}
          >
            {loading ? (
              <LoadingText text={t('home.loading')} />
            ) : professionals.length > 0 ? (
              <div className="amazon-mini-grid">
                {professionals.slice(0, 4).map((pro) => (
                  <ProMiniTile key={pro.id} pro={pro} t={t} />
                ))}
              </div>
            ) : (
              <LoadingText text={t('home.noProfessionals')} />
            )}
          </AmazonDealCard>

          {popularGroup && (
            <AmazonDealCard
              title={t('home.allCategoriesTitle')}
              seeMore={t('listings.title')}
              onSeeMore={() => navigateTo('/listings')}
            >
              <div className="amazon-mini-grid">
                {popularGroup.tiles.slice(0, 4).map((tile) => (
                  <CategoryCircleTile
                    key={tile.id}
                    icon={tile.icon}
                    label={tile.label}
                    onClick={() => navigateTo(tile.path)}
                  />
                ))}
              </div>
            </AmazonDealCard>
          )}

          <AmazonDealCard title={t('header.postJob')}>
            <div className="amazon-promo-card">
              <p className="text-sm text-[var(--ink-700)]">{t('home.heroTrustSubtitle')}</p>
              <button
                type="button"
                className="amazon-promo-card__cta"
                onClick={() => navigateTo('/create-ad')}
              >
                {t('home.postJobFree')}
              </button>
              <button
                type="button"
                className="amazon-see-more"
                onClick={() => navigateTo('/assistant/job')}
              >
                {t('home.heroAiCta')}
              </button>
            </div>
          </AmazonDealCard>
        </div>

        {jobs.length > 4 && (
          <div className="amazon-home-deck">
            <AmazonDealCard
              className="amazon-deal-card--wide"
              title={t('home.recentJobsTitle')}
              seeMore={t('home.allRequests')}
              onSeeMore={() => navigateTo('/listings')}
            >
              <div className="product-grid">
                {jobs.slice(4, 8).map((job) => (
                  <JobMiniTile key={job.id} job={job} t={t} variant="card" />
                ))}
              </div>
            </AmazonDealCard>
          </div>
        )}
      </div>
    </div>
  )
}

function AmazonDealCard({
  title,
  children,
  seeMore,
  onSeeMore,
  className = '',
}: {
  title: string
  children: React.ReactNode
  seeMore?: string
  onSeeMore?: () => void
  className?: string
}) {
  return (
    <div className={`amazon-deal-card ${className}`}>
      <h2 className="amazon-deal-card__title">{title}</h2>
      <div className="amazon-deal-card__body">{children}</div>
      {seeMore && onSeeMore && (
        <button type="button" className="amazon-see-more" onClick={onSeeMore}>
          {seeMore}
        </button>
      )}
    </div>
  )
}

function JobMiniTile({
  job,
  t,
  variant = 'mini',
}: {
  job: ListingWithImages
  t: (key: TranslationKey) => string
  variant?: 'mini' | 'card'
}) {
  const image = getListingDisplayImage(job, 400)

  const go = () => navigateTo(`/listing/${job.id}`)

  if (variant === 'card') {
    return (
      <button type="button" onClick={go} className="product-card text-left">
        <div className="aspect-square overflow-hidden rounded-sm bg-[#f7fafa]">
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-900)]">{job.title}</p>
        <p className="mt-1 text-xs font-bold text-[var(--ink-900)]">
          {job.price != null ? `€${job.price}` : t('listing.contactForPrice')}
        </p>
      </button>
    )
  }

  return (
    <button type="button" onClick={go} className="amazon-mini-tile">
      <div className="amazon-mini-tile__img">
        <img src={image} alt="" loading="lazy" />
      </div>
      <span className="amazon-mini-tile__label line-clamp-2">{job.title}</span>
    </button>
  )
}

function ProMiniTile({
  pro,
  t,
}: {
  pro: HomeProfessional
  t: (key: TranslationKey) => string
}) {
  const avatar = pro.profile_photo || pro.avatar_url || null
  const name = formatProfessionalCardTitle(pro, t('professional.defaultName'))
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <button
      type="button"
      onClick={() => navigateTo(`/professional/${pro.id}`)}
      className="amazon-mini-tile"
    >
      <div className="amazon-mini-tile__img">
        {avatar ? (
          <img src={avatar} alt="" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[#f7fafa] text-lg font-bold text-[var(--ink-500)]">
            {initials || '?'}
          </span>
        )}
      </div>
      <span className="amazon-mini-tile__label line-clamp-2">{name}</span>
      {pro.location && (
        <span className="text-[10px] text-[var(--ink-500)]">{listingCityLabel(pro.location)}</span>
      )}
    </button>
  )
}

function LoadingText({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-[var(--ink-500)]">{text}</p>
}
