import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, Clock, XCircle } from 'lucide-react'
import {
  adminReviewVerification,
  countVerificationsByStatus,
  listVerificationsByStatus,
  type VerificationQueueRow,
  type VerificationQueueStatus,
} from '../../lib/verification/verification'
import { useApp } from '../../contexts/AppContext'
import { OwnerCabinetGeoQueue, type OwnerCabinetQueueFilter } from '../OwnerCabinetGeoQueue'
import { navigateTo } from '../../lib/navigation'

function verificationLocation(row: VerificationQueueRow): string | null {
  return row.profile?.location ?? null
}

const FILTERS: OwnerCabinetQueueFilter<VerificationQueueStatus>[] = [
  { id: 'pending', label: 'Очікують', icon: Clock },
  { id: 'verified', label: 'Схвалені', icon: BadgeCheck },
  { id: 'rejected', label: 'Відхилені', icon: XCircle },
]

export function VerificationAdminPanel() {
  const { user, t } = useApp()
  const [filter, setFilter] = useState<VerificationQueueStatus>('pending')
  const [rows, setRows] = useState<VerificationQueueRow[]>([])
  const [counts, setCounts] = useState<Record<VerificationQueueStatus, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async (status: VerificationQueueStatus) => {
    setLoading(true)
    setError('')
    try {
      const [data, nextCounts] = await Promise.all([
        listVerificationsByStatus(status),
        countVerificationsByStatus(),
      ])
      setRows(data)
      setCounts(nextCounts)
    } catch (e) {
      setRows([])
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(filter)
  }, [filter, load])

  const review = async (id: string, action: 'approve' | 'reject') => {
    if (!user) return
    setBusyId(id)
    setNotice('')
    setError('')
    const ok = await adminReviewVerification(id, user.id, action)
    if (ok) setNotice(action === 'approve' ? 'Заявку схвалено' : 'Заявку відхилено')
    else setError('Не вдалося оновити заявку')
    setBusyId(null)
    await load(filter)
  }

  return (
    <OwnerCabinetGeoQueue
      title="Верифікація підрядників"
      subtitle="Заявки на перевірку документів. Натисніть групу — як категорію. Далі країна і регіон, потім список."
      filters={FILTERS}
      activeId={filter}
      rows={rows}
      locationOf={verificationLocation}
      loading={loading}
      countFor={(id) => counts?.[id] ?? null}
      emptyText={t('verification.adminEmpty')}
      onSelect={setFilter}
      notice={notice}
      error={error}
      renderRow={(row) => (
        <div
          key={row.id}
          className="rounded-none border border-[rgba(148,163,184,0.28)] bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-[#2f2a24]">
                {row.profile?.full_name || row.business_name || row.profile_id}
              </p>
              {row.business_name ? (
                <p className="mt-0.5 text-xs text-[#6f665d]">{row.business_name}</p>
              ) : null}
              {row.profile?.location ? (
                <p className="mt-0.5 text-xs text-[#6f665d]">{row.profile.location}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-[#6f665d]">
                {row.status}
                {row.submitted_at ? ` · ${new Date(row.submitted_at).toLocaleDateString('uk')}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border px-3 py-1 text-xs font-bold"
                onClick={() => navigateTo(`/professional/${row.profile_id}`)}
              >
                View
              </button>
              {row.status !== 'verified' ? (
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void review(row.id, 'approve')}
                  className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {t('verification.approve')}
                </button>
              ) : null}
              {row.status !== 'rejected' ? (
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void review(row.id, 'reject')}
                  className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50"
                >
                  {t('verification.reject')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    />
  )
}
