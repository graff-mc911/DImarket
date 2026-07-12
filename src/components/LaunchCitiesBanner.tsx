import { useEffect, useState } from 'react'
import { ArrowRight, MapPin, TrendingUp } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LAUNCH_MARKETS } from '../lib/launchMarkets'
import { launchSeoLinks } from '../lib/seoRoutes'
import { navigateTo } from '../lib/navigation'
import { fetchLaunchMarketHealth, type MarketHealthRow } from '../lib/marketStats'

export function LaunchCitiesBanner() {
  const { t } = useApp()
  const [rows, setRows] = useState<MarketHealthRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchLaunchMarketHealth()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="pb-4 pt-2">
      <div className="layout-page-content">
        <div className="glass-panel rounded-[22px] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]">
                {t('launch.eyebrow')}
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[var(--ink-900)] md:text-xl">
                {t('launch.title')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-600)]">
                {t('launch.description')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/register')}
              className="btn-primary inline-flex items-center gap-2 self-start rounded-full md:self-auto"
            >
              <span>{t('launch.registerCta')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {loading
              ? LAUNCH_MARKETS.map((market) => (
                  <div
                    key={market.id}
                    className="rounded-[18px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.45)] p-4"
                  >
                    <div className="h-4 w-24 animate-pulse rounded bg-[rgba(0,0,0,0.06)]" />
                    <div className="mt-3 h-8 w-16 animate-pulse rounded bg-[rgba(0,0,0,0.06)]" />
                  </div>
                ))
              : rows.map((row) => (
                  <LaunchCityCard key={row.market.id} row={row} />
                ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-[var(--ink-500)]">
            {t('launch.globalNote')}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {launchSeoLinks().slice(0, 6).map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigateTo(link.path)}
                className="rounded-full border border-[var(--glass-border)] bg-white/50 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-700)] hover:bg-white/80"
              >
                {link.city} · {link.trade}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LaunchCityCard({ row }: { row: MarketHealthRow }) {
  const { t } = useApp()
  const { market, professionals, companies, activeRequests, readinessPercent } = row

  return (
    <div className="rounded-[18px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.5)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-extrabold text-[var(--ink-900)]">
            <MapPin className="h-4 w-4 text-[var(--accent-600)]" />
            <span>{market.city}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-500)]">
            {market.region}, {market.countryCode}
          </p>
        </div>
        <span className="rounded-full bg-[rgba(199,138,96,0.14)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-700)]">
          {readinessPercent}%
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--ink-500)]">
            {t('launch.metricMasters')}
          </dt>
          <dd className="text-sm font-extrabold text-[var(--ink-900)]">
            {professionals}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--ink-500)]">
            {t('launch.metricCompanies')}
          </dt>
          <dd className="text-sm font-extrabold text-[var(--ink-900)]">
            {companies}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--ink-500)]">
            {t('launch.metricRequests')}
          </dt>
          <dd className="text-sm font-extrabold text-[var(--ink-900)]">
            {activeRequests}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#6366f1]">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>{t('launch.freeForPros')}</span>
      </div>
    </div>
  )
}
