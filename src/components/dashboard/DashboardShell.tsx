import {
  Menu,
  Moon,
  Radio,
  Search,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { navigateTo } from '../../lib/navigation'
import {
  navForRole,
  quickActionsForRole,
  type DashNavItem,
} from '../../lib/dashboard/nav'
import { roleLabel, type DashboardRole } from '../../lib/dashboard/roles'
import { dashboardTone } from '../../lib/dashboard/theme'

export type DashboardBadges = Partial<{
  messages: number
  notifications: number
  leads: number
  projects: number
}>

type DashboardShellProps = {
  role: DashboardRole
  title: string
  subtitle?: string
  section: string
  onSectionChange: (id: string) => void
  dark: boolean
  onToggleDark: () => void
  live?: boolean
  badges?: DashboardBadges
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  children: ReactNode
  /** Extra top-right actions */
  actions?: ReactNode
}

function badgeFor(item: DashNavItem, badges?: DashboardBadges): number {
  if (!item.badgeKey || !badges) return 0
  return badges[item.badgeKey] || 0
}

export function DashboardShell({
  role,
  title,
  subtitle,
  section,
  onSectionChange,
  dark,
  onToggleDark,
  live,
  badges,
  searchPlaceholder = 'Search dashboard…',
  onSearch,
  children,
  actions,
}: DashboardShellProps) {
  const tone = dashboardTone(dark)
  const nav = useMemo(() => navForRole(role), [role])
  const quick = useMemo(() => quickActionsForRole(role), [role])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')

  const onNav = (item: DashNavItem) => {
    setMobileOpen(false)
    if (item.href) {
      navigateTo(item.href)
      return
    }
    onSectionChange(item.id)
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={
        (mobile
          ? 'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r shadow-2xl '
          : 'sticky top-0 hidden h-[calc(100vh-0px)] w-[260px] shrink-0 flex-col border-r lg:flex ') +
        tone.sidebar
      }
      aria-label={`${roleLabel(role)} dashboard navigation`}
    >
      <div className={`border-b px-4 py-5 ${tone.border}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${tone.muted}`}>
          DImarket · {roleLabel(role)}
        </p>
        <p className={`mt-1 truncate text-[15px] font-semibold ${tone.ink}`}>{title}</p>
        {live != null ? (
          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              live ? 'bg-emerald-500/15 text-emerald-500' : tone.muted
            }`}
          >
            <Radio className="h-3 w-3" aria-hidden />
            Live
          </span>
        ) : null}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Sections">
        {nav.map((item) => {
          const Icon = item.icon as LucideIcon
          const active = !item.href && section === item.id
          const count = badgeFor(item, badges)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item)}
              aria-current={active ? 'page' : undefined}
              className={
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ' +
                (active
                  ? dark
                    ? 'bg-white text-[#0b0b0f]'
                    : 'bg-[#1d1d1f] text-white'
                  : dark
                    ? 'text-white/70 hover:bg-white/5 hover:text-white'
                    : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]')
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {count > 0 ? (
                <span
                  className={
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ' +
                    (active
                      ? dark
                        ? 'bg-black/10'
                        : 'bg-white/20'
                      : 'bg-[#f5f5f7] text-[#1d1d1f]')
                  }
                >
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className={`border-t px-3 py-3 ${tone.border}`}>
        <p className={`mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tone.muted}`}>
          Quick actions
        </p>
        <div className="space-y-1">
          {quick.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setMobileOpen(false)
                navigateTo(a.href)
              }}
              className={`block w-full rounded-xl px-3 py-2 text-left text-[12px] font-semibold ${tone.soft} ${tone.hoverRow}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )

  return (
    <div className={`dashboard-system min-h-[80vh] transition-colors ${tone.page}`}>
      <div className="flex min-h-[80vh]">
        <Sidebar />

        {mobileOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <Sidebar mobile />
          </>
        ) : null}

        <div className="min-w-0 flex-1">
          <header
            className={`sticky top-0 z-20 border-b backdrop-blur-2xl ${tone.border} ${
              dark ? 'bg-[#0a0a0c]/85' : 'bg-white/85'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border lg:hidden ${tone.btnGhost}`}
                onClick={() => setMobileOpen(true)}
                aria-label="Open dashboard menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className={`truncate text-[20px] font-semibold tracking-tight md:text-[24px] ${tone.ink}`}>
                  {title}
                </h1>
                {subtitle ? <p className={`truncate text-[13px] ${tone.muted}`}>{subtitle}</p> : null}
              </div>

              <label className="relative hidden min-w-[200px] max-w-xs flex-1 md:block">
                <span className="sr-only">Search</span>
                <Search
                  className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${tone.muted}`}
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    onSearch?.(e.target.value)
                  }}
                  placeholder={searchPlaceholder}
                  className={`w-full rounded-full border py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-[#1d1d1f] ${tone.input}`}
                />
              </label>

              <button
                type="button"
                onClick={onToggleDark}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold ${tone.btnGhost}`}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
              </button>

              {actions}

              {mobileOpen ? (
                <button
                  type="button"
                  className="rounded-full border p-2 lg:hidden"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </header>

          <div className="px-4 py-6 md:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
