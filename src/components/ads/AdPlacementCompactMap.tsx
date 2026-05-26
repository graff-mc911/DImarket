import { useApp } from '../../contexts/AppContext'
import { AdPlacementSitePreview } from '../AdPlacementSitePreview'
import { getPlacementEditorPage, type PlacementEditorPageId } from '../../lib/adPlacementPages'
import type { SlotMediaMap } from '../../lib/adSlotMedia'

const PURCHASE_EDITOR_PAGES: PlacementEditorPageId[] = ['home', 'listings', 'professionals']

type AdPlacementCompactMapProps = {
  selectedSlots: string[]
  onChange?: (slots: string[]) => void
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  onFocusSlot?: (slotId: string | null) => void
  onSlotClear?: (slotId: string) => void
  onSlotUploadRequest?: (slotId: string) => void
  onSlotReplaceRequest?: (slotId: string) => void
}

/** Компактна схема без кнопок вибору сторінки — Home / Listings / Professionals одна під одною */
export function AdPlacementCompactMap({
  selectedSlots,
  onChange,
  slotMedia,
  focusedSlotId,
  onFocusSlot,
  onSlotClear,
  onSlotUploadRequest,
  onSlotReplaceRequest,
}: AdPlacementCompactMapProps) {
  const { t } = useApp()

  return (
    <div className="space-y-2.5">
      {PURCHASE_EDITOR_PAGES.map((pageId) => {
        const meta = getPlacementEditorPage(pageId)
        const count = selectedSlots.filter((id) => id.startsWith(`${meta.adPageKey}_`)).length
        return (
          <div
            key={pageId}
            className="rounded-[14px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.35)] p-2.5"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-[11px] font-extrabold text-[#2f2a24]">
                {t(meta.labelKey)}
                {count > 0 ? (
                  <span className="ml-1.5 font-bold text-[#6366f1]">({count})</span>
                ) : null}
              </p>
              <span className="font-mono text-[9px] text-[#9a8776]">{meta.route}</span>
            </div>
            <AdPlacementSitePreview
              compact
              hidePageTabs
              selected={selectedSlots}
              onChange={onChange}
              slotMedia={slotMedia}
              focusedSlotId={focusedSlotId}
              onFocusSlot={onFocusSlot}
              onSlotClear={onSlotClear}
              onSlotUploadRequest={onSlotUploadRequest}
              onSlotReplaceRequest={onSlotReplaceRequest}
              editorPage={pageId}
            />
          </div>
        )
      })}
    </div>
  )
}
