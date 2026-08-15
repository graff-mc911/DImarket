import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, MapPin, Users } from 'lucide-react'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { ListingCard } from '../components/ListingCard'
import { LANGUAGES } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { excludeSuppressedFromQuery, filterSuppressedListings } from '../lib/suppressedListings'
import { filterPublicProfiles } from '../lib/publicProfileVisibility'
import { supabase } from '../lib/supabase'
import { locationMatchesMarket } from '../lib/launchMarkets'
import type { ListingWithImages, Profile } from '../lib/types'
import { priceGuideForMarketTrade } from '../lib/cityPriceGuides'
import {
  parseSeoPath,
  subcategorySlugsForGroup,
  type ParsedSeoRoute,
} from '../lib/seoRoutes'

interface SeoMarketLandingProps {
  parts: string[]
}

export function SeoMarketLanding({ parts }: SeoMarketLandingProps) {
  const { t, setLanguage, language } = useApp()
  const route = useMemo(() => parseSeoPath(parts), [parts])
  const [professionals, setProfessionals] = useState<Profile[]>([])
  const [jobs, setJobs] = useState<ListingWithImages[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!route) return
    const lang = route.locale
    if (language.code !== lang) {
      const match = LANGUAGES.find((l) => l.code === lang)
      if (match) setLanguage(match)
    }
  }, [route, language.code, setLanguage])

  useEffect(() => {
    if (!route) return
    void loadData(route)
  }, [route])

  useEffect(() => {
    if (!route) return
    const tradeLabel = t(route.trade.labelKey)
    document.title = `${tradeLabel} — ${route.market.city} | DImarket`
  }, [route, t])

  const loadData = async (parsed: ParsedSeoRoute) => {
    setLoading(true)
    try {
      const groupSlugs = subcategorySlugsForGroup(parsed.trade.groupSlug)
      const now = new Date().toISOString()

      const [prosResult, jobsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('is_professional', true)
          .in('user_role', ['professional', 'company'])
          .order('created_at', { ascending: false })
          .limit(60),
        excludeSuppressedFromQuery(
          supabase
            .from('listings')
            .select('*, images:listing_images(*), category:categories(*)')
            .eq('listing_type', 'service_request')
            .eq('status', 'active')
            .gte('expires_at', now)
            .order('created_at', { ascending: false })
            .limit(20),
        ),
      ])

      const allPros = filterPublicProfiles((prosResult.data as Profile[] | null) ?? [])
      const allJobs = filterSuppressedListings((jobsResult.data as ListingWithImages[] | null) ?? [])

      setProfessionals(
        allPros
          .filter((p) => locationMatchesMarket(p.location, parsed.market))
          .filter((p) => {
            const subs = p.work_subcategory_slugs ?? []
            if (!groupSlugs.length) return true
            return subs.some(
              (s) => groupSlugs.includes(s) || s.startsWith(`${parsed.trade.groupSlug}-`),
            )
          })
          .slice(0, 8),
      )

      setJobs(
        allJobs
          .filter((j) => locationMatchesMarket(j.location, parsed.market))
          .filter((j) => {
            const subs = j.subcategory_slugs ?? []
            if (!groupSlugs.length) return true
            return subs.some(
              (s) => groupSlugs.includes(s) || s.startsWith(`${parsed.trade.groupSlug}-`),
            )
          })
          .slice(0, 6),
      )
    } finally {
      setLoading(false)
    }
  }

  if (!route) {
    return (
      <div className="layout-page-content py-10 text-center">
        <p className="text-[var(--ink-600)]">{t('seo.notFound')}</p>
        <button type="button" onClick={() => navigateTo('/')} className="btn-primary mt-4 rounded-full">
          {t('listing.backToListings')}
        </button>
      </div>
    )
  }

  const tradeLabel = t(route.trade.labelKey)
  const priceGuide = priceGuideForMarketTrade(route.market.id, route.trade.groupSlug)
  const fill = (template: string) =>
    template
      .replace('{trade}', tradeLabel)
      .replace('{city}', route.market.city)
      .replace('{region}', route.market.region)

  return (
    <div className="py-8 pb-24 lg:pb-8">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]">
          {t('seo.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--ink-900)] md:text-4xl">
          {fill(t('seo.title'))}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-600)]">
          {fill(t('seo.description'))}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateTo('/register?role=professional')}
            className="btn-primary inline-flex items-center gap-2 rounded-full"
          >
            <span>{t('landing.pro.cta')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/assistant/job')}
            className="btn-secondary rounded-full"
          >
            {t('header.postJob')}
          </button>
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-500)]">
          <MapPin className="h-4 w-4 text-[var(--accent-600)]" />
          {route.market.city}, {route.market.region}, {route.market.countryCode}
        </p>
      </section>

      {priceGuide && (
        <section className="mt-6 glass-card p-5 md:p-6">
          <h2 className="text-lg font-extrabold text-[var(--ink-900)]">
            {fill(t('priceGuide.title'))}
          </h2>
          <p className="mt-2 text-2xl font-extrabold text-[var(--accent-700)]">
            €{priceGuide.minEur}–{priceGuide.maxEur}
            <span className="ml-2 text-sm font-semibold text-[var(--ink-500)]">
              {t(priceGuide.unitKey)}
            </span>
          </p>
          <p className="mt-2 text-sm text-[var(--ink-600)]">{t(priceGuide.noteKey)}</p>
          <p className="mt-2 text-xs text-[var(--ink-500)]">{t('priceGuide.disclaimer')}</p>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--accent-600)]" />
          <h2 className="text-xl font-extrabold text-[var(--ink-900)]">
            {fill(t('seo.prosTitle'))}
          </h2>
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center text-[var(--ink-500)]">{t('common.loading')}</div>
        ) : professionals.length > 0 ? (
          <div className="pros-grid--compact">
            {professionals.map((pro) => (
              <ProfessionalCard key={pro.id} professional={pro} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-[var(--ink-600)]">{t('seo.emptyPros')}</p>
            <button
              type="button"
              onClick={() => navigateTo('/for-professionals')}
              className="btn-primary mt-4 rounded-full"
            >
              {t('landing.pro.cta')}
            </button>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-extrabold text-[var(--ink-900)]">
          {fill(t('seo.jobsTitle'))}
        </h2>
        {loading ? null : jobs.length > 0 ? (
          <div className="listing-feed overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.42)]">
            {jobs.map((job, index) => (
              <ListingCard key={job.id} listing={job} isLast={index === jobs.length - 1} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-500)]">{t('seo.emptyJobs')}</p>
        )}
      </section>
    </div>
  )
}
