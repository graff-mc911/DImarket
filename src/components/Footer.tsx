import { Facebook, Instagram, Linkedin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()

  const linkClass =
    'text-sm text-[var(--ink-600)] transition hover:text-[var(--brand-primary)]'

  const go = (path: string) => navigateTo(path)

  return (
    <footer className="layout-page-gutter relative z-10 mt-auto w-full border-t border-[var(--glass-border)] bg-white pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-10">
      <div className="layout-page-content">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-1">
            <button type="button" onClick={() => go('/')} className="text-left">
              <Logo variant="text" size="md" />
            </button>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--ink-600)]">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[var(--ink-900)]">
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
            <h3 className="text-sm font-bold text-[var(--ink-900)]">
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
            <h3 className="text-sm font-bold text-[var(--ink-900)]">Legal</h3>
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

        <div className="mt-8 flex flex-col gap-4 border-t border-[var(--glass-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--ink-500)]">
            {`© ${currentYear} DImarket. ${t('footer.allRightsReserved')}`}
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--ink-600)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--ink-600)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--glass-border)] text-[var(--ink-600)] transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
