import type { ReactNode } from 'react'
import { AD_MEDIA_FALLBACK, resolveAdDisplayCopy, type AdCampaignWithAdvertiser } from '../lib/adCampaigns'
import { adOverlayGlow } from './AdOverlayCard'
import { adSlotTailwind } from '../lib/adSlotLayout'

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
  className = '',
}: AdCampaignDraftPreviewProps) {
  const draft: AdCampaignWithAdvertiser = {
    id: 'draft-preview',
    title: title.trim() || placeholderTitle,
    description: description.trim() || null,
    link_url: linkUrl.trim() || '#',
    image_url: mediaType !== 'video' ? mediaUrl || null : null,
    media_url: mediaUrl || null,
    media_type: mediaType,
    advertiser: null,
  } as AdCampaignWithAdvertiser

  const { brand, title: displayTitle } = resolveAdDisplayCopy(draft)
  const showMedia = Boolean(mediaUrl && mediaReady)
  const href = linkUrl.trim() || undefined

  const body = (
    <>
      <div className="relative h-[8.75rem] w-full shrink-0 overflow-hidden bg-[rgba(255,248,241,0.5)] md:h-[9.75rem]">
        {showMedia ? (
          mediaType === 'video' ? (
            <video
              src={mediaUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img
              src={mediaUrl}
              alt={displayTitle}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = AD_MEDIA_FALLBACK
              }}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(71,85,105,0.35),rgba(51,65,85,0.5))]">
            <span className="text-xs font-semibold text-white/70">{placeholderTitle}</span>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[rgba(219,148,94,0.12)] bg-[rgba(255,252,248,0.98)] p-2.5">
        <div className="space-y-0.5">
          {brand && (
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-500)]">
              {brand}
            </p>
          )}
          {displayTitle && (
            <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-[var(--ink-900)]">
              {displayTitle}
            </h3>
          )}
          {description.trim() && (
            <p className="line-clamp-2 text-xs leading-snug text-[var(--ink-700)]">
              {description.trim()}
            </p>
          )}
        </div>
      </div>
    </>
  )

  const shell = `group flex flex-col overflow-hidden ${adOverlayGlow} ${adSlotTailwind.center} max-w-xl ${className}`

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer sponsored" className={shell}>
        {body}
      </a>
    )
  }

  return <div className={shell}>{body}</div>
}
