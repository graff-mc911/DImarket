// ============================================================
// Home.tsx — Головна сторінка DImarket
// Виправлено: всі видимі тексти винесені через t()
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  ClipboardList,
  HardHat,
  Megaphone,
  Search,
  ShieldCheck,
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

  return (
    <div className="home-page">
      <section className="pb-3 pt-0">
        <div className="layout-page-content">
          <div className="glass-panel fade-rise rounded-[22px] p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="eyebrow gap-1.5 px-2.5 py-1 text-[11px]">
                <ShieldCheck className="h-3 w-3" />
                <span>{t('home.globalEyebrow')}</span>
              </div>

              <div className="mt-3 max-w-3xl">
                <h1 className="font-[var(--font-display)] text-[1.15rem] font-bold leading-[1.1] tracking-[-0.035em] text-[var(--ink-900)] md:text-[1.35rem] xl:text-[1.5rem]">
                  {t('home.heroSimpleTitle')}
                </h1>
              </div>

              <nav
                className="home-hero__category-chips mt-4 hidden w-full max-w-2xl flex-wrap justify-center gap-2 md:flex"
                aria-label={t('home.popularCategoriesTitle')}
              >
                {displayCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigateTo(categoryPagePath(category.slug))}
                    type="button"
                    className="stat-chip px-2.5 py-1 text-[11px]"
                  >
                    {getCategoryName(category)}
                  </button>
                ))}
                {HOME_FEATURED_WORK_GROUPS.map((feat) => (
                  <button
                    key={feat.groupSlug}
                    onClick={() => navigateTo(homeFeaturedWorkPath(feat.groupSlug))}
                    type="button"
                    className="rounded-full border border-[rgba(99,102,241,0.28)] bg-[rgba(99,102,241,0.08)] px-2.5 py-1 text-[11px] font-semibold text-[#4338ca] transition hover:bg-[rgba(99,102,241,0.14)]"
                  >
                    {homeFeaturedWorkTitle(feat, t, language.code)}
                  </button>
                ))}
              </nav>

              <nav
                className="mt-3 flex w-full max-w-xl flex-wrap justify-center gap-x-5 gap-y-2"
                aria-label={t('footer.platformTitleSimple')}
              >
                <button
                  onClick={() => navigateTo('/professionals')}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-700)] transition hover:text-[var(--ink-900)]"
                >
                  <span>{t('home.findProfessionals')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigateTo('/listings')}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-700)] transition hover:text-[var(--accent-700)]"
                >
                  <span>{t('home.browseRequests')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigateTo('/create-ad')}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-700)] transition hover:text-[var(--accent-700)]"
                >
                  <span>{t('header.createAd')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigateTo('/assistant/job')}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6366f1] transition hover:text-[var(--accent-700)]"
                >
                  <span>{t('header.aiAssistant')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </nav>

              {!loading && (stats.professionals > 0 || stats.listings > 0) && (
                <div className="mt-4 flex w-full flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[var(--glass-border)] pt-4">
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
                    icon={<ShieldCheck className="h-4 w-4" />}
                    value={stats.countries}
                    label={t('home.statsLanguages')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <LaunchCitiesBanner />

      <section className="pb-2 pt-2">
        <div className="layout-page-content">
          <div className="glass-panel rounded-[22px] p-4 md:p-5">
            <h2 className="text-center text-lg font-extrabold text-[var(--ink-900)]">
              {t('home.audienceTitle')}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <AudienceCard
                icon={<HardHat className="h-5 w-5" />}
                title={t('home.audienceProfessional')}
                text={t('home.audienceProfessionalDesc')}
                onClick={() => navigateTo('/for-professionals')}
              />
              <AudienceCard
                icon={<Building2 className="h-5 w-5" />}
                title={t('home.audienceCompany')}
                text={t('home.audienceCompanyDesc')}
                onClick={() => navigateTo('/for-companies')}
              />
              <AudienceCard
                icon={<Megaphone className="h-5 w-5" />}
                title={t('home.audienceAdvertiser')}
                text={t('home.audienceAdvertiserDesc')}
                onClick={() => navigateTo('/for-advertisers')}
              />
            </div>
          </div>
        </div>
      </section>

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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={getCategoryName(category)}
                  icon={category.icon || '•'}
                  onClick={() => navigateTo(categoryPagePath(category.slug))}
                />
              ))}
              {HOME_FEATURED_WORK_GROUPS.map((feat) => (
                <CategoryCard
                  key={feat.groupSlug}
                  name={homeFeaturedWorkTitle(feat, t, language.code)}
                  icon={feat.icon}
                  onClick={() => navigateTo(homeFeaturedWorkPath(feat.groupSlug))}
                  accent="indigo"
                />
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noCategories')} />
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
            <div className="listing-feed overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.42)]">
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

      <section className="pb-14 pt-6">
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

      <MobileAdBanner variant="inline" page="home" inlineIndex={4} />
    </div>
  )
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[var(--ink-600)]">
      <span className="text-[var(--accent-600)] [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>
      <span className="text-sm font-extrabold text-[var(--ink-900)]">
        {value > 0 ? `${value.toLocaleString()}+` : '—'}
      </span>
      <span className="text-xs">{label}</span>
    </div>
  )
}

function CategoryCard({
  name,
  icon,
  onClick,
  accent = 'default',
}: {
  name: string
  icon: string
  onClick: () => void
  accent?: 'default' | 'indigo'
}) {
  const iconWrapClass =
    accent === 'indigo'
      ? 'border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.08)] text-[#4338ca]'
      : 'border border-[var(--glass-border)] bg-[rgba(255,248,241,0.34)] text-[var(--accent-700)]'

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card group flex w-full items-center gap-3 p-3 text-left transition duration-300 hover:-translate-y-0.5"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-base ${iconWrapClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold tracking-[-0.02em] text-[var(--ink-900)] transition group-hover:text-[var(--accent-700)]">
          {name}
        </h3>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--ink-500)] transition group-hover:text-[var(--accent-700)]" />
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

function AudienceCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card group flex h-full flex-col items-start p-4 text-left transition duration-300 hover:-translate-y-0.5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--glass-border)] bg-[rgba(255,248,241,0.5)] text-[var(--accent-700)]">
        {icon}
      </span>
      <h3 className="mt-3 text-base font-extrabold text-[var(--ink-900)]">{title}</h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-[var(--ink-600)]">{text}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-700)]">
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}
