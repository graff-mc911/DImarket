import { useEffect } from 'react'
import { Building2, Settings } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { AnalyticsHub } from '../components/analytics/AnalyticsHub'

/**
 * Company dashboard — analytics-first workspace.
 * Keeps existing DImarket branding; full analytics embedded.
 */
export function CompanyDashboard() {
  const { user, profile } = useApp()

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    if (profile && profile.user_role !== 'company' && !profile.is_site_owner) {
      // Pros without company role can still view; customers redirect
      if (profile.user_role === 'client' || (!profile.is_professional && profile.user_role !== 'owner')) {
        navigateTo('/customer/dashboard')
      }
    }
  }, [user?.id, profile?.user_role])

  if (!user) return null

  const name = profile?.full_name || 'Company'

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between md:px-6">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868b]">
              <Building2 className="h-4 w-4" />
              Company dashboard
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[32px]">
              {name}
            </h1>
            <p className="mt-1 text-[15px] text-[#86868b]">
              Leads, conversion, branches, services & live analytics
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
              onClick={() => navigateTo('/settings')}
            >
              <Settings className="mr-1 inline h-3.5 w-3.5" />
              Settings
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]"
              onClick={() => navigateTo('/leads')}
            >
              Leads
            </button>
            <button
              type="button"
              className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white"
              onClick={() => navigateTo('/analytics')}
            >
              Full analytics
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <AnalyticsHub role="company" userId={user.id} />
      </div>
    </div>
  )
}
