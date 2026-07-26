import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { isSiteOwner } from '../lib/siteOwner'
import { OwnerAdManager } from '../components/OwnerAdManager'
import { OwnerMarketHealth } from '../components/OwnerMarketHealth'
import { VerificationAdminPanel } from '../components/verification/VerificationAdminPanel'
import { AnalyticsEmbed } from './Analytics'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton'
import { useDashboardSection } from '../hooks/useDashboardSection'
import { loadDashboardTheme, saveDashboardTheme } from '../lib/dashboard/theme'
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  fetchAdminListings,
  fetchAdminPayments,
  fetchAdminSubscriptions,
  fetchAdminGoogleAdsRequests,
  updateGoogleAdsRequestStatus,
  fetchAdminReviews,
  fetchAdminStats,
  fetchFraudReports,
  fetchReviewReports,
  moderateReview,
  searchAdminProfiles,
  setListingStatus,
  setReviewReportStatus,
  updateAdminProfileFlags,
  type AdminCategory,
  type AdminListing,
  type AdminPayment,
  type AdminProfile,
  type AdminReport,
  type AdminReview,
  type AdminStats,
  type AdminSubscriptionRow,
} from '../lib/admin/adminPanel'
import type { AdCampaign, Profile } from '../lib/types'

type TabId =
  | 'overview'
  | 'users'
  | 'professionals'
  | 'companies'
  | 'projects'
  | 'reviews'
  | 'categories'
  | 'ads'
  | 'subscriptions'
  | 'payments'
  | 'support'
  | 'analytics'
  | 'reports'
  | 'verification'

const SECTION_TO_TAB: Record<string, TabId> = {
  overview: 'overview',
  users: 'users',
  professionals: 'professionals',
  companies: 'companies',
  projects: 'projects',
  reviews: 'reviews',
  categories: 'categories',
  ads: 'ads',
  payments: 'payments',
  support: 'support',
  analytics: 'analytics',
  reports: 'reports',
  verification: 'verification',
}

export function AdminPanel() {
  const { user } = useApp()
  const [profile, setProfile] = useState<Profile | null>(null)
  const { section, setSection } = useDashboardSection('admin', '/admin')
  const tab: TabId = SECTION_TO_TAB[section] || 'overview'
  const setTab = (id: TabId) => setSection(id)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(() => loadDashboardTheme())
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [notice, setNotice] = useState('')

  // shared data
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [listings, setListings] = useState<AdminListing[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([])
  const [googleAdsReqs, setGoogleAdsReqs] = useState<
    Array<{
      id: string
      user_id: string
      business_name: string | null
      website_url: string | null
      monthly_budget_eur: number | null
      goals: string | null
      status: string
      created_at: string
    }>
  >([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [fraud, setFraud] = useState<
    Array<{ id: string; status: string | null; created_at: string; summary?: string | null }>
  >([])
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([])
  const [campaignActionId, setCampaignActionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')

  const gate = useCallback(async () => {
    setLoading(true)
    const activeUser = user ?? (await supabase.auth.getUser()).data.user ?? null
    if (!activeUser) {
      navigateTo('/login')
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', activeUser.id)
      .maybeSingle()
    const p = data as Profile | null
    setProfile(p)
    if (!isSiteOwner(p, activeUser.email)) {
      navigateTo('/')
      return
    }
    const s = await fetchAdminStats()
    setStats(s)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void gate()
  }, [gate])

  useEffect(() => {
    saveDashboardTheme(dark)
  }, [dark])

  const loadTab = useCallback(async (id: TabId) => {
    if (id === 'overview' || id === 'analytics') {
      setStats(await fetchAdminStats())
    }
    if (id === 'users') {
      setUsers(await searchAdminProfiles(userQuery, 'all'))
    }
    if (id === 'professionals') {
      setUsers(await searchAdminProfiles(userQuery, 'professional'))
    }
    if (id === 'companies') {
      const all = await searchAdminProfiles(userQuery, 'all')
      setUsers(all.filter((u) => u.user_role === 'company'))
    }
    if (id === 'projects') {
      setListings(await fetchAdminListings())
    }
    if (id === 'reviews') {
      setReviews(await fetchAdminReviews())
    }
    if (id === 'categories') {
      setCategories(await fetchAdminCategories())
    }
    if (id === 'ads') {
      const { data } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setAdCampaigns((data as AdCampaign[]) || [])
    }
    if (id === 'subscriptions' || id === 'payments') {
      setPayments(await fetchAdminPayments())
      setUsers(await searchAdminProfiles('', 'premium'))
      setSubscriptions(await fetchAdminSubscriptions())
      setGoogleAdsReqs(await fetchAdminGoogleAdsRequests())
    }
    if (id === 'reports' || id === 'support') {
      setReports(await fetchReviewReports())
      setFraud(await fetchFraudReports())
    }
  }, [userQuery])

  useEffect(() => {
    if (!loading && profile) void loadTab(tab)
  }, [tab, loading, profile, loadTab])

  const toast = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-[#f5f5f7] px-4 py-10">
        <DashboardSkeleton />
      </div>
    )
  }

  if (!isSiteOwner(profile, user?.email)) return null

  return (
    <DashboardShell
      role="admin"
      title="Admin Panel"
      subtitle="Users · Professionals · Companies · Projects · Payments · Support"
      section={section}
      onSectionChange={setSection}
      dark={dark}
      onToggleDark={() => setDark((d) => !d)}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigateTo('/admin/ai')}
            className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[12px] font-semibold"
          >
            AI Admin
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/dashboard')}
            className="rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Classic cabinet
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {notice ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{notice}</p>
        ) : null}

        {tab === 'overview' && (
          <OverviewSection
            stats={stats}
            onOpen={(id) => setTab(id as TabId)}
          />
        )}

        {(tab === 'users' || tab === 'professionals' || tab === 'companies') && (
          <UsersSection
            title={
              tab === 'professionals'
                ? 'Professionals'
                : tab === 'companies'
                  ? 'Companies'
                  : 'Users'
            }
            users={users}
            query={userQuery}
            onQuery={setUserQuery}
            onSearch={() =>
              void (async () => {
                if (tab === 'companies') {
                  const all = await searchAdminProfiles(userQuery, 'all')
                  setUsers(all.filter((u) => u.user_role === 'company'))
                  return
                }
                setUsers(
                  await searchAdminProfiles(
                    userQuery,
                    tab === 'professionals' ? 'professional' : 'all',
                  ),
                )
              })()
            }
            onToggle={async (id, flags) => {
              const res = await updateAdminProfileFlags(id, flags)
              toast(res.ok ? 'Updated' : res.error || 'Failed')
              void loadTab(tab)
            }}
          />
        )}

        {tab === 'projects' && (
          <ProjectsSection
            listings={listings}
            onStatus={async (id, status) => {
              const res = await setListingStatus(id, status)
              toast(res.ok ? 'Listing updated' : res.error || 'Failed')
              void loadTab('projects')
            }}
          />
        )}

        {tab === 'reviews' && (
          <ReviewsSection
            reviews={reviews}
            onHide={async (id, hidden) => {
              const res = await moderateReview(id, { is_hidden: hidden })
              toast(res.ok ? 'Review updated' : res.error || 'Failed')
              void loadTab('reviews')
            }}
          />
        )}

        {tab === 'categories' && (
          <CategoriesSection
            categories={categories}
            name={catName}
            slug={catSlug}
            onName={setCatName}
            onSlug={setCatSlug}
            onCreate={async () => {
              const res = await createAdminCategory({ name: catName, slug: catSlug || catName })
              toast(res.ok ? 'Category created' : res.error || 'Failed')
              if (res.ok) {
                setCatName('')
                setCatSlug('')
                void loadTab('categories')
              }
            }}
            onDelete={async (id) => {
              const res = await deleteAdminCategory(id)
              toast(res.ok ? 'Deleted' : res.error || 'Failed')
              void loadTab('categories')
            }}
          />
        )}

        {tab === 'ads' && profile && (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-[16px] font-semibold text-[#1d1d1f]">Ads & campaigns</h2>
            <OwnerAdManager
              ownerId={profile.id}
              campaigns={adCampaigns}
              onRefresh={async () => {
                await loadTab('ads')
              }}
              onNotice={setNotice}
              onError={setError}
              campaignActionId={campaignActionId}
              setCampaignActionId={setCampaignActionId}
            />
            {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
          </section>
        )}

        {(tab === 'subscriptions' || tab === 'payments') && (
          <SubscriptionsSection
            payments={payments}
            premiumUsers={users}
            subscriptions={subscriptions}
            googleAds={googleAdsReqs}
            onGoogleAdsStatus={async (id, status) => {
              await updateGoogleAdsRequestStatus(id, status)
              setGoogleAdsReqs(await fetchAdminGoogleAdsRequests())
            }}
          />
        )}

        {tab === 'support' && (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-sm">
            <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Support inbox</h2>
            <p className="mt-1 text-[13px] text-[#86868b]">
              Review reports and fraud flags. Open Messages for live conversations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
                onClick={() => setTab('reports')}
              >
                Open reports
              </button>
              <button
                type="button"
                className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold"
                onClick={() => navigateTo('/messages')}
              >
                Messages
              </button>
              <button
                type="button"
                className="rounded-full border border-[#d2d2d7] px-4 py-2 text-[12px] font-semibold"
                onClick={() => navigateTo('/contact')}
              >
                Contact form
              </button>
            </div>
            <div className="mt-6">
              <ReportsSection
                reports={reports}
                fraud={fraud}
                onResolve={async (id, status) => {
                  const res = await setReviewReportStatus(id, status)
                  toast(res.ok ? 'Report updated' : res.error || 'Failed')
                  void loadTab('support')
                }}
              />
            </div>
          </section>
        )}

        {tab === 'analytics' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Analytics</h2>
              <a
                href="/analytics"
                className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f]"
              >
                Open full analytics
              </a>
            </div>
            <AnalyticsEmbed />
            <div className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="mb-4 text-[16px] font-semibold text-[#1d1d1f]">Market health</h2>
              <OwnerMarketHealth />
            </div>
          </section>
        )}

        {tab === 'reports' && (
          <ReportsSection
            reports={reports}
            fraud={fraud}
            onResolve={async (id, status) => {
              const res = await setReviewReportStatus(id, status)
              toast(res.ok ? 'Report updated' : res.error || 'Failed')
              void loadTab('reports')
            }}
          />
        )}

        {tab === 'verification' && (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-4 text-[16px] font-semibold text-[#1d1d1f]">
              Professional verification
            </h2>
            <VerificationAdminPanel />
          </section>
        )}
      </div>
    </DashboardShell>
  )
}

function Kpi({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-[#e8e8ed] bg-white p-4 text-left shadow-sm transition hover:border-[#d2d2d7]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">{label}</p>
      <p className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">{value}</p>
    </button>
  )
}

function OverviewSection({
  stats,
  onOpen,
}: {
  stats: AdminStats | null
  onOpen: (id: TabId) => void
}) {
  if (!stats) {
    return <p className="text-[13px] text-[#86868b]">Stats unavailable — apply admin migration.</p>
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Users" value={stats.users} onClick={() => onOpen('users')} />
      <Kpi label="Professionals" value={stats.professionals} onClick={() => onOpen('professionals')} />
      <Kpi label="Projects" value={stats.listings} onClick={() => onOpen('projects')} />
      <Kpi label="Active listings" value={stats.active_listings} onClick={() => onOpen('projects')} />
      <Kpi label="Reviews" value={stats.reviews} onClick={() => onOpen('reviews')} />
      <Kpi label="Open reports" value={stats.open_reports} onClick={() => onOpen('reports')} />
      <Kpi label="Pending ads" value={stats.pending_ads} onClick={() => onOpen('ads')} />
      <Kpi label="Premium" value={stats.premium_users} onClick={() => onOpen('subscriptions')} />
      <Kpi
        label="Pending verifications"
        value={stats.pending_verifications}
        onClick={() => onOpen('verification')}
      />
      <Kpi label="Payments" value={stats.payments} onClick={() => onOpen('subscriptions')} />
    </div>
  )
}

function UsersSection({
  title,
  users,
  query,
  onQuery,
  onSearch,
  onToggle,
}: {
  title: string
  users: AdminProfile[]
  query: string
  onQuery: (v: string) => void
  onSearch: () => void
  onToggle: (
    id: string,
    flags: {
      is_verified?: boolean
      is_premium?: boolean
      is_featured?: boolean
      is_professional?: boolean
    },
  ) => void
}) {
  return (
    <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold text-[#1d1d1f]">{title}</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search name / phone / id"
            className="rounded-full border border-[#d2d2d7] px-3 py-1.5 text-[13px] outline-none focus:border-[#1d1d1f]"
          />
          <button
            type="button"
            onClick={onSearch}
            className="rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Search
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-wide text-[#86868b]">
            <tr>
              <th className="pb-2 pr-3">User</th>
              <th className="pb-2 pr-3">Role</th>
              <th className="pb-2 pr-3">Flags</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#f0f0f2]">
                <td className="py-3 pr-3">
                  <p className="font-semibold text-[#1d1d1f]">{u.full_name || '—'}</p>
                  <p className="text-[11px] text-[#86868b]">{u.phone || u.id.slice(0, 8)}</p>
                </td>
                <td className="py-3 pr-3">{u.user_role || (u.is_professional ? 'pro' : 'client')}</td>
                <td className="py-3 pr-3 text-[11px]">
                  {u.is_verified ? '✓ verified ' : ''}
                  {u.is_premium ? '★ premium ' : ''}
                  {u.is_featured ? '◆ featured' : ''}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[11px] font-semibold"
                      onClick={() => onToggle(u.id, { is_verified: !u.is_verified })}
                    >
                      {u.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[11px] font-semibold"
                      onClick={() => onToggle(u.id, { is_premium: !u.is_premium })}
                    >
                      {u.is_premium ? 'Remove premium' : 'Premium'}
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[11px] font-semibold"
                      onClick={() => onToggle(u.id, { is_featured: !u.is_featured })}
                    >
                      {u.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#f5f5f7] px-2 py-1 text-[11px] font-semibold"
                      onClick={() => onToggle(u.id, { is_professional: !u.is_professional })}
                    >
                      {u.is_professional ? 'Demote' : 'Make pro'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? (
          <p className="py-6 text-center text-[13px] text-[#86868b]">No users found</p>
        ) : null}
      </div>
    </section>
  )
}

function ProjectsSection({
  listings,
  onStatus,
}: {
  listings: AdminListing[]
  onStatus: (id: string, status: string) => void
}) {
  return (
    <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Projects & listings</h2>
      <div className="mt-4 space-y-2">
        {listings.map((l) => (
          <div
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0f0f2] p-3"
          >
            <div>
              <p className="text-[14px] font-semibold text-[#1d1d1f]">{l.title}</p>
              <p className="text-[12px] text-[#86868b]">
                {l.status} · {l.location || '—'} · {new Date(l.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              {l.status !== 'active' ? (
                <button
                  type="button"
                  className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                  onClick={() => onStatus(l.id, 'active')}
                >
                  Activate
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700"
                onClick={() => onStatus(l.id, 'deleted')}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!listings.length ? (
          <p className="py-6 text-center text-[13px] text-[#86868b]">No projects</p>
        ) : null}
      </div>
    </section>
  )
}

function ReviewsSection({
  reviews,
  onHide,
}: {
  reviews: AdminReview[]
  onHide: (id: string, hidden: boolean) => void
}) {
  return (
    <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Reviews</h2>
      <div className="mt-4 space-y-2">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#f0f0f2] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[14px] font-semibold">
                  {r.reviewer_name} · {r.rating}★
                  {r.is_hidden ? (
                    <span className="ml-2 text-[11px] font-bold uppercase text-red-600">hidden</span>
                  ) : null}
                </p>
                <p className="mt-1 text-[13px] text-[#6e6e73]">{r.comment || '—'}</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[11px] font-semibold"
                onClick={() => onHide(r.id, !r.is_hidden)}
              >
                {r.is_hidden ? 'Unhide' : 'Hide'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CategoriesSection({
  categories,
  name,
  slug,
  onName,
  onSlug,
  onCreate,
  onDelete,
}: {
  categories: AdminCategory[]
  name: string
  slug: string
  onName: (v: string) => void
  onSlug: (v: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Categories</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Name"
          className="rounded-xl border border-[#d2d2d7] px-3 py-2 text-[13px]"
        />
        <input
          value={slug}
          onChange={(e) => onSlug(e.target.value)}
          placeholder="slug"
          className="rounded-xl border border-[#d2d2d7] px-3 py-2 text-[13px]"
        />
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
        >
          Add
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-[#f0f0f2] px-3 py-2"
          >
            <div>
              <p className="text-[14px] font-semibold">{c.name}</p>
              <p className="text-[11px] text-[#86868b]">{c.slug}</p>
            </div>
            <button
              type="button"
              className="text-[12px] font-semibold text-red-600"
              onClick={() => onDelete(c.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SubscriptionsSection({
  payments,
  premiumUsers,
  subscriptions,
  googleAds,
  onGoogleAdsStatus,
}: {
  payments: AdminPayment[]
  premiumUsers: AdminProfile[]
  subscriptions: AdminSubscriptionRow[]
  googleAds: Array<{
    id: string
    user_id: string
    business_name: string | null
    website_url: string | null
    monthly_budget_eur: number | null
    goals: string | null
    status: string
    created_at: string
  }>
  onGoogleAdsStatus: (id: string, status: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <a
          href="/pricing"
          className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f]"
        >
          View pricing page
        </a>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Stripe subscriptions</h2>
          <div className="mt-3 space-y-2">
            {subscriptions.map((s) => (
              <div key={s.id} className="rounded-xl border border-[#f0f0f2] p-3 text-[13px]">
                <p className="font-semibold">
                  {s.full_name || s.user_id.slice(0, 8)} · {s.plan_id}
                </p>
                <p className="text-[#86868b]">
                  {s.status} · {s.billing_interval} · {s.lead_credits} credits
                  {s.current_period_end
                    ? ` · until ${new Date(s.current_period_end).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
            ))}
            {!subscriptions.length ? (
              <p className="text-[13px] text-[#86868b]">No subscriptions yet</p>
            ) : null}
          </div>
        </section>
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Recent payments</h2>
          <div className="mt-3 space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#f0f0f2] p-3 text-[13px]">
                <p className="font-semibold">{p.payment_type}</p>
                <p className="text-[#86868b]">
                  {p.amount != null ? Number(p.amount).toFixed(2) : '—'} {p.currency} · {p.status} ·{' '}
                  {new Date(p.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {!payments.length ? (
              <p className="text-[13px] text-[#86868b]">No payments yet</p>
            ) : null}
          </div>
        </section>
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Premium / featured users</h2>
          <div className="mt-3 space-y-2">
            {premiumUsers.map((u) => (
              <div key={u.id} className="rounded-xl border border-[#f0f0f2] p-3 text-[13px]">
                <p className="font-semibold">{u.full_name || u.id.slice(0, 8)}</p>
              </div>
            ))}
            {!premiumUsers.length ? (
              <p className="text-[13px] text-[#86868b]">No premium users</p>
            ) : null}
          </div>
        </section>
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Google Ads requests</h2>
          <div className="mt-3 space-y-2">
            {googleAds.map((g) => (
              <div key={g.id} className="rounded-xl border border-[#f0f0f2] p-3 text-[13px]">
                <p className="font-semibold">
                  {g.business_name || 'Untitled'} · {g.status}
                </p>
                <p className="text-[#86868b]">
                  Budget €{g.monthly_budget_eur ?? '—'} · {g.website_url || 'no site'}
                </p>
                {g.status === 'pending' || g.status === 'in_review' ? (
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                      onClick={() => onGoogleAdsStatus(g.id, 'active')}
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#d2d2d7] px-3 py-1 text-[11px] font-semibold"
                      onClick={() => onGoogleAdsStatus(g.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {!googleAds.length ? (
              <p className="text-[13px] text-[#86868b]">No Google Ads requests</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

function ReportsSection({
  reports,
  fraud,
  onResolve,
}: {
  reports: AdminReport[]
  fraud: Array<{ id: string; status: string | null; created_at: string; summary?: string | null }>
  onResolve: (id: string, status: string) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Review reports</h2>
        <div className="mt-3 space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#f0f0f2] p-3">
              <p className="text-[13px] font-semibold">
                {r.reason} · <span className="uppercase text-[#86868b]">{r.status}</span>
              </p>
              <p className="mt-1 text-[12px] text-[#6e6e73]">{r.details || '—'}</p>
              {r.status === 'open' ? (
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                    onClick={() => onResolve(r.id, 'actioned')}
                  >
                    Actioned
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[11px] font-semibold"
                    onClick={() => onResolve(r.id, 'dismissed')}
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {!reports.length ? (
            <p className="text-[13px] text-[#86868b]">No review reports</p>
          ) : null}
        </div>
      </section>
      <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-[16px] font-semibold text-[#1d1d1f]">AI fraud reports</h2>
        <div className="mt-3 space-y-2">
          {fraud.map((f) => (
            <div key={f.id} className="rounded-xl border border-[#f0f0f2] p-3 text-[13px]">
              <p className="font-semibold">{f.status || 'open'}</p>
              <p className="text-[#6e6e73]">{f.summary || f.id}</p>
            </div>
          ))}
          {!fraud.length ? (
            <p className="text-[13px] text-[#86868b]">No fraud reports</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
