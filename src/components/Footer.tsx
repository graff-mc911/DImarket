import { useApp } from '../contexts/AppContext'
import { FooterStats } from './FooterStats'

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="layout-page-gutter relative z-30 mt-auto w-full pb-2">
      <div className="w-full rounded-[16px] border border-white/70 bg-[rgba(252,246,240,0.96)] p-3 text-center shadow-[0_8px_20px_rgba(89,63,48,0.05)] backdrop-blur-xl md:p-4">
        <FooterStats compact />

        <div className="mt-4 border-t border-[rgba(190,168,150,0.28)] pt-4 text-center text-xs text-[#7a7168] sm:text-sm">
          <span>{`© ${currentYear} Dimarket. ${t('footer.allRightsReserved')}`}</span>
        </div>
      </div>
    </footer>
  )
}
