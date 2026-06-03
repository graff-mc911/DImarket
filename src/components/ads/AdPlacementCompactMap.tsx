import { useEffect, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import { AdPlacementSitePreview } from '../AdPlacementSitePreview'
import { AdPlacementPagesBar } from './AdPlacementPagesBar'
import {
  editorPageFromSlotId,
  getPlacementEditorPage,
  type PlacementEditorPageId,
} from '../../lib/adPlacementPages'
import type { SlotMediaMap } from '../../lib/adSlotMedia'

const PURCHASE_EDITOR_PAGES: PlacementEditorPageId[] = ['home', 'listings', 'professionals']

type AdPlacementCompactMapProps = {
  selectedSlots: string[]
  unavailableSlots?: Record<string, string>
  onChange?: (slots: string[]) => void
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  onFocusSlot?: (slotId: string | null) => void
  onSlotClear?: (slotId: string) => void
  onSlotUploadRequest?: (slotId: string) => void
  onSlotReplaceRequest?: (slotId: string) => void
}

function PageWireframeBlock({
  pageId,
  selectedSlots,
  unavailableSlots,
  onChange,
  slotMedia,
  focusedSlotId,
  onFocusSlot,
  onSlotClear,
  onSlotUploadRequest,
  onSlotReplaceRequest,
}: {
  pageId: PlacementEditorPageId
  selectedSlots: string[]
  unavailableSlots?: Record<string, string>
  onChange?: (slots: string[]) => void
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  onFocusSlot?: (slotId: string | null) => void
  onSlotClear?: (slotId: string) => void
  onSlotUploadRequest?: (slotId: string) => void
  onSlotReplaceRequest?: (slotId: string) => void
}) {
  const { t } = useApp()
  const meta = getPlacementEditorPage(pageId)
  const count = selectedSlots.filter((id) => id.startsWith(`${meta.adPageKey}_`)).length

  return (
    <div className="min-w-0 overflow-hidden rounded-[14px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.35)] p-2.5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-extrabold text-[#2f2a24]">
          {t(meta.labelKey)}
          {count > 0 ? (
            <span className="ml-1.5 font-bold text-[#6366f1]">({count})</span>
          ) : null}
        </p>
        <span className="shrink-0 font-mono text-[9px] text-[#9a8776]">{meta.route}</span>
      </div>
      <AdPlacementSitePreview
        compact
        hidePageTabs
        purchaseLayout
        selected={selectedSlots}
        unavailableSlots={unavailableSlots}
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
}

/** Компактна схема: на мобільному — одна сторінка з перемикачем; на md+ — Home / Listings / Professionals */
export function AdPlacementCompactMap({
  selectedSlots,
  unavailableSlots,
  onChange,
  slotMedia,
  focusedSlotId,
  onFocusSlot,
  onSlotClear,
  onSlotUploadRequest,
  onSlotReplaceRequest,
}: AdPlacementCompactMapProps) {
  const [mobilePage, setMobilePage] = useState<PlacementEditorPageId>('home')

  useEffect(() => {
    if (focusedSlotId) setMobilePage(editorPageFromSlotId(focusedSlotId))
  }, [focusedSlotId])

  const handleFocusSlot = (slotId: string | null) => {
    if (slotId) setMobilePage(editorPageFromSlotId(slotId))
    onFocusSlot?.(slotId)
  }

  const shared = {
    selectedSlots,
    unavailableSlots,
    onChange,
    slotMedia,
    focusedSlotId,
    onFocusSlot: handleFocusSlot,
    onSlotClear,
    onSlotUploadRequest,
    onSlotReplaceRequest,
  }

  return (
    <div className="min-w-0 space-y-2.5">
      <div className="min-w-0 md:hidden">
        <AdPlacementPagesBar
          activePage={mobilePage}
          onPageChange={setMobilePage}
          selectedSlots={selectedSlots}
          pageIds={PURCHASE_EDITOR_PAGES}
        />
        <div className="mt-2">
          <PageWireframeBlock pageId={mobilePage} {...shared} />
        </div>
      </div>

      <div className="hidden min-w-0 space-y-2.5 md:block">
        {PURCHASE_EDITOR_PAGES.map((pageId) => (
          <PageWireframeBlock key={pageId} pageId={pageId} {...shared} />
        ))}
      </div>
    </div>
  )
}
