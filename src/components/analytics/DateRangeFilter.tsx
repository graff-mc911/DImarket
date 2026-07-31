import { DATE_PRESET_OPTIONS, type DatePreset } from '../../lib/analytics/dateRange'

export function DateRangeFilter({
  preset,
  customFrom,
  customTo,
  onPreset,
  onCustomFrom,
  onCustomTo,
}: {
  preset: DatePreset
  customFrom: string
  customTo: string
  onPreset: (p: DatePreset) => void
  onCustomFrom: (v: string) => void
  onCustomTo: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESET_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPreset(opt.id)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              preset === opt.id
                ? 'bg-[#1d1d1f] text-white'
                : 'border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[12px] text-[#86868b]">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFrom(e.target.value)}
              className="ml-1.5 rounded-lg border border-[#d2d2d7] bg-white px-2 py-1 text-[12px] text-[#1d1d1f]"
            />
          </label>
          <label className="text-[12px] text-[#86868b]">
            To
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomTo(e.target.value)}
              className="ml-1.5 rounded-lg border border-[#d2d2d7] bg-white px-2 py-1 text-[12px] text-[#1d1d1f]"
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
