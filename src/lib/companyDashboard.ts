import { supabase } from './supabase'
import { fetchProDashboardStats, type ProDashboardStats } from './proDashboard'
import type { Profile } from './types'

export type CompanyEmployee = {
  id: string
  name: string
  role: string
  email?: string
}

export type CompanyBranch = {
  id: string
  name: string
  city: string
  address?: string
}

export type CompanyDocument = {
  id: string
  title: string
  kind: 'document' | 'certificate'
  url?: string
  issuedAt?: string
}

export type CompanyWorkspace = {
  employees: CompanyEmployee[]
  branches: CompanyBranch[]
  documents: CompanyDocument[]
  certificates: CompanyDocument[]
  services: string[]
}

export type CompanyDashboardStats = ProDashboardStats & {
  workspace: CompanyWorkspace
  companyName: string
}

const EMPTY_WORKSPACE: CompanyWorkspace = {
  employees: [],
  branches: [],
  documents: [],
  certificates: [],
  services: [],
}

function parseWorkspace(raw: unknown): CompanyWorkspace {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_WORKSPACE }
  const o = raw as Record<string, unknown>
  return {
    employees: Array.isArray(o.employees) ? (o.employees as CompanyEmployee[]) : [],
    branches: Array.isArray(o.branches) ? (o.branches as CompanyBranch[]) : [],
    documents: Array.isArray(o.documents) ? (o.documents as CompanyDocument[]) : [],
    certificates: Array.isArray(o.certificates) ? (o.certificates as CompanyDocument[]) : [],
    services: Array.isArray(o.services)
      ? (o.services as string[])
      : [],
  }
}

export async function fetchCompanyDashboardStats(
  userId: string,
  profile: Profile | null,
): Promise<CompanyDashboardStats> {
  const base = await fetchProDashboardStats(userId, profile)

  let workspace = { ...EMPTY_WORKSPACE }
  const { data, error } = await supabase
    .from('company_workspaces')
    .select('employees, branches, documents, certificates, services')
    .eq('user_id', userId)
    .maybeSingle()

  if (!error && data) {
    workspace = parseWorkspace(data)
  } else {
    // Fallback: derive services from profile categories
    workspace = {
      ...EMPTY_WORKSPACE,
      services: profile?.work_subcategory_slugs?.slice(0, 12) || [],
      branches: profile?.location
        ? [
            {
              id: 'hq',
              name: 'Headquarters',
              city: profile.location.split(',')[0]?.trim() || profile.location,
              address: profile.location,
            },
          ]
        : [],
    }
  }

  return {
    ...base,
    workspace,
    companyName: profile?.full_name || 'Company',
  }
}

export async function upsertCompanyWorkspace(
  userId: string,
  patch: Partial<CompanyWorkspace>,
): Promise<{ ok: true } | { error: string }> {
  const { data: existing } = await supabase
    .from('company_workspaces')
    .select('id, employees, branches, documents, certificates, services')
    .eq('user_id', userId)
    .maybeSingle()

  const current = parseWorkspace(existing || {})
  const next = {
    user_id: userId,
    employees: patch.employees ?? current.employees,
    branches: patch.branches ?? current.branches,
    documents: patch.documents ?? current.documents,
    certificates: patch.certificates ?? current.certificates,
    services: patch.services ?? current.services,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('company_workspaces')
      .update(next as never)
      .eq('id', existing.id)
    if (error) return { error: error.message }
    return { ok: true }
  }

  const { error } = await supabase.from('company_workspaces').insert(next as never)
  if (error) {
    if (/relation|schema cache|does not exist/i.test(error.message)) {
      return { error: 'unavailable' }
    }
    return { error: error.message }
  }
  return { ok: true }
}

export const COMPANY_DASH_THEME_KEY = 'dimarket_company_dashboard_theme'
