import { useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { isSiteOwner } from '../lib/siteOwner'
import {
  AnalyticsEmbed,
  AnalyticsHub,
  type AnalyticsRole,
} from '../components/analytics/AnalyticsHub'

function resolveRole(profile: {
  user_role?: string | null
  is_professional?: boolean | null
} | null): AnalyticsRole {
  if (profile?.user_role === 'company') return 'company'
  if (profile?.user_role === 'professional' || profile?.is_professional) return 'professional'
  if (profile?.user_role === 'owner') return 'admin'
  return 'customer'
}

export function Analytics() {
  const { user, profile } = useApp()
  const owner = isSiteOwner(profile, user?.email)

  const role: AnalyticsRole = useMemo(() => {
    if (owner) return 'admin'
    return resolveRole(profile)
  }, [owner, profile])

  useEffect(() => {
    if (!user) navigateTo('/login')
  }, [user?.id])

  if (!user) return null

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] py-6 pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AnalyticsHub role={role} userId={user.id} />
      </div>
    </div>
  )
}

/** Compact embed for Admin Panel / dashboards — defaults to platform analytics for owners */
export function AnalyticsEmbedPlatform({ userId }: { userId?: string }) {
  const { user } = useApp()
  const id = userId || user?.id || ''
  if (!id) return null
  return <AnalyticsEmbed role="admin" userId={id} />
}

export { AnalyticsEmbed }
