import type { TranslateFn } from '../../lib/i18n'
import { PROJECT_TRADES } from '../../lib/projectWizard'

type CategoryStepProps = {
  selectedId: string | null
  onSelect: (tradeId: string, subcategorySlug: string) => void
  t: TranslateFn
  error?: string
}

export function CategoryStep({ selectedId, onSelect, t, error }: CategoryStepProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PROJECT_TRADES.map((trade) => {
          const Icon = trade.icon
          const active = selectedId === trade.id
          return (
            <button
              key={trade.id}
              type="button"
              onClick={() => onSelect(trade.id, trade.subcategorySlug)}
              className={
                'group flex flex-col items-center gap-3 rounded-none border px-3 py-5 text-center transition duration-200 ' +
                (active
                  ? 'border-[#2f2a24] bg-[#2f2a24] text-white shadow-lg shadow-black/10'
                  : 'border-[rgba(148,163,184,0.22)] bg-[#fafafa] text-[#2f2a24] hover:border-[rgba(148,163,184,0.35)] hover:bg-white hover:shadow-sm')
              }
            >
              <span
                className={
                  'flex h-12 w-12 items-center justify-center rounded-2xl ' +
                  (active ? 'bg-white/15' : 'bg-white shadow-sm')
                }
              >
                <Icon className={'h-6 w-6 ' + (active ? 'text-white' : 'text-[#2f2a24]')} />
              </span>
              <span className="text-[13px] font-semibold leading-snug tracking-[-0.01em]">
                {t(trade.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
      {error ? <p className="mt-3 text-center text-[13px] text-[#c41e3a]">{error}</p> : null}
    </div>
  )
}
