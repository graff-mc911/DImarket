import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { fetchHomepageMetrics, type HomeMetrics } from '../lib/homeMarketplace'
import { navigateTo } from '../lib/navigation'
import { LANGUAGES } from '../lib/types'
import { FooterStats } from './FooterStats'
import { HomeDownloadApp } from './home/HomeDownloadApp'

export function Footer() {
  const { t, user, language, setLanguage } = useApp()
  const currentYear = new Date().getFullYear()
  const [metrics, setMetrics] = useState<HomeMetrics | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await fetchHomepageMetrics()
      if (!cancelled) setMetrics(data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const linkClass =
    'text-sm text-[#c9cdd3] transition hover:text-white hover:underline'

  const go = (path: string) => navigateTo(path)
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const columnLinks = [
    {
      title: t('footer.companyCol'),
      links: [
        { label: t('footer.howItWorks'), path: '/for-professionals' },
        { label: t('footer.about'), path: '/contact' },
        { label: t('footer.advertisingLink'), path: '/advertising' },
        { label: t('footer.contactLink'), path: '/contact' },
        { label: t('footer.pricing'), path: '/pricing' },
      ],
    },
    {
      title: t('footer.servicesCol'),
      links: [
        { label: t('footer.browseListings'), path: '/listings' },
        { label: t('footer.marketplace'), path: '/buy-sell' },
        { label: t('footer.jobs'), path: '/jobs' },
        { label: t('homePremium.postProject'), path: '/create-project' },
        { label: t('header.aiAssistant'), path: '/assistant' },
        { label: t('header.sell'), path: '/create-ad' },
        { label: t('advancedSearch.title'), path: '/search' },
      ],
    },
    {
      title: t('footer.professionalsCol'),
      links: [
        { label: t('header.findProfessionals'), path: '/professionals' },
        { label: t('footer.forCompanies'), path: '/for-companies' },
        { label: t('footer.register'), path: '/register' },
        { label: t('footer.verification'), path: '/verification' },
        { label: t('footer.forPros'), path: '/for-professionals' },
      ],
    },
    {
      title: t('footer.supportCol'),
      links: [
        { label: t('footer.helpCenter'), path: '/contact' },
        { label: t('footer.privacy'), path: '/contact?topic=privacy' },
        { label: t('footer.cookies'), path: '/contact?topic=cookies' },
        { label: t('footer.gdpr'), path: '/contact?topic=gdpr' },
        { label: t('footer.terms'), path: '/contact?topic=terms' },
        { label: t('footer.impressum'), path: '/contact?topic=legal' },
      ],
    },
  ]

  const primaryLangs = LANGUAGES.filter((l) =>
    ['en', 'uk', 'ru', 'de', 'pl', 'es', 'fr', 'it'].includes(l.code),
  )

  return (
    <footer className="premium-footer relative z-10 mt-auto w-full">
      <div className="amazon-footer-back py-4 text-center">
        <button
          type="button"
          onClick={scrollTop}
          className="text-sm font-medium text-white hover:underline"
        >
          ↑ {t('footer.backToTop')}
        </button>
      </div>

      {!user && (
        <div className="amazon-footer-signin">
          <p className="mb-3 text-sm text-white">{t('footer.signInPrompt')}</p>
          <button type="button" onClick={() => go('/login')} className="amazon-footer-signin__btn">
            {t('header.signIn')}
          </button>
        </div>
      )}

      <div className="premium-footer__download layout-page-gutter">
        <div className="home-download__inner-row layout-page-content py-1">
          <div className="mb-3 text-center md:mb-0 md:text-left">
            <p className="text-sm font-bold text-white">{t('homePremium.appTitle')}</p>
            <p className="mt-1 text-xs text-[#aeb4bc]">{t('homePremium.appSubtitle')}</p>
          </div>
          <HomeDownloadApp
            compact
            appStoreUrl={metrics?.appStoreUrl}
            playStoreUrl={metrics?.playStoreUrl}
          />
        </div>
      </div>

      <div className="layout-page-gutter py-8">
        <div className="layout-page-content">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {columnLinks.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold text-white">{col.title}</h3>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.path + link.label}>
                      <button type="button" onClick={() => go(link.path)} className={linkClass}>
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-5 border-t border-[#2f3b4a] pt-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#aeb4bc]">
                {t('footer.languages')}
              </p>
              <div className="flex flex-wrap gap-2">
                {primaryLangs.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      language.code === lang.code
                        ? 'border-[#ff9900] text-[#ff9900]'
                        : 'border-[#3a4553] text-[#c9cdd3] hover:border-[#ff9900] hover:text-[#ff9900]'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#aeb4bc]">
                {t('footer.social')}
              </p>
              <div className="flex items-center gap-3">
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
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3a4553] text-[#cccccc] transition hover:border-[#ff9900] hover:text-[#ff9900]"
                  aria-label="X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="hidden md:block">
              <FooterStats compact />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#8b939e]">
            <button type="button" className="hover:text-white" onClick={() => go('/contact?topic=legal')}>
              {t('footer.legal')}
            </button>
            <button type="button" className="hover:text-white" onClick={() => go('/contact?topic=privacy')}>
              {t('footer.privacy')}
            </button>
            <button type="button" className="hover:text-white" onClick={() => go('/contact?topic=cookies')}>
              {t('footer.cookies')}
            </button>
            <button type="button" className="hover:text-white" onClick={() => go('/contact?topic=gdpr')}>
              {t('footer.gdpr')}
            </button>
            <span className="text-[#5c6570]">App Store · Google Play</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2f3b4a] layout-page-gutter py-4">
        <div className="layout-page-content">
          <p className="text-center text-xs text-[#aeb4bc] sm:text-left">
            © {currentYear} DImarket. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  )
}
