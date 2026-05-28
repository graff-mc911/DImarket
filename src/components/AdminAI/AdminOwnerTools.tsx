import { useLayoutEffect, useState } from 'react'
import { Bot, Megaphone } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { bindPathListener, navigateTo } from '../../lib/navigation'
import { isSiteOwner } from '../../lib/siteOwner'
import { AdminAIPanel } from './AdminAIPanel'

/** Швидкий доступ власника на мобільному + плаваюча Admin AI (окремо від фіолетового sales-бота). */
export function AdminOwnerTools() {
  const { user, profile, t } = useApp()
  const [path, setPath] = useState(() => window.location.pathname)

  useLayoutEffect(() => {
    const sync = (p: string) => setPath(p)
    bindPathListener(sync)
    return () => bindPathListener(null)
  }, [])

  if (!isSiteOwner(profile, user?.email)) return null

  const onAiPage = path === '/admin/ai'
  const onMarketingPage = path === '/admin/marketing-agent'

  return (
    <>
      {!onAiPage && <AdminAIPanel anchor="left" />}

      <div className="pointer-events-none fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] left-3 z-[280] flex flex-col gap-2 md:hidden">
        {!onAiPage && (
          <button
            type="button"
            onClick={() => navigateTo('/admin/ai')}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,109,44,0.35)] bg-white/95 px-3 py-2 text-xs font-semibold text-[#b85d1c] shadow-md backdrop-blur-sm"
          >
            <Bot className="h-4 w-4" />
            <span className="max-w-[7rem] truncate">{t('ai.admin.title')}</span>
          </button>
        )}
        {!onMarketingPage && (
          <button
            type="button"
            onClick={() => navigateTo('/admin/marketing-agent')}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-[rgba(99,102,241,0.35)] bg-white/95 px-3 py-2 text-xs font-semibold text-[#4338ca] shadow-md backdrop-blur-sm"
          >
            <Megaphone className="h-4 w-4" />
            <span className="max-w-[7rem] truncate">{t('marketing.admin.shortTitle')}</span>
          </button>
        )}
      </div>
    </>
  )
}
