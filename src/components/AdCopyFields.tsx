import type { ReactNode } from 'react'
import type { AdCampaignWithAdvertiser } from '../lib/adCampaigns'
import {
  buildMediaStylePayload,
  DEFAULT_AD_MEDIA_STYLE,
  type AdMediaStyle,
} from '../lib/adMediaStyle'
import { AdOverlayCard } from './AdOverlayCard'

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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-[var(--glass-border)] bg-[rgba(255,248,241,0.34)] text-[var(--accent-700)]">
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

interface AdCampaignDraftPreviewProps {
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
}

/** Живий перегляд реклами — той самий вигляд, що й AdOverlayCard на сайті. */
export function AdCampaignDraftPreview({
  title,
  description,
  linkUrl,
  mediaUrl,
  mediaType,
  mediaReady,
  placeholderTitle,
  mediaStyle,
  slideUrls = [],
  className = '',
}: AdCampaignDraftPreviewProps) {
  const primary = slideUrls[0] || mediaUrl
  const draft: AdCampaignWithAdvertiser = {
    id: 'draft-preview',
    title: title.trim() || placeholderTitle,
    description: description.trim() || null,
    link_url: linkUrl.trim() || '#',
    image_url: mediaType !== 'video' ? primary || null : null,
    media_url: primary || null,
    media_type: mediaType,
    media_style: mediaReady
      ? buildMediaStylePayload(
          mediaStyle ?? DEFAULT_AD_MEDIA_STYLE,
          slideUrls.length ? slideUrls : primary ? [primary] : [],
        )
      : null,
    advertiser: null,
  } as AdCampaignWithAdvertiser

  return (
    <AdOverlayCard
      campaign={draft}
      variant="center"
      className={`max-w-xl ${className}`}
      showDescription={Boolean(description.trim())}
    />
  )
}
