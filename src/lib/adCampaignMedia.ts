import type { AdCampaign } from './types'
import {
  buildMediaStylePayload,
  DEFAULT_AD_MEDIA_STYLE,
  parseAdMediaStyle,
  type AdMediaStyle,
} from './adMediaStyle'

export type AdCampaignMediaState = {
  mediaUrl: string
  slideUrls: string[]
  mediaStyle: AdMediaStyle
  mediaType: 'image' | 'gif' | 'video'
}

export function mediaStateFromCampaign(
  campaign: AdCampaign & { media_style?: unknown },
): AdCampaignMediaState {
  const mediaStyle = parseAdMediaStyle(campaign.media_style)
  const primary = (campaign.media_url || campaign.image_url || '').trim()
  const fromSlideshow = mediaStyle.slideshow?.urls?.filter(Boolean) ?? []
  const slideUrls = fromSlideshow.length > 0 ? fromSlideshow : primary ? [primary] : []
  const rawType = campaign.media_type
  const mediaType: AdCampaignMediaState['mediaType'] =
    rawType === 'video' || rawType === 'gif' ? rawType : 'image'

  return {
    mediaUrl: slideUrls[0] || primary,
    slideUrls,
    mediaStyle,
    mediaType,
  }
}

export function emptyCampaignMediaState(): AdCampaignMediaState {
  return {
    mediaUrl: '',
    slideUrls: [],
    mediaStyle: { ...DEFAULT_AD_MEDIA_STYLE },
    mediaType: 'image',
  }
}

export function buildCampaignMediaFields(state: AdCampaignMediaState) {
  const primary = state.slideUrls[0] || state.mediaUrl.trim()
  return {
    image_url: primary,
    media_url: primary,
    media_type: state.mediaType,
    media_style: buildMediaStylePayload(
      state.mediaStyle,
      state.slideUrls.length ? state.slideUrls : primary ? [primary] : [],
    ),
  }
}
