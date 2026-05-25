import { useMemo } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatSlotLabel, PAGE_LABEL_KEYS, type AdPageKey } from '../lib/adPlacementSlots'
import { getSlotDefinition, slotGroupsForPurchasePicker } from '../lib/adPlacementCatalog'
import type { TranslationKey } from '../lib/i18n'

type AdPlacementSitePreviewProps = {
  selected: string[]
  onChange?: (slots: string[]) => void
  page?: AdPageKey
  onPageChange?: (page: AdPageKey) => void
  /** Мініатюра чернетки в обраних слотах (сторінка /advertising) */
  draftMediaUrl?: string | null
}

function SlotBox({
  active,
  label,
  title,
  className = '',
  draftMediaUrl,
  interactive,
  onToggle,
}: {
  active: boolean
  label: string
  title: string
  className?: string
  draftMediaUrl?: string | null
  interactive: boolean
  onToggle?: () => void
}) {
  const showDraft = active && draftMediaUrl

  const baseClass =
    'relative flex min-h-[28px] w-full items-center justify-center overflow-hidden rounded-md border px-1 text-center text-[9px] font-bold leading-tight transition ' +
    (active
      ? 'border-[rgba(99,102,241,0.55)] bg-[rgba(99,102,241,0.22)] text-[#312e81] shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
      : 'border-[rgba(148,163,184,0.35)] bg-[rgba(255,255,255,0.45)] text-[#7a7168]') +
    (interactive
      ? active
        ? ' cursor-pointer hover:brightness-95'
        : ' cursor-pointer hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(238,242,255,0.55)]'
      : '') +
    ' ' +
    className

  if (!interactive) {
    return (
      <div title={title} className={baseClass}>
        {showDraft ? (
          <>
            <img src={draftMediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            <span className="relative z-[1] rounded bg-black/45 px-1 py-0.5 text-[8px] text-white">{label}</span>
          </>
        ) : (
          label
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onToggle}
      className={baseClass}
    >
      {showDraft ? (
        <>
          <img src={draftMediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <span className="relative z-[1] rounded bg-black/45 px-1 py-0.5 text-[8px] text-white">{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  )
}

function DesktopWireframe({
  page,
  selected,
  t,
  draftMediaUrl,
  interactive,
  onToggle,
}: {
  page: AdPageKey
  selected: string[]
  t: (key: TranslationKey) => string
  draftMediaUrl?: string | null
  interactive: boolean
  onToggle: (id: string) => void
}) {
  const group = slotGroupsForPurchasePicker().find((g) => g.page === page)!
  const isActive = (id: string) => selected.includes(id)
  const short = (id: string) => {
    const def = getSlotDefinition(id)
    if (!def?.row) return '·'
    return String(def.row)
  }

  const slotProps = (id: string, label: string) => ({
    active: isActive(id),
    label,
    title: formatSlotLabel(id, t),
    draftMediaUrl,
    interactive,
    onToggle: () => onToggle(id),
  })

  return (
    <div className="rounded-[18px] border border-white/45 bg-[rgba(248,250,252,0.65)] p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#9a8776]">
        {t('advertising.catalog.desktopWire')} · {t(PAGE_LABEL_KEYS[page])}
      </p>
      <div className="grid grid-cols-[52px_1fr_52px] gap-1.5">
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
  interactive,
  onToggle,
}: {
  page: AdPageKey
  selected: string[]
  t: (key: TranslationKey) => string
  draftMediaUrl?: string | null
  interactive: boolean
  onToggle: (id: string) => void
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
          return (
            <div key={id}>
              <SlotBox
                active={isActive(id)}
                label={label}
                title={formatSlotLabel(id, t)}
                className={isLeader ? 'min-h-[32px]' : 'min-h-[24px]'}
                draftMediaUrl={draftMediaUrl}
                interactive={interactive}
                onToggle={() => onToggle(id)}
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
}: AdPlacementSitePreviewProps) {
  const { t } = useApp()
  const groups = slotGroupsForPurchasePicker()
  const interactive = Boolean(onChange)

  const page = pageProp ?? groups[0]?.page ?? 'home'

  const selectedOnPage = useMemo(
    () => selected.filter((id) => id.startsWith(`${page}_`)),
    [selected, page],
  )

  const toggle = (slotId: string) => {
    if (!onChange) return
    onChange(
      selected.includes(slotId)
        ? selected.length > 1
          ? selected.filter((s) => s !== slotId)
          : selected
        : [...selected, slotId],
    )
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const count = pageSlotCount(g.page)
            return (
              <button
                key={g.page}
                type="button"
                onClick={() => onPageChange?.(g.page)}
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

      {interactive && (
        <p className="text-xs leading-5 text-[#6f665d]">{t('advertising.catalog.tapToSelect')}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5f5a54]">
            <Monitor className="h-4 w-4" />
            {t('advertising.slots.desktopTitle')}
          </div>
          <DesktopWireframe
            page={page}
            selected={selected}
            t={t}
            draftMediaUrl={draftMediaUrl}
            interactive={interactive}
            onToggle={toggle}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5f5a54]">
            <Smartphone className="h-4 w-4" />
            {t('advertising.slots.mobileTitle')}
          </div>
          <MobileWireframe
            page={page}
            selected={selected}
            t={t}
            draftMediaUrl={draftMediaUrl}
            interactive={interactive}
            onToggle={toggle}
          />
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-xs font-semibold text-[#5f5a54]">
          {t('advertising.slots.selectedCount')}: {selected.length}
        </p>
      )}

      {selectedOnPage.length > 0 ? (
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
      ) : (
        <p className="text-xs text-[#7a7168]">{t('advertising.catalog.noneOnPage')}</p>
      )}
    </div>
  )
}
