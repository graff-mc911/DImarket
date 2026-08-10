import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Handshake, PlusCircle, UserPlus } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { applyPageSeo } from '../../lib/pageSeo'
import {
  EMPTY_COMMERCIAL_FILTERS,
  fetchAgents,
  fetchManufacturers,
  fetchOpportunities,
  type AgentProfile,
  type ManufacturerProfile,
  type RepresentationOpportunity,
} from '../../lib/commercialAgents'
import {
  COMMERCIAL_FOCUS_COUNTRIES,
  dimarketParentCategoryOptions,
} from '../../lib/commercialAgents/categories'
import { AgentCard } from '../../components/commercialAgents/AgentCard'
import { ManufacturerCard } from '../../components/commercialAgents/ManufacturerCard'
import { OpportunityCard } from '../../components/commercialAgents/OpportunityCard'

export function CommercialAgentsHome() {
  const { t, language } = useApp()
  const [query, setQuery] = useState('')
  const [manufacturers, setManufacturers] = useState<ManufacturerProfile[]>([])
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [opportunities, setOpportunities] = useState<RepresentationOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const parentCategories = useMemo(
    () => dimarketParentCategoryOptions(language.code).slice(0, 16),
    [language.code],
  )

  useEffect(() => {
    return applyPageSeo({
      title: `${t('commercialAgents.title')} | DImarket`,
      description: t('commercialAgents.seoDescription'),
      canonicalPath: '/commercial-agents',
    })
  }, [t])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const filters = { ...EMPTY_COMMERCIAL_FILTERS }
      const [m, a, o] = await Promise.all([
        fetchManufacturers(filters, 6),
        fetchAgents({ ...filters, availableOnly: true }, 6),
        fetchOpportunities(filters, 6),
      ])
      if (!cancelled) {
        setManufacturers(m)
        setAgents(a)
        setOpportunities(o)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const runSearch = () => {
    const q = encodeURIComponent(query.trim())
    navigateTo(`/commercial-agents/opportunities${q ? `?q=${q}` : ''}`)
  }

  return (
    <div className="page-bg pb-24 lg:pb-12">
      <section className="relative overflow-hidden border-b border-[var(--line-200)] bg-gradient-to-br from-[#1b2430] via-[#232f3e] to-[#3d2a1a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,153,0,0.22),transparent_55%)]" />
        <div className="layout-page-gutter relative py-14 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff9900]">
            {t('commercialAgents.eyebrow')}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            {t('commercialAgents.heroTitle')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
            {t('commercialAgents.heroSubtitle')}
          </p>

          <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              className="w-full flex-1 rounded-full border-0 bg-white px-5 py-3.5 text-sm text-[var(--ink-900)] shadow-lg outline-none"
              placeholder={t('commercialAgents.searchPlaceholder')}
            />
            <button type="button" onClick={runSearch} className="btn-primary rounded-full px-6 py-3 text-sm font-bold">
              {t('commercialAgents.search')}
            </button>
          </div>

          {/* Primary two-way marketplace CTAs */}
          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigateTo('/commercial-agents/representatives')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff9900] px-5 py-3 text-sm font-bold text-[#0f1111] hover:bg-[#ffb84d]"
            >
              <Handshake className="h-4 w-4" />
              {t('commercialAgents.ctaFindAgent')}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/commercial-agents/manufacturers')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#232f3e] hover:bg-white/90"
            >
              <Building2 className="h-4 w-4" />
              {t('commercialAgents.ctaFindManufacturer')}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigateTo('/commercial-agents/dashboard?role=manufacturer&tab=opportunities')}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/15"
            >
              <PlusCircle className="h-4 w-4" />
              {t('commercialAgents.ctaPostOpportunity')}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/commercial-agents/dashboard?role=agent&tab=profile')}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/15"
            >
              <UserPlus className="h-4 w-4" />
              {t('commercialAgents.ctaCreateAgentProfile')}
            </button>
          </div>
        </div>
      </section>

      <div className="layout-page-gutter py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              path: '/commercial-agents/manufacturers',
              label: t('commercialAgents.findManufacturer'),
              desc: t('commercialAgents.findManufacturerDesc'),
            },
            {
              path: '/commercial-agents/representatives',
              label: t('commercialAgents.findAgent'),
              desc: t('commercialAgents.findAgentDesc'),
            },
            {
              path: '/commercial-agents/opportunities',
              label: t('commercialAgents.findOpportunity'),
              desc: t('commercialAgents.findOpportunityDesc'),
            },
          ].map((card) => (
            <button
              key={card.path}
              type="button"
              onClick={() => navigateTo(card.path)}
              className="rounded-2xl border border-[var(--line-200)] bg-white/95 p-5 text-left transition hover:border-[rgba(255,153,0,0.4)]"
            >
              <p className="text-base font-bold text-[var(--ink-900)]">{card.label}</p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">{card.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#c45500]">
                {t('commercialAgents.explore')} <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-900)]">{t('commercialAgents.opportunitiesTitle')}</h2>
              <p className="mt-1 text-sm text-[var(--ink-600)]">{t('commercialAgents.opportunitiesSubtitle')}</p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#c45500]"
              onClick={() => navigateTo('/commercial-agents/opportunities')}
            >
              {t('commercialAgents.viewAll')}
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-[var(--ink-500)]">{t('commercialAgents.loading')}</p>
          ) : opportunities.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--line-200)] bg-white/60 p-6 text-sm text-[var(--ink-600)]">
              {t('commercialAgents.emptyOpportunities')}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((item) => (
                <OpportunityCard key={item.id} item={item} t={t} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-900)]">{t('commercialAgents.manufacturersTitle')}</h2>
              <p className="mt-1 text-sm text-[var(--ink-600)]">{t('commercialAgents.manufacturersSubtitle')}</p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#c45500]"
              onClick={() => navigateTo('/commercial-agents/manufacturers')}
            >
              {t('commercialAgents.viewAll')}
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {manufacturers.map((item) => (
              <ManufacturerCard key={item.id} item={item} t={t} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--ink-900)]">{t('commercialAgents.agentsTitle')}</h2>
              <p className="mt-1 text-sm text-[var(--ink-600)]">{t('commercialAgents.agentsSubtitle')}</p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#c45500]"
              onClick={() => navigateTo('/commercial-agents/representatives')}
            >
              {t('commercialAgents.viewAll')}
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((item) => (
              <AgentCard key={item.id} item={item} t={t} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--ink-900)]">{t('commercialAgents.categoriesTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--ink-600)]">{t('commercialAgents.categoriesFromDimarket')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {parentCategories.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                onClick={() => navigateTo(`/commercial-agents/opportunities?category=${opt.slug}`)}
                className="rounded-full border border-[var(--line-200)] bg-white px-3.5 py-1.5 text-sm font-medium text-[var(--ink-700)] hover:border-[rgba(255,153,0,0.45)]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--ink-900)]">{t('commercialAgents.countriesTitle')}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMERCIAL_FOCUS_COUNTRIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => navigateTo(`/commercial-agents/representatives?country=${encodeURIComponent(c)}`)}
                className="rounded-full border border-[var(--line-200)] bg-white px-3.5 py-1.5 text-sm font-medium text-[var(--ink-700)] hover:border-[rgba(255,153,0,0.45)]"
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
