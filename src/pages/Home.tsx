// ============================================================
// Home.tsx — Головна сторінка DImarket
// Виправлено: всі видимі тексти винесені через t()
// ============================================================

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Clock3,
  ClipboardList,
  MapPin,
  MessageCircle,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  Zap,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { AdBanner } from '../components/AdBanner'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { SponsoredCompanies } from '../components/SponsoredCompanies'
import type { Category, ListingWithImages, Profile } from '../lib/types'
import type { TranslationKey } from '../lib/i18n'

interface PlatformStats {
  professionals: number
  listings: number
  countries: number
}

export function Home() {
  const { currency, language, t } = useApp()

  const [categories, setCategories] = useState<Category[]>([])
  const [professionals, setProfessionals] = useState<Profile[]>([])
  const [jobs, setJobs] = useState<ListingWithImages[]>([])
  const [stats, setStats] = useState<PlatformStats>({
    professionals: 0,
    listings: 0,
    countries: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
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
            .limit(8),

          supabase
            .from('profiles')
            .select('*')
            .eq('is_professional', true)
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
      setProfessionals(professionalsResult.data ?? [])
      setJobs((jobsResult.data as ListingWithImages[] | null) ?? [])

      const { count: profCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_professional', true)

      const { count: listCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      setStats({
        professionals: profCount || statsResult.data?.total_professionals || 0,
        listings: listCount || statsResult.data?.total_listings_created || 0,
        countries: 24,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const params = new URLSearchParams()

    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (locationQuery.trim()) params.set('location', locationQuery.trim())

    const query = params.toString()
    navigateTo(query ? `/listings?${query}` : '/listings')
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

  const getCategoryDescription = (category: Category) => {
    const legacyKey = `category.${category.slug}Desc`
    const legacyValue = tr(legacyKey)

    if (legacyValue !== legacyKey) return legacyValue

    return category.description || t('home.unknownCategory')
  }

  const getListingCategoryName = (job: ListingWithImages) => {
    if (!job.category) return t('home.unknownCategory')
    return getCategoryName(job.category)
  }

  return (
    <div className="page-bg min-h-screen pb-24 lg:pb-8">
      <div className="w-full px-4 md:px-6 xl:px-8 2xl:px-10">
        <div className="flex items-stretch gap-6">

          <aside className="hidden w-[260px] shrink-0 self-stretch xl:flex xl:flex-col 2xl:w-[300px]">
            <AdBanner position="left" sticky={false} page="home" stackCount={6} />
          </aside>

          <main className="min-w-0 flex-1">
      <section className="pb-6 pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="glass-panel fade-rise p-6 md:p-7 xl:p-8">
            <div className="eyebrow">
              <ShieldCheck className="h-4 w-4" />
              <span>{t('home.globalEyebrow')}</span>
            </div>

            <div className="mt-5 max-w-3xl">
              <h1 className="font-[var(--font-display)] text-[1.72rem] font-bold leading-[1.08] tracking-[-0.035em] text-[var(--ink-900)] md:text-[2.02rem] xl:text-[2.3rem]">
                {t('home.heroSimpleTitle')}
              </h1>
              <p className="muted-text mt-4 max-w-2xl text-[14px] md:text-[15px]">
                {t('home.heroSimpleDescription')}
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="mt-7 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_166px]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.whatNeedsToBeDone')}
                  className="input-glass h-[50px] pl-11"
                />
              </div>

              <div className="relative">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder={t('home.cityOrCountry')}
                  className="input-glass h-[50px] pl-11"
                />
              </div>

              <button type="submit" className="btn-primary h-[50px] rounded-full px-5 text-sm">
                {t('listings.findRequests')}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                onClick={() => navigateTo('/create-ad')}
                type="button"
                className="btn-primary rounded-full px-5 text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                {t('header.createAd')}
              </button>

              <button
                onClick={() => navigateTo('/professionals')}
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-700)] transition hover:text-[var(--ink-900)]"
              >
                <span>{t('home.findProfessionals')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigateTo('/listings')}
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-700)] transition hover:text-[var(--accent-700)]"
              >
                <span>{t('home.browseRequests')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigateTo(`/listings?category=${category.slug}`)}
                  type="button"
                  className="stat-chip text-[13px]"
                >
                  {getCategoryName(category)}
                </button>
              ))}
            </div>

            {!loading && (stats.professionals > 0 || stats.listings > 0) && (
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--glass-border)] pt-5">
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
      </section>

      <MobileAdBanner variant="horizontal" page="home" />

      <SponsoredCompanies />

      <section className="py-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t('home.howItWorksTitle')}
            text={t('home.howItWorksText')}
            buttonText={t('register.createAccount')}
            onClick={() => navigateTo('/register')}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <HowItWorksCard
              number="01"
              icon={<UserRound className="h-6 w-6" />}
              title={t('home.howStep1Title')}
              text={t('home.howStep1Text')}
            />
            <HowItWorksCard
              number="02"
              icon={<Search className="h-6 w-6" />}
              title={t('home.howStep2Title')}
              text={t('home.howStep2Text')}
            />
            <HowItWorksCard
              number="03"
              icon={<MessageCircle className="h-6 w-6" />}
              title={t('home.howStep3Title')}
              text={t('home.howStep3Text')}
            />
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t('home.popularCategoriesTitle')}
            text={t('home.popularCategoriesText')}
            buttonText={t('home.browseRequests')}
            onClick={() => navigateTo('/listings')}
          />

          {loading ? (
            <LoadingBlock text={t('home.loading')} />
          ) : categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigateTo(`/listings?category=${category.slug}`)}
                  type="button"
                  className="glass-card group p-5 text-left transition duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--glass-border)] bg-[rgba(255,248,241,0.34)] text-xl text-[var(--accent-700)]">
                      {category.icon || '•'}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-500)] transition group-hover:text-[var(--accent-700)]" />
                  </div>

                  <h3 className="mt-4 text-[1rem] font-bold tracking-[-0.02em] text-[var(--ink-900)] transition group-hover:text-[var(--accent-700)]">
                    {getCategoryName(category)}
                  </h3>

                  <p className="muted-text mt-3 text-[13px]">
                    {getCategoryDescription(category)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noCategories')} />
          )}
        </div>
      </section>

      <MobileAdBanner variant="inline" page="home" />

      <section className="py-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t('home.freshRequestsTitle')}
            text={t('home.freshRequestsText')}
            buttonText={t('home.allRequests')}
            onClick={() => navigateTo('/listings')}
          />

          {loading ? (
            <LoadingBlock text={t('home.loading')} />
          ) : jobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <HomeJobCard
                  key={job.id}
                  job={job}
                  categoryLabel={getListingCategoryName(job)}
                  currencySymbol={currency.symbol}
                  locale={language.code}
                  budgetLabel={t('home.budgetLabel')}
                  activeLabel={t('home.activeLabel')}
                  noBudgetLabel={t('listing.contactForPrice')}
                  noLocationLabel={t('home.noLocation')}
                  unknownCategoryLabel={t('home.unknownCategory')}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noJobs')} />
          )}
        </div>
      </section>

      <section className="pb-14 pt-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={t('home.popularProsTitle')}
            text={t('home.popularProsText')}
            buttonText={t('home.allPros')}
            onClick={() => navigateTo('/professionals')}
          />

          {loading ? (
            <LoadingBlock text={t('home.loading')} />
          ) : professionals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {professionals.map((professional) => (
                <ProfessionalPreviewCard
                  key={professional.id}
                  professional={professional}
                  noBioLabel={t('home.noBio')}
                  defaultNameLabel={t('professional.defaultName')}
                  globalLabel={t('professional.global')}
                  newLabel={t('professional.new')}
                  reviewLabel={t('professional.reviews')}
                  actionLabel={t('professional.contact')}
                  featuredLabel={t('professional.featured')}
                  verifiedLabel={t('professional.verified')}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock text={t('home.noProfessionals')} />
          )}
        </div>
      </section>
          </main>

          <aside className="hidden w-[260px] shrink-0 self-stretch xl:flex xl:flex-col 2xl:w-[300px]">
            <AdBanner position="right" sticky={false} page="home" stackCount={6} />
          </aside>
        </div>
      </div>

      <MobileAdBanner variant="sticky" page="home" />
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
    <div className="flex items-center gap-2" style={{ color: 'var(--ink-600)' }}>
      <span style={{ color: 'var(--accent-600)' }}>{icon}</span>
      <span className="text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
        {value > 0 ? `${value.toLocaleString()}+` : '—'}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  )
}

function HowItWorksCard({
  number,
  icon,
  title,
  text,
}: {
  number: string
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
          style={{
            background: 'rgba(199,138,96,0.14)',
            color: 'var(--accent-700)',
          }}
        >
          {icon}
        </div>

        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--ink-400)' }}
        >
          {number}
        </span>
      </div>

      <h3
        className="text-base font-extrabold tracking-[-0.02em]"
        style={{ color: 'var(--ink-900)' }}
      >
        {title}
      </h3>

      <p className="muted-text mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  )
}

function SectionHeader({
  title,
  text,
  buttonText,
  onClick,
}: {
  title: string
  text: string
  buttonText: string
  onClick: () => void
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-[var(--font-display)] text-[1.35rem] font-bold leading-[1.08] tracking-[-0.03em] text-[var(--ink-900)] md:text-[1.6rem]">
          {title}
        </h2>
        <p className="muted-text mt-2 max-w-2xl text-[13px] md:text-[14px]">
          {text}
        </p>
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

function HomeJobCard({
  job,
  categoryLabel,
  currencySymbol,
  locale,
  budgetLabel,
  activeLabel,
  noBudgetLabel,
  noLocationLabel,
  unknownCategoryLabel,
}: {
  job: ListingWithImages
  categoryLabel: string
  currencySymbol: string
  locale: string
  budgetLabel: string
  activeLabel: string
  noBudgetLabel: string
  noLocationLabel: string
  unknownCategoryLabel: string
}) {
  const createdLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(job.created_at))

  const budgetValue = job.price
    ? `${currencySymbol}${job.price.toLocaleString()}`
    : noBudgetLabel

  const primaryImage = job.images?.[0]?.image_url || null

  return (
    <button
      onClick={() => navigateTo(`/listing/${job.id}`)}
      type="button"
      className="glass-card group overflow-hidden p-5 text-left transition duration-300 hover:-translate-y-1"
    >
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={job.title}
          className="mb-4 h-44 w-full rounded-[20px] object-cover"
        />
      ) : (
        <div className="mb-4 flex h-44 w-full items-center justify-center rounded-[20px] border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(255,248,241,0.72),rgba(244,210,180,0.46))] text-[var(--accent-700)]">
          <ClipboardList className="h-10 w-10" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-[var(--glass-border)] bg-[rgba(255,252,248,0.38)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-700)]">
            {categoryLabel || unknownCategoryLabel}
          </span>

          <h3 className="mt-4 line-clamp-2 text-[0.98rem] font-bold tracking-[-0.02em] text-[var(--ink-900)] transition group-hover:text-[var(--accent-700)] md:text-[1.02rem]">
            {job.title}
          </h3>
        </div>

        <span className="shrink-0 rounded-full border border-[rgba(111,145,125,0.18)] bg-[rgba(111,145,125,0.08)] px-3 py-1 text-[10px] font-semibold text-[#4d755e]">
          {activeLabel}
        </span>
      </div>

      <p className="muted-text mt-3 line-clamp-3 text-[13px]">
        {job.description}
      </p>

      <div className="mt-4 space-y-2 text-[13px] text-[var(--ink-700)]">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--accent-700)]" />
          <span>{job.location || noLocationLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[var(--accent-700)]" />
          <span>{createdLabel}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--glass-border)] pt-4">
        <span className="text-[13px] text-[var(--ink-500)]">
          {budgetLabel}
        </span>
        <span className="text-[15px] font-bold text-[var(--ink-900)]">
          {budgetValue}
        </span>
      </div>
    </button>
  )
}

function ProfessionalPreviewCard({
  professional,
  noBioLabel,
  defaultNameLabel,
  globalLabel,
  newLabel,
  reviewLabel,
  actionLabel,
  featuredLabel,
  verifiedLabel,
}: {
  professional: Profile
  noBioLabel: string
  defaultNameLabel: string
  globalLabel: string
  newLabel: string
  reviewLabel: string
  actionLabel: string
  featuredLabel: string
  verifiedLabel: string
}) {
  const initials = getInitials(professional.full_name)
  const ratingLabel = professional.rating > 0 ? professional.rating.toFixed(1) : newLabel
  const avatarUrl = professional.profile_photo || professional.avatar_url || null
  const isVerified = professional.is_verified === true
  const isFeatured = professional.is_featured === true

  return (
    <div className="glass-card p-5 transition duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={professional.full_name || defaultNameLabel}
              className="h-14 w-14 shrink-0 rounded-[18px] object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-[var(--glass-border)] bg-[rgba(255,248,241,0.42)] text-base font-bold text-[var(--accent-700)]">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[0.98rem] font-bold tracking-[-0.02em] text-[var(--ink-900)] md:text-[1rem]">
                {professional.full_name || defaultNameLabel}
              </h3>

              {isVerified && (
                <ShieldCheck
                  className="h-3.5 w-3.5 shrink-0 text-[#15803d]"
                  aria-label={verifiedLabel}
                />
              )}
            </div>

            <p className="mt-1 text-[13px] text-[var(--ink-500)]">
              {professional.location || globalLabel}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[rgba(255,252,248,0.38)] px-3 py-1 text-[13px] font-semibold text-[#8c6728]">
          <Star className="h-4 w-4 fill-current" />
          <span>{ratingLabel}</span>
        </div>
      </div>

      {isFeatured && (
        <div
          className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            background: 'rgba(99,102,241,0.12)',
            color: '#6366f1',
          }}
        >
          <Zap className="h-3 w-3" />
          {featuredLabel}
        </div>
      )}

      <p className="muted-text mt-4 line-clamp-3 text-[13px]">
        {professional.bio || noBioLabel}
      </p>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-500)]">
          <UserRound className="h-4 w-4 text-[var(--accent-700)]" />
          <span>
            {professional.total_reviews} {reviewLabel}
          </span>
        </div>

        <button
          onClick={() => navigateTo(`/professional/${professional.id}`)}
          type="button"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--accent-700)] transition hover:text-[var(--ink-900)]"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
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

function getInitials(fullName: string | null): string {
  if (!fullName) return 'DI'

  const parts = fullName.trim().split(/\s+/).slice(0, 2)

  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'DI'
}