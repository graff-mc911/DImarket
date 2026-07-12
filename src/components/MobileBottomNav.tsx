import { useEffect, useState } from 'react'
import { Home, MessageSquare, Plus, Search, User } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { bindPathListener, navigateTo } from '../lib/navigation'

export function MobileBottomNav() {
  const { t, user } = useApp()
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    bindPathListener(sync)
    window.addEventListener('popstate', sync)
    return () => {
      bindPathListener(null)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  const isActive = (target: string) => {
    if (target === '/') return path === '/'
    return path === target || path.startsWith(`${target}/`)
  }

  const go = (target: string) => {
    if (target === path) return
    navigateTo(target)
  }

  const profilePath = user ? '/profile' : '/login'

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#3a4553] bg-[#232f3e] text-white xl:hidden"
      aria-label={t('nav.mobileNavigation')}
    >
      <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch px-2 pb-[env(safe-area-inset-bottom,0px)]">
        <NavItem
          active={isActive('/')}
          icon={<Home className="h-5 w-5" />}
          label={t('nav.home')}
          onClick={() => go('/')}
        />
        <NavItem
          active={isActive('/listings')}
          icon={<Search className="h-5 w-5" />}
          label={t('nav.search')}
          onClick={() => go('/listings')}
        />
        <button
          type="button"
          onClick={() => go('/create-ad')}
          className="relative -top-3 mx-1 flex flex-1 flex-col items-center justify-end"
          aria-label={t('nav.post')}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff9900] text-[#0f1111] shadow-[0_4px_14px_rgba(255,153,0,0.35)]">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </span>
        </button>
        <NavItem
          active={isActive('/messages')}
          icon={<MessageSquare className="h-5 w-5" />}
          label={t('nav.messages')}
          onClick={() => go(user ? '/messages' : '/login')}
        />
        <NavItem
          active={isActive(profilePath)}
          icon={<User className="h-5 w-5" />}
          label={t('nav.profile')}
          onClick={() => go(profilePath)}
        />
      </div>
    </nav>
  )
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
        active ? 'text-[#ff9900]' : 'text-[#cccccc]'
      }`}
    >
      {icon}
      <span className="max-w-[4.5rem] truncate">{label}</span>
    </button>
  )
}
