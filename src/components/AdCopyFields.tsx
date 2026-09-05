import { type ReactNode } from 'react'
import type { AdMediaStyle } from '../lib/adMediaStyle'
import { AdPreviewStudio } from './ads/AdPreviewStudio'

type DraftMediaType = 'image' | 'gif' | 'video'

interface AdCopyFieldProps {
  icon: ReactNode
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}

/** Поле форми реклами у стилі glass-card (як картки категорій на головній). */
export function AdCopyField({ icon, label, hint, required, children }: AdCopyFieldProps) {
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-[var(--glass-border)] bg-white text-[var(--accent-700)]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-bold tracking-[-0.02em] text-[var(--ink-900)]">
            {label}
            {required && <span className="ml-0.5 text-[#c45a4a]">*</span>}
          </span>
          {hint && <p className="muted-text mt-0.5 text-[11px] leading-snug">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export interface AdCampaignDraftPreviewProps {
  title: string
  description: string
  linkUrl: string
  mediaUrl: string
  mediaType: DraftMediaType
  mediaReady: boolean
  placeholderTitle: string
  mediaStyle?: AdMediaStyle
  slideUrls?: string[]
  className?: string
  onMediaStyleChange?: (style: AdMediaStyle) => void
  onSlideUrlsChange?: (urls: string[]) => void
  onUploadFiles?: (files: File[]) => Promise<void>
  selectedSlots?: string[]
  slotMedia?: import('../lib/adSlotMedia').SlotMediaMap
  editable?: boolean
}

/** Живий перегляд реклами — реальні розміри контейнерів + ручне кадрування. */
export function AdCampaignDraftPreview(props: AdCampaignDraftPreviewProps) {
  return <AdPreviewStudio {...props} />
}
