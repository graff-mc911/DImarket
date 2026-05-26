import { useMemo, useState } from 'react'
import { ImagePlus, Monitor, Smartphone, Upload, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { AdMediaDisplay } from './AdMediaDisplay'
import { formatSlotLabel, PAGE_LABEL_KEYS, type AdPageKey } from '../lib/adPlacementSlots'
import { getSlotDefinition, slotGroupsForPurchasePicker } from '../lib/adPlacementCatalog'
import {
  AD_SLOT_CONTAINER_SPECS,
  containerSpecForZone,
  type AdSlotContainerSpec,
} from '../lib/adSlotContainerSpecs'
import {
  layoutKeyFromSlotId,
  slotMediaEntryHasMedia,
  type SlotMediaEntry,
  type SlotMediaMap,
} from '../lib/adSlotMedia'
import type { TranslationKey } from '../lib/i18n'

function interpolateTranslation(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  )
}

type AdPlacementSitePreviewProps = {
  selected: string[]
  onChange?: (slots: string[]) => void
  page?: AdPageKey
  onPageChange?: (page: AdPageKey) => void
  /** @deprecated Використовуйте slotMedia */
  draftMediaUrl?: string | null
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  onFocusSlot?: (slotId: string | null) => void
  onSlotClear?: (slotId: string) => void
  onSlotUploadRequest?: (slotId: string) => void
  compact?: boolean
  /** Сторінки перемикаються зовні (AdPlacementPagesBar) */
  hidePageTabs?: boolean
}

function slotSizeLabels(
  spec: AdSlotContainerSpec,
  t: (key: TranslationKey) => string,
): { short: string; title: string } {
  const params = {
    w: spec.containerW,
    h: spec.containerH,
    cw: spec.containerW,
    ch: spec.containerH,
    iw: spec.imageW,
    ih: spec.imageH,
    uw: spec.uploadW,
    uh: spec.uploadH,
    aspect: spec.aspect,
  }
  return {
    short: interpolateTranslation(t('advertising.catalog.slotSizeShort'), params),
    title: interpolateTranslation(t('advertising.catalog.slotSizeTooltip'), params),
  }
}

function SlotBox({
  active,
  focused,
  label,
  title,
  sizeShort,
  className = '',
  draftMediaUrl,
  slotEntry,
  slotId,
  interactive,
  onToggle,
  onClear,
  onUploadRequest,
}: {
  active: boolean
  focused?: boolean
  label: string
  title: string
  sizeShort?: string
  className?: string
  draftMediaUrl?: string | null
  slotEntry?: SlotMediaEntry
  slotId?: string
  interactive: boolean
  onToggle?: () => void
  onClear?: () => void
  onUploadRequest?: () => void
}) {
  const { t } = useApp()
  const hasSlotMedia = slotMediaEntryHasMedia(slotEntry)
  const previewUrl = hasSlotMedia
    ? slotEntry!.slideUrls[0] || slotEntry!.mediaUrl
    : active && draftMediaUrl
      ? draftMediaUrl
      : null
  const layoutKey = slotId ? layoutKeyFromSlotId(slotId) : 'center'

  const labelBlock = (
    <span className="flex flex-col items-center gap-0.5 leading-tight">
      <span>{label}</span>
      {sizeShort && !previewUrl ? (
        <span className="text-[7px] font-semibold tabular-nums opacity-90">{sizeShort}</span>
      ) : null}
    </span>
  )

  const baseClass =
    'group relative flex min-h-[28px] w-full items-center justify-center overflow-hidden rounded-md border px-0.5 py-1 text-center text-[9px] font-bold leading-tight transition ' +
    (focused
      ? 'border-[#6366f1] ring-2 ring-[rgba(99,102,241,0.45)] shadow-md'
      : active
        ? 'border-[rgba(99,102,241,0.55)] bg-[rgba(99,102,241,0.22)] text-[#312e81] shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
        : 'border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.45)] text-[#7a7168]') +
    (interactive
      ? ' cursor-pointer hover:brightness-95'
      : '') +
    ' ' +
    className

  const inner = (
    <>
      {previewUrl && hasSlotMedia ? (
        <AdMediaDisplay
          src={previewUrl}
          mediaType={slotEntry!.mediaType}
          style={slotEntry!.mediaStyle}
          layoutKey={layoutKey}
          className="absolute inset-0 h-full w-full"
          imageClassName="h-full w-full object-cover"
          animateSlides
        />
      ) : previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover bg-[#1a1816]/80"
        />
      ) : active && interactive ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-[rgba(238,242,255,0.35)] text-[#6366f1] opacity-80 group-hover:opacity-100">
          <Upload className="h-3 w-3" />
          <span className="text-[7px] font-bold">{t('advertising.slotStudio.tapUpload')}</span>
        </span>
      ) : null}
      <span
        className={
          'relative z-[1] rounded px-1 py-0.5 text-[8px] ' +
          (previewUrl ? 'bg-black/55 text-white' : '')
        }
      >
        {labelBlock}
      </span>
      {hasSlotMedia && onClear && (
        <button
          type="button"
          title={t('advertising.slotStudio.removeMedia')}
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          className="absolute right-0.5 top-0.5 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
      {active && !hasSlotMedia && onUploadRequest && (
        <button
          type="button"
          title={t('advertising.slotStudio.uploadHere')}
          onClick={(e) => {
            e.stopPropagation()
            onUploadRequest()
          }}
          className="absolute bottom-0.5 right-0.5 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-[#6366f1] text-white opacity-0 transition group-hover:opacity-100"
        >
          <ImagePlus className="h-2.5 w-2.5" />
        </button>
      )}
    </>
  )

  if (!interactive) {
    return (
      <div title={title} className={baseClass}>
        {inner}
      </div>
    )
  }

  return (
    <button type="button" title={title} aria-pressed={active} onClick={onToggle} className={baseClass}>
      {inner}
    </button>
  )
}

function DesktopWireframe({
  page,
  selected,
  t,
  draftMediaUrl,
  slotMedia,
  focusedSlotId,
  interactive,
  onToggle,
  onSlotClear,
  onSlotUploadRequest,
}: {
  page: AdPageKey
  selected: string[]
  t: (key: TranslationKey) => string
  draftMediaUrl?: string | null
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  interactive: boolean
  onToggle: (id: string) => void
  onSlotClear?: (id: string) => void
  onSlotUploadRequest?: (id: string) => void
}) {
  const group = slotGroupsForPurchasePicker().find((g) => g.page === page)!
  const isActive = (id: string) => selected.includes(id)
  const short = (id: string) => {
    const def = getSlotDefinition(id)
    if (!def?.row) return '·'
    return String(def.row)
  }

  const slotProps = (id: string, label: string) => {
    const def = getSlotDefinition(id)
    const spec = def ? containerSpecForZone(def.zone) : null
    const sizes = spec ? slotSizeLabels(spec, t) : null
    return {
      slotId: id,
      active: isActive(id),
      focused: focusedSlotId === id,
      label,
      sizeShort: sizes?.short,
      title: sizes
        ? `${formatSlotLabel(id, t)}\n${sizes.title}`
        : formatSlotLabel(id, t),
      draftMediaUrl,
      slotEntry: slotMedia?.[id],
      interactive,
      onToggle: () => onToggle(id),
      onClear: onSlotClear ? () => onSlotClear(id) : undefined,
      onUploadRequest: onSlotUploadRequest ? () => onSlotUploadRequest(id) : undefined,
    }
  }

  return (
    <div className="rounded-[18px] border border-white/45 bg-[rgba(248,250,252,0.65)] p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#9a8776]">
        {t('advertising.catalog.desktopWire')} · {t(PAGE_LABEL_KEYS[page])}
      </p>
      <div className="grid grid-cols-[minmax(58px,72px)_1fr_minmax(58px,72px)] gap-1.5">
        <div className="grid grid-rows-4 gap-1">
          {group.desktop.left.map((id) => (
            <SlotBox key={id} {...slotProps(id, `L${short(id)}`)} />
          ))}
        </div>
        <div className="flex min-h-[140px] flex-col gap-1.5">
          <div className="rounded-md border border-dashed border-[rgba(148,163,184,0.45)] bg-white/50 px-2 py-3 text-center text-[10px] font-semibold text-[#6f665d]">
            {t('advertising.catalog.contentArea')}
          </div>
          {group.desktop.center && (
            <SlotBox
              {...slotProps(group.desktop.center, t('advertising.slots.centerShort'))}
              className="min-h-[36px]"
            />
          )}
        </div>
        <div className="grid grid-rows-4 gap-1">
          {group.desktop.right.map((id) => (
            <SlotBox key={id} {...slotProps(id, `R${short(id)}`)} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[#7a7168]">{t('advertising.catalog.desktopNote')}</p>
    </div>
  )
}

function MobileWireframe({
  page,
  selected,
  t,
  draftMediaUrl,
  slotMedia,
  focusedSlotId,
  interactive,
  onToggle,
  onSlotClear,
  onSlotUploadRequest,
}: {
  page: AdPageKey
  selected: string[]
  t: (key: TranslationKey) => string
  draftMediaUrl?: string | null
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  interactive: boolean
  onToggle: (id: string) => void
  onSlotClear?: (id: string) => void
  onSlotUploadRequest?: (id: string) => void
}) {
  const group = slotGroupsForPurchasePicker().find((g) => g.page === page)!
  const isActive = (id: string) => selected.includes(id)

  return (
    <div className="mx-auto w-full max-w-[220px] rounded-[22px] border-2 border-[#2f2a24] bg-[#faf8f5] p-2 shadow-lg">
      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-wide text-[#9a8776]">
        {t('advertising.catalog.mobileWire')}
      </p>
      <div className="space-y-1">
        <div className="rounded bg-[rgba(148,163,184,0.2)] px-2 py-2 text-center text-[9px] font-semibold text-[#6f665d]">
          {t('advertising.catalog.mobileHero')}
        </div>
        {group.mobile.inline.map((id, i) => {
          const def = getSlotDefinition(id)
          const isLeader = def?.zone === 'mob_leaderboard'
          const label = isLeader ? t('advertising.catalog.leaderboard') : `#${def?.row ?? i + 1}`
          const spec = def ? containerSpecForZone(def.zone) : null
          const sizes = spec ? slotSizeLabels(spec, t) : null
          return (
            <div key={id}>
              <SlotBox
                slotId={id}
                active={isActive(id)}
                focused={focusedSlotId === id}
                label={label}
                sizeShort={sizes?.short}
                title={
                  sizes
                    ? `${formatSlotLabel(id, t)}\n${sizes.title}`
                    : formatSlotLabel(id, t)
                }
                className={isLeader ? 'min-h-[36px]' : 'min-h-[28px]'}
                draftMediaUrl={draftMediaUrl}
                slotEntry={slotMedia?.[id]}
                interactive={interactive}
                onToggle={() => onToggle(id)}
                onClear={onSlotClear ? () => onSlotClear(id) : undefined}
                onUploadRequest={
                  onSlotUploadRequest ? () => onSlotUploadRequest(id) : undefined
                }
              />
              {!isLeader && i < group.mobile.inline.length - 1 && (
                <div className="my-0.5 rounded bg-[rgba(148,163,184,0.15)] px-1 py-1.5 text-center text-[8px] text-[#9a8776]">
                  …
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AdPlacementSitePreview({
  selected,
  onChange,
  page: pageProp,
  onPageChange,
  draftMediaUrl,
  slotMedia,
  focusedSlotId,
  onFocusSlot,
  onSlotClear,
  onSlotUploadRequest,
  compact = false,
  hidePageTabs = false,
}: AdPlacementSitePreviewProps) {
  const { t } = useApp()
  const groups = slotGroupsForPurchasePicker()
  const interactive = Boolean(onChange)
  const [internalPage, setInternalPage] = useState<AdPageKey>('home')

  const page = pageProp ?? internalPage

  const switchPage = (next: AdPageKey) => {
    if (onPageChange) onPageChange(next)
    else setInternalPage(next)
  }

  const selectedOnPage = useMemo(
    () => selected.filter((id) => id.startsWith(`${page}_`)),
    [selected, page],
  )

  const toggle = (slotId: string) => {
    if (!onChange) return
    const isSelected = selected.includes(slotId)
    if (!isSelected) {
      onChange([...selected, slotId])
      onFocusSlot?.(slotId)
      return
    }
    if (focusedSlotId !== slotId) {
      onFocusSlot?.(slotId)
      return
    }
    if (selected.length > 1) {
      const next = selected.filter((s) => s !== slotId)
      onChange(next)
      onFocusSlot?.(next[0] ?? null)
    }
  }

  const selectAllForPage = () => {
    if (!onChange) return
    const g = groups.find((x) => x.page === page)!
    const ids = [
      ...g.desktop.left,
      ...g.desktop.right,
      ...(g.desktop.center ? [g.desktop.center] : []),
      ...g.mobile.inline,
    ]
    const allSelected = ids.every((id) => selected.includes(id))
    if (allSelected) {
      const next = selected.filter((id) => !ids.includes(id))
      onChange(next.length > 0 ? next : [ids[0]])
    } else {
      onChange([...new Set([...selected, ...ids])])
    }
  }

  const pageSlotCount = (p: AdPageKey) => {
    const g = groups.find((x) => x.page === p)!
    const ids = [
      ...g.desktop.left,
      ...g.desktop.right,
      ...(g.desktop.center ? [g.desktop.center] : []),
      ...g.mobile.inline,
    ]
    return ids.filter((id) => selected.includes(id)).length
  }

  return (
    <div className="space-y-4">
      {!hidePageTabs && (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const count = pageSlotCount(g.page)
            return (
              <button
                key={g.page}
                type="button"
                onClick={() => switchPage(g.page)}
                className={
                  'rounded-full px-3 py-1.5 text-xs font-bold transition ' +
                  (page === g.page
                    ? 'bg-[rgba(201,109,44,0.18)] text-[var(--accent-700)]'
                    : 'bg-white/40 text-[#6f665d] hover:bg-white/55')
                }
              >
                {t(PAGE_LABEL_KEYS[g.page])}
                {count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
        {interactive && (
          <button
            type="button"
            onClick={selectAllForPage}
            className="text-xs font-semibold text-[#6366f1] hover:underline"
          >
            {t('advertising.slots.togglePage')}
          </button>
        )}
      </div>
      )}
      {hidePageTabs && interactive && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={selectAllForPage}
            className="text-xs font-semibold text-[#6366f1] hover:underline"
          >
            {t('advertising.slots.togglePage')}
          </button>
        </div>
      )}

      {interactive && (
        <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.catalog.tapToSelect')}</p>
      )}

      <div className={compact ? 'grid gap-3 sm:grid-cols-[1fr_auto]' : 'grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'}>
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold text-[#5f5a54]">
            <Monitor className="h-3.5 w-3.5" />
            {t('advertising.slots.desktopTitle')}
          </div>
          <DesktopWireframe
            page={page}
            selected={selected}
            t={t}
            draftMediaUrl={draftMediaUrl}
            slotMedia={slotMedia}
            focusedSlotId={focusedSlotId}
            interactive={interactive}
            onToggle={toggle}
            onSlotClear={onSlotClear}
            onSlotUploadRequest={onSlotUploadRequest}
          />
        </div>
        <div className={compact ? 'sm:max-w-[180px]' : ''}>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold text-[#5f5a54]">
            <Smartphone className="h-3.5 w-3.5" />
            {t('advertising.slots.mobileTitle')}
          </div>
          <MobileWireframe
            page={page}
            selected={selected}
            t={t}
            draftMediaUrl={draftMediaUrl}
            slotMedia={slotMedia}
            focusedSlotId={focusedSlotId}
            interactive={interactive}
            onToggle={toggle}
            onSlotClear={onSlotClear}
            onSlotUploadRequest={onSlotUploadRequest}
          />
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-xs font-semibold text-[#5f5a54]">
          {t('advertising.slots.selectedCount')}: {selected.length}
        </p>
      )}

      {!compact && (
      <div className="rounded-[14px] border border-white/35 bg-white/25 px-3 py-2.5 text-[11px] leading-relaxed text-[#5f5a54]">
        <p className="font-bold text-[#2f2a24]">{t('advertising.catalog.sizesLegendTitle')}</p>
        <ul className="mt-1.5 list-inside list-disc space-y-1">
          <li>
            {interpolateTranslation(t('advertising.catalog.sizesLegendSide'), {
              cw: AD_SLOT_CONTAINER_SPECS.side_left.containerW,
              ch: AD_SLOT_CONTAINER_SPECS.side_left.containerH,
              uw: AD_SLOT_CONTAINER_SPECS.side_left.uploadW,
              uh: AD_SLOT_CONTAINER_SPECS.side_left.uploadH,
              aspect: AD_SLOT_CONTAINER_SPECS.side_left.aspect,
            })}
          </li>
          {page === 'home' && (
            <li>
              {interpolateTranslation(t('advertising.catalog.sizesLegendCenter'), {
                iw: AD_SLOT_CONTAINER_SPECS.center.imageW,
                ih: AD_SLOT_CONTAINER_SPECS.center.imageH,
                uw: AD_SLOT_CONTAINER_SPECS.center.uploadW,
                uh: AD_SLOT_CONTAINER_SPECS.center.uploadH,
                aspect: AD_SLOT_CONTAINER_SPECS.center.aspect,
              })}
            </li>
          )}
          <li>
            {interpolateTranslation(t('advertising.catalog.sizesLegendLeaderboard'), {
              cw: AD_SLOT_CONTAINER_SPECS.mob_leaderboard.containerW,
              ch: AD_SLOT_CONTAINER_SPECS.mob_leaderboard.containerH,
              uw: AD_SLOT_CONTAINER_SPECS.mob_leaderboard.uploadW,
              uh: AD_SLOT_CONTAINER_SPECS.mob_leaderboard.uploadH,
              aspect: AD_SLOT_CONTAINER_SPECS.mob_leaderboard.aspect,
            })}
          </li>
          <li>
            {interpolateTranslation(t('advertising.catalog.sizesLegendInline'), {
              cw: AD_SLOT_CONTAINER_SPECS.mob_inline.containerW,
              ch: AD_SLOT_CONTAINER_SPECS.mob_inline.containerH,
              iw: AD_SLOT_CONTAINER_SPECS.mob_inline.imageW,
              ih: AD_SLOT_CONTAINER_SPECS.mob_inline.imageH,
              uw: AD_SLOT_CONTAINER_SPECS.mob_inline.uploadW,
              uh: AD_SLOT_CONTAINER_SPECS.mob_inline.uploadH,
              aspect: AD_SLOT_CONTAINER_SPECS.mob_inline.aspect,
            })}
          </li>
        </ul>
      </div>
      )}

      {!compact && selectedOnPage.length > 0 ? (
        <details className="rounded-[14px] border border-white/35 bg-white/25 px-3 py-2 text-xs text-[#5f5a54]">
          <summary className="cursor-pointer font-semibold text-[#2f2a24]">
            {t('advertising.catalog.selectedOnPage')}: {selectedOnPage.length}
          </summary>
          <ul className="mt-2 space-y-0.5">
            {selectedOnPage.map((id) => (
              <li key={id}>{formatSlotLabel(id, t)}</li>
            ))}
          </ul>
        </details>
      ) : !compact ? (
        <p className="text-xs text-[#7a7168]">{t('advertising.catalog.noneOnPage')}</p>
      ) : null}
    </div>
  )
}
