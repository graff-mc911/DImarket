import { useEffect, useState } from 'react'
import { adminReviewVerification, listPendingVerifications } from '../../lib/verification/verification'
import { useApp } from '../../contexts/AppContext'

type PendingRow = {
  id: string
  profile_id: string
  business_name: string | null
  submitted_at: string | null
  profile?: { full_name: string | null; email: string | null; location: string | null }
}

export function VerificationAdminPanel() {
  const { user, t } = useApp()
  const [rows, setRows] = useState<PendingRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setRows((await listPendingVerifications()) as unknown as PendingRow[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const review = async (id: string, action: 'approve' | 'reject') => {
    if (!user) return
    await adminReviewVerification(id, user.id, action)
    await load()
  }

  if (loading) return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  if (!rows.length) return <p className="text-sm text-slate-500">{t('verification.adminEmpty')}</p>

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-semibold">{row.profile?.full_name || row.profile_id}</p>
          <p className="text-xs text-slate-500">{row.business_name}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void review(row.id, 'approve')}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white"
            >
              {t('verification.approve')}
            </button>
            <button
              type="button"
              onClick={() => void review(row.id, 'reject')}
              className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-bold text-red-600"
            >
              {t('verification.reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
