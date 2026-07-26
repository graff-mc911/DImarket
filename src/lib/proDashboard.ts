import { supabase } from './supabase'
import { fetchMyApplications } from './projectApplications'
import { fetchNotifications, type AppNotification } from './notifications/notifications'
import { fetchConversationsForUser } from './chat/conversations'
import { buildOnboardingState } from './onboardingProgress'
import type { Profile, ProjectApplication, Quote } from './types'
import {
  averageResponseHours,
  countLeadStatuses,
  type StatusCounts,
} from './dashboard/statsExtras'
import type { LeadLifecycle } from './dashboard/projectStatus'

export type ProActivityItem = {
  id: string
  type: 'lead' | 'quote' | 'message' | 'review' | 'match' | 'notification'
  title: string
  subtitle?: string
  at: string
  href?: string
}

export type ProLeadRow = ProjectApplication & {
  listing?: {
    id: string
    title: string | null
    status: string | null
    city_name: string | null
  } | null
  matchScore?: number | null
}

export type ProDashboardStats = {
  todaysLeads: number
  openLeads: number
  revenue: number
  revenueCurrency: string
  pipeline: number
  unreadMessages: number
  quotesDraft: number
  quotesSent: number
  quotesAccepted: number
  quotesTotal: number
  rating: number
  totalReviews: number
  recentReviews: Array<{
    id: string
    rating: number
    comment: string | null
    reviewer_name: string | null
    created_at: string
  }>
  profileCompletion: number
  profileSteps: Array<{ id: string; label: string; done: boolean }>
  applications: ProjectApplication[]
  leads: ProLeadRow[]
  leadStatusCounts: StatusCounts<LeadLifecycle>
  avgResponseHours: number | null
  acceptedProjects: ProLeadRow[]
  quotes: Quote[]
  invoices: Quote[]
  notifications: AppNotification[]
  unreadNotifications: number
  activity: ProActivityItem[]
  leadsByDay: number[]
  revenueByDay: number[]
  calendarMarks: Record<string, number>
  dayLabels: string[]
  availabilityStatus: string
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
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export async function fetchProDashboardStats(
  userId: string,
  profile: Profile | null,
): Promise<ProDashboardStats> {
  const days = lastNDays(7)
  const today = isoDay(startOfDay())
  const weekAgo = days[0]

  const [
    apps,
    quotesRes,
    conversations,
    notifications,
    reviewsRes,
    leadsRes,
    matchesRes,
  ] = await Promise.all([
    fetchMyApplications(userId),
    supabase
      .from('quotes')
      .select('*')
      .eq('professional_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100),
    fetchConversationsForUser(userId),
    fetchNotifications(userId, 20),
    supabase
      .from('reviews')
      .select('id, rating, comment, reviewer_name, created_at')
      .eq('professional_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('listings')
      .select('id, created_at, title, city_name, urgency')
      .eq('listing_type', 'service_request')
      .eq('status', 'active')
      .gte('created_at', `${weekAgo}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('match_scores')
      .select('id, score, created_at, listing_id')
      .eq('contractor_id', userId)
      .gte('created_at', `${weekAgo}T00:00:00`)
      .order('created_at', { ascending: false })
      .limit(40),
  ])

  const quotes = ((quotesRes.data ?? []) as Quote[]) || []
  const recentReviews = (reviewsRes.data ?? []) as ProDashboardStats['recentReviews']
  const weekLeads = (leadsRes.data ?? []) as Array<{
    id: string
    created_at: string
    title: string
    city_name: string | null
    urgency: string | null
  }>
  const matches = (matchesRes.data ?? []) as Array<{
    id: string
    score: number
    created_at: string
    listing_id: string
  }>

  const hidden = new Set(apps.filter((a) => a.hidden).map((a) => a.listing_id))
  const openLeads = weekLeads.filter((l) => !hidden.has(l.id)).length
  const todaysLeads = weekLeads.filter((l) => l.created_at.slice(0, 10) === today).length

  const accepted = quotes.filter((q) => q.status === 'accepted')
  const revenue = accepted.reduce((s, q) => s + (Number(q.total) || 0), 0)
  const pipeline = quotes
    .filter((q) => q.status === 'sent' || q.status === 'draft')
    .reduce((s, q) => s + (Number(q.total) || 0), 0)

  const unreadMessages = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  const quotesDraft = quotes.filter((q) => q.status === 'draft').length
  const quotesSent = quotes.filter((q) => q.status === 'sent').length
  const quotesAccepted = accepted.length

  const leadsByDay = days.map(
    (d) => weekLeads.filter((l) => l.created_at.slice(0, 10) === d).length,
  )
  const revenueByDay = days.map((d) =>
    accepted
      .filter((q) => (q.updated_at || q.created_at || '').slice(0, 10) === d)
      .reduce((s, q) => s + (Number(q.total) || 0), 0),
  )

  const calendarMarks: Record<string, number> = {}
  for (const l of weekLeads) {
    const d = l.created_at.slice(0, 10)
    calendarMarks[d] = (calendarMarks[d] || 0) + 1
  }
  for (const q of quotes) {
    const d = (q.updated_at || q.created_at || '').slice(0, 10)
    if (d) calendarMarks[d] = (calendarMarks[d] || 0) + 1
  }

  const onboarding = buildOnboardingState({
    profile,
    workSubcategoryCount: profile?.work_subcategory_slugs?.length ?? 0,
    role:
      profile?.user_role === 'company'
        ? 'company'
        : profile?.user_role === 'professional'
          ? 'professional'
          : 'professional',
  })

  const STEP_LABELS: Record<string, string> = {
    photo: 'Photo',
    bio: 'Bio',
    categories: 'Categories',
    location: 'Location',
    phone: 'Phone',
  }

  const profileSteps =
    onboarding?.steps.map((s) => ({
      id: s.id,
      label: STEP_LABELS[s.id] || s.id,
      done: s.done,
    })) ?? []

  const profileCompletion = onboarding
    ? Math.round((onboarding.completedCount / onboarding.totalCount) * 100)
    : 0

  const activity: ProActivityItem[] = []

  for (const l of weekLeads.slice(0, 8)) {
    activity.push({
      id: `lead-${l.id}`,
      type: 'lead',
      title: l.title || 'New project lead',
      subtitle: [l.city_name, l.urgency].filter(Boolean).join(' · ') || undefined,
      at: l.created_at,
      href: '/projects',
    })
  }
  for (const q of quotes.slice(0, 6)) {
    activity.push({
      id: `quote-${q.id}`,
      type: 'quote',
      title: `Quote ${q.status}`,
      subtitle: `€${Math.round(Number(q.total) || 0).toLocaleString()}`,
      at: q.updated_at || q.created_at,
      href: q.application_id ? `/leads/${q.application_id}/quote` : '/projects',
    })
  }
  for (const r of recentReviews.slice(0, 4)) {
    activity.push({
      id: `review-${r.id}`,
      type: 'review',
      title: `${r.rating}★ review`,
      subtitle: r.reviewer_name || r.comment?.slice(0, 60) || undefined,
      at: r.created_at,
      href: '/profile',
    })
  }
  for (const m of matches.slice(0, 4)) {
    activity.push({
      id: `match-${m.id}`,
      type: 'match',
      title: `${Math.round(m.score)}% match`,
      subtitle: 'You were matched to a project',
      at: m.created_at,
      href: '/projects',
    })
  }
  for (const n of notifications.slice(0, 6)) {
    activity.push({
      id: `notif-${n.id}`,
      type: 'notification',
      title: n.title,
      subtitle: n.body?.slice(0, 80) || undefined,
      at: n.created_at,
      href: n.link_path || undefined,
    })
  }

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const listingIds = [...new Set(apps.map((a) => a.listing_id))]
  let listingMap = new Map<
    string,
    { id: string; title: string | null; status: string | null; city_name: string | null }
  >()
  if (listingIds.length) {
    const { data: listingRows } = await supabase
      .from('listings')
      .select('id, title, status, city_name')
      .in('id', listingIds)
    listingMap = new Map(
      ((listingRows ?? []) as Array<{
        id: string
        title: string | null
        status: string | null
        city_name: string | null
      }>).map((l) => [l.id, l]),
    )
  }

  const scoreByListing = new Map(matches.map((m) => [m.listing_id, m.score]))
  const leads: ProLeadRow[] = apps.map((a) => ({
    ...a,
    listing: listingMap.get(a.listing_id) || null,
    matchScore: scoreByListing.get(a.listing_id) ?? null,
  }))

  const acceptedProjects = leads.filter((l) => l.status === 'accepted')
  const invoices = quotes.filter((q) => q.status === 'sent' || q.status === 'accepted')

  return {
    todaysLeads,
    openLeads,
    revenue,
    revenueCurrency: 'EUR',
    pipeline,
    unreadMessages,
    quotesDraft,
    quotesSent,
    quotesAccepted,
    quotesTotal: quotes.length,
    rating: profile?.rating ?? 0,
    totalReviews: profile?.total_reviews ?? recentReviews.length,
    recentReviews,
    profileCompletion,
    profileSteps,
    applications: apps,
    leads,
    leadStatusCounts: countLeadStatuses(leads),
    avgResponseHours: averageResponseHours(apps, quotes),
    acceptedProjects,
    quotes,
    invoices,
    notifications,
    unreadNotifications: notifications.filter((n) => !n.is_read).length,
    activity: activity.slice(0, 18),
    leadsByDay,
    revenueByDay,
    calendarMarks,
    dayLabels: days.map(dayLabel),
    availabilityStatus: profile?.availability_status || 'available',
  }
}

export const PRO_DASH_THEME_KEY = 'dimarket_pro_dashboard_theme'
