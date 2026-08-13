import { supabase } from './supabase'
import { fetchNotifications, type AppNotification } from './notifications/notifications'
import { fetchConversationsForUser } from './chat/conversations'
import type { Listing, Profile, Quote } from './types'

export type CustomerQuoteRow = Quote & {
  professional?: {
    id: string
    full_name: string | null
    profile_photo: string | null
    avatar_url: string | null
    rating: number | null
  } | null
  listing?: { id: string; title: string } | null
}

export type FavoritePro = {
  savedId: string
  profile: Pick<
    Profile,
    | 'id'
    | 'full_name'
    | 'location'
    | 'rating'
    | 'total_reviews'
    | 'profile_photo'
    | 'avatar_url'
    | 'is_verified'
    | 'verification_level'
  > | null
}

export type CustomerDashboardStats = {
  projects: Listing[]
  activeProjects: number
  quotes: CustomerQuoteRow[]
  quotesPending: number
  invoices: CustomerQuoteRow[]
  invoiceTotal: number
  unreadMessages: number
  favoritePros: FavoritePro[]
  notifications: AppNotification[]
  unreadNotifications: number
  /** last 7 days project publishes */
  projectsByDay: number[]
  quotesByDay: number[]
  dayLabels: string[]
  profileComplete: number
  profileHints: Array<{ id: string; label: string; done: boolean; href: string }>
}

function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function lastNDays(n: number): string[] {
  const out: string[] = []
  const now = startOfDay()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push(isoDay(d))
  }
  return out
}

function dayLabel(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
}

export async function fetchCustomerDashboardStats(
  userId: string,
  profile: Profile | null,
): Promise<CustomerDashboardStats> {
  const days = lastNDays(7)
  const weekAgo = days[0]

  const [projectsRes, conversations, notifications, savedRes] = await Promise.all([
    supabase
      .from('listings')
      .select('*')
      .eq('author_id', userId)
      .eq('listing_type', 'service_request')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(40),
    fetchConversationsForUser(userId),
    fetchNotifications(userId, 20),
    supabase
      .from('saved_items')
      .select('id, item_id, created_at')
      .eq('user_id', userId)
      .eq('item_type', 'profile')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const projects = ((projectsRes.data ?? []) as Listing[]) || []
  const projectIds = projects.map((p) => p.id)

  let quotes: CustomerQuoteRow[] = []
  if (projectIds.length) {
    const { data } = await supabase
      .from('quotes')
      .select(
        '*, professional:profiles!quotes_professional_id_fkey(id, full_name, profile_photo, avatar_url, rating), listing:listings!quotes_listing_id_fkey(id, title)',
      )
      .in('listing_id', projectIds)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (data) {
      quotes = data as unknown as CustomerQuoteRow[]
    } else {
      // Fallback without FK aliases
      const { data: plain } = await supabase
        .from('quotes')
        .select('*')
        .in('listing_id', projectIds)
        .order('updated_at', { ascending: false })
        .limit(50)
      quotes = ((plain ?? []) as Quote[]) as CustomerQuoteRow[]

      const proIds = [...new Set(quotes.map((q) => q.professional_id).filter(Boolean))]
      if (proIds.length) {
        const { data: pros } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo, avatar_url, rating')
          .in('id', proIds)
        const map = new Map((pros ?? []).map((p) => [p.id, p]))
        quotes = quotes.map((q) => ({
          ...q,
          professional: (map.get(q.professional_id) as CustomerQuoteRow['professional']) || null,
          listing: projects.find((p) => p.id === q.listing_id)
            ? { id: q.listing_id, title: projects.find((p) => p.id === q.listing_id)!.title }
            : null,
        }))
      }
    }
  }

  const invoices = quotes.filter((q) => q.status === 'sent' || q.status === 'accepted')
  const invoiceTotal = invoices.reduce((s, q) => s + (Number(q.total) || 0), 0)
  const quotesPending = quotes.filter((q) => q.status === 'sent' || q.status === 'draft').length

  let favoritePros: FavoritePro[] = []
  if (!savedRes.error && savedRes.data?.length) {
    const ids = savedRes.data.map((s) => s.item_id)
    const { data: pros } = await supabase
      .from('profiles')
      .select('id, full_name, location, rating, total_reviews, profile_photo, avatar_url, is_verified, verification_level')
      .in('id', ids)
    const map = new Map((pros ?? []).map((p) => [p.id, p]))
    favoritePros = savedRes.data.map((s) => ({
      savedId: s.id,
      profile: (map.get(s.item_id) as FavoritePro['profile']) || null,
    }))
  }

  const projectsByDay = days.map(
    (d) => projects.filter((p) => p.created_at.slice(0, 10) === d).length,
  )
  const quotesByDay = days.map(
    (d) =>
      quotes.filter((q) => (q.updated_at || q.created_at || '').slice(0, 10) === d).length,
  )

  // Ignore weekAgo unused warning by referencing in filter optional future
  void weekAgo

  const profileHints = [
    {
      id: 'name',
      label: 'Full name',
      done: Boolean(profile?.full_name?.trim()),
      href: '/settings',
    },
    {
      id: 'phone',
      label: 'Phone',
      done: Boolean(profile?.phone?.trim()),
      href: '/settings',
    },
    {
      id: 'location',
      label: 'Location',
      done: Boolean(profile?.location?.trim()),
      href: '/settings',
    },
    {
      id: 'photo',
      label: 'Photo',
      done: Boolean(profile?.profile_photo?.trim() || profile?.avatar_url?.trim()),
      href: '/profile',
    },
    {
      id: 'project',
      label: 'First project',
      done: projects.length > 0,
      href: '/create-project',
    },
  ]
  const profileComplete = Math.round(
    (profileHints.filter((h) => h.done).length / profileHints.length) * 100,
  )

  return {
    projects,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    quotes,
    quotesPending,
    invoices,
    invoiceTotal,
    unreadMessages: conversations.reduce((s, c) => s + (c.unread_count || 0), 0),
    favoritePros,
    notifications,
    unreadNotifications: notifications.filter((n) => !n.is_read).length,
    projectsByDay,
    quotesByDay,
    dayLabels: days.map(dayLabel),
    profileComplete,
    profileHints,
  }
}

export const CUSTOMER_DASH_THEME_KEY = 'dimarket_customer_dashboard_theme'
