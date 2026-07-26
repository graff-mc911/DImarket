import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Flag,
  FolderKanban,
  FolderTree,
  Heart,
  Images,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Receipt,
  Settings,
  Star,
  Users,
  Wallet,
} from 'lucide-react'
import type { DashboardRole } from './roles'

export type DashNavItem = {
  id: string
  label: string
  icon: LucideIcon
  /** External route — navigates away from dashboard */
  href?: string
  badgeKey?: 'messages' | 'notifications' | 'leads' | 'projects'
}

export type DashQuickAction = {
  id: string
  label: string
  href: string
}

const CUSTOMER_NAV: DashNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'My Projects', icon: FolderKanban },
  { id: 'saved', label: 'Saved Professionals', icon: Bookmark },
  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages', badgeKey: 'messages' },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'favorites', label: 'Favorites', icon: Heart, href: '/favorites' },
  { id: 'notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
]

const PRO_NAV: DashNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'My Leads', icon: Briefcase, badgeKey: 'leads' },
  { id: 'projects', label: 'Accepted Projects', icon: FolderKanban },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/pro/calendar' },
  { id: 'portfolio', label: 'Portfolio', icon: Images, href: '/profile' },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages', badgeKey: 'messages' },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'availability', label: 'Availability', icon: CalendarDays },
  { id: 'notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
]

const COMPANY_NAV: DashNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Company Profile', icon: Building2 },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'certificates', label: 'Certificates', icon: BadgeCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Briefcase, href: '/leads', badgeKey: 'leads' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/messages', badgeKey: 'messages' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
]

const ADMIN_NAV: DashNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'professionals', label: 'Professionals', icon: Briefcase },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'support', label: 'Support', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ads', label: 'Ads', icon: FileText },
  { id: 'verification', label: 'Verification', icon: BadgeCheck },
]

export function navForRole(role: DashboardRole): DashNavItem[] {
  switch (role) {
    case 'admin':
      return ADMIN_NAV
    case 'company':
      return COMPANY_NAV
    case 'professional':
      return PRO_NAV
    case 'customer':
    default:
      return CUSTOMER_NAV
  }
}

export function quickActionsForRole(role: DashboardRole): DashQuickAction[] {
  switch (role) {
    case 'customer':
      return [
        { id: 'create', label: 'Create Project', href: '/create-project' },
        { id: 'profile', label: 'Edit Profile', href: '/settings' },
        { id: 'estimate', label: 'Cost Estimate', href: '/cost-estimator' },
      ]
    case 'professional':
      return [
        { id: 'leads', label: 'Browse Leads', href: '/projects' },
        { id: 'portfolio', label: 'Upload Portfolio', href: '/profile' },
        { id: 'profile', label: 'Edit Profile', href: '/settings' },
        { id: 'calendar', label: 'Availability', href: '/pro/calendar' },
      ]
    case 'company':
      return [
        { id: 'profile', label: 'Edit Profile', href: '/settings' },
        { id: 'portfolio', label: 'Upload Portfolio', href: '/profile' },
        { id: 'invite', label: 'Invite Company', href: '/for-companies' },
        { id: 'leads', label: 'Browse Leads', href: '/leads' },
      ]
    case 'admin':
      return [
        { id: 'users', label: 'Manage Users', href: '/admin?section=users' },
        { id: 'classic', label: 'Classic Cabinet', href: '/dashboard' },
        { id: 'ai', label: 'AI Admin', href: '/admin/ai' },
      ]
    default:
      return []
  }
}

export function defaultSection(role: DashboardRole): string {
  return 'overview'
}

export function parseSection(role: DashboardRole, raw: string | null | undefined): string {
  const items = navForRole(role)
  const id = (raw || '').trim() || defaultSection(role)
  if (items.some((i) => i.id === id && !i.href)) return id
  if (items.some((i) => i.id === id)) return id
  return defaultSection(role)
}
