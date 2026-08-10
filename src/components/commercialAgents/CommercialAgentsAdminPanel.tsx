import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { setVerificationStatus } from '../../lib/commercialAgents/api'
import { navigateTo } from '../../lib/navigation'

type Row = {
  id: string
  kind: 'manufacturer' | 'agent'
  name: string
  slug: string
  verification_status: string
  country: string | null
}

/**
 * Owner queue: approve / verify manufacturer & agent profiles, moderate reports.
 */
export function CommercialAgentsAdminPanel() {
  const [rows, setRows] = useState<Row[]>([])
  const [reports, setReports] = useState<
    Array<{ id: string; entity_type: string; reason: string; status: string; details: string | null }>
  >([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const reload = async () => {
    setLoading(true)
    const [{ data: mfr }, { data: agents }, { data: reps }] = await Promise.all([
      supabase
        .from('manufacturer_profiles')
        .select('id, company_name, slug, verification_status, country')
        .in('verification_status', ['pending', 'unverified'])
        .order('updated_at', { ascending: false })
        .limit(20),
      supabase
        .from('agent_profiles')
        .select('id, full_name, slug, verification_status, country')
        .in('verification_status', ['pending', 'unverified'])
        .order('updated_at', { ascending: false })
        .limit(20),
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
        company_name: string
        slug: string
        verification_status: string
        country: string | null
      }>).map((r) => ({
        id: r.id,
        kind: 'manufacturer' as const,
        name: r.company_name,
        slug: r.slug,
        verification_status: r.verification_status,
        country: r.country,
      })),
      ...((agents ?? []) as Array<{
        id: string
        full_name: string
        slug: string
        verification_status: string
        country: string | null
      }>).map((r) => ({
        id: r.id,
        kind: 'agent' as const,
        name: r.full_name,
        slug: r.slug,
        verification_status: r.verification_status,
        country: r.country,
      })),
    ]
    setRows(next)
    setReports((reps as typeof reports) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const verify = async (row: Row) => {
    const table = row.kind === 'manufacturer' ? 'manufacturer_profiles' : 'agent_profiles'
    const ok = await setVerificationStatus(table, row.id, 'verified')
    setNotice(ok ? `Verified ${row.name}` : 'Verification failed')
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
        Approve manufacturer / representative profiles and review safety reports.
      </p>
      {notice ? <p className="mt-2 text-sm text-[#248a3d]">{notice}</p> : null}
      {loading ? (
        <p className="mt-4 text-sm text-[var(--ink-500)]">Loading…</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--ink-600)]">No pending B2B profiles.</p>
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
                    {row.country || '—'} · {row.verification_status}
                  </p>
                </div>
                <div className="flex gap-2">
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
                  <button
                    type="button"
                    className="rounded-full bg-[#248a3d] px-3 py-1 text-xs font-bold text-white"
                    onClick={() => void verify(row)}
                  >
                    Verify
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
    </section>
  )
}
