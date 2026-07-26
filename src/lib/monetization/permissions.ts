import { getPlan, type PlanPermission } from './plans'

export function hasPlanPermission(
  planId: string | null | undefined,
  permission: PlanPermission,
): boolean {
  return getPlan(planId).permissions.includes(permission)
}

export function portfolioPhotoLimit(planId: string | null | undefined): number | null {
  if (hasPlanPermission(planId, 'unlimited_portfolio')) return null
  return 6
}

export function applicationLimitMonthly(planId: string | null | undefined): number | null {
  if (hasPlanPermission(planId, 'unlimited_applications')) return null
  return 10
}

export function savedProsLimit(planId: string | null | undefined): number | null {
  if (hasPlanPermission(planId, 'unlimited_saved_pros')) return null
  const plan = getPlan(planId)
  if (plan.audience === 'customer') return 5
  return null
}

export function employeeLimit(planId: string | null | undefined): number | null {
  if (hasPlanPermission(planId, 'unlimited_employees')) return null
  if (getPlan(planId).audience === 'company') return 3
  return 1
}

export function branchLimit(planId: string | null | undefined): number | null {
  if (hasPlanPermission(planId, 'unlimited_branches')) return null
  if (getPlan(planId).audience === 'company') return 1
  return 0
}
