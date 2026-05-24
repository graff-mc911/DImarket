import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { FooterStats } from './FooterStats'
import { LayoutChrome } from './PageWithSideAds'

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const bump = () => setPath(window.location.pathname)
    window.addEventListener('popstate', bump)
    return () => window.removeEventListener('popstate', bump)
  }, [])

  return (
    <footer className="relative z-40 mt-auto w-full pb-2">
      <LayoutChrome path={path}>
        <div className="w-full rounded-[16px] border border-white/70 bg-[rgba(252,246,240,0.96)] p-3 text-center shadow-[0_8px_20px_rgba(89,63,48,0.05)] backdrop-blur-xl md:p-4">
          <FooterStats compact />

          <div className="mt-4 flex flex-col items-center gap-1 border-t border-[rgba(190,168,150,0.28)] pt-4 text-xs text-[#7a7168] sm:text-sm">
            <span>{`© ${currentYear} Dimarket. ${t('footer.allRightsReserved')}`}</span>
            <span className="max-w-2xl leading-relaxed">{t('footer.legalRight')}</span>
          </div>
        </div>
      </LayoutChrome>
    </footer>
  )
}
