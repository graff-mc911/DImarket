import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  ownerDeleteCommercialEntity,
  setVerificationStatus,
} from '../../lib/commercialAgents/api'
import { navigateTo } from '../../lib/navigation'
import type { VerificationStatus } from '../../lib/commercialAgents/types'

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
  is_published: boolean
}

type ConfirmState = {
  row: Row
} | null

const FILTER_STATUSES: Record<QueueFilter, string[]> = {
  pending: ['pending', 'unverified'],
  verified: ['verified'],
  rejected: ['rejected'],
}

/**
 * Owner queue: approve / reject / delete manufacturer & agent profiles.
 */
export function CommercialAgentsAdminPanel() {
  const [filter, setFilter] = useState<QueueFilter>('pending')
  const [rows, setRows] = useState<Row[]>([])
  const [reports, setReports] = useState<
    Array<{ id: string; entity_type: string; reason: string; status: string; details: string | null }>
  >([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)

  const reload = async () => {
    setLoading(true)
    setError('')
    const statuses = FILTER_STATUSES[filter]

    const mfrQuery = supabase
      .from('manufacturer_profiles')
      .select(
        'id, profile_id, company_name, slug, verification_status, country, public_email, is_published',
      )
      .order('updated_at', { ascending: false })
      .limit(40)

    const agentQuery = supabase
      .from('agent_profiles')
      .select(
        'id, profile_id, full_name, company_name, slug, verification_status, country, public_email, is_published',
      )
      .order('updated_at', { ascending: false })
      .limit(40)

    // Rejected tab: status=rejected OR soft-rejected (unpublished + not verified)
    // until APPLY_CA_OWNER_MODERATION.sql adds the rejected CHECK value.
    if (filter === 'rejected') {
      mfrQuery.or('verification_status.eq.rejected,and(is_published.eq.false,verification_status.neq.verified)')
      agentQuery.or(
        'verification_status.eq.rejected,and(is_published.eq.false,verification_status.neq.verified)',
      )
    } else if (filter === 'pending') {
      mfrQuery.in('verification_status', statuses).eq('is_published', true)
      agentQuery.in('verification_status', statuses).eq('is_published', true)
    } else {
      mfrQuery.in('verification_status', statuses)
      agentQuery.in('verification_status', statuses)
    }

    const [{ data: mfr }, { data: agents }, { data: reps }] = await Promise.all([
      mfrQuery,
      agentQuery,
      supabase
        .from('commercial_entity_reports')
        .select('id, entity_type, reason, status, details')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const next: Row[] = [
      ...((mfr ?? []) as Array<{
        id: string
        profile_id: string
        company_name: string
        slug: string
        verification_status: string
        country: string | null
        public_email: string | null
        is_published: boolean
      }>).map((r) => ({
        id: r.id,
        kind: 'manufacturer' as const,
        name: r.company_name,
        company: r.company_name,
        email: r.public_email,
        slug: r.slug,
        profile_id: r.profile_id,
        verification_status: r.verification_status,
        country: r.country,
        is_published: r.is_published,
      })),
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
      }>).map((r) => ({
        id: r.id,
        kind: 'agent' as const,
        name: r.full_name,
        company: r.company_name,
        email: r.public_email,
        slug: r.slug,
        profile_id: r.profile_id,
        verification_status: r.verification_status,
        country: r.country,
        is_published: r.is_published,
      })),
    ]
    setRows(next)
    setReports((reps as typeof reports) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [filter])

  const filterLabel = useMemo(() => {
    if (filter === 'pending') return 'Pending'
    if (filter === 'verified') return 'Approved'
    return 'Rejected'
  }, [filter])

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
    <section className="rounded-2xl border border-[var(--line-200)] bg-white/95 p-5">
      <h2 className="text-lg font-bold text-[var(--ink-900)]">Commercial Agents — verification queue</h2>
      <p className="mt-1 text-sm text-[var(--ink-600)]">
        Owner moderation: view, verify, reject, or delete manufacturer / representative profiles.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {([
          ['pending', 'Pending'],
          ['verified', 'Approved'],
          ['rejected', 'Rejected'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              filter === key
                ? 'bg-[var(--ink-900)] text-white'
                : 'border border-[var(--line-200)] text-[var(--ink-700)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice ? <p className="mt-2 text-sm text-[#248a3d]">{notice}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#c0392b]">{error}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--ink-500)]">Loading…</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--ink-600)]">No {filterLabel.toLowerCase()} B2B profiles.</p>
          ) : (
            rows.map((row) => (
              <div
                key={`${row.kind}-${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line-200)] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">
                    {row.name}{' '}
                    <span className="text-xs font-medium uppercase text-[var(--ink-500)]">({row.kind})</span>
                  </p>
                  <p className="text-xs text-[var(--ink-500)]">
                    {row.company || '—'} · {row.email || 'no public email'} · {row.country || '—'} ·{' '}
                    {row.verification_status}
                  </p>
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
            ))
          )}

          <h3 className="pt-2 text-sm font-bold text-[var(--ink-800)]">Open reports</h3>
          {reports.length === 0 ? (
            <p className="text-sm text-[var(--ink-600)]">No open reports.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                <p className="text-sm text-[var(--ink-800)]">
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
            ))
          )}
        </div>
      )}

      {confirm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
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
    </section>
  )
}
