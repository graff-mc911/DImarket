import { PROJECT_TRADES } from '../../lib/projectWizard'

type CategoryStepProps = {
  selectedId: string | null
  onSelect: (tradeId: string, subcategorySlug: string) => void
  t: (key: string) => string
}

export function CategoryStep({ selectedId, onSelect, t }: CategoryStepProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {PROJECT_TRADES.map((trade) => {
        const Icon = trade.icon
        const active = selectedId === trade.id
        return (
          <button
            key={trade.id}
            type="button"
            onClick={() => onSelect(trade.id, trade.subcategorySlug)}
            className={
              'flex flex-col items-center gap-2 rounded-sm border p-4 text-center transition ' +
              (active
                ? 'border-[#ff9900] bg-[#fff8e7] shadow-sm ring-1 ring-[#ff9900]'
                : 'border-[#d5d9d9] bg-white hover:border-[#ff9900]')
            }
          >
            <Icon className={'h-7 w-7 ' + (active ? 'text-[#c45500]' : 'text-[#565959]')} />
            <span className="text-xs font-semibold leading-snug text-[var(--ink-900)]">
              {t(trade.labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
