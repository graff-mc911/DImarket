import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Circle,
  Contact,
  FileText,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { VerificationBadge } from '../components/MatchScoreBadge'
import {
  getOrCreateVerification,
  listVerificationDocTypes,
  markContactVerified,
  submitVerificationRequest,
  uploadVerificationDoc,
  type ContractorVerification,
} from '../lib/verification/verification'
import {
  VERIFICATION_LEVELS,
  buildVerificationChecks,
  nextLevelHint,
  type VerificationCheck,
} from '../lib/verificationChecks'

const DOC_UPLOADS = [
  { key: 'identity', label: 'Identity document', icon: Contact },
  { key: 'business_registration', label: 'Company registration', icon: Building2 },
  { key: 'vat', label: 'VAT certificate', icon: FileText },
  { key: 'trade_license', label: 'Trade license', icon: FileText },
  { key: 'insurance', label: 'Insurance', icon: Shield },
  { key: 'background_check', label: 'Background check', icon: ShieldCheck },
  { key: 'certification', label: 'Certification (optional)', icon: FileText },
] as const

export function Verification() {
  const { user, profile, t } = useApp()
  const [ver, setVer] = useState<ContractorVerification | null>(null)
  const [docTypes, setDocTypes] = useState<string[]>([])
  const [businessName, setBusinessName] = useState('')
  const [vat, setVat] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const refreshDocs = useCallback(async (verificationId: string) => {
    setDocTypes(await listVerificationDocTypes(verificationId))
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
        await refreshDocs(v.id)
      }
    })
  }, [user?.id, profile?.user_role, refreshDocs])

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

  if (!user || !ver) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-[#8a8178]">
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
    if (!user.email) return
    const ok = await markContactVerified(user.id, 'email')
    setMessage(ok ? 'Email marked as verified' : t('verification.error'))
  }

  const confirmPhone = async () => {
    if (!profile?.phone) {
      setMessage('Add a phone number in Settings first')
      navigateTo('/settings')
      return
    }
    const ok = await markContactVerified(user.id, 'phone')
    setMessage(ok ? 'Phone marked as verified' : t('verification.error'))
  }

  return (
    <div className="min-h-[70vh] bg-[#f3f0ea] pb-24">
      <div className="border-b border-[rgba(148,163,184,0.22)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f2a24] text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-semibold tracking-tight text-[#2f2a24]">
                {t('verification.title')}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={ver.status} label={t(`verification.status.${ver.status}`)} />
                <VerificationBadge level={level} size="md" />
              </div>
              <p className="mt-2 text-[14px] text-[#8a8178]">
                {doneCount}/{checks.length} checks complete · {hint}
              </p>
            </div>
          </div>

          {/* Level ladder */}
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
                      ? 'border-[#2f2a24] bg-[#2f2a24] text-white'
                      : unlocked
                        ? 'border-emerald-200 bg-emerald-50 text-[#2f2a24]'
                        : 'border-[rgba(148,163,184,0.22)] bg-white text-[#8a8178]'
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
        {message ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
            {message}
          </p>
        ) : null}

        {/* Checks checklist */}
        <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-[17px] font-semibold text-[#2f2a24]">Verification checks</h2>
          <p className="mt-1 text-[13px] text-[#8a8178]">
            Email · Phone · Identity · Company · Insurance · License · Background Check
          </p>
          <ul className="mt-4 space-y-2">
            {checks.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#f3f0ea] px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {c.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-[rgba(148,163,184,0.35)]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#2f2a24]">{c.label}</p>
                    <p className="truncate text-[12px] text-[#8a8178]">{c.description}</p>
                  </div>
                </div>
                {!c.done && c.id === 'email' ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-[#2f2a24] px-3 py-1.5 text-[11px] font-semibold text-white"
                    onClick={() => void confirmEmail()}
                  >
                    <Mail className="mr-1 inline h-3 w-3" />
                    Confirm
                  </button>
                ) : null}
                {!c.done && c.id === 'phone' ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-[#2f2a24] px-3 py-1.5 text-[11px] font-semibold text-white"
                    onClick={() => void confirmPhone()}
                  >
                    <Phone className="mr-1 inline h-3 w-3" />
                    Confirm
                  </button>
                ) : null}
                {c.done ? (
                  <span className="text-[11px] font-bold uppercase text-emerald-600">Done</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {/* Business fields */}
        <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#2f2a24]">Business details</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
                {t('verification.businessName')}
              </span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[#2f2a24]"
                disabled={ver.status === 'verified'}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8178]">
                {t('verification.vat')}
              </span>
              <input
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[rgba(148,163,184,0.35)] bg-[#fafafa] px-3 py-2.5 text-sm outline-none focus:border-[#2f2a24]"
                disabled={ver.status === 'verified'}
              />
            </label>
          </div>
        </section>

        {/* Document uploads */}
        <section className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#2f2a24]">Documents</h2>
          <p className="mt-1 text-[13px] text-[#8a8178]">
            Upload proof for each check. Admins review before Gold / Platinum unlock.
          </p>
          <ul className="mt-4 space-y-2">
            {DOC_UPLOADS.map((doc) => {
              const Icon = doc.icon
              const uploaded =
                docTypes.includes(doc.key) ||
                (doc.key === 'business_registration' && docTypes.includes('vat'))
              return (
                <li
                  key={doc.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f0f0f2] px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#8a8178]" />
                    <span className="text-[14px] font-medium text-[#2f2a24]">{doc.label}</span>
                    {uploaded ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Uploaded
                      </span>
                    ) : null}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#2f2a24] hover:bg-[#f3f0ea]">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading === doc.key ? 'Uploading…' : 'Upload'}
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

        {ver.status !== 'verified' ? (
          <button
            type="button"
            disabled={submitting || ver.status === 'pending'}
            onClick={() => void handleSubmit()}
            className="w-full rounded-full bg-[#2f2a24] px-5 py-3.5 text-[15px] font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {ver.status === 'pending'
              ? 'Under review'
              : submitting
                ? 'Submitting…'
                : t('verification.submit')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    rejected: 'bg-red-100 text-red-800',
    unverified: 'bg-slate-100 text-slate-700',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors[status] ?? colors.unverified}`}>
      {label}
    </span>
  )
}
