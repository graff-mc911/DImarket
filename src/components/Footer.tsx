import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'
import { useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  languageDisplayCode,
  languageOptionLabel,
  type AppLanguage,
} from '../lib/languageDisplay'
import { navigateTo } from '../lib/navigation'
import { labelKeyFor, navEntriesFor, type NavEntry } from '../lib/navMap'
import { LANGUAGES } from '../lib/types'
import { FooterStats } from './FooterStats'
import { LanguageFlag } from './LanguageFlag'

const FOOTER_COLUMNS: Array<{
  titleKey: 'footer.companyCol' | 'footer.servicesCol' | 'footer.professionalsCol' | 'footer.supportCol'
  surface:
    | 'footer-company'
    | 'footer-services'
    | 'footer-professionals'
    | 'footer-support'
  /** Preserve historical link order within each column. */
  ids: string[]
}> = [
  {
    titleKey: 'footer.companyCol',
    surface: 'footer-company',
    ids: ['how-it-works-footer', 'about', 'advertising', 'contact', 'pricing'],
  },
  {
    titleKey: 'footer.servicesCol',
    surface: 'footer-services',
    ids: ['search', 'publish-request', 'commercial-agents', 'manufacturers', 'assistant', 'publish', 'advanced-search'],
  },
  {
    titleKey: 'footer.professionalsCol',
    surface: 'footer-professionals',
    ids: ['professionals', 'commercial-agents', 'for-companies', 'register', 'verification', 'for-pros'],
  },
  {
    titleKey: 'footer.supportCol',
    surface: 'footer-support',
    ids: ['help', 'privacy', 'cookies', 'gdpr', 'terms', 'impressum'],
  },
]

function pickEntries(surface: (typeof FOOTER_COLUMNS)[number]['surface'], ids: string[]): NavEntry[] {
  const byId = new Map(navEntriesFor(surface).map((e) => [e.id, e]))
  return ids.map((id) => byId.get(id)).filter(Boolean) as NavEntry[]
}

export function Footer() {
  const { t, user, language, setLanguage } = useApp()
  const currentYear = new Date().getFullYear()

  const linkClass =
    'text-sm text-[#c9cdd3] transition hover:text-white hover:underline'

  const go = (path: string) => navigateTo(path)
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const columnLinks = FOOTER_COLUMNS.map((col) => ({
    title: t(col.titleKey),
    links: pickEntries(col.surface, col.ids).map((entry) => ({
      label: t(labelKeyFor(entry, col.surface)),
      path: entry.path,
    })),
  }))

  const primaryLangs = useMemo(
    () =>
      LANGUAGES.filter((l) =>
        ['en', 'uk', 'ru', 'de', 'pl', 'es', 'fr', 'it'].includes(l.code),
      ) as AppLanguage[],
    [],
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
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('footer.languages')}>
                {primaryLangs.map((lang) => {
                  const selected = language.code === lang.code
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      aria-pressed={selected}
                      aria-label={languageOptionLabel(lang)}
                      className={`lang-footer-chip ${selected ? 'is-selected' : ''}`}
                    >
                      <LanguageFlag languageCode={lang.code} size={20} />
                      <span className="lang-footer-chip__code">{languageDisplayCode(lang.code)}</span>
                      <span className="lang-footer-chip__name">{lang.name}</span>
                    </button>
                  )
                })}
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
