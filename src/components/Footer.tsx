import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { FooterStats } from './FooterStats'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()

  const platformLinks = [
    { label: t('header.jobRequests'), path: '/listings' },
    { label: t('header.findProfessionals'), path: '/professionals' },
    { label: t('header.postJob'), path: '/create-ad' },
  ]

  const accountLinks = [
    { label: t('footer.signIn'), path: '/login' },
    { label: t('footer.register'), path: '/register' },
    { label: t('header.myProfile'), path: '/settings' },
  ]

  const supportLinks = [
    { label: t('footer.contactLink'), path: '/contact' },
    { label: t('footer.advertisingLink'), path: '/advertising' },
  ]

  return (
    <footer className="mt-auto w-full px-4 pb-3 md:px-6 xl:px-8 2xl:px-10">
      <div className="surface-shell w-full rounded-[22px] border border-white/70 bg-[rgba(252,246,240,0.96)] p-3 shadow-[0_12px_32px_rgba(89,63,48,0.06)] md:border-[var(--glass-border)] md:bg-[var(--bg-glass-top)] md:shadow-[0_12px_32px_rgba(55,70,50,0.06)] md:backdrop-blur-none md:p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_0.8fr_0.8fr_0.9fr_1fr]">
          <div>
            <button
              onClick={() => navigateTo('/')}
              type="button"
              className="rounded-full"
            >
              <Logo size="header" />
            </button>

            <p className="mt-2 max-w-md text-xs leading-5 text-[#6f665d]">
              {t('footer.brandText')}
            </p>

            <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-[#9a5525]">
              {t('footer.monetization')}
            </p>
          </div>

          <FooterLinkGroup
            title={t('footer.platformTitleSimple')}
            links={platformLinks}
          />

          <FooterLinkGroup
            title={t('footer.accountTitleSimple')}
            links={accountLinks}
          />

          <FooterLinkGroup
            title={t('footer.supportTitle')}
            links={supportLinks}
          />

          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#9d8b7a]">
              {t('footer.adsTitle')}
            </h3>

            <p className="mt-2 text-xs leading-5 text-[#6f665d]">
              {t('footer.adsText')}
            </p>

            <div className="mt-2.5 flex flex-col gap-2">
              <button
                onClick={() => navigateTo('/advertising')}
                type="button"
                className="btn-secondary rounded-full px-3 py-1.5 text-xs"
              >
                {t('footer.adsButton')}
              </button>

              <button
                onClick={() => navigateTo('/contact')}
                type="button"
                className="btn-primary rounded-full px-3 py-1.5 text-xs"
              >
                {t('footer.contactButton')}
              </button>
            </div>
          </div>
        </div>

        <FooterStats />

        <div className="mt-4 flex flex-col gap-1 border-t border-[rgba(190,168,150,0.28)] pt-3 text-xs text-[#7a7168] md:flex-row md:items-center md:justify-between">
          <span>{`© ${currentYear} Dimarket. ${t('footer.allRightsReserved')}`}</span>
          <span>{t('footer.legalRight')}</span>
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; path: string }>
}) {
  return (
    <div>
      <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#9d8b7a]">
        {title}
      </h3>

      <div className="mt-2 flex flex-col gap-1.5">
        {links.map((link) => (
          <button
            key={link.path}
            onClick={() => navigateTo(link.path)}
            type="button"
            className="text-left text-xs font-medium text-[#5f5a54] transition hover:text-[#2f2a24]"
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  )
}
