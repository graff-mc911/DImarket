import { useEffect, useState } from 'react'
import { ShieldCheck, Upload } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import {
  getOrCreateVerification,
  submitVerificationRequest,
  uploadVerificationDoc,
  type ContractorVerification,
} from '../lib/verification/verification'

const DOC_TYPES = [
  { key: 'identity', labelKey: 'verification.docIdentity' },
  { key: 'business_registration', labelKey: 'verification.docBusiness' },
  { key: 'trade_license', labelKey: 'verification.docLicense' },
  { key: 'vat', labelKey: 'verification.docVat' },
  { key: 'insurance', labelKey: 'verification.docInsurance' },
  { key: 'certification', labelKey: 'verification.docCert' },
] as const

export function Verification() {
  const { user, profile, t } = useApp()
  const [ver, setVer] = useState<ContractorVerification | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [vat, setVat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    if (profile?.user_role !== 'professional' && profile?.user_role !== 'company') {
      navigateTo('/profile')
      return
    }
    void getOrCreateVerification(user.id).then((v) => {
      if (v) {
        setVer(v)
        setBusinessName(v.business_name || '')
        setVat(v.vat_number || '')
      }
    })
  }, [user?.id, profile?.user_role])

  if (!user || !ver) return null

  const statusBadge = () => {
    const colors: Record<string, string> = {
      verified: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-amber-100 text-amber-800',
      rejected: 'bg-red-100 text-red-800',
      unverified: 'bg-slate-100 text-slate-700',
    }
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[ver.status] ?? colors.unverified}`}>
        {t(`verification.status.${ver.status}`)}
      </span>
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setMessage(null)
    const ok = await submitVerificationRequest(ver.id, {
      business_name: businessName.trim(),
      vat_number: vat.trim(),
    })
    setSubmitting(false)
    if (ok) {
      setVer({ ...ver, status: 'pending' })
      setMessage(t('verification.submitted'))
    } else {
      setMessage(t('verification.error'))
    }
  }

  const handleUpload = async (docType: string, file: File) => {
    const ok = await uploadVerificationDoc(user.id, ver.id, file, docType)
    setMessage(ok ? t('verification.uploaded') : t('verification.error'))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--ink-900)]">{t('verification.title')}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {statusBadge()}
            {profile?.verification_level && profile.verification_level !== 'none' && (
              <span className="rounded-full border border-[#d5d9d9] bg-[#f7fafa] px-3 py-1 text-xs font-bold uppercase">
                {profile.verification_level} tier
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-500)]">
            Bronze: phone + email · Silver: + identity/company · Gold: + insurance + license
          </p>
        </div>
      </div>

      <div className="glass-panel space-y-5 rounded-2xl p-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('verification.businessName')}
          </label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={ver.status === 'verified'}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('verification.vat')}
          </label>
          <input
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            disabled={ver.status === 'verified'}
          />
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-800">{t('verification.documents')}</p>
          {DOC_TYPES.map((d) => (
            <label
              key={d.key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-200 px-4 py-3 hover:border-indigo-300"
            >
              <span className="text-sm">{t(d.labelKey)}</span>
              <Upload className="h-4 w-4 text-slate-400" />
              <input
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleUpload(d.key, f)
                }}
              />
            </label>
          ))}
        </div>

        {message && <p className="text-sm text-indigo-700">{message}</p>}

        {ver.status !== 'verified' && ver.status !== 'pending' && (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="w-full rounded-full bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? t('common.loading') : t('verification.submit')}
          </button>
        )}
      </div>
    </div>
  )
}
