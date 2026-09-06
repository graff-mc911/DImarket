import { useEffect, useState } from 'react'
import { Flag, Heart } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { applyPageSeo } from '../../lib/pageSeo'
import { normalizeSpokenLanguageList } from '../../lib/languageDisplay'
import {
  applyToOpportunity,
  calculateOpportunityAgentMatch,
  fetchMyAgent,
  fetchOpportunityById,
  isCommercialFavorite,
  openCommercialMessage,
  reportCommercialEntity,
  toggleCommercialFavorite,
  trackCommercialEvent,
  type RepresentationOpportunity,
} from '../../lib/commercialAgents'
import { labelForMatchCategory } from '../../lib/commercialAgents/categories'
import { MatchScorePanel } from '../../components/commercialAgents/MatchScorePanel'

export function OpportunityDetailPage({ id }: { id: string }) {
  const { t, user, language } = useApp()
  const [item, setItem] = useState<RepresentationOpportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [match, setMatch] = useState<ReturnType<typeof calculateOpportunityAgentMatch> | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const row = await fetchOpportunityById(id)
      if (cancelled) return
      setItem(row)
      setLoading(false)
      if (row) {
        void trackCommercialEvent('opportunity_view', user?.id ?? null, 'opportunity', row.id)
        if (user?.id) {
          setSaved(await isCommercialFavorite(user.id, 'opportunity', row.id))
          const agent = await fetchMyAgent(user.id)
          if (agent) setMatch(calculateOpportunityAgentMatch(agent, row))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, user?.id])

  useEffect(() => {
    if (!item) return
    return applyPageSeo({
      title: `${item.title} | ${t('commercialAgents.title')} | DImarket`,
      description: item.description.slice(0, 160),
      canonicalPath: `/commercial-agents/opportunities/${item.id}`,
    })
  }, [item, t])

  if (loading) {
    return <p className="layout-page-gutter py-12 text-sm text-[var(--ink-500)]">{t('commercialAgents.loading')}</p>
  }
  if (!item) {
    return <p className="layout-page-gutter py-12 text-sm text-[var(--ink-500)]">{t('commercialAgents.notFound')}</p>
  }

  const mfr = item.manufacturer

  const apply = async () => {
    if (!user) {
      navigateTo(`/login?redirect=/commercial-agents/opportunities/${id}`)
      return
    }
    setBusy(true)
    const agent = await fetchMyAgent(user.id)
    if (!agent) {
      setFeedback(t('commercialAgents.needAgentProfile'))
      setBusy(false)
      return
    }
    if (!mfr) {
      setFeedback(t('commercialAgents.notFound'))
      setBusy(false)
      return
    }
    const { error } = await applyToOpportunity({
      opportunityId: item.id,
      agentId: agent.id,
      manufacturerId: item.manufacturer_id,
      manufacturerProfileId: mfr.profile_id,
      message: message || t('commercialAgents.defaultApplyMessage'),
    })
    setBusy(false)
    setFeedback(error ? error : t('commercialAgents.applySent'))
  }

  return (
    <div className="page-bg pb-24 lg:pb-12">
      <div className="layout-page-gutter py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">
              {mfr?.company_name ?? t('commercialAgents.manufacturer')}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-[var(--ink-900)] md:text-3xl">{item.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-700)] md:text-base">
              {item.description}
            </p>

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <Fact label={t('commercialAgents.country')} value={item.target_country} />
              <Fact label={t('commercialAgents.category')} value={item.category ? labelForMatchCategory(item.category, language.code) : null} />
              <Fact label={t('commercialAgents.commission')} value={item.commission_range} />
              <Fact
                label={t('commercialAgents.exclusivity')}
                value={item.exclusive ? t('commercialAgents.exclusive') : t('commercialAgents.nonExclusive')}
              />
              <Fact label={t('commercialAgents.contractType')} value={item.contract_type} />
              <Fact
                label={t('commercialAgents.remote')}
                value={item.remote_possible ? t('commercialAgents.yes') : t('commercialAgents.no')}
              />
            </dl>

            {item.required_languages.length ? (
              <p className="mt-4 text-sm text-[var(--ink-700)]">
                <span className="font-semibold">{t('commercialAgents.languages')}:</span>{' '}
                {normalizeSpokenLanguageList(item.required_languages).join(', ')}
              </p>
            ) : null}
            {item.minimum_requirements ? (
              <p className="mt-4 text-sm text-[var(--ink-700)]">
                <span className="font-semibold">{t('commercialAgents.requirements')}:</span> {item.minimum_requirements}
              </p>
            ) : null}

            {mfr ? (
              <button
                type="button"
                className="mt-6 text-sm font-semibold text-[#c45500]"
                onClick={() => navigateTo(`/commercial-agents/manufacturers/${mfr.slug}`)}
              >
                {t('commercialAgents.viewManufacturer')} →
              </button>
            ) : null}
          </div>

          <aside className="space-y-4">
            {match ? <MatchScorePanel match={match} t={t} /> : null}
            <div className="rounded-none border border-[var(--line-200)] bg-white/95 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                {t('commercialAgents.apply')}
              </label>
              <textarea
                className="mt-1.5 w-full rounded-none border border-[rgba(148,163,184,0.35)] bg-white p-3 text-sm outline-none"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('commercialAgents.applyPlaceholder')}
              />
              <button
                type="button"
                disabled={busy}
                onClick={apply}
                className="btn-primary mt-2 w-full rounded-full py-2.5 text-sm disabled:opacity-60"
              >
                {t('commercialAgents.apply')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!user) return
                  const ok = await toggleCommercialFavorite(user.id, 'opportunity', item.id, saved)
                  if (ok) setSaved(!saved)
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-200)] py-2.5 text-sm font-semibold"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-[#c45500] text-[#c45500]' : ''}`} />
                {saved ? t('commercialAgents.saved') : t('commercialAgents.favorite')}
              </button>
              {mfr ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) return
                    openCommercialMessage(mfr.profile_id)
                    navigateTo('/messages')
                  }}
                  className="mt-2 w-full rounded-full bg-[#232f3e] py-2.5 text-sm font-semibold text-white"
                >
                  {t('commercialAgents.messageManufacturer')}
                </button>
              ) : null}
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--ink-500)]"
                onClick={async () => {
                  if (!user) return
                  const ok = await reportCommercialEntity({
                    reporterId: user.id,
                    entityType: 'opportunity',
                    entityId: item.id,
                    reason: 'other',
                  })
                  setFeedback(ok ? t('commercialAgents.reportSent') : t('commercialAgents.reportFailed'))
                }}
              >
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
    <div className="rounded-none border border-[var(--line-200)] bg-white/80 px-3 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-500)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--ink-800)]">{value}</dd>
    </div>
  )
}
