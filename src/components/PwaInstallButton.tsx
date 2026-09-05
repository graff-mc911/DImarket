import { Download } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { usePwaInstall } from '../contexts/PwaInstallContext'

type PwaInstallButtonVariant = 'header' | 'header-mobile' | 'menu' | 'settings'

const baseActionClass =
  'inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007185]'

export function PwaInstallButton({ variant }: { variant: PwaInstallButtonVariant }) {
  const { t } = useApp()
  const { canInstall, isStandalone, install } = usePwaInstall()

  if (!canInstall || isStandalone) return null

  const onClick = () => void install()

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseActionClass} hidden shrink-0 rounded-full bg-white px-3 py-1.5 text-xs text-[#2f2a24] shadow-sm ring-1 ring-[#d5d9d9] hover:bg-[#f7fafa] md:inline-flex`}
        aria-label={t('pwa.saveAsApp')}
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        <span className="max-w-[9rem] truncate">{t('pwa.saveAsApp')}</span>
      </button>
    )
  }

  if (variant === 'header-mobile') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseActionClass} amazon-header-block px-1 py-0.5 md:hidden`}
        aria-label={t('pwa.saveAsApp')}
      >
        <span className="amazon-header-block__top text-[10px]">{t('pwa.saveAsAppShort')}</span>
        <span className="amazon-header-block__bottom text-xs">
          <Download className="mx-auto h-4 w-4" aria-hidden />
        </span>
      </button>
    )
  }

  if (variant === 'menu') {
    return (
      <li>
        <button
          type="button"
          className="mobile-nav-more__item mobile-nav-more__item--install"
          onClick={onClick}
        >
          <span className="mobile-nav-more__icon" aria-hidden>
            <Download className="h-5 w-5" />
          </span>
          <span>{t('pwa.saveAsApp')}</span>
        </button>
      </li>
    )
  }

  return (
    <section className="mb-6 rounded-none border border-[rgba(233,202,177,0.7)] bg-[rgba(255,247,239,0.88)] p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f2a24] text-white">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-[#2f2a24]">{t('pwa.settingsTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f665d]">{t('pwa.settingsText')}</p>
          <button
            type="button"
            onClick={onClick}
            className={`${baseActionClass} mt-3 rounded-full bg-[#2f2a24] px-5 py-2.5 text-sm text-white hover:bg-black`}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
            {t('pwa.saveAsApp')}
          </button>
        </div>
      </div>
    </section>
  )
}
