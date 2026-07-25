import { useApp } from '../../contexts/AppContext'

interface HomeDownloadAppProps {
  appStoreUrl?: string
  playStoreUrl?: string
  compact?: boolean
}

export function HomeDownloadApp({
  appStoreUrl = '',
  playStoreUrl = '',
  compact = false,
}: HomeDownloadAppProps) {
  const { t } = useApp()
  const appleHref = appStoreUrl || '#'
  const playHref = playStoreUrl || '#'
  const comingSoon = !appStoreUrl && !playStoreUrl

  return (
    <section
      className={`home-download ${compact ? 'home-download--compact' : ''}`}
      aria-labelledby={compact ? undefined : 'home-download-title'}
    >
      <div className={compact ? '' : 'layout-page-gutter home-download__inner'}>
        {!compact && (
          <div className="home-download__copy">
            <p className="home-section__eyebrow home-section__eyebrow--on-dark">
              {t('homePremium.appEyebrow')}
            </p>
            <h2 id="home-download-title" className="home-download__title">
              {t('homePremium.appTitle')}
            </h2>
            <p className="home-download__subtitle">{t('homePremium.appSubtitle')}</p>
          </div>
        )}

        <div className="home-download__badges">
          <a
            href={playHref}
            className="home-store-badge"
            {...(playStoreUrl
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : { onClick: (e) => e.preventDefault(), 'aria-disabled': true })}
          >
            <span className="home-store-badge__mark" aria-hidden>
              ▶
            </span>
            <span>
              <small>{t('homePremium.getItOn')}</small>
              <strong>Google Play</strong>
            </span>
          </a>
          <a
            href={appleHref}
            className="home-store-badge"
            {...(appStoreUrl
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : { onClick: (e) => e.preventDefault(), 'aria-disabled': true })}
          >
            <span className="home-store-badge__mark" aria-hidden>
              &#63743;
            </span>
            <span>
              <small>{t('homePremium.downloadOn')}</small>
              <strong>App Store</strong>
            </span>
          </a>
        </div>
        {comingSoon && !compact ? (
          <p className="home-download__soon">{t('homePremium.appComingSoon')}</p>
        ) : null}
      </div>
    </section>
  )
}
