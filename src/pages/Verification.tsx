import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { TrustBadges, TrustScorePill, VerificationBadge } from '../components/MatchScoreBadge'
import {
  ACCEPT_MIME,
  docsForRole,
  getOrCreateVerification,
  listVerificationDocuments,
  listVerificationDocTypes,
  listVerificationHistory,
  markContactVerified,
  resolveRoleKind,
  submitVerificationRequest,
  uploadVerificationDoc,
  type ContractorVerification,
  type VerificationDocument,
  type VerificationHistoryRow,
} from '../lib/verification/verification'
import {
  buildVerificationChecks,
  nextLevelHint,
  progressFromChecks,
} from '../lib/verificationChecks'
import { TRUST_LEVELS, clampTrustLevel } from '../lib/verification/trustLevels'
import {
  estimateTrustScore,
  fetchTrustScore,
  recomputeTrustScore,
  type TrustScoreBreakdown,
} from '../lib/verification/trustScore'

export function Verification() {
  const { user, profile, t } = useApp()
  const role = resolveRoleKind(profile?.user_role, profile?.is_professional)
  const [ver, setVer] = useState<ContractorVerification | null>(null)
  const [docTypes, setDocTypes] = useState<string[]>([])
  const [docs, setDocs] = useState<VerificationDocument[]>([])
  const [history, setHistory] = useState<VerificationHistoryRow[]>([])
  const [trust, setTrust] = useState<TrustScoreBreakdown | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [vat, setVat] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressCountry, setAddressCountry] = useState('')
  const [addressPostal, setAddressPostal] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const refresh = useCallback(async (verificationId: string, profileId: string) => {
    const [types, documents, hist, score] = await Promise.all([
      listVerificationDocTypes(verificationId),
      listVerificationDocuments(verificationId),
      listVerificationHistory(verificationId),
      fetchTrustScore(profileId),
    ])
    setDocTypes(types)
    setDocs(documents)
    setHistory(hist)
    if (score) setTrust(score)
    void recomputeTrustScore(profileId).then(async () => {
      const again = await fetchTrustScore(profileId)
      if (again) setTrust(again)
    })
  }, [])

  useEffect(() => {
    if (!user) {
      navigateTo('/login')
      return
    }
    void getOrCreateVerification(user.id).then(async (v) => {
      if (!v) return
      setVer(v)
      setBusinessName(v.business_name || '')
      setVat(v.vat_number || '')
      setAddressLine(v.address_line || '')
      setAddressCity(v.address_city || '')
      setAddressCountry(v.address_country || '')
      setAddressPostal(v.address_postal_code || '')
      setYearsExp(v.years_experience != null ? String(v.years_experience) : '')
      await refresh(v.id, user.id)
    })
  }, [user?.id, refresh])

  const checks = useMemo(
    () =>
      buildVerificationChecks({
        profile,
        emailConfirmed: Boolean(user?.email_confirmed_at || profile?.email_verified_at),
        docTypes,
        role,
      }),
    [profile, user, docTypes, role],
  )

  const progress = progressFromChecks(checks)
  const trustLevel = clampTrustLevel(profile?.trust_level ?? 0)
  const hint = nextLevelHint(trustLevel, checks)
  const estimated = useMemo(
    () => estimateTrustScore({ profile, docTypes }),
    [profile, docTypes],
  )
  const score = trust ?? estimated
  const uploadDefs = docsForRole(role)

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
    const ok = await submitVerificationRequest(ver.id, user.id, {
      business_name: businessName.trim(),
      vat_number: vat.trim(),
      address_line: addressLine.trim(),
      address_city: addressCity.trim(),
      address_country: addressCountry.trim(),
      address_postal_code: addressPostal.trim(),
      years_experience: yearsExp ? Number(yearsExp) : null,
    })
    setSubmitting(false)
    if (ok) {
      setVer({ ...ver, status: 'pending' })
      setMessage(t('verification.submitted'))
      await refresh(ver.id, user.id)
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
      await refresh(ver.id, user.id)
    } else {
      setMessage(t('verification.error'))
    }
  }

  const confirmEmail = async () => {
    const result = await markContactVerified(user.id, 'email', {
      emailConfirmed: Boolean(user.email_confirmed_at),
    })
    setMessage(result.ok ? t('verification.emailMarked') : result.error || t('verification.error'))
    if (result.ok) await refresh(ver.id, user.id)
  }

  const confirmPhone = async () => {
    if (!profile?.phone) {
      setMessage(t('verification.addPhoneFirst'))
      navigateTo('/settings')
      return
    }
    const result = await markContactVerified(user.id, 'phone', { phone: profile.phone })
    setMessage(result.ok ? t('verification.phoneMarked') : result.error || t('verification.error'))
    if (result.ok) await refresh(ver.id, user.id)
  }

  const statusLabel =
    ver.status === 'needs_info'
      ? t('verification.status.needs_info')
      : ver.status === 'pending'
        ? t('verification.status.pending')
        : ver.status === 'verified'
          ? t('verification.status.verified')
          : ver.status === 'rejected'
            ? t('verification.status.rejected')
            : t('verification.status.unverified')

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
                <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-bold text-[#1d1d1f]">
                  {statusLabel}
                </span>
                <VerificationBadge trustLevel={trustLevel} size="md" />
                <TrustScorePill score={score.score} size="md" />
              </div>
              <div className="mt-3">
                <TrustBadges source={profile} size="md" max={6} />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-6 rounded-2xl border border-[#e8e8ed] bg-[#f5f5f7] p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[#1d1d1f]">{t('verification.progress')}</span>
              <span className="tabular-nums text-[#86868b]">
                {progress.done}/{progress.total} · {progress.pct}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#1d1d1f] transition-all duration-500"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="mt-2 text-[12px] text-[#86868b]">{hint}</p>
          </div>

          {/* Level ladder 0–6 */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {TRUST_LEVELS.map((tier) => {
              const unlocked = trustLevel >= tier.level
              const active = trustLevel === tier.level
              return (
                <div
                  key={tier.level}
                  className={`rounded-xl border px-2 py-2 ${
                    active
                      ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                      : unlocked
                        ? 'border-emerald-200 bg-emerald-50 text-[#1d1d1f]'
                        : 'border-[#e8e8ed] bg-white text-[#86868b]'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide">L{tier.level}</p>
                  <p className="mt-0.5 text-[11px] font-semibold leading-snug">{tier.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 md:px-6">
        {ver.status === 'needs_info' && ver.review_notes ? (
          <Alert tone="amber" title={t('verification.needsInfoTitle')} body={ver.review_notes} />
        ) : null}
        {ver.status === 'rejected' && ver.review_notes ? (
          <Alert tone="red" title={t('verification.rejectedTitle')} body={ver.review_notes} />
        ) : null}
        {message ? <Alert tone="green" title={message} body="" /> : null}

        {/* Trust score + AI tips */}
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.trustScore')}</h2>
              <p className="mt-1 text-[13px] text-[#86868b]">{t('verification.trustScoreHint')}</p>
            </div>
            <p className="text-3xl font-semibold tabular-nums text-[#1d1d1f]">{Math.round(score.score)}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              ['Verification', score.verification_points],
              ['Reviews', score.reviews_points],
              ['Projects', score.projects_points],
              ['Response', score.response_points],
              ['Profile', score.profile_points],
              ['Tenure', score.tenure_points],
            ].map(([label, pts]) => (
              <div key={String(label)} className="rounded-xl bg-[#f5f5f7] px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-[#86868b]">{label}</p>
                <p className="text-sm font-semibold tabular-nums text-[#1d1d1f]">{pts}</p>
              </div>
            ))}
          </div>
          {score.recommendations.length > 0 ? (
            <div className="mt-4 rounded-xl border border-[#e8e8ed] bg-[#fafafa] p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1d1d1f]">
                <Sparkles className="h-3.5 w-3.5" />
                {t('verification.aiTips')}
              </p>
              <ul className="mt-2 space-y-1">
                {score.recommendations.slice(0, 5).map((tip) => (
                  <li key={tip} className="text-[12px] text-[#86868b]">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Checks */}
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.checksTitle')}</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">
            {role === 'customer'
              ? t('verification.roleCustomer')
              : role === 'company'
                ? t('verification.roleCompany')
                : t('verification.roleProfessional')}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase text-emerald-700">
                {t('verification.completedSteps')}
              </p>
              <ul className="space-y-2">
                {progress.completed.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm text-[#1d1d1f]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {c.label}
                  </li>
                ))}
                {!progress.completed.length ? (
                  <li className="text-xs text-[#86868b]">—</li>
                ) : null}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase text-amber-700">
                {t('verification.missingSteps')}
              </p>
              <ul className="space-y-2">
                {progress.missing.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm text-[#1d1d1f]">
                    <span className="inline-flex items-center gap-2">
                      <Circle className="h-4 w-4 text-[#d2d2d7]" />
                      {c.label}
                    </span>
                    {c.id === 'email' ? (
                      <button
                        type="button"
                        onClick={() => void confirmEmail()}
                        className="rounded-full bg-[#1d1d1f] px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        <Mail className="mr-1 inline h-3 w-3" />
                        {t('verification.confirm')}
                      </button>
                    ) : null}
                    {c.id === 'phone' ? (
                      <button
                        type="button"
                        onClick={() => void confirmPhone()}
                        className="rounded-full bg-[#1d1d1f] px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        <Phone className="mr-1 inline h-3 w-3" />
                        {t('verification.confirm')}
                      </button>
                    ) : null}
                  </li>
                ))}
                {!progress.missing.length ? (
                  <li className="text-xs text-emerald-600">{t('verification.allComplete')}</li>
                ) : null}
              </ul>
            </div>
          </div>
        </section>

        {/* Business / address fields */}
        {(role === 'company' || role === 'professional' || role === 'customer') && (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.businessDetails')}</h2>
            <div className="mt-4 space-y-3">
              {(role === 'company' || role === 'professional') && (
                <>
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
                </>
              )}
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
              {role === 'professional' ? (
                <Field
                  label={t('verification.yearsExperience')}
                  value={yearsExp}
                  onChange={setYearsExp}
                  disabled={ver.status === 'verified'}
                />
              ) : null}
            </div>
          </section>
        )}

        {/* Documents */}
        <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.documents')}</h2>
          <p className="mt-1 text-[13px] text-[#86868b]">{t('verification.documentsHint')}</p>
          <ul className="mt-4 space-y-2">
            {uploadDefs.map((doc) => {
              const uploaded = docTypes.includes(doc.key)
              return (
                <li
                  key={doc.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f0f0f2] px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#86868b]" />
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
                      accept={ACCEPT_MIME}
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

        {/* Certificates on profile-style list */}
        {docs.length > 0 ? (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.certificates')}</h2>
            <ul className="mt-3 space-y-2">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[#1d1d1f]">
                    {d.file_name || d.doc_type} · {d.doc_type.replace(/_/g, ' ')}
                  </span>
                  {d.signed_url ? (
                    <a
                      href={d.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-semibold text-[#1d1d1f] underline"
                    >
                      {t('verification.secureDownload')}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Timeline */}
        {history.length > 0 ? (
          <section className="rounded-[22px] border border-[#e8e8ed] bg-white p-5">
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t('verification.timeline')}</h2>
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl bg-[#f5f5f7] px-3 py-2.5 text-[13px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-[#1d1d1f]">
                      {h.action.replace(/_/g, ' ')}
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
                : ver.status === 'needs_info' || ver.status === 'rejected'
                  ? t('verification.resubmit')
                  : t('verification.submit')}
          </button>
        ) : null}

        <p className="text-center text-[11px] text-[#86868b]">{t('verification.gdprHint')}</p>
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

function Alert({
  tone,
  title,
  body,
}: {
  tone: 'amber' | 'red' | 'green'
  title: string
  body: string
}) {
  const cls =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return (
    <div className={`rounded-2xl border px-4 py-3 text-[13px] ${cls}`}>
      <p className="font-semibold">{title}</p>
      {body ? <p className="mt-1">{body}</p> : null}
    </div>
  )
}
