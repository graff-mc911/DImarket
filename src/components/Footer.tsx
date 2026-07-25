import { Facebook, Instagram, Linkedin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { FooterStats } from './FooterStats'

export function Footer() {
  const { t, user } = useApp()
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

  const columnLinks = [
    {
      title: t('footer.getToKnow'),
      links: [
        { label: t('footer.howItWorks'), path: '/for-professionals' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'AI Assistant', path: '/assistant' },
        { label: 'Analytics', path: '/analytics' },
        { label: t('footer.advertisingLink'), path: '/advertising' },
        { label: t('footer.contactLink'), path: '/contact' },
      ],
    },
    {
      title: t('footer.makeMoney'),
      links: [
        { label: t('footer.register'), path: '/register' },
        { label: t('footer.forCompanies'), path: '/for-companies' },
        { label: t('header.sell'), path: '/create-ad' },
      ],
    },
    {
      title: t('footer.platformTitleSimple'),
      links: [
        { label: t('header.findProfessionals'), path: '/professionals' },
        { label: t('footer.browseListings'), path: '/listings' },
        { label: t('footer.postRequest'), path: '/create-ad' },
      ],
    },
    {
      title: t('footer.supportTitle'),
      links: [
        { label: t('footer.privacy'), path: '/contact' },
        { label: t('footer.impressum'), path: '/contact' },
        { label: t('footer.terms'), path: '/contact' },
      ],
    },
  ]

  return (
    <footer className="relative z-10 mt-auto w-full">
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

      <div className="amazon-footer-main layout-page-gutter py-10">
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

          <div className="mt-8 hidden md:block">
            <FooterStats compact />
          </div>
        </div>
      </div>

      <div className="amazon-footer-bottom layout-page-gutter pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-6">
        <div className="layout-page-content">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs sm:text-left">
              {`© ${currentYear} DImarket. ${t('footer.allRightsReserved')}`}
            </p>
            {socialLinks}
          </div>
        </div>
      </div>
    </footer>
  )
}
