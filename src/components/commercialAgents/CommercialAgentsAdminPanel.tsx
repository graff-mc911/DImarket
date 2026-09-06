import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, Clock, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  ownerDeleteCommercialEntity,
  setVerificationStatus,
} from '../../lib/commercialAgents/api'
import { navigateTo } from '../../lib/navigation'
import type { VerificationStatus } from '../../lib/commercialAgents/types'
import { OwnerCabinetGeoQueue, type OwnerCabinetQueueFilter } from '../OwnerCabinetGeoQueue'

type QueueFilter = 'pending' | 'verified' | 'rejected'

type Row = {
  id: string
  kind: 'manufacturer' | 'agent'
  name: string
  company: string | null
  email: string | null
  slug: string
  profile_id: string
  verification_status: VerificationStatus | string
  country: string | null
  headquarters: string | null
  profile_location: string | null
  is_published: boolean
}

type ConfirmState = {
  row: Row
} | null

const FILTERS: OwnerCabinetQueueFilter<QueueFilter>[] = [
  { id: 'pending', label: 'Очікують', icon: Clock },
  { id: 'verified', label: 'Схвалені', icon: BadgeCheck },
  { id: 'rejected', label: 'Відхилені', icon: XCircle },
]

const FILTER_STATUSES: Record<QueueFilter, Array<'unverified' | 'pending' | 'verified' | 'rejected'>> = {
  pending: ['pending', 'unverified'],
  verified: ['verified'],
  rejected: ['rejected'],
}

function applyQueueFilter<T extends { or: Function; in: Function; eq: Function }>(
  query: T,
  filter: QueueFilter,
): T {
  const statuses = FILTER_STATUSES[filter]
  if (filter === 'rejected') {
    return query.or(
      'verification_status.eq.rejected,and(is_published.eq.false,verification_status.neq.verified)',
    ) as T
  }
  if (filter === 'pending') {
    return query.in('verification_status', statuses).eq('is_published', true) as T
  }
  return query.in('verification_status', statuses) as T
}

function rowLocation(row: Row): string | null {
  return row.profile_location || row.headquarters || row.country
}

/**
 * Owner queue: approve / reject / delete manufacturer & agent profiles.
 */
export function CommercialAgentsAdminPanel() {
  const [filter, setFilter] = useState<QueueFilter>('pending')
  const [rows, setRows] = useState<Row[]>([])
  const [counts, setCounts] = useState<Record<QueueFilter, number> | null>(null)
  const [reports, setReports] = useState<
    Array<{ id: string; entity_type: string; reason: string; status: string; details: string | null }>
  >([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const countForFilter = async (next: QueueFilter) => {
    const mfrQ = applyQueueFilter(
      supabase.from('manufacturer_profiles').select('id', { count: 'exact', head: true }),
      next,
    )
    const agentQ = applyQueueFilter(
      supabase.from('agent_profiles').select('id', { count: 'exact', head: true }),
      next,
    )
    const [mfr, agents] = await Promise.all([mfrQ, agentQ])
    return (mfr.count ?? 0) + (agents.count ?? 0)
  }

  const reload = useCallback(async (nextFilter = filter) => {
    setLoading(true)
    setError('')

    const mfrQuery = applyQueueFilter(
      supabase
        .from('manufacturer_profiles')
        .select(
          'id, profile_id, company_name, slug, verification_status, country, headquarters, public_email, is_published, profile:profiles(location)',
        )
        .order('updated_at', { ascending: false })
        .limit(200),
      nextFilter,
    )

    const agentQuery = applyQueueFilter(
      supabase
        .from('agent_profiles')
        .select(
          'id, profile_id, full_name, company_name, slug, verification_status, country, public_email, is_published, profile:profiles(location)',
        )
        .order('updated_at', { ascending: false })
        .limit(200),
      nextFilter,
    )

    const [{ data: mfr }, { data: agents }, { data: reps }, pendingN, verifiedN, rejectedN] =
      await Promise.all([
        mfrQuery,
        agentQuery,
        supabase
          .from('commercial_entity_reports')
          .select('id, entity_type, reason, status, details')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(20),
        countForFilter('pending'),
        countForFilter('verified'),
        countForFilter('rejected'),
      ])

    const next: Row[] = [
      ...((mfr ?? []) as Array<{
        id: string
        profile_id: string
        company_name: string
        slug: string
        verification_status: string
        country: string | null
        headquarters: string | null
        public_email: string | null
        is_published: boolean
        profile?: { location: string | null } | { location: string | null }[] | null
      }>).map((r) => {
        const loc = Array.isArray(r.profile) ? r.profile[0]?.location : r.profile?.location
        return {
          id: r.id,
          kind: 'manufacturer' as const,
          name: r.company_name,
          company: r.company_name,
          email: r.public_email,
          slug: r.slug,
          profile_id: r.profile_id,
          verification_status: r.verification_status,
          country: r.country,
          headquarters: r.headquarters,
          profile_location: loc ?? null,
          is_published: r.is_published,
        }
      }),
      ...((agents ?? []) as Array<{
        id: string
        profile_id: string
        full_name: string
        company_name: string | null
        slug: string
        verification_status: string
        country: string | null
        public_email: string | null
        is_published: boolean
        profile?: { location: string | null } | { location: string | null }[] | null
      }>).map((r) => {
        const loc = Array.isArray(r.profile) ? r.profile[0]?.location : r.profile?.location
        return {
          id: r.id,
          kind: 'agent' as const,
          name: r.full_name,
          company: r.company_name,
          email: r.public_email,
          slug: r.slug,
          profile_id: r.profile_id,
          verification_status: r.verification_status,
          country: r.country,
          headquarters: null,
          profile_location: loc ?? null,
          is_published: r.is_published,
        }
      }),
    ]
    setRows(next)
    setCounts({ pending: pendingN, verified: verifiedN, rejected: rejectedN })
    setReports((reps as typeof reports) ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    void reload(filter)
  }, [filter, reload])

  const verify = async (row: Row) => {
    setBusyId(row.id)
    setNotice('')
    setError('')
    const table = row.kind === 'manufacturer' ? 'manufacturer_profiles' : 'agent_profiles'
    const res = await setVerificationStatus(table, row.id, 'verified')
    if (res.ok) setNotice(`Verified ${row.name}`)
    else setError(res.error || 'Verification failed')
    setBusyId(null)
    await reload()
  }

  const reject = async (row: Row) => {
    setBusyId(row.id)
    setNotice('')
    setError('')
    const table = row.kind === 'manufacturer' ? 'manufacturer_profiles' : 'agent_profiles'
    const res = await setVerificationStatus(table, row.id, 'rejected')
    if (res.ok) {
      setNotice(`Rejected ${row.name}`)
      setFilter('rejected')
    } else {
      setError(
        res.error ||
          'Reject failed. Apply APPLY_CA_OWNER_MODERATION.sql if status "rejected" is not allowed yet.',
      )
    }
    setBusyId(null)
    await reload()
  }

  const performDelete = async (row: Row) => {
    setBusyId(row.id)
    setNotice('')
    setError('')
    setConfirm(null)
    const res = await ownerDeleteCommercialEntity({
      kind: row.kind,
      id: row.id,
      profileId: row.profile_id,
      deleteAuth: true,
    })
    if (res.ok) {
      setNotice(
        `Deleted ${row.name}` +
          (res.authDeleted ? ' (auth user removed)' : ' (commercial profile removed)'),
      )
    } else {
      setError(res.error || 'Delete failed')
    }
    setBusyId(null)
    await reload()
  }

  const dismissReport = async (id: string) => {
    await supabase.from('commercial_entity_reports').update({ status: 'dismissed' }).eq('id', id)
    await reload()
  }

  return (
    <>
      <OwnerCabinetGeoQueue
        title="Комерційні агенти"
        subtitle="Заявки виробників і представників: перегляд, підтвердження, відхилення або видалення. Натисніть групу — як категорію. Далі країна і регіон, потім список."
        filters={FILTERS}
        activeId={filter}
        rows={rows}
        locationOf={rowLocation}
        loading={loading}
        countFor={(id) => counts?.[id] ?? null}
        emptyText="Немає заявок у цій групі."
        onSelect={setFilter}
        notice={notice}
        error={error}
        renderRow={(row) => (
          <div
            key={`${row.kind}-${row.id}`}
            className="rounded-none border border-[rgba(148,163,184,0.28)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-[#2f2a24]">
                  {row.name}{' '}
                  <span className="text-xs font-medium uppercase text-[#6f665d]">({row.kind})</span>
                </p>
                <p className="mt-0.5 text-xs text-[#6f665d]">
                  {row.company || '—'} · {row.email || 'no public email'} · {row.country || '—'} ·{' '}
                  {row.verification_status}
                </p>
                {rowLocation(row) ? (
                  <p className="mt-0.5 text-xs text-[#6f665d]">{rowLocation(row)}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    navigateTo(
                      row.kind === 'manufacturer'
                        ? `/commercial-agents/manufacturers/${row.slug}`
                        : `/commercial-agents/representatives/${row.slug}`,
                    )
                  }
                >
                  View
                </button>
                {row.verification_status !== 'verified' ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-full bg-[#248a3d] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                    onClick={() => void verify(row)}
                  >
                    Verify
                  </button>
                ) : null}
                {row.verification_status !== 'rejected' ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-full bg-[#b45309] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                    onClick={() => void reject(row)}
                  >
                    Reject
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === row.id}
                  className="rounded-full bg-[#b91c1c] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                  onClick={() => setConfirm({ row })}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        extra={
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#2f2a24]">Скарги</h3>
            {reports.length === 0 ? (
              <p className="mt-2 text-sm text-[#6f665d]">Немає відкритих скарг.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-[rgba(148,163,184,0.28)] bg-white px-3 py-2.5"
                  >
                    <p className="text-sm text-[#2f2a24]">
                      {r.entity_type} · {r.reason}
                      {r.details ? ` — ${r.details}` : ''}
                    </p>
                    <button
                      type="button"
                      className="rounded-full bg-[#e7e9ec] px-3 py-1 text-xs font-bold"
                      onClick={() => void dismissReport(r.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      />

      {confirm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-none bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--ink-900)]">
              Delete {confirm.row.kind === 'agent' ? 'Commercial Agent' : 'Manufacturer'}?
            </h3>
            <dl className="mt-3 space-y-1 text-sm text-[var(--ink-700)]">
              <div>
                <dt className="inline font-semibold">Name: </dt>
                <dd className="inline">{confirm.row.name}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Company: </dt>
                <dd className="inline">{confirm.row.company || '—'}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Email: </dt>
                <dd className="inline">{confirm.row.email || '—'}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--ink-500)]">
              Removes the commercial profile from search, map, ads linkage, and this queue. Auth user
              removal is attempted via the admin edge function when available.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border px-4 py-1.5 text-xs font-bold"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-[#b91c1c] px-4 py-1.5 text-xs font-bold text-white"
                onClick={() => void performDelete(confirm.row)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
