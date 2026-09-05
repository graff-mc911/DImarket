import { useEffect, useState } from 'react'
import { ExternalLink, Flag, Heart, MessageSquare, Search } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { applyPageSeo } from '../../lib/pageSeo'
import {
  fetchManufacturerBySlug,
  fetchMyAgent,
  fetchOpportunitiesForManufacturer,
  isCommercialFavorite,
  openCommercialMessage,
  reportCommercialEntity,
  toggleCommercialFavorite,
  trackCommercialEvent,
  type ManufacturerProfile,
  type RepresentationOpportunity,
} from '../../lib/commercialAgents'
import { labelForMatchCategory } from '../../lib/commercialAgents/categories'
import { normalizeSpokenLanguageList } from '../../lib/languageDisplay'
import { VerifiedB2BBadge } from '../../components/commercialAgents/VerifiedB2BBadge'
import { MatchScorePanel } from '../../components/commercialAgents/MatchScorePanel'
import { OpportunityCard } from '../../components/commercialAgents/OpportunityCard'
import { calculateAgentManufacturerMatch } from '../../lib/commercialAgents/matchingService'

export function ManufacturerProfilePage({ slug }: { slug: string }) {
  const { t, user, language } = useApp()
  const [item, setItem] = useState<ManufacturerProfile | null>(null)
  const [opps, setOpps] = useState<RepresentationOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [matchPanel, setMatchPanel] = useState<ReturnType<typeof calculateAgentManufacturerMatch> | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const row = await fetchManufacturerBySlug(slug)
      if (cancelled) return
      setItem(row)
      setLoading(false)
      if (row) {
        void trackCommercialEvent('profile_view', user?.id ?? null, 'manufacturer', row.id)
        const published = (await fetchOpportunitiesForManufacturer(row.id)).filter((o) => o.status === 'published')
        if (!cancelled) setOpps(published)
        if (user?.id) {
          setSaved(await isCommercialFavorite(user.id, 'manufacturer', row.id))
          const myAgent = await fetchMyAgent(user.id)
          if (myAgent) setMatchPanel(calculateAgentManufacturerMatch(myAgent, row))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, user?.id])

  useEffect(() => {
    if (!item) return
    return applyPageSeo({
      title: `${item.company_name} | ${t('commercialAgents.title')} | DImarket`,
      description: item.description?.slice(0, 160) || t('commercialAgents.seoDescription'),
      canonicalPath: `/commercial-agents/manufacturers/${item.slug}`,
    })
  }, [item, t])

  if (loading) {
    return <p className="layout-page-gutter py-12 text-sm text-[var(--ink-500)]">{t('commercialAgents.loading')}</p>
  }
  if (!item) {
    return <p className="layout-page-gutter py-12 text-sm text-[var(--ink-500)]">{t('commercialAgents.notFound')}</p>
  }

  const catLabel = (slugValue: string) => labelForMatchCategory(slugValue, language.code)

  const message = () => {
    if (!user) {
      navigateTo('/login?redirect=/commercial-agents/manufacturers/' + slug)
      return
    }
    openCommercialMessage(item.profile_id)
    void trackCommercialEvent('message_started', user.id, 'manufacturer', item.id)
    navigateTo('/messages')
  }

  const favorite = async () => {
    if (!user) {
      navigateTo('/login?redirect=/commercial-agents/manufacturers/' + slug)
      return
    }
    const ok = await toggleCommercialFavorite(user.id, 'manufacturer', item.id, saved)
    if (ok) setSaved(!saved)
  }

  const report = async () => {
    if (!user) return
    const ok = await reportCommercialEntity({
      reporterId: user.id,
      entityType: 'manufacturer',
      entityId: item.id,
      reason: 'other',
      details: 'Reported from profile page',
    })
    setFeedback(ok ? t('commercialAgents.reportSent') : t('commercialAgents.reportFailed'))
  }

  const findAgentsPath = `/commercial-agents/representatives?${new URLSearchParams({
    ...(item.country ? { country: item.country } : {}),
    ...(item.categories[0] ? { category: item.categories[0] } : {}),
  }).toString()}`

  return (
    <div className="page-bg pb-24 lg:pb-12">
      <div className="layout-page-gutter py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#232f3e] text-2xl font-bold text-white">
                {item.logo_url ? (
                  <img src={item.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  item.company_name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-[var(--ink-900)] md:text-3xl">{item.company_name}</h1>
                  <VerifiedB2BBadge status={item.verification_status} kind="manufacturer" t={t} />
                </div>
                <p className="mt-2 text-sm text-[var(--ink-600)]">
                  {[item.country, item.headquarters].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-700)] md:text-base">
              {item.description || t('commercialAgents.noDescription')}
            </p>

            <section className="mt-8 rounded-2xl border border-[var(--line-200)] bg-white p-5">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('commercialAgents.representationBlock')}</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Fact label={t('commercialAgents.countriesAvailable')} value={item.countries_available.join(', ') || item.country} />
                <Fact
                  label={t('commercialAgents.categoriesTitle')}
                  value={item.categories.map(catLabel).join(', ')}
                />
                <Fact label={t('commercialAgents.targetMarkets')} value={item.target_markets.join(', ')} />
                <Fact
                  label={t('commercialAgents.commission')}
                  value={
                    [item.commission_model, item.commission_min != null || item.commission_max != null
                      ? `${item.commission_min ?? '?'}–${item.commission_max ?? '?'}%`
                      : null]
                      .filter(Boolean)
                      .join(' · ') || null
                  }
                />
                <Fact
                  label={t('commercialAgents.agentRequirements')}
                  value={
                    [
                      item.required_experience,
                      item.minimum_experience_years != null
                        ? `${item.minimum_experience_years}+ ${t('commercialAgents.yearsExp')}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || null
                  }
                />
                <Fact
                  label={t('commercialAgents.exclusivity')}
                  value={
                    item.exclusive_representation
                      ? t('commercialAgents.exclusive')
                      : item.non_exclusive_representation
                        ? t('commercialAgents.nonExclusive')
                        : null
                  }
                />
              </dl>
            </section>

            <InfoBlock title={t('commercialAgents.products')} items={item.products} />
            <InfoBlock title={t('commercialAgents.languages')} items={normalizeSpokenLanguageList(item.languages)} />

            {opps.length > 0 ? (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('commercialAgents.openOpportunities')}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {opps.map((o) => (
                    <OpportunityCard key={o.id} item={{ ...o, manufacturer: item }} t={t} />
                  ))}
                </div>
              </section>
            ) : null}

            {item.website ? (
              <a
                href={item.website}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#c45500]"
              >
                {t('commercialAgents.website')} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}

            {item.show_public_contacts ? (
              <div className="mt-4 text-sm text-[var(--ink-700)]">
                {item.contact_person ? <p>{item.contact_person}</p> : null}
                {item.public_email ? <p>{item.public_email}</p> : null}
                {item.public_phone ? <p>{item.public_phone}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-500)]">{t('commercialAgents.contactsPrivate')}</p>
            )}
          </div>

          <aside className="space-y-4">
            {matchPanel ? <MatchScorePanel match={matchPanel} t={t} /> : null}
            <div className="rounded-2xl border border-[var(--line-200)] bg-white p-4">
              <button
                type="button"
                onClick={() => navigateTo(findAgentsPath)}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm"
              >
                <Search className="h-4 w-4" />
                {t('commercialAgents.findAgentsCta')}
              </button>
              <button type="button" onClick={message} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-200)] py-2.5 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" />
                {t('commercialAgents.messageManufacturer')}
              </button>
              <button
                type="button"
                onClick={favorite}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-200)] py-2.5 text-sm font-semibold"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-[#c45500] text-[#c45500]' : ''}`} />
                {saved ? t('commercialAgents.saved') : t('commercialAgents.favorite')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/commercial-agents/opportunities')}
                className="mt-2 flex w-full items-center justify-center rounded-full bg-[#232f3e] py-2.5 text-sm font-semibold text-white"
              >
                {t('commercialAgents.viewOpportunities')}
              </button>
              <button type="button" onClick={report} className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--ink-500)]">
                <Flag className="h-3 w-3" /> {t('commercialAgents.report')}
              </button>
              {feedback ? <p className="mt-2 text-xs text-[var(--ink-600)]">{feedback}</p> : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="rounded-xl bg-[#f7f8fa] px-3 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-500)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--ink-800)]">{value}</dd>
    </div>
  )
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--ink-500)]">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((c) => (
          <span key={c} className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink-700)]">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}
