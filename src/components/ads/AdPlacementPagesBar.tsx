import { useApp } from '../../contexts/AppContext'
import { slotCountOnPage, AD_PAGE_KEYS } from '../../lib/adPlacementPages'
import { PAGE_LABEL_KEYS, type AdPageKey } from '../../lib/adPlacementSlots'
import type { TranslationKey } from '../../lib/i18n'

const PAGE_ROUTES_KEYS: Record<AdPageKey, TranslationKey> = {
  home: 'advertising.places.routes.home',
  listings: 'advertising.places.routes.listings',
  professionals: 'advertising.places.routes.professionals',
  default: 'advertising.places.routes.default',
}

type AdPlacementPagesBarProps = {
  activePage: AdPageKey
  onPageChange: (page: AdPageKey) => void
  selectedSlots: string[]
}

export function AdPlacementPagesBar({
  activePage,
  onPageChange,
  selectedSlots,
}: AdPlacementPagesBarProps) {
  const { t } = useApp()

  return (
    <div className="rounded-[14px] border border-white/40 bg-white/25 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#6f665d]">
        {t('advertising.places.pagesLabel')}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AD_PAGE_KEYS.map((page) => {
          const count = slotCountOnPage(page, selectedSlots)
          const active = activePage === page
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={
                'min-w-[7rem] rounded-[14px] border px-3 py-2 text-left transition ' +
                (active
                  ? 'border-[rgba(201,109,44,0.45)] bg-[rgba(201,109,44,0.12)] shadow-sm'
                  : 'border-[rgba(148,163,184,0.25)] bg-white/50 hover:border-[rgba(99,102,241,0.35)]')
              }
            >
              <span className="block text-xs font-extrabold text-[#2f2a24]">
                {t(PAGE_LABEL_KEYS[page])}
                {count > 0 ? (
                  <span className="ml-1 font-bold text-[#6366f1]">({count})</span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[#7a7168]">
                {t(PAGE_ROUTES_KEYS[page])}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
