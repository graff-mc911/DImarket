import { PROJECT_TRADES } from '../../lib/projectWizard'

type CategoryStepProps = {
  selectedId: string | null
  onSelect: (tradeId: string, subcategorySlug: string) => void
  t: (key: string) => string
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
                'group flex flex-col items-center gap-3 rounded-[22px] border px-3 py-5 text-center transition duration-200 ' +
                (active
                  ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-lg shadow-black/10'
                  : 'border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] hover:border-[#d2d2d7] hover:bg-white hover:shadow-sm')
              }
            >
              <span
                className={
                  'flex h-12 w-12 items-center justify-center rounded-2xl ' +
                  (active ? 'bg-white/15' : 'bg-white shadow-sm')
                }
              >
                <Icon className={'h-6 w-6 ' + (active ? 'text-white' : 'text-[#1d1d1f]')} />
              </span>
              <span className="text-[13px] font-semibold leading-snug tracking-[-0.01em]">
                {t(trade.labelKey) || trade.labelEn}
              </span>
            </button>
          )
        })}
      </div>
      {error ? <p className="mt-3 text-center text-[13px] text-[#c41e3a]">{error}</p> : null}
    </div>
  )
}
