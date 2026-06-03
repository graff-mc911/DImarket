import { useMemo, useState } from 'react'
import { ImagePlus, Monitor, Smartphone, Upload, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatSlotLabel } from '../lib/adPlacementSlots'
import { getSlotDefinition } from '../lib/adPlacementCatalog'
import {
  editorPageFromSlotId,
  getPlacementEditorPage,
  wireframeGroupForEditorPage,
  type EditorWireframeGroup,
  type PlacementEditorPageId,
} from '../lib/adPlacementPages'
import {
  AD_SLOT_CONTAINER_SPECS,
  containerSpecForZone,
  wireframeSlotFileSizeShort,
  wireframeSlotSizeShort,
  type AdSlotContainerSpec,
} from '../lib/adSlotContainerSpecs'
import {
  slotMediaEntryHasMedia,
  type SlotMediaEntry,
  type SlotMediaMap,
} from '../lib/adSlotMedia'
import type { TranslationKey } from '../lib/i18n'
import { wireframeMobileInlineHeightPx, wireframeSlotHeightPx, wireframeWideAspectClass } from '../lib/adSlotDisplay'

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
  unavailableSlots?: Record<string, string>
  onChange?: (slots: string[]) => void
  editorPage?: PlacementEditorPageId
  onEditorPageChange?: (page: PlacementEditorPageId) => void
  /** @deprecated Використовуйте slotMedia */
  draftMediaUrl?: string | null
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  onFocusSlot?: (slotId: string | null) => void
  onSlotClear?: (slotId: string) => void
  onSlotUploadRequest?: (slotId: string) => void
  onSlotReplaceRequest?: (slotId: string) => void
  compact?: boolean
  /** Сторінки перемикаються зовні (AdPlacementPagesBar) */
  hidePageTabs?: boolean
  /** Компактна схема купівлі (/advertising): вужча сітка, без моб. wireframe на телефоні */
  purchaseLayout?: boolean
}

function slotSizeLabels(
  spec: AdSlotContainerSpec,
  t: (key: TranslationKey) => string,
): { short: string; subline: string | null; title: string } {
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
    short: wireframeSlotFileSizeShort(spec),
    subline:
      spec.imageH < spec.containerH
        ? interpolateTranslation(t('advertising.catalog.slotSizeSublineContainer'), {
            cw: spec.containerW,
            ch: spec.containerH,
          })
        : null,
    title: interpolateTranslation(t('advertising.catalog.slotSizeTooltip'), params),
  }
}

function SlotBox({
  active,
  unavailable = false,
  unavailableReason,
  focused,
  label,
  title,
  sizeShort,
  sizeSubline,
  slotHeightPx,
  aspectClass = '',
  className = '',
  draftMediaUrl,
  slotEntry,
  slotId,
  interactive,
  onToggle,
  onClear,
  onUploadRequest,
  onReplaceRequest,
}: {
  active: boolean
  unavailable?: boolean
  unavailableReason?: string
  focused?: boolean
  label: string
  title: string
  sizeShort?: string
  sizeSubline?: string | null
  slotHeightPx?: number
  aspectClass?: string
  className?: string
  draftMediaUrl?: string | null
  slotEntry?: SlotMediaEntry
  slotId?: string
  interactive: boolean
  onToggle?: () => void
  onClear?: () => void
  onUploadRequest?: () => void
  onReplaceRequest?: () => void
}) {
  const { t } = useApp()
  const hasSlotMedia = slotMediaEntryHasMedia(slotEntry)
  const previewUrl = hasSlotMedia
    ? slotEntry!.slideUrls[0] || slotEntry!.mediaUrl
    : active && draftMediaUrl
      ? draftMediaUrl
      : null

  const labelBlock = (
    <span className="flex flex-col items-center gap-0.5 leading-tight">
      <span>{label}</span>
      {sizeShort ? (
        <span className="text-[7px] font-semibold tabular-nums opacity-90">{sizeShort}</span>
      ) : null}
      {sizeSubline ? (
        <span className="text-[6px] font-medium tabular-nums opacity-80">{sizeSubline}</span>
      ) : null}
    </span>
  )

  const baseClass =
    'group relative flex min-h-[28px] w-full items-center justify-center overflow-hidden rounded-md border px-0.5 py-1 text-center text-[9px] font-bold leading-tight transition ' +
    (focused
      ? 'border-[#6366f1] ring-2 ring-[rgba(99,102,241,0.45)] shadow-md'
      : unavailable
        ? 'border-[rgba(249,115,22,0.6)] bg-[rgba(251,146,60,0.22)] text-[#9a3412] shadow-[0_0_0_1px_rgba(249,115,22,0.2)]'
      : active
        ? 'border-[rgba(99,102,241,0.55)] bg-[rgba(99,102,241,0.22)] text-[#312e81] shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
        : 'border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.45)] text-[#7a7168]') +
    (interactive
      ? unavailable
        ? ' cursor-not-allowed'
        : ' cursor-pointer hover:brightness-95'
      : '') +
    ' touch-manipulation ' +
    aspectClass +
    ' ' +
    className

  const heightStyle =
    aspectClass || !slotHeightPx
      ? undefined
      : { height: slotHeightPx, minHeight: slotHeightPx }
  const slotTitle = unavailable && unavailableReason ? `${title}\n${unavailableReason}` : title

  const inner = (
    <>
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="absolute inset-0 z-0 h-full w-full bg-[#1a1816] object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80'
          }}
        />
      ) : active && interactive && !hasSlotMedia ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-[rgba(238,242,255,0.35)] text-[#6366f1] opacity-80 group-hover:opacity-100">
          <Upload className="h-3 w-3" />
        </span>
      ) : unavailable ? (
        <span className="absolute inset-0 bg-[rgba(251,146,60,0.2)]" />
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
      {active && !hasSlotMedia && onUploadRequest ? (
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
      ) : null}
      {active && hasSlotMedia && onReplaceRequest ? (
        <button
          type="button"
          title={t('advertising.slotStudio.replace')}
          onClick={(e) => {
            e.stopPropagation()
            onReplaceRequest()
          }}
          className="absolute bottom-0.5 right-0.5 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-[#6366f1] text-white opacity-0 transition group-hover:opacity-100"
        >
          <Upload className="h-2.5 w-2.5" />
        </button>
      ) : null}
    </>
  )

  if (!interactive) {
    return (
      <div
        title={slotTitle}
        className={baseClass}
        style={heightStyle}
        data-slot-id={slotId || undefined}
      >
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      title={slotTitle}
        aria-disabled={unavailable}
      style={heightStyle}
      aria-pressed={active}
      data-slot-id={slotId || undefined}
      onClick={unavailable ? undefined : onToggle}
      className={baseClass}
    >
      {inner}
    </button>
  )
}

function DesktopWireframe({
  group,
  editorLabel,
  selected,
  unavailableSlots,
  compact,
  purchaseLayout = false,
  t,
  draftMediaUrl,
  slotMedia,
  focusedSlotId,
  interactive,
  onToggle,
  onSlotClear,
  onSlotUploadRequest,
  onSlotReplaceRequest,
}: {
  group: EditorWireframeGroup
  editorLabel: string
  selected: string[]
  unavailableSlots: Record<string, string>
  compact: boolean
  purchaseLayout?: boolean
  t: (key: TranslationKey) => string
  draftMediaUrl?: string | null
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  interactive: boolean
  onToggle: (id: string) => void
  onSlotClear?: (id: string) => void
  onSlotUploadRequest?: (id: string) => void
  onSlotReplaceRequest?: (id: string) => void
}) {
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
    const zone = def?.zone
    const isWide = zone === 'center' || zone === 'mob_leaderboard'
    const sideH =
      spec && !isWide ? wireframeSlotHeightPx(spec.containerH) : undefined

    return {
      slotId: id,
      active: isActive(id),
      unavailable: Boolean(unavailableSlots[id]),
      unavailableReason: unavailableSlots[id],
      focused: focusedSlotId === id,
      label,
      sizeShort: sizes?.short,
      sizeSubline: sizes?.subline,
      slotHeightPx: sideH,
      aspectClass: zone ? wireframeWideAspectClass(zone) : '',
      title: sizes
        ? `${formatSlotLabel(id, t)}\n${sizes.title}`
        : formatSlotLabel(id, t),
      draftMediaUrl,
      slotEntry: slotMedia?.[id],
      interactive,
      onToggle: () => onToggle(id),
      onClear: onSlotClear ? () => onSlotClear(id) : undefined,
      onUploadRequest: onSlotUploadRequest ? () => onSlotUploadRequest(id) : undefined,
      onReplaceRequest: onSlotReplaceRequest ? () => onSlotReplaceRequest(id) : undefined,
    }
  }

  return (
    <div
      className={
        'rounded-[18px] border border-white/45 bg-[rgba(248,250,252,0.65)] ' +
        (compact ? (purchaseLayout ? 'p-2 sm:p-3 md:p-4' : 'p-4') : 'p-3')
      }
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#9a8776]">
        {t('advertising.catalog.desktopWire')} · {editorLabel}
      </p>
      <div
        className={
          compact
            ? purchaseLayout
              ? 'grid w-full max-w-full grid-cols-[minmax(2.75rem,1fr)_minmax(4.25rem,1.35fr)_minmax(2.75rem,1fr)] items-start gap-1.5 sm:grid-cols-[minmax(5.5rem,1fr)_minmax(6.75rem,1.25fr)_minmax(5.5rem,1fr)] sm:gap-2.5 md:grid-cols-[minmax(128px,176px)_minmax(150px,1.15fr)_minmax(128px,176px)] md:gap-3.5'
              : 'grid grid-cols-[minmax(128px,176px)_minmax(150px,1.15fr)_minmax(128px,176px)] items-start gap-3.5'
            : 'grid grid-cols-[minmax(108px,148px)_minmax(122px,0.98fr)_minmax(108px,148px)] items-start gap-3'
        }
      >
        <div className="grid grid-rows-4 gap-1 self-start">
          {group.desktop.left.map((id) => (
            <SlotBox key={id} {...slotProps(id, `L${short(id)}`)} />
          ))}
        </div>
        <div className={'flex flex-col ' + (compact ? 'min-h-[184px] gap-3' : 'min-h-[159px] gap-2.5')}>
          <div className="rounded-md border border-dashed border-[rgba(148,163,184,0.45)] bg-white/50 px-2 py-3 text-center text-[10px] font-semibold text-[#6f665d]">
            {t('advertising.catalog.contentArea')}
          </div>
          {group.desktop.center && (
            <SlotBox {...slotProps(group.desktop.center, t('advertising.slots.centerShort'))} />
          )}
        </div>
        <div className="grid grid-rows-4 gap-1 self-start">
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
  group,
  editorLabel,
  selected,
  unavailableSlots,
  t,
  draftMediaUrl,
  slotMedia,
  focusedSlotId,
  interactive,
  onToggle,
  onSlotClear,
  onSlotUploadRequest,
  onSlotReplaceRequest,
}: {
  group: EditorWireframeGroup
  editorLabel: string
  selected: string[]
  unavailableSlots: Record<string, string>
  t: (key: TranslationKey) => string
  draftMediaUrl?: string | null
  slotMedia?: SlotMediaMap
  focusedSlotId?: string | null
  interactive: boolean
  onToggle: (id: string) => void
  onSlotClear?: (id: string) => void
  onSlotUploadRequest?: (id: string) => void
  onSlotReplaceRequest?: (id: string) => void
}) {
  const isActive = (id: string) => selected.includes(id)

  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[22px] border-2 border-[#2f2a24] bg-[#faf8f5] p-2.5 shadow-lg">
      <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-wide text-[#9a8776]">
        {t('advertising.catalog.mobileWire')} · {editorLabel}
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
          const isWide = def?.zone === 'center' || def?.zone === 'mob_leaderboard'
          const mobH =
            spec && def?.zone === 'mob_inline'
              ? wireframeMobileInlineHeightPx(spec.containerH)
              : undefined
          return (
            <div key={id}>
              <SlotBox
                slotId={id}
                active={isActive(id)}
                unavailable={Boolean(unavailableSlots[id])}
                unavailableReason={unavailableSlots[id]}
                focused={focusedSlotId === id}
                label={label}
                sizeShort={sizes?.short}
                sizeSubline={sizes?.subline}
                slotHeightPx={mobH}
                aspectClass={def?.zone ? wireframeWideAspectClass(def.zone) : ''}
                title={
                  sizes
                    ? `${formatSlotLabel(id, t)}\n${sizes.title}`
                    : formatSlotLabel(id, t)
                }
                className=""
                draftMediaUrl={draftMediaUrl}
                slotEntry={slotMedia?.[id]}
                interactive={interactive}
                onToggle={() => onToggle(id)}
                onClear={onSlotClear ? () => onSlotClear(id) : undefined}
                onUploadRequest={
                  onSlotUploadRequest ? () => onSlotUploadRequest(id) : undefined
                }
                onReplaceRequest={
                  onSlotReplaceRequest ? () => onSlotReplaceRequest(id) : undefined
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
  unavailableSlots,
  onChange,
  editorPage: editorPageProp,
  onEditorPageChange,
  draftMediaUrl,
  slotMedia,
  focusedSlotId,
  onFocusSlot,
  onSlotClear,
  onSlotUploadRequest,
  onSlotReplaceRequest,
  compact = false,
  hidePageTabs = false,
  purchaseLayout = false,
}: AdPlacementSitePreviewProps) {
  const blockedMap = unavailableSlots ?? {}
  const { t } = useApp()
  const interactive = Boolean(onChange)
  const [internalEditorPage, setInternalEditorPage] = useState<PlacementEditorPageId>('home')

  const editorPage = editorPageProp ?? internalEditorPage
  const wireframe = useMemo(() => wireframeGroupForEditorPage(editorPage), [editorPage])
  const editorMeta = getPlacementEditorPage(editorPage)
  const editorLabel = t(editorMeta.labelKey)

  const switchPage = (next: PlacementEditorPageId) => {
    if (onEditorPageChange) onEditorPageChange(next)
    else setInternalEditorPage(next)
  }

  const pageSlotIds = useMemo(() => wireframe.desktop.left.concat(
    wireframe.desktop.right,
    wireframe.desktop.center ? [wireframe.desktop.center] : [],
    wireframe.mobile.inline,
  ), [wireframe])

  const selectedOnPage = useMemo(
    () => selected.filter((id) => pageSlotIds.includes(id)),
    [selected, pageSlotIds],
  )

  const syncEditorPageForSlot = (slotId: string) => {
    if (onEditorPageChange) {
      onEditorPageChange(editorPageFromSlotId(slotId))
    }
  }

  const toggle = (slotId: string) => {
    if (!onChange) return
    const isSelected = selected.includes(slotId)
    if (!isSelected) {
      syncEditorPageForSlot(slotId)
      onChange([...selected, slotId])
      onFocusSlot?.(slotId)
      return
    }
    if (focusedSlotId !== slotId) {
      syncEditorPageForSlot(slotId)
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
    const ids = pageSlotIds
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id))
    if (allSelected) {
      const next = selected.filter((id) => !ids.includes(id))
      onChange(next.length > 0 ? next : [ids[0]])
    } else {
      onChange([...new Set([...selected, ...ids])])
    }
  }

  return (
    <div className="space-y-4">
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

      <div
        className={
          purchaseLayout
            ? 'grid gap-3 max-lg:grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]'
            : compact
              ? 'grid gap-3 sm:grid-cols-[1.1fr_0.9fr]'
              : 'grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'
        }
      >
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold text-[#5f5a54]">
            <Monitor className="h-3.5 w-3.5" />
            {t('advertising.slots.desktopTitle')}
          </div>
          <div className={purchaseLayout ? 'min-w-0' : 'overflow-x-auto pb-1'}>
            <div className={compact && !purchaseLayout ? 'min-w-[min(100%,760px)]' : 'w-full min-w-0 max-w-full'}>
              <DesktopWireframe
                group={wireframe}
                editorLabel={editorLabel}
                selected={selected}
                unavailableSlots={blockedMap}
                compact={compact}
                purchaseLayout={purchaseLayout}
                t={t}
                draftMediaUrl={draftMediaUrl}
                slotMedia={slotMedia}
                focusedSlotId={focusedSlotId}
                interactive={interactive}
                onToggle={toggle}
                onSlotClear={onSlotClear}
                onSlotUploadRequest={onSlotUploadRequest}
                onSlotReplaceRequest={onSlotReplaceRequest}
              />
            </div>
          </div>
        </div>
        <div
          className={
            purchaseLayout
              ? 'hidden min-w-0 lg:block lg:max-w-[280px]'
              : compact
                ? 'sm:max-w-[280px]'
                : ''
          }
        >
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold text-[#5f5a54]">
            <Smartphone className="h-3.5 w-3.5" />
            {t('advertising.slots.mobileTitle')}
          </div>
          <MobileWireframe
            group={wireframe}
            editorLabel={editorLabel}
            selected={selected}
            unavailableSlots={blockedMap}
            t={t}
            draftMediaUrl={draftMediaUrl}
            slotMedia={slotMedia}
            focusedSlotId={focusedSlotId}
            interactive={interactive}
            onToggle={toggle}
            onSlotClear={onSlotClear}
            onSlotUploadRequest={onSlotUploadRequest}
            onSlotReplaceRequest={onSlotReplaceRequest}
          />
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-xs font-semibold text-[#5f5a54]">
          {t('advertising.slots.selectedCount')}: {selected.length}
        </p>
      )}

      <div
        className={
          compact
            ? 'rounded-[12px] border border-white/35 bg-white/25 px-2.5 py-2 text-[10px] leading-relaxed text-[#5f5a54]'
            : 'rounded-[14px] border border-white/35 bg-white/25 px-3 py-2.5 text-[11px] leading-relaxed text-[#5f5a54]'
        }
      >
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
          {wireframe.adPageKey === 'home' && wireframe.desktop.center && (
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
