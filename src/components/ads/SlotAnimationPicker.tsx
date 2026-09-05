import { useApp } from '../../contexts/AppContext'
import type { AdBannerLayoutKey } from '../../lib/adBannerLayouts'
import {
  resolveDisplayMode,
  resolveLayoutTransition,
  setLayoutPrefs,
  TRANSITIONS_FOR_LAYOUT,
  type AdDisplayMode,
  type AdMediaStyle,
  type AdSlideshowTransition,
} from '../../lib/adMediaStyle'

type SlotAnimationPickerProps = {
  layoutKey: AdBannerLayoutKey
  style: AdMediaStyle
  slideCount?: number
  onStyleChange: (style: AdMediaStyle) => void
  compact?: boolean
}

const DISPLAY_MODES: AdDisplayMode[] = ['single', 'rotate', 'collage']

export function SlotAnimationPicker({
  layoutKey,
  style,
  slideCount = 1,
  onStyleChange,
  compact = false,
}: SlotAnimationPickerProps) {
  const { t } = useApp()
  const mode = resolveDisplayMode(style, layoutKey, slideCount)
  const transition = resolveLayoutTransition(style, layoutKey)
  const transitions = TRANSITIONS_FOR_LAYOUT[layoutKey]

  const patchLayout = (patch: { displayMode?: AdDisplayMode; transition?: AdSlideshowTransition }) => {
    const prefs = style.byLayout?.[layoutKey] ?? {}
    onStyleChange(setLayoutPrefs(style, layoutKey, { ...prefs, ...patch }))
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="flex flex-wrap gap-1">
        {DISPLAY_MODES.map((m) => {
          const disabled = (m === 'rotate' || m === 'collage') && slideCount < 2
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => patchLayout({ displayMode: m })}
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold disabled:opacity-40 ${
                mode === m
                  ? 'bg-[#6366f1] text-white'
                  : 'border border-[rgba(99,102,241,0.22)] bg-white/70 text-[#5f5a54]'
              }`}
            >
              {t(`advertising.mediaEditor.mode.${m}`)}
            </button>
          )
        })}
      </div>
      <label className="block text-[9px] font-semibold text-[#6f665d]">
        {t('advertising.mediaEditor.transition')}
        <select
          value={transition}
          disabled={mode !== 'rotate' || slideCount < 2}
          onChange={(e) =>
            patchLayout({ transition: e.target.value as AdSlideshowTransition })
          }
          className="input-glass mt-0.5 w-full py-1 text-[10px] disabled:opacity-50"
        >
          {transitions.map((tr) => (
            <option key={tr} value={tr}>
              {t(`advertising.mediaEditor.transition.${tr}`)}
            </option>
          ))}
        </select>
      </label>
      {slideCount < 2 && (
        <p className="text-[8px] leading-snug text-[#9a8776]">
          {t('advertising.mediaEditor.slideshowNeedTwo')}
        </p>
      )}
    </div>
  )
}
