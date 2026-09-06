import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { applyPageSeo } from '../../lib/pageSeo'
import {
  EMPTY_COMMERCIAL_FILTERS,
  fetchAgents,
  fetchManufacturers,
  fetchOpportunities,
  type AgentProfile,
  type CommercialSearchFilters,
  type ManufacturerProfile,
  type RepresentationOpportunity,
} from '../../lib/commercialAgents'
import { CommercialAgentsFilters } from '../../components/commercialAgents/CommercialAgentsFilters'
import { AgentCard } from '../../components/commercialAgents/AgentCard'
import { ManufacturerCard } from '../../components/commercialAgents/ManufacturerCard'
import { OpportunityCard } from '../../components/commercialAgents/OpportunityCard'
import { PageContentAds } from '../../components/CenterPageAd'
import type { TranslateFn } from '../../lib/i18n'

function readQueryParams(): Partial<CommercialSearchFilters> {
  const sp = new URLSearchParams(window.location.search)
  return {
    query: sp.get('q') ?? '',
    country: sp.get('country') ?? '',
    category: sp.get('category') ?? '',
  }
}

export function CommercialAgentsDirectory({
  mode,
}: {
  mode: 'manufacturers' | 'agents' | 'opportunities'
}) {
  const { t } = useApp()
  const initial = useMemo(() => ({ ...EMPTY_COMMERCIAL_FILTERS, ...readQueryParams() }), [])
  const [draft, setDraft] = useState<CommercialSearchFilters>(initial)
  const [filters, setFilters] = useState<CommercialSearchFilters>(initial)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manufacturers, setManufacturers] = useState<ManufacturerProfile[]>([])
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [opportunities, setOpportunities] = useState<RepresentationOpportunity[]>([])

  const title =
    mode === 'manufacturers'
      ? t('commercialAgents.manufacturersTitle')
      : mode === 'agents'
        ? t('commercialAgents.agentsTitle')
        : t('commercialAgents.opportunitiesTitle')

  const path =
    mode === 'manufacturers'
      ? '/commercial-agents/manufacturers'
      : mode === 'agents'
        ? '/commercial-agents/representatives'
        : '/commercial-agents/opportunities'

  useEffect(() => {
    return applyPageSeo({
      title: `${title} | DImarket`,
      description: t('commercialAgents.seoDescription'),
      canonicalPath: path,
    })
  }, [t, title, path])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      if (mode === 'manufacturers') {
        const rows = await fetchManufacturers(filters)
        if (!cancelled) setManufacturers(rows)
      } else if (mode === 'agents') {
        const rows = await fetchAgents(filters)
        if (!cancelled) setAgents(rows)
      } else {
        const rows = await fetchOpportunities(filters)
        if (!cancelled) setOpportunities(rows)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [filters, mode])

  const apply = () => {
    setFilters(draft)
    setDrawerOpen(false)
  }

  return (
    <div className="page-bg pb-24 lg:pb-12">
      <div className="layout-page-gutter py-8">
        {mode === 'manufacturers' ? (
          <PageContentAds page="categories" outerClassName="mt-0 mb-4" />
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)] md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-600)] md:text-base">
          {mode === 'manufacturers'
            ? t('commercialAgents.manufacturersSubtitle')
            : mode === 'agents'
              ? t('commercialAgents.agentsSubtitle')
              : t('commercialAgents.opportunitiesSubtitle')}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <CommercialAgentsFilters
            value={draft}
            onChange={setDraft}
            onApply={apply}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            t={t}
            mode={mode}
          />

          <div>
            {loading ? (
              <p className="text-sm text-[var(--ink-500)]">{t('commercialAgents.loading')}</p>
            ) : mode === 'manufacturers' ? (
              manufacturers.length === 0 ? (
                <Empty t={t} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {manufacturers.map((item) => (
                    <ManufacturerCard key={item.id} item={item} t={t} />
                  ))}
                </div>
              )
            ) : mode === 'agents' ? (
              agents.length === 0 ? (
                <Empty t={t} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {agents.map((item) => (
                    <AgentCard key={item.id} item={item} t={t} />
                  ))}
                </div>
              )
            ) : opportunities.length === 0 ? (
              <Empty t={t} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map((item) => (
                  <OpportunityCard key={item.id} item={item} t={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Empty({ t }: { t: TranslateFn }) {
  return (
    <p className="rounded-none border border-dashed border-[var(--line-200)] bg-white/70 p-8 text-sm text-[var(--ink-600)]">
      {t('commercialAgents.emptyResults')}
    </p>
  )
}
