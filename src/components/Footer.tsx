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
    <footer className="relative z-40 mt-auto w-full px-4 pb-2 md:px-6 xl:px-8 2xl:px-10">
      <div className="w-full rounded-[16px] border border-white/70 bg-[rgba(252,246,240,0.96)] p-2 shadow-[0_8px_20px_rgba(89,63,48,0.05)] backdrop-blur-xl md:p-2.5">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.1fr_0.75fr_0.75fr_0.8fr_0.95fr] xl:gap-3">
          <div className="min-w-0">
            <button onClick={() => navigateTo('/')} type="button" className="rounded-full">
              <Logo size="header" />
            </button>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#6f665d]">
              {t('footer.brandText')}
            </p>
          </div>

          <FooterLinkGroup title={t('footer.platformTitleSimple')} links={platformLinks} />
          <FooterLinkGroup title={t('footer.accountTitleSimple')} links={accountLinks} />
          <FooterLinkGroup title={t('footer.supportTitle')} links={supportLinks} />

          <div className="min-w-0">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9d8b7a]">
              {t('footer.adsTitle')}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                onClick={() => navigateTo('/advertising')}
                type="button"
                className="btn-secondary rounded-full px-2.5 py-1 text-[10px]"
              >
                {t('footer.adsButton')}
              </button>
              <button
                onClick={() => navigateTo('/contact')}
                type="button"
                className="btn-primary rounded-full px-2.5 py-1 text-[10px]"
              >
                {t('footer.contactButton')}
              </button>
            </div>
          </div>
        </div>

        <FooterStats compact />

        <div className="mt-1.5 flex flex-col gap-0.5 border-t border-[rgba(190,168,150,0.28)] pt-1.5 text-[10px] text-[#7a7168] md:flex-row md:items-center md:justify-between">
          <span>{`© ${currentYear} Dimarket. ${t('footer.allRightsReserved')}`}</span>
          <span className="line-clamp-1">{t('footer.legalRight')}</span>
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
    <div className="min-w-0">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9d8b7a]">
        {title}
      </h3>
      <div className="mt-1 flex flex-col gap-0.5">
        {links.map((link) => (
          <button
            key={link.path}
            onClick={() => navigateTo(link.path)}
            type="button"
            className="text-left text-[10px] font-medium text-[#5f5a54] transition hover:text-[#2f2a24]"
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  )
}
