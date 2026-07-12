// ============================================================
// Home.tsx — Головна сторінка DImarket
// Виправлено: всі видимі тексти винесені через t()
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bot,
  Building2,
  ClipboardList,
  HardHat,
  Megaphone,
  Search,
  Star,
  Users,
} from 'lucide-react'
import { ListingCard } from '../components/ListingCard'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { SponsoredCompanies } from '../components/SponsoredCompanies'
import type { Category, ListingWithImages, Profile } from '../lib/types'
import { LANGUAGES } from '../lib/types'

interface HomeProfessional extends Profile {
  professional_categories?: {
    category_id: string
    category?: Category | null
  }[]
}
import { LaunchCitiesBanner } from '../components/LaunchCitiesBanner'
import { mergeLaunchExampleRequests } from '../lib/launchSeedRequests'
import type { TranslationKey } from '../lib/i18n'
import { buildDisplayCategories, categoryPagePath } from '../lib/siteCategories'
import {
  HOME_FEATURED_WORK_GROUPS,
  homeFeaturedWorkPath,
  homeFeaturedWorkTitle,
} from '../lib/homeFeaturedWorkTypes'

interface PlatformStats {
  professionals: number
  listings: number
  countries: number
}

export function Home() {
  const { language, t } = useApp()

  const [categories, setCategories] = useState<Category[]>([])
  const [professionals, setProfessionals] = useState<HomeProfessional[]>([])
  const [jobs, setJobs] = useState<ListingWithImages[]>([])
  const [stats, setStats] = useState<PlatformStats>({
    professionals: 0,
    listings: 0,
    countries: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadHomeData()
  }, [])

  const tr = (key: string) => t(key as TranslationKey)

  const loadHomeData = async () => {
    setLoading(true)

    try {
      const now = new Date().toISOString()

      const [categoriesResult, professionalsResult, jobsResult, statsResult] =
        await Promise.all([
          supabase
            .from('categories')
            .select('*')
            .is('parent_id', null)
            .order('name')
            .limit(12),

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
            .limit(6),

          supabase
            .from('app_site_stats')
            .select('total_professionals, total_listings_created')
            .eq('id', 1)
            .maybeSingle(),
        ])

      if (categoriesResult.error) console.error('[Home] categories:', categoriesResult.error.message)
      if (professionalsResult.error) console.error('[Home] profiles:', professionalsResult.error.message)
      if (jobsResult.error) console.error('[Home] listings:', jobsResult.error.message)
      if (statsResult.error) console.error('[Home] app_site_stats:', statsResult.error.message)

      setCategories(categoriesResult.data ?? [])
      setProfessionals((professionalsResult.data as HomeProfessional[] | null) ?? [])

      const realJobs = (jobsResult.data as ListingWithImages[] | null) ?? []
      setJobs(
        mergeLaunchExampleRequests(realJobs, (key) => tr(key)),
      )

      const { count: profCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_professional', true)
        .neq('user_role', 'company')

      const { count: listCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setStats({
        professionals: profCount || statsResult.data?.total_professionals || 0,
        listings: listCount || statsResult.data?.total_listings_created || 0,
        countries: LANGUAGES.length,
      })
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (category: Category) => {
    const newKey = `category.name.${category.slug}`
    const newValue = tr(newKey)
    if (newValue !== newKey) return newValue

    const legacyKey = `category.${category.slug}`
    const legacyValue = tr(legacyKey)
    if (legacyValue !== legacyKey) return legacyValue

    return category.name
  }

  const displayCategories = useMemo(
    () => buildDisplayCategories(categories, tr),
    [categories, language, t],
  )

  const [heroSearch, setHeroSearch] = useState('')

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = heroSearch.trim()
    if (!query) {
      navigateTo('/listings')
      return
    }
    navigateTo('/listings?search=' + encodeURIComponent(query))
  }

  return (
    <div className="home-page">
      <section className="pb-4 pt-2">
        <div className="layout-page-content">
          <div className="trust-card p-6 md:p-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-verified)]">
              {t('home.globalEyebrow')}
            </p>
            <h1 className="mt-3 text-center text-2xl font-bold tracking-tight text-[var(--ink-900)] md:text-4xl">
              {t('home.heroTrustTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-7 text-[var(--ink-700)]">
              {t('home.heroTrustSubtitle')}
            </p>

            <form
              onSubmit={handleHeroSearch}
              className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="input-hero h-12 pl-12 text-base"
                />
              </div>
              <button type="submit" className="btn-primary h-12 shrink-0 px-8">
                {t('home.search')}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('/assistant/job')}
                className="btn-outline px-4 py-2 text-sm"
              >
                <Bot className="h-4 w-4" />
                {t('header.aiAssistant')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/professionals')}
                className="btn-ghost text-sm"
              >
                {t('home.findProfessionals')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {!loading && (stats.professionals > 0 || stats.listings > 0) && (
              <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-[var(--glass-border)] pt-5">
                <StatPill
                  icon={<Users className="h-4 w-4" />}
                  value={stats.professionals}
                  label={t('home.statsProfessionals')}
                />
                <StatPill
                  icon={<ClipboardList className="h-4 w-4" />}
                  value={stats.listings}
                  label={t('home.statsListings')}
                />
                <StatPill
                  icon={<Star className="h-4 w-4" />}
                  value={0}
                  label={t('home.statsTrust')}
                  staticText="4.8"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <LaunchCitiesBanner />

      <section className="pt-2 pb-6">
        <div className="layout-page-content">
          <SectionHeader
            title={t('home.popularCategoriesTitle')}
            buttonText={t('home.browseRequests')}
            onClick={() => navigateTo('/listings')}
          />

          {loading ? (
            <LoadingBlock text={t('home.loading')} />
          ) : displayCategories.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayCategories.slice(0, 6).map((category) => (
                <CategoryCard
                  key={category.id}
                  name={getCategoryName(category)}
                  icon={category.icon || '•'}
                  onClick={() => navigateTo(categoryPagePath(category.slug))}
                />
              ))}
              {HOME_FEATURED_WORK_GROUPS.slice(0, 2).map((feat) => (
                <CategoryCard
                  key={feat.groupSlug}
                  name={homeFeaturedWorkTitle(feat, t, language.code)}
                  icon={feat.icon}
                  onClick={() => navigateTo(homeFeaturedWorkPath(feat.groupSlug))}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noCategories')} />
          )}
        </div>
      </section>

      <section className="pb-6">
        <div className="layout-page-content">
          <h2 className="text-center text-xl font-bold text-[var(--ink-900)] md:text-2xl">
            {t('home.howItWorksTitle')}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <HowItWorksStep
              step="1"
              title={t('home.howStep1Title')}
              text={t('home.howStep1Text')}
            />
            <HowItWorksStep
              step="2"
              title={t('home.howStep2Title')}
              text={t('home.howStep2Text')}
            />
            <HowItWorksStep
              step="3"
              title={t('home.howStep3Title')}
              text={t('home.howStep3Text')}
            />
          </div>
        </div>
      </section>

      <section className="pb-6">
        <div className="layout-page-content">
          <SectionHeader
            title={t('home.popularProsTitle')}
            buttonText={t('home.allPros')}
            onClick={() => navigateTo('/professionals')}
          />

          {loading ? (
            <LoadingBlock text={t('home.loading')} />
          ) : professionals.length > 0 ? (
            <div className="home-pros-grid">
              {professionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  compact
                  showStatusBadges
                  emptyBioLabel={t('home.noBio')}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noProfessionals')} />
          )}
        </div>
      </section>

      <div className="layout-page-content">
        <MobileAdBanner variant="horizontal" page="home" inlineIndex={1} />
      </div>

      <SponsoredCompanies />

      <MobileAdBanner variant="inline" page="home" inlineIndex={2} />

      <section className="py-6">
        <div className="layout-page-content">
          <SectionHeader
            title={t('home.freshRequestsTitle')}
            buttonText={t('home.allRequests')}
            onClick={() => navigateTo('/listings')}
          />

          {loading ? (
            <LoadingBlock text={t('home.loading')} />
          ) : jobs.length > 0 ? (
            <div className="listing-feed overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white">
              {jobs.map((job, index) => (
                <ListingCard
                  key={job.id}
                  listing={job}
                  isLast={index === jobs.length - 1}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noJobs')} />
          )}
        </div>
      </section>

      <MobileAdBanner variant="inline" page="home" inlineIndex={3} />

      <section className="pb-8 pt-2">
        <div className="layout-page-content">
          <div className="trust-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <p className="text-sm font-semibold text-[var(--ink-900)]">{t('home.audienceTitle')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigateTo('/for-professionals')} className="btn-secondary px-4 py-2 text-xs">
                <HardHat className="h-4 w-4" />
                {t('home.audienceProfessional')}
              </button>
              <button type="button" onClick={() => navigateTo('/for-companies')} className="btn-secondary px-4 py-2 text-xs">
                <Building2 className="h-4 w-4" />
                {t('home.audienceCompany')}
              </button>
              <button type="button" onClick={() => navigateTo('/for-advertisers')} className="btn-ghost px-3 py-2 text-xs">
                <Megaphone className="h-4 w-4" />
                {t('home.audienceAdvertiser')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatPill({
  icon,
  value,
  label,
  staticText,
}: {
  icon: React.ReactNode
  value: number
  label: string
  staticText?: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[var(--ink-600)]">
      <span className="text-[var(--brand-primary)] [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      <span className="text-sm font-extrabold text-[var(--ink-900)]">
        {staticText ?? (value > 0 ? `${value.toLocaleString()}+` : '—')}
      </span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function HowItWorksStep({
  step,
  title,
  text,
}: {
  step: string
  title: string
  text: string
}) {
  return (
    <div className="trust-card p-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--brand-primary)]">
        {step}
      </div>
      <h3 className="mt-3 text-base font-bold text-[var(--ink-900)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{text}</p>
    </div>
  )
}

function CategoryCard({
  name,
  icon,
  onClick,
}: {
  name: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="trust-card group flex w-full items-center gap-3 p-4 text-left transition duration-200 hover:border-[var(--line-strong)]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--accent-soft)] text-lg text-[var(--brand-primary)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-[var(--ink-900)] transition group-hover:text-[var(--brand-primary)]">
          {name}
        </h3>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-500)] transition group-hover:text-[var(--brand-primary)]" />
    </button>
  )
}

function SectionHeader({
  title,
  buttonText,
  onClick,
}: {
  title: string
  buttonText: string
  onClick: () => void
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-[var(--font-display)] text-[1.35rem] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--ink-900)] md:text-[1.6rem]">
          {title}
        </h2>
      </div>

      <button
        onClick={onClick}
        type="button"
        className="btn-ghost self-start rounded-full px-0 text-sm sm:self-auto"
      >
        {buttonText}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="glass-card p-8 text-center text-[var(--ink-500)]">
      {text}
    </div>
  )
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="glass-card p-8 text-center text-[var(--ink-500)]">
      {text}
    </div>
  )
}
