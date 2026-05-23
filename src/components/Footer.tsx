import { useApp } from '../contexts/AppContext'
import { FooterStats } from './FooterStats'

export function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-40 mt-auto w-full px-4 pb-2 md:px-6 xl:px-8 2xl:px-10">
      <div className="w-full rounded-[16px] border border-white/70 bg-[rgba(252,246,240,0.96)] p-2 shadow-[0_8px_20px_rgba(89,63,48,0.05)] backdrop-blur-xl md:p-2.5">
        <FooterStats compact />

        <div className="mt-1.5 flex flex-col gap-0.5 border-t border-[rgba(190,168,150,0.28)] pt-1.5 text-[10px] text-[#7a7168] md:flex-row md:items-center md:justify-between">
          <span>{`© ${currentYear} Dimarket. ${t('footer.allRightsReserved')}`}</span>
          <span className="line-clamp-1">{t('footer.legalRight')}</span>
        </div>
      </div>
    </footer>
  )
}
