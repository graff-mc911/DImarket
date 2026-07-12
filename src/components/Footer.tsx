import { Facebook, Instagram, Linkedin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { FooterStats } from './FooterStats'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()

  const linkClass =
    'text-sm text-[#dddddd] transition hover:text-white hover:underline'

  const go = (path: string) => navigateTo(path)

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const socialLinks = (
    <div className="flex items-center justify-center gap-3 sm:justify-end">
      <a
        href="https://www.facebook.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a4553] text-[#cccccc] transition hover:border-[#ff9900] hover:text-[#ff9900]"
        aria-label="Facebook"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href="https://www.instagram.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a4553] text-[#cccccc] transition hover:border-[#ff9900] hover:text-[#ff9900]"
        aria-label="Instagram"
      >
        <Instagram className="h-4 w-4" />
      </a>
      <a
        href="https://www.linkedin.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a4553] text-[#cccccc] transition hover:border-[#ff9900] hover:text-[#ff9900]"
        aria-label="LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </a>
    </div>
  )

  return (
    <footer className="relative z-10 mt-auto w-full">
      {/* Мобільний футер: тільки лічильники + копірайт */}
      <div className="amazon-footer-main layout-page-gutter py-8 md:hidden">
        <div className="layout-page-content">
          <FooterStats compact standalone />
        </div>
      </div>

      <div className="amazon-footer-bottom layout-page-gutter pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-6 md:hidden">
        <div className="layout-page-content">
          <div className="flex flex-col gap-4">
            <p className="text-center text-xs">
              {`© ${currentYear} DImarket. ${t('footer.allRightsReserved')}`}
            </p>
            {socialLinks}
          </div>
        </div>
      </div>

      {/* Десктопний футер */}
      <div className="hidden md:block">
        <div className="amazon-footer-back py-4 text-center">
          <button
            type="button"
            onClick={scrollTop}
            className="text-sm font-medium text-white hover:underline"
          >
            ↑ {t('footer.backToTop') || 'Back to top'}
          </button>
        </div>

        <div className="amazon-footer-main layout-page-gutter py-10">
          <div className="layout-page-content">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-left">
                <button type="button" onClick={() => go('/')} className="text-left">
                  <Logo variant="text" size="md" inverted />
                </button>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[#cccccc]">
                  {t('footer.tagline')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  {t('footer.forProfessionals')}
                </h3>
                <ul className="mt-3 space-y-2">
                  <li>
                    <button type="button" onClick={() => go('/register')} className={linkClass}>
                      {t('footer.register')}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => go('/for-professionals')} className={linkClass}>
                      {t('footer.howItWorks')}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => go('/professionals')} className={linkClass}>
                      {t('header.findProfessionals')}
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  {t('footer.forCompanies')}
                </h3>
                <ul className="mt-3 space-y-2">
                  <li>
                    <button type="button" onClick={() => go('/for-companies')} className={linkClass}>
                      {t('footer.forCompanies')}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => go('/advertising')} className={linkClass}>
                      {t('footer.advertisingLink')}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => go('/contact')} className={linkClass}>
                      {t('footer.contactLink')}
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{t('footer.legal')}</h3>
                <ul className="mt-3 space-y-2">
                  <li>
                    <button type="button" onClick={() => go('/contact')} className={linkClass}>
                      {t('footer.privacy')}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => go('/contact')} className={linkClass}>
                      {t('footer.impressum')}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => go('/contact')} className={linkClass}>
                      {t('footer.terms')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <FooterStats compact />
          </div>
        </div>

        <div className="amazon-footer-bottom layout-page-gutter pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-6">
          <div className="layout-page-content">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs">
                {`© ${currentYear} DImarket. ${t('footer.allRightsReserved')}`}
              </p>
              {socialLinks}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
