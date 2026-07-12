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
import { CategoryCircleTile } from '../components/CategoryCircleTile'
import { ListingCard } from '../components/ListingCard'
import { LAUNCH_MARKETS } from '../lib/launchMarkets'
import { buildHomeCategoryGroups } from '../lib/homeCategoryTiles'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { MobileAdBanner } from '../components/MobileAdBanner'
import type { Category, ListingWithImages, Profile } from '../lib/types'
import { LANGUAGES } from '../lib/types'

interface HomeProfessional extends Profile {
  professional_categories?: {
    category_id: string
    category?: Category | null
  }[]
}
import { LaunchCitiesBanner } from '../components/LaunchCitiesBanner'
import { isLaunchExampleListing, getLaunchExampleTitleKey, mergeLaunchExampleRequests } from '../lib/launchSeedRequests'
import type { TranslationKey } from '../lib/i18n'

interface PlatformStats {
  professionals: number
  listings: number
  countries: number
}

export function Home() {
  const { language, t } = useApp()
  const categoryGroups = useMemo(
    () => buildHomeCategoryGroups(language.code, t),
    [language.code, t],
  )

  const [professionals, setProfessionals] = useState<HomeProfessional[]>([])
  const [rawJobs, setRawJobs] = useState<ListingWithImages[]>([])
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

  useEffect(() => {
    setJobs(mergeLaunchExampleRequests(rawJobs, (key) => t(key as TranslationKey)))
  }, [rawJobs, language.code, t])

  const loadHomeData = async () => {
    setLoading(true)

    try {
      const now = new Date().toISOString()

      const [professionalsResult, jobsResult, statsResult] =
        await Promise.all([
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

      if (professionalsResult.error) console.error('[Home] profiles:', professionalsResult.error.message)
      if (jobsResult.error) console.error('[Home] listings:', jobsResult.error.message)
      if (statsResult.error) console.error('[Home] app_site_stats:', statsResult.error.message)

      setProfessionals((professionalsResult.data as HomeProfessional[] | null) ?? [])

      const realJobs = (jobsResult.data as ListingWithImages[] | null) ?? []
      setRawJobs(realJobs)

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

  const [heroCity] = useState(LAUNCH_MARKETS[0]?.city ?? 'Darmstadt')

  return (
    <div className="home-page">
      {/* Amazon-style hero banner */}
      <section className="pb-4 pt-3">
        <div className="layout-page-content">
          <div className="amazon-section-card overflow-hidden bg-gradient-to-r from-[#232f3e] to-[#37475a] p-6 text-white md:p-8">
            <h1 className="text-xl font-bold md:text-3xl">
              {t('home.heroTrustTitle')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#dddddd] md:text-base">
              {t('home.heroTrustSubtitle')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => navigateTo('/listings')} className="btn-primary px-5 py-2 text-sm">
                {t('home.search')}
              </button>
              <button type="button" onClick={() => navigateTo('/create-ad')} className="btn-secondary px-5 py-2 text-sm">
                {t('home.postJobFree')}
              </button>
              <button type="button" onClick={() => navigateTo('/assistant/job')} className="btn-outline px-5 py-2 text-sm">
                <Bot className="h-4 w-4" />
                {t('home.heroAiCta')}
              </button>
            </div>
            <p className="mt-4 text-sm text-[#cccccc]">
              <Star className="mr-1 inline h-4 w-4 fill-[#ffa41c] text-[#ffa41c]" />
              {t('home.heroSocialProof')
                .replace('{rating}', '4.8')
                .replace('{pros}', stats.professionals > 0 ? `${stats.professionals}+` : '120+')}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-6">
        <div className="layout-page-content">
          <div className="amazon-section-card">
            <h2 className="mb-4 text-lg font-bold text-[var(--ink-900)]">
              {t('home.allCategoriesTitle')}
            </h2>
            <div className="flex flex-col gap-6">
              {categoryGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--ink-500)]">
                    {t(group.titleKey)}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {group.tiles.map((tile) => (
                      <CategoryCircleTile
                        key={tile.id}
                        icon={tile.icon}
                        label={tile.label}
                        onClick={() => navigateTo(tile.path)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28 pb-6">
        <div className="layout-page-content">
          <div className="amazon-section-card">
            <h2 className="text-lg font-bold text-[var(--ink-900)] md:text-xl">
              {t('home.howItWorksTitle')}
            </h2>
            <div className="mt-4 flex flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-2">
            <HowItWorksStep
              step="1"
              title={t('home.howStep1Title')}
              text={t('home.howStep1Text')}
              icon={<ClipboardList className="h-5 w-5" />}
            />
            <ArrowRight className="mx-1 hidden h-5 w-5 shrink-0 self-center text-[var(--ink-400)] md:block" />
            <HowItWorksStep
              step="2"
              title={t('home.howStep2Title')}
              text={t('home.howStep2Text')}
              icon={<Search className="h-5 w-5" />}
            />
            <ArrowRight className="mx-1 hidden h-5 w-5 shrink-0 self-center text-[var(--ink-400)] md:block" />
            <HowItWorksStep
              step="3"
              title={t('home.howStep3Title')}
              text={t('home.howStep3Text')}
              icon={<Users className="h-5 w-5" />}
            />
          </div>
          </div>
        </div>
      </section>

      <section className="pb-6">
        <div className="layout-page-content">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="amazon-section-card">
              <SectionHeader
                title={t('home.topProsInCity').replace('{city}', heroCity)}
                buttonText={t('home.allPros')}
                onClick={() => navigateTo('/professionals')}
              />
              {loading ? (
                <LoadingBlock text={t('home.loading')} />
              ) : professionals.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="amazon-section-card">
              <SectionHeader
                title={t('home.recentJobsTitle')}
                buttonText={t('home.allRequests')}
                onClick={() => navigateTo('/listings')}
              />
              {loading ? (
                <LoadingBlock text={t('home.loading')} />
              ) : jobs.length > 0 ? (
                <div className="product-grid mt-3">
                  {jobs.slice(0, 4).map((job) => (
                    <ListingCard key={job.id} listing={job} />
                  ))}
                </div>
              ) : (
                <EmptyBlock text={t('home.noJobs')} />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="layout-page-content pb-6 md:hidden">
        <MobileAdBanner variant="inline" page="home" inlineIndex={1} />
      </div>

      <section className="pb-6 pt-2">
        <div className="layout-page-content">
          <div className="amazon-section-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

      <LaunchCitiesBanner />
    </div>
  )
}

function HowItWorksStep({
  step,
  title,
  text,
  icon,
}: {
  step: string
  title: string
  text: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 items-start gap-3 md:max-w-[15rem] md:flex-col md:items-center md:text-center">
      <div className="flex shrink-0 flex-col items-center gap-2 md:w-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--brand-primary)] bg-[var(--accent-soft)] text-sm font-bold text-[var(--brand-primary)]">
          {step}
        </div>
        {icon && <span className="text-[var(--brand-copper)]">{icon}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[var(--ink-900)]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--ink-600)] md:text-sm md:leading-6">{text}</p>
      </div>
    </div>
  )
}

function CompactJobCard({
  job,
  t,
}: {
  job: ListingWithImages
  t: (key: TranslationKey) => string
}) {
  const isExample = isLaunchExampleListing(job)
  const titleKey = job.id ? getLaunchExampleTitleKey(job.id) : null
  const title =
    titleKey != null ? t(titleKey as TranslationKey) : job.title
  const budget =
    job.price != null
      ? `€${job.price}`
      : t('home.budgetOnRequest')

  return (
    <button
      type="button"
      onClick={() => navigateTo(`/listing/${job.id}`)}
      className="trust-card flex w-full items-center gap-3 p-4 text-left transition hover:border-[var(--line-strong)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--brand-primary)]">
        <Wrench className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--ink-900)]">{title}</p>
        <p className="truncate text-xs text-[var(--ink-500)]">{job.location}</p>
        <p className="mt-0.5 text-xs font-medium text-[var(--brand-primary)]">{budget}</p>
      </div>
      {isExample && (
        <span className="shrink-0 rounded-full bg-[rgba(184,115,51,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-copper)]">
          {t('launch.exampleBadge')}
        </span>
      )}
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--ink-400)]" />
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
