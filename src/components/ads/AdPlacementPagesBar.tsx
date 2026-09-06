import { useApp } from '../../contexts/AppContext'
import {
  PLACEMENT_EDITOR_PAGES,
  slotCountForEditorPage,
  type PlacementEditorPageId,
} from '../../lib/adPlacementPages'

type AdPlacementPagesBarProps = {
  activePage: PlacementEditorPageId
  onPageChange: (page: PlacementEditorPageId) => void
  selectedSlots: string[]
  /** За замовчуванням — усі сторінки каталогу; для купівлі — лише home / listings / professionals */
  pageIds?: PlacementEditorPageId[]
}

export function AdPlacementPagesBar({
  activePage,
  onPageChange,
  selectedSlots,
  pageIds,
}: AdPlacementPagesBarProps) {
  const { t } = useApp()
  const pages = pageIds
    ? PLACEMENT_EDITOR_PAGES.filter((p) => pageIds.includes(p.id))
    : PLACEMENT_EDITOR_PAGES

  return (
    <div className="rounded-none border border-white/40 bg-white/25 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#6f665d]">
        {t('advertising.places.pagesLabel')}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {pages.map((page) => {
          const count = slotCountForEditorPage(page.id, selectedSlots)
          const active = activePage === page.id
          return (
            <button
              key={page.id}
              type="button"
              data-testid={`placement-page-${page.id}`}
              data-active={active ? 'true' : 'false'}
              onClick={() => onPageChange(page.id)}
              className={
                'min-w-[6.5rem] rounded-none border px-2.5 py-1.5 text-left transition ' +
                (active
                  ? 'border-[rgba(201,109,44,0.45)] bg-[rgba(201,109,44,0.12)] shadow-sm'
                  : 'border-[rgba(148,163,184,0.25)] bg-white/50 hover:border-[rgba(99,102,241,0.35)]')
              }
            >
              <span className="block text-[11px] font-extrabold leading-tight text-[#2f2a24]">
                {t(page.labelKey)}
                {count > 0 ? (
                  <span className="ml-1 font-bold text-[#6366f1]">({count})</span>
                ) : null}
              </span>
              <span className="mt-0.5 block font-mono text-[9px] leading-snug text-[#7a7168]">
                {page.route}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
