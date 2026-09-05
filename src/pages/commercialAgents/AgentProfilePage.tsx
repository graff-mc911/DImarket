import { useEffect, useState } from 'react'
import { ExternalLink, Flag, Heart, MessageSquare, Search, Send } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { applyPageSeo } from '../../lib/pageSeo'
import { normalizeSpokenLanguageList } from '../../lib/languageDisplay'
import {
  calculateAgentManufacturerMatch,
  fetchAgentBySlug,
  fetchMyManufacturer,
  inviteAgent,
  isCommercialFavorite,
  openCommercialMessage,
  reportCommercialEntity,
  toggleCommercialFavorite,
  trackCommercialEvent,
  type AgentProfile,
} from '../../lib/commercialAgents'
import { labelForMatchCategory } from '../../lib/commercialAgents/categories'
import { VerifiedB2BBadge } from '../../components/commercialAgents/VerifiedB2BBadge'
import { MatchScorePanel } from '../../components/commercialAgents/MatchScorePanel'

export function AgentProfilePage({ slug }: { slug: string }) {
  const { t, user, language } = useApp()
  const [item, setItem] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [matchPanel, setMatchPanel] = useState<ReturnType<typeof calculateAgentManufacturerMatch> | null>(null)
  const [inviteMsg, setInviteMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const row = await fetchAgentBySlug(slug)
      if (cancelled) return
      setItem(row)
      setLoading(false)
      if (row) {
        void trackCommercialEvent('profile_view', user?.id ?? null, 'agent', row.id)
        if (user?.id) {
          setSaved(await isCommercialFavorite(user.id, 'agent', row.id))
          const mfr = await fetchMyManufacturer(user.id)
          if (mfr) setMatchPanel(calculateAgentManufacturerMatch(row, mfr))
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
      title: `${item.full_name} | ${t('commercialAgents.title')} | DImarket`,
      description: item.description?.slice(0, 160) || t('commercialAgents.seoDescription'),
      canonicalPath: `/commercial-agents/representatives/${item.slug}`,
    })
  }, [item, t])

  if (loading) {
    return <p className="layout-page-gutter py-12 text-sm text-[var(--ink-500)]">{t('commercialAgents.loading')}</p>
  }
  if (!item) {
    return <p className="layout-page-gutter py-12 text-sm text-[var(--ink-500)]">{t('commercialAgents.notFound')}</p>
  }

  const message = () => {
    if (!user) {
      navigateTo('/login?redirect=/commercial-agents/representatives/' + slug)
      return
    }
    openCommercialMessage(item.profile_id)
    void trackCommercialEvent('message_started', user.id, 'agent', item.id)
    navigateTo('/messages')
  }

  const favorite = async () => {
    if (!user) {
      navigateTo('/login?redirect=/commercial-agents/representatives/' + slug)
      return
    }
    const ok = await toggleCommercialFavorite(user.id, 'agent', item.id, saved)
    if (ok) setSaved(!saved)
  }

  const invite = async () => {
    if (!user) {
      navigateTo('/login?redirect=/commercial-agents/representatives/' + slug)
      return
    }
    setBusy(true)
    const mfr = await fetchMyManufacturer(user.id)
    if (!mfr) {
      setFeedback(t('commercialAgents.needManufacturerProfile'))
      setBusy(false)
      return
    }
    const { error } = await inviteAgent({
      manufacturerId: mfr.id,
      agentId: item.id,
      agentProfileId: item.profile_id,
      message: inviteMsg || t('commercialAgents.defaultInviteMessage'),
    })
    setBusy(false)
    setFeedback(error ? error : t('commercialAgents.inviteSent'))
  }

  const report = async () => {
    if (!user) return
    const ok = await reportCommercialEntity({
      reporterId: user.id,
      entityType: 'agent',
      entityId: item.id,
      reason: 'other',
    })
    setFeedback(ok ? t('commercialAgents.reportSent') : t('commercialAgents.reportFailed'))
  }

  return (
    <div className="page-bg pb-24 lg:pb-12">
      <div className="layout-page-gutter py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#232f3e] text-2xl font-bold text-white">
                {item.profile_photo_url ? (
                  <img src={item.profile_photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  item.full_name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-[var(--ink-900)] md:text-3xl">{item.full_name}</h1>
                  <VerifiedB2BBadge status={item.verification_status} kind="agent" t={t} />
                </div>
                {item.company_name ? <p className="mt-1 text-sm text-[var(--ink-600)]">{item.company_name}</p> : null}
                <p className="mt-1 text-sm text-[var(--ink-600)]">
                  {[item.city, item.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>

            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-700)] md:text-base">
              {item.description || t('commercialAgents.noDescription')}
            </p>

            <section className="mt-8 rounded-2xl border border-[var(--line-200)] bg-white/90 p-5">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">{t('commercialAgents.representationBlock')}</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <AgentFact
                  label={t('commercialAgents.categoriesTitle')}
                  value={item.categories.map((c) => labelForMatchCategory(c, language.code)).join(', ')}
                />
                <AgentFact label={t('commercialAgents.countriesTitle')} value={[item.city, item.country].filter(Boolean).join(', ')} />
                <AgentFact label={t('commercialAgents.regions')} value={item.service_regions.join(', ')} />
                <AgentFact label={t('commercialAgents.languages')} value={normalizeSpokenLanguageList(item.languages).join(', ')} />
                <AgentFact
                  label={t('commercialAgents.experience')}
                  value={
                    item.years_experience != null
                      ? `${item.years_experience}+ ${t('commercialAgents.yearsExp')}`
                      : item.previous_experience
                  }
                />
                <AgentFact
                  label={t('commercialAgents.availableForBrands')}
                  value={item.available_for_new_brands ? t('commercialAgents.yes') : t('commercialAgents.no')}
                />
              </dl>
            </section>

            <ChipBlock title={t('commercialAgents.industries')} items={item.industries} />
            <ChipBlock title={t('commercialAgents.clientTypes')} items={item.client_types} />

            {item.years_experience != null ? (
              <p className="mt-4 text-sm text-[var(--ink-700)]">
                <span className="font-semibold">{t('commercialAgents.experience')}:</span> {item.years_experience}+{' '}
                {t('commercialAgents.yearsExp')}
              </p>
            ) : null}

            {item.available_for_new_brands ? (
              <p className="mt-2 text-sm font-semibold text-[#248a3d]">{t('commercialAgents.availableForBrands')}</p>
            ) : null}

            {item.website || item.linkedin_url ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {item.website ? (
                  <a href={item.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#c45500]">
                    {t('commercialAgents.website')} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {item.linkedin_url ? (
                  <a href={item.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#c45500]">
                    LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            ) : null}

            {item.show_public_contacts ? (
              <div className="mt-4 text-sm text-[var(--ink-700)]">
                {item.public_email ? <p>{item.public_email}</p> : null}
                {item.public_phone ? <p>{item.public_phone}</p> : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-500)]">{t('commercialAgents.contactsPrivate')}</p>
            )}
          </div>

          <aside className="space-y-4">
            {matchPanel ? <MatchScorePanel match={matchPanel} t={t} /> : null}
            <div className="rounded-2xl border border-[var(--line-200)] bg-white/95 p-4">
              <button
                type="button"
                onClick={() =>
                  navigateTo(
                    `/commercial-agents/manufacturers?${new URLSearchParams({
                      ...(item.country ? { country: item.country } : {}),
                      ...(item.categories[0] ? { category: item.categories[0] } : {}),
                    }).toString()}`,
                  )
                }
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm"
              >
                <Search className="h-4 w-4" />
                {t('commercialAgents.findManufacturersCta')}
              </button>
              <button type="button" onClick={message} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-200)] py-2.5 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" />
                {t('commercialAgents.messageAgent')}
              </button>
              <button
                type="button"
                onClick={favorite}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-200)] py-2.5 text-sm font-semibold"
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-[#c45500] text-[#c45500]' : ''}`} />
                {saved ? t('commercialAgents.saved') : t('commercialAgents.favorite')}
              </button>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]">
                {t('commercialAgents.invite')}
              </label>
              <textarea
                className="mt-1.5 w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-white p-3 text-sm outline-none"
                rows={3}
                value={inviteMsg}
                onChange={(e) => setInviteMsg(e.target.value)}
                placeholder={t('commercialAgents.invitePlaceholder')}
              />
              <button
                type="button"
                disabled={busy}
                onClick={invite}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#232f3e] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {t('commercialAgents.invite')}
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

function ChipBlock({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
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

function AgentFact({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="rounded-xl bg-[#f7f8fa] px-3 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-500)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--ink-800)]">{value}</dd>
    </div>
  )
}
