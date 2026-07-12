import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LAUNCH_MARKETS } from '../lib/launchMarkets'
import { launchSeoLinks } from '../lib/seoRoutes'
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

  const statsByMarket = new Map(rows.map((row) => [row.market.id, row]))

  return (
    <section className="pb-6 pt-2">
      <div className="layout-page-content">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-copper)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--ink-900)]">{t('launch.title')}</p>
              <p className="text-xs text-[var(--ink-500)]">{t('launch.globalNote')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/register?role=professional')}
            className="btn-secondary self-start px-3 py-1.5 text-xs sm:self-auto"
          >
            {t('launch.registerCta')}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {LAUNCH_MARKETS.map((market) => {
            const row = statsByMarket.get(market.id)
            const pros = row?.professionals ?? 0
            const jobs = row?.activeRequests ?? 0
            return (
              <button
                key={market.id}
                type="button"
                onClick={() => navigateTo(`/listings?search=${encodeURIComponent(market.city)}`)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-700)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              >
                <span>{market.city}</span>
                {loading ? (
                  <span className="inline-block h-3 w-14 animate-pulse rounded-full bg-[var(--line)]" />
                ) : (
                  <span className="text-[10px] font-medium text-[var(--ink-500)]">
                    {pros} {t('launch.metricMasters')} · {jobs} {t('launch.metricRequests')}
                  </span>
                )}
              </button>
            )
          })}
          {launchSeoLinks().slice(0, 4).map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => navigateTo(link.path)}
              className="rounded-full border border-dashed border-[var(--glass-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ink-500)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            >
              {link.city} · {t(link.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
