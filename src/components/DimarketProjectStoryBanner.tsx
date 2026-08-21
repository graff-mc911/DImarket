import { useApp } from '../contexts/AppContext'
import { ProjectStoryBanner } from './ProjectStoryBanner'

const FALLBACK_IMAGE = '/media/banners/project-story-home.jpg'

/** Own-media mid-page story when no paid center campaign is booked. */
export function DimarketProjectStoryBanner({ className = '' }: { className?: string }) {
  const { t } = useApp()

  return (
    <ProjectStoryBanner
      href="/cost-estimator"
      title={t('ads.story.fallbackTitle')}
      imageSrc={FALLBACK_IMAGE}
      imageAlt=""
      rows={[
        {
          label: t('ads.story.client'),
          value: t('ads.story.fallbackClient'),
        },
        {
          label: t('ads.story.contractor'),
          value: t('ads.story.fallbackContractor'),
          accent: true,
        },
        {
          label: t('ads.story.location'),
          value: t('ads.story.fallbackLocation'),
        },
        {
          label: t('ads.story.budget'),
          value: t('ads.story.fallbackBudget'),
        },
      ]}
      quote={t('ads.story.fallbackQuote')}
      className={className}
    />
  )
}
