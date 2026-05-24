import { useState } from 'react'
import { ChevronDown, Monitor, Smartphone } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { getSlotDefinition, slotGroupsForPurchasePicker } from '../lib/adPlacementCatalog'
import {
  formatSlotLabel,
  PAGE_LABEL_KEYS,
  type AdPageKey,
} from '../lib/adPlacementSlots'
interface AdPlacementPickerProps {
  selected: string[]
  onChange: (slots: string[]) => void
  previewPage?: AdPageKey
  onPreviewPageChange?: (page: AdPageKey) => void
}

function SlotToggle({
  slotId,
  label,
  hint,
  selected,
  onToggle,
}: {
  slotId: string
  label: string
  hint?: string
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(slotId)}
      aria-pressed={selected}
      className={
        'rounded-[14px] border px-3 py-2 text-left transition ' +
        (selected
          ? 'border-[rgba(99,102,241,0.35)] bg-[rgba(238,242,255,0.65)] text-[#4338ca]'
          : 'border-white/40 bg-[rgba(255,255,255,0.28)] text-[#5f5a54] hover:bg-[rgba(255,255,255,0.42)]')
      }
    >
      <span className="block text-xs font-semibold">{label}</span>
      {hint && <span className="mt-0.5 block text-[10px] font-normal leading-snug opacity-80">{hint}</span>}
    </button>
  )
}

export function AdPlacementPicker({
  selected,
  onChange,
  previewPage,
  onPreviewPageChange,
}: AdPlacementPickerProps) {
  const { t } = useApp()
  const groups = slotGroupsForPurchasePicker()
  const [openPage, setOpenPage] = useState<AdPageKey>(previewPage ?? 'home')

  const setPage = (page: AdPageKey) => {
    setOpenPage(page)
    onPreviewPageChange?.(page)
  }

  const toggle = (slotId: string) => {
    onChange(
      selected.includes(slotId)
        ? selected.length > 1
          ? selected.filter((s) => s !== slotId)
          : selected
        : [...selected, slotId],
    )
  }

  const slotLabel = (slotId: string) => {
    const def = getSlotDefinition(slotId)
    if (def?.labelKey === 'advertising.catalog.leaderboard') {
      return t('advertising.catalog.leaderboard')
    }
    if (def?.labelKey === 'advertising.slots.mobInlinePrefix' && def.row) {
      return `${t('advertising.slots.mobInlinePrefix')}${def.row}`
    }
    return formatSlotLabel(slotId, t)
  }

  const slotHint = (slotId: string) => {
    const key = getSlotDefinition(slotId)?.hintKey
    return key ? t(key) : undefined
  }

  const selectAllForPage = (page: AdPageKey) => {
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const count = [
            ...g.desktop.left,
            ...g.desktop.right,
            ...(g.desktop.center ? [g.desktop.center] : []),
            ...g.mobile.inline,
          ].filter((id) => selected.includes(id)).length
          return (
            <button
              key={g.page}
              type="button"
              onClick={() => setPage(g.page)}
              className={
                'rounded-full px-4 py-2 text-sm font-bold transition ' +
                (openPage === g.page
                  ? 'bg-[rgba(99,102,241,0.14)] text-[#4338ca]'
                  : 'bg-[rgba(255,255,255,0.35)] text-[#6f665d] hover:bg-[rgba(255,255,255,0.5)]')
              }
            >
              {t(PAGE_LABEL_KEYS[g.page])}
              {count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {groups
        .filter((g) => g.page === openPage)
        .map((g) => (
          <div
            key={g.page}
            className="rounded-[22px] border border-white/40 bg-[rgba(255,255,255,0.22)] p-4 md:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-[#2f2a24]">{t(PAGE_LABEL_KEYS[g.page])}</h3>
              <button
                type="button"
                onClick={() => selectAllForPage(g.page)}
                className="text-xs font-semibold text-[#6366f1] hover:underline"
              >
                {t('advertising.slots.togglePage')}
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#9a8776]">
                <Monitor className="h-4 w-4" />
                {t('advertising.slots.desktopTitle')}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#6f665d]">{t('advertising.slots.sideLeft')}</p>
                  <div className="grid gap-2">
                    {g.desktop.left.map((id) => (
                      <SlotToggle
                        key={id}
                        slotId={id}
                        label={slotLabel(id)}
                        hint={slotHint(id)}
                        selected={selected.includes(id)}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#6f665d]">{t('advertising.slots.sideRight')}</p>
                  <div className="grid gap-2">
                    {g.desktop.right.map((id) => (
                      <SlotToggle
                        key={id}
                        slotId={id}
                        label={slotLabel(id)}
                        hint={slotHint(id)}
                        selected={selected.includes(id)}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  {g.desktop.center ? (
                    <>
                      <p className="mb-2 text-xs font-semibold text-[#6f665d]">{t('advertising.slots.center')}</p>
                      <SlotToggle
                        slotId={g.desktop.center}
                        label={t('advertising.slots.centerShort')}
                        hint={slotHint(g.desktop.center)}
                        selected={selected.includes(g.desktop.center)}
                        onToggle={toggle}
                      />
                    </>
                  ) : (
                    <p className="text-xs leading-5 text-[#7a7168]">{t('advertising.catalog.noCenterOnPage')}</p>
                  )}
                </div>
              </div>
            </div>

            {g.mobile.inline.length > 0 && (
              <div className="mt-5 border-t border-white/30 pt-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#9a8776]">
                  <Smartphone className="h-4 w-4" />
                  {t('advertising.slots.mobileTitle')}
                </div>
                <p className="mb-3 text-xs leading-5 text-[#6f665d]">{t('advertising.catalog.mobileHint')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {g.mobile.inline.map((id) => (
                    <SlotToggle
                      key={id}
                      slotId={id}
                      label={slotLabel(id)}
                      hint={slotHint(id)}
                      selected={selected.includes(id)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

      {selected.length > 0 && (
        <details className="rounded-[18px] border border-white/35 bg-[rgba(255,255,255,0.2)] px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#5f5a54]">
            <span>
              {t('advertising.slots.selectedCount')}: {selected.length}
            </span>
            <ChevronDown className="h-4 w-4" />
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-[#6f665d]">
            {selected.map((id) => (
              <li key={id}>
                <span className="font-semibold text-[#2f2a24]">{formatSlotLabel(id, t)}</span>
                {slotHint(id) && <span className="text-[#7a7168]"> — {slotHint(id)}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
