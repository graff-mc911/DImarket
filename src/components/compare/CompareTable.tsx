import { navigateTo } from '../../lib/navigation'
import { VerificationBadge } from '../MatchScoreBadge'
import type { CompareProfessional } from '../../lib/compare'
import { buildCompareRows } from '../../lib/compare'
import type { VerificationLevel } from '../../lib/types'
import { User } from 'lucide-react'

export function CompareTable({ professionals }: { professionals: CompareProfessional[] }) {
  const rows = buildCompareRows(professionals)

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-[22px] border border-[#e8e8ed] bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#e8e8ed] bg-[#fafafa]">
              <th className="sticky left-0 z-10 w-[140px] bg-[#fafafa] px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
                Metric
              </th>
              {professionals.map((p) => (
                <th key={p.id} className="min-w-[160px] px-4 py-4 align-top">
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left"
                    onClick={() => navigateTo(`/professional/${p.id}`)}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
                      {p.photo ? (
                        <img src={p.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-[#86868b]" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[14px] font-semibold text-[#1d1d1f]">
                          {p.fullName}
                        </span>
                        <VerificationBadge
                          level={p.verificationLevel as VerificationLevel}
                        />
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] font-normal text-[#86868b]">
                        {p.location || '—'}
                      </span>
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-[#f0f0f2] last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-4 py-3 text-[12px] font-semibold text-[#6e6e73]"
                >
                  {row.label}
                </th>
                {row.values.map((value, i) => {
                  const best = row.bestIndex === i
                  return (
                    <td
                      key={`${row.key}-${i}`}
                      className={`px-4 py-3 tabular-nums ${
                        best
                          ? 'bg-[#e8f5e9] font-semibold text-[#1b5e20]'
                          : 'text-[#1d1d1f]'
                      }`}
                    >
                      {String(value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {professionals.map((p, pi) => (
          <article
            key={p.id}
            className="rounded-[20px] border border-[#e8e8ed] bg-white p-4 shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 text-left"
              onClick={() => navigateTo(`/professional/${p.id}`)}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
                {p.photo ? (
                  <img src={p.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-[#86868b]" />
                )}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold text-[#1d1d1f]">
                    {p.fullName}
                  </span>
                  <VerificationBadge level={p.verificationLevel as VerificationLevel} />
                </span>
                <span className="mt-0.5 block text-[12px] text-[#86868b]">
                  {p.location || '—'}
                </span>
              </span>
            </button>
            <dl className="mt-4 space-y-2 border-t border-[#f0f0f2] pt-3">
              {rows.map((row) => {
                const best = row.bestIndex === pi
                return (
                  <div key={row.key} className="flex items-start justify-between gap-3 text-[13px]">
                    <dt className="text-[#86868b]">{row.label}</dt>
                    <dd
                      className={`text-right tabular-nums ${
                        best ? 'font-semibold text-[#1b5e20]' : 'font-medium text-[#1d1d1f]'
                      }`}
                    >
                      {String(row.values[pi])}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </article>
        ))}
      </div>
    </>
  )
}
