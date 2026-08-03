import { useEffect, useState } from 'react'
import { Building2, ClipboardList, HardHat, MapPin, TrendingUp } from 'lucide-react'
import { fetchMarketHealthRows, type MarketHealthRow } from '../lib/marketStats'
import { ALL_TRACKED_MARKETS, LAUNCH_MARKETS } from '../lib/launchMarkets'
import { useApp } from '../contexts/AppContext'

export function OwnerMarketHealth() {
  const { t } = useApp()
  const [rows, setRows] = useState<MarketHealthRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchMarketHealthRows(ALL_TRACKED_MARKETS)
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const launchRows = rows.filter((r) =>
    LAUNCH_MARKETS.some((m) => m.id === r.market.id),
  )
  const expansionRows = rows.filter((r) =>
    !LAUNCH_MARKETS.some((m) => m.id === r.market.id),
  )

  return (
    <section className="mb-8 rounded-[26px] border border-white/70 bg-white/45 p-5 md:p-6">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/42 bg-[rgba(248,250,252,0.70)] px-4 py-2 text-sm font-semibold text-[#64748b]">
          <MapPin className="h-4 w-4" />
          <span>{t('marketHealth.eyebrow')}</span>
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#2f2a24]">
          {t('marketHealth.title')}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#6f665d]">
          {t('marketHealth.subtitle')}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#7a7168]">{t('marketHealth.loading')}</p>
      ) : (
        <>
          <MarketGroup title={t('marketHealth.pilotGroup')} rows={launchRows} />
          <MarketGroup title={t('marketHealth.nextWave')} rows={expansionRows} className="mt-6" />
        </>
      )}
    </section>
  )
}

function MarketGroup({
  title,
  rows,
  className = '',
}: {
  title: string
  rows: MarketHealthRow[]
  className?: string
}) {
  return (
    <div className={className}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#8a8178]">
        {title}
      </h3>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <MarketHealthCard key={row.market.id} row={row} />
        ))}
      </div>
    </div>
  )
}

function MarketHealthCard({ row }: { row: MarketHealthRow }) {
  const { market, professionals, companies, activeRequests, readinessPercent } =
    row
  const targets = market.seedTargets

  return (
    <div className="rounded-[20px] border border-white/80 bg-[rgba(255,255,255,0.72)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-[#2f2a24]">{market.city}</p>
          <p className="text-xs text-[#8a8178]">
            {market.region}, {market.countryCode}
          </p>
        </div>
        <span
          className={[
            'rounded-full px-2.5 py-1 text-xs font-bold',
            readinessPercent >= 60
              ? 'bg-[rgba(34,197,94,0.12)] text-[#15803d]'
              : readinessPercent >= 30
                ? 'bg-[rgba(234,179,8,0.14)] text-[#a16207]'
                : 'bg-[rgba(239,68,68,0.1)] text-[#b91c1c]',
          ].join(' ')}
        >
          {readinessPercent}%
        </span>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <MetricLine
          icon={HardHat}
          label="Майстри"
          value={professionals}
          target={targets.professionals}
        />
        <MetricLine
          icon={Building2}
          label="Компанії"
          value={companies}
          target={targets.companies}
        />
        <MetricLine
          icon={ClipboardList}
          label="Запити"
          value={activeRequests}
          target={targets.requests}
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#6366f1]">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>Мови: {market.languages.join(', ')}</span>
      </div>
    </div>
  )
}

function MetricLine({
  icon: Icon,
  label,
  value,
  target,
}: {
  icon: typeof HardHat
  label: string
  value: number
  target: number
}) {
  const pct = Math.min(Math.round((value / target) * 100), 100)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#5f5a54]">
          <Icon className="h-3.5 w-3.5 text-[#b59a84]" />
          {label}
        </span>
        <span className="font-bold text-[#2f2a24]">
          {value} / {target}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#c78a60,#e8b48a)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
