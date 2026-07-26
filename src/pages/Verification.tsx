import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Circle,
  Contact,
  FileText,
  MapPin,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { TrustBadges, VerificationBadge } from '../components/MatchScoreBadge'
import {
  getOrCreateVerification,
  listVerificationDocTypes,
  listVerificationHistory,
  markContactVerified,
  submitVerificationRequest,
  uploadVerificationDoc,
  type ContractorVerification,
  type VerificationReview,
} from '../lib/verification/verification'
import {
  VERIFICATION_LEVELS,
  buildVerificationChecks,
  nextLevelHint,
  type VerificationCheck,
} from '../lib/verificationChecks'

const DOC_UPLOADS = [
  { key: 'identity', label: 'Identity document', icon: Contact },
  { key: 'proof_of_address', label: 'Proof of address', icon: MapPin },
  { key: 'business_registration', label: 'Business registration', icon: Building2 },
  { key: 'vat', label: 'VAT certificate', icon: FileText },
  { key: 'trade_license', label: 'Professional / trade license', icon: FileText },
  { key: 'insurance', label: 'Insurance', icon: Shield },
  { key: 'background_check', label: 'Background check', icon: ShieldCheck },
  { key: 'certification', label: 'Certification (optional)', icon: FileText },
] as const

export function Verification() {
  const { user, profile, t } = useApp()
  const [ver, setVer] = useState<ContractorVerification | null>(null)
  const [docTypes, setDocTypes] = useState<string[]>([])
  const [history, setHistory] = useState<VerificationReview[]>([])
  const [businessName, setBusinessName] = useState('')
  const [vat, setVat] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressCountry, setAddressCountry] = useState('')
  const [addressPostal, setAddressPostal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const refreshDocs = useCallback(async (verificationId: string) => {
    setDocTypes(await listVerificationDocTypes(verificationId))
  }, [])

  const refreshHistory = useCallback(async (verificationId: string) => {
    setHistory(await listVerificationHistory(verificationId))
  }, [])

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    if (profile?.user_role !== 'professional' && profile?.user_role !== 'company') {
      navigateTo('/profile')
      return
    }
    void getOrCreateVerification(user.id).then(async (v) => {
      if (v) {
        setVer(v)
        setBusinessName(v.business_name || '')
        setVat(v.vat_number || '')
        setAddressLine(v.address_line || '')
        setAddressCity(v.address_city || '')
        setAddressCountry(v.address_country || '')
        setAddressPostal(v.address_postal_code || '')
        await Promise.all([refreshDocs(v.id), refreshHistory(v.id)])
      }
    })
  }, [user?.id, profile?.user_role, refreshDocs, refreshHistory])

  const checks: VerificationCheck[] = useMemo(
    () =>
      buildVerificationChecks({
        profile,
        email: user?.email,
        emailConfirmed: Boolean(user?.email_confirmed_at || profile?.email_verified_at),
        docTypes,
      }),
    [profile, user, docTypes],
  )

  const level = profile?.verification_level || 'none'
  const hint = nextLevelHint(level, checks)
  const doneCount = checks.filter((c) => c.done).length
  const canResubmit = ver?.status === 'rejected' || ver?.status === 'needs_info' || ver?.status === 'unverified'

  if (!user || !ver) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-[#86868b]">
        Loading verification…
      </div>
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setMessage(null)
    const ok = await submitVerificationRequest(ver.id, {
      business_name: businessName.trim(),
      vat_number: vat.trim(),
      address_line: addressLine.trim(),
      address_city: addressCity.trim(),
      address_country: addressCountry.trim(),
      address_postal_code: addressPostal.trim(),
    })
    setSubmitting(false)
    if (ok) {
      setVer({ ...ver, status: 'pending' })
      setMessage(t('verification.submitted'))
      await refreshHistory(ver.id)
    } else {
      setMessage(t('verification.error'))
    }
  }

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType)
    setMessage(null)
    const ok = await uploadVerificationDoc(user.id, ver.id, file, docType)
    setUploading(null)
    if (ok) {
      setMessage(t('verification.uploaded'))
      await refreshDocs(ver.id)
    } else {
      setMessage(t('verification.error'))
    }
  }

  const confirmEmail = async () => {
    const result = await markContactVerified(user.id, 'email', {
      emailConfirmed: Boolean(user.email_confirmed_at),
    })
    setMessage(result.ok ? t('verification.emailMarked') : result.error || t('verification.error'))
  }

  const confirmPhone = async () => {
    if (!profile?.phone) {
      setMessage(t('verification.addPhoneFirst'))
      navigateTo('/settings')
      return
    }
    const result = await markContactVerified(user.id, 'phone', { phone: profile.phone })
    setMessage(result.ok ? t('verification.phoneMarked') : result.error || t('verification.error'))
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] pb-24">
      <div className="border-b border-[#e8e8ed] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1d1d1f] text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
                {t('verification.title')}
              </h1>
              <p className="mt-1 text-[14px] text-[#86868b]">{t('verification.subtitle')}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill
                  status={ver.status}
                  label={
                    ver.status === 'needs_info'
                      ? t('verification.status.needs_info')
                      : ver.status === 'pending'
                        ? t('verification.status.pending')
                        : ver.status === 'verified'
                          ? t('verification.status.verified')
                          : ver.status === 'rejected'
                            ? t('verification.status.rejected')
                            : t('verification.status.unverified')
                  }
                />
                <VerificationBadge level={level} size="md" />
              </div>
              <div className="mt-3">
                <TrustBadges source={profile} size="md" />
              </div>
              <p className="mt-2 text-[14px] text-[#86868b]">
                {doneCount}/{checks.length} checks complete · {hint}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VERIFICATION_LEVELS.map((tier) => {
              const active = level === tier.id
              const unlocked =
                level !== 'none' &&
                ['bronze', 'silver', 'gold', 'platinum'].indexOf(level) >=
                  ['bronze', 'silver', 'gold', 'platinum'].indexOf(tier.id)
              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border px-3 py-3 ${
                    active
                      ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                      : unlocked
                        ? 'border-emerald-200 bg-emerald-50 text-[#1d1d1f]'
                        : 'border-[#e8e8ed] bg-white text-[#86868b]'
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide">{tier.label}</p>
                  <p className={`mt-1 text-[11px] leading-snug ${active ? 'text-white/70' : ''}`}>
                    {tier.blurb}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-6">
        {ver.status === 'needs_info' && ver.review_notes ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            <p className="font-semibold">{t('verification.needsInfoTitle')}</p>
            <p className="mt-1">{ver.review_notes}</p>
          </div>
        ) : null}

        {ver.status === 'rejected' && ver.review_notes ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            <p className="font-semibold">{t('verification.rejectedTitle')}</p>
            <p className="mt-1">{ver.review_notes}</p>
          </div>
        ) : null}

        {message ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
            {message}
          </p>
        ) : null}

        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.checksTitle')}</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">{t('verification.checksHint')}</p>
          <ul className="mt-4 space-y-2">
            {checks.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#f5f5f7] px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {c.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-[#d2d2d7]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1d1d1f]">{c.label}</p>
                    <p className="truncate text-[12px] text-[#86868b]">{c.description}</p>
                  </div>
                </div>
                {!c.done && c.id === 'email' ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[11px] font-semibold text-white"
                    onClick={() => void confirmEmail()}
                  >
                    <Mail className="mr-1 inline h-3 w-3" />
                    {t('verification.confirm')}
                  </button>
                ) : null}
                {!c.done && c.id === 'phone' ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[11px] font-semibold text-white"
                    onClick={() => void confirmPhone()}
                  >
                    <Phone className="mr-1 inline h-3 w-3" />
                    {t('verification.confirm')}
                  </button>
                ) : null}
                {c.done ? (
                  <span className="text-[11px] font-bold uppercase text-emerald-600">
                    {t('verification.done')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.businessDetails')}</h2>
          <div className="mt-4 space-y-3">
            <Field
              label={t('verification.businessName')}
              value={businessName}
              onChange={setBusinessName}
              disabled={ver.status === 'verified'}
            />
            <Field
              label={t('verification.vat')}
              value={vat}
              onChange={setVat}
              disabled={ver.status === 'verified'}
            />
            <Field
              label={t('verification.addressLine')}
              value={addressLine}
              onChange={setAddressLine}
              disabled={ver.status === 'verified'}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label={t('verification.addressCity')}
                value={addressCity}
                onChange={setAddressCity}
                disabled={ver.status === 'verified'}
              />
              <Field
                label={t('verification.addressPostal')}
                value={addressPostal}
                onChange={setAddressPostal}
                disabled={ver.status === 'verified'}
              />
              <Field
                label={t('verification.addressCountry')}
                value={addressCountry}
                onChange={setAddressCountry}
                disabled={ver.status === 'verified'}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.documents')}</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">{t('verification.documentsHint')}</p>
          <ul className="mt-4 space-y-2">
            {DOC_UPLOADS.map((doc) => {
              const Icon = doc.icon
              const uploaded =
                docTypes.includes(doc.key) ||
                (doc.key === 'business_registration' && docTypes.includes('vat')) ||
                (doc.key === 'trade_license' && docTypes.includes('professional_license'))
              return (
                <li
                  key={doc.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f0f0f2] px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#86868b]" />
                    <span className="text-[14px] font-medium text-[#1d1d1f]">{doc.label}</span>
                    {uploaded ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        {t('verification.uploadedShort')}
                      </span>
                    ) : null}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading === doc.key ? t('verification.uploading') : t('verification.upload')}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={ver.status === 'verified' || uploading === doc.key}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleUpload(doc.key, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </li>
              )
            })}
          </ul>
        </section>

        {history.length > 0 ? (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.history')}</h2>
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl bg-[#f5f5f7] px-3 py-2.5 text-[13px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-[#1d1d1f]">
                      {h.action.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-[#86868b]">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  {h.notes ? <p className="mt-1 text-[#86868b]">{h.notes}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {ver.status !== 'verified' ? (
          <button
            type="button"
            disabled={submitting || ver.status === 'pending'}
            onClick={() => void handleSubmit()}
            className="w-full rounded-full bg-[#1d1d1f] px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {ver.status === 'pending'
              ? t('verification.underReview')
              : submitting
                ? t('verification.submitting')
                : canResubmit && ver.status !== 'unverified'
                  ? t('verification.resubmit')
                  : t('verification.submit')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-[#d2d2d7] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[#1d1d1f]"
        disabled={disabled}
      />
    </label>
  )
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    rejected: 'bg-red-100 text-red-800',
    needs_info: 'bg-orange-100 text-orange-800',
    unverified: 'bg-slate-100 text-slate-700',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[status] ?? colors.unverified}`}>
      {label}
    </span>
  )
}
