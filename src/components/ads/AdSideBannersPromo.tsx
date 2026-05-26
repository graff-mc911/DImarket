import { Megaphone } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { navigateTo } from '../../lib/navigation'
import { sideSlotId } from '../../lib/adPlacementSlots'

type AdSideBannersPromoProps = {
  page?: 'home' | 'listings' | 'default'
}

/** CTA: бокові банери L1–R4 на головній та інших сторінках */
export function AdSideBannersPromo({ page = 'home' }: AdSideBannersPromoProps) {
  const { t } = useApp()

  const goAdvertising = () => {
    const slots = [
      sideSlotId(page, 'left', 1),
      sideSlotId(page, 'left', 2),
      sideSlotId(page, 'left', 3),
      sideSlotId(page, 'left', 4),
      sideSlotId(page, 'right', 1),
      sideSlotId(page, 'right', 2),
      sideSlotId(page, 'right', 3),
      sideSlotId(page, 'right', 4),
    ]
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dimarket_ad_preset_slots', JSON.stringify(slots))
    }
    navigateTo('/advertising')
  }

  return (
    <div className="rounded-[20px] border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.06)] p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(99,102,241,0.15)] text-[#4338ca]">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[#2f2a24]">{t('advertising.sidePromo.title')}</p>
          <p className="mt-1 text-xs leading-5 text-[#6f665d]">{t('advertising.sidePromo.desc')}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#9a8776]">
            {t('advertising.sidePromo.sizes')}
          </p>
        </div>
        <button type="button" onClick={goAdvertising} className="btn-primary shrink-0 rounded-full px-4 py-2 text-sm">
          {t('advertising.sidePromo.cta')}
        </button>
      </div>
    </div>
  )
}
