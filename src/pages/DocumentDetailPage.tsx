import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileSignature,
  Loader2,
  MapPin,
  Send,
  UserSearch,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import type { TranslateFn, TranslationKey } from '../lib/i18n'
import { navigateTo } from '../lib/navigation'
import { appendLocationToPath, formatGlobalLocationLabel } from '../lib/globalLocation'
import {
  DocumentFreshnessBadge,
  LegalContentDisclaimer,
} from '../components/officialSources/DocumentFreshnessBadge'
import {
  documentVerificationStatus,
  filledDocumentFilename,
  getDocumentByPathParts,
  openFilledDocumentPdf,
  type DocumentRecord,
  type FormFieldDef,
} from '../lib/documents'
import { documentDisplayDescription, documentDisplayTitle } from '../lib/documents/display'
import { fieldDisplayLabel } from '../lib/documents/officialForms'
import type { Profile } from '../lib/types'

type Props = {
  countrySlug: string
  cityOrSlug: string
  slug?: string
}

function profileValue(
  field: FormFieldDef,
  profile: Profile | null,
  userEmail: string | null | undefined,
): string {
  if (!field.profileKey) return ''
  switch (field.profileKey) {
    case 'full_name':
      return profile?.full_name ?? ''
    case 'phone':
      return profile?.phone ?? ''
    case 'email':
      return userEmail ?? ''
    case 'location':
      return profile?.location ?? ''
    case 'company_name':
      return (profile as Profile & { company_name?: string | null })?.company_name
        || profile?.full_name
        || ''
    default:
      return ''
  }
}

export function DocumentDetailPage({ countrySlug, cityOrSlug, slug }: Props) {
  const { t, location, profile, user, language } = useApp()
  const tStored = (key: string) => t(key as TranslationKey)
  const doc = useMemo(
    () => getDocumentByPathParts(countrySlug, cityOrSlug, slug),
    [countrySlug, cityOrSlug, slug],
  )

  const [filling, setFilling] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [signOpen, setSignOpen] = useState(false)

  useEffect(() => {
    if (!doc?.formFields) return
    const next: Record<string, string> = {}
    for (const field of doc.formFields) {
      next[field.id] = profileValue(field, profile, user?.email)
    }
    setValues(next)
  }, [doc, profile, user?.email])

  if (!doc) {
    return (
      <div className="layout-page-content py-16 text-center">
        <p className="text-sm text-[#6f665d]">{t('docs.notFound')}</p>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#007185]"
          onClick={() => navigateTo('/documents')}
        >
          {t('docs.backToHub')}
        </button>
      </div>
    )
  }

  const locationLabel = formatGlobalLocationLabel(location, t('dimarket.loc.all-europe'))
  const steps = doc.procedureSteps ?? []
  const isLicense = doc.documentType === 'license' || doc.documentType === 'permit'

  const onDownloadPdf = () => {
    if (!doc.formFields) return
    const fields = doc.formFields.map((f) => {
      const raw = values[f.id] ?? ''
      let value = raw
      if (f.type === 'select' && raw) {
        const opt = f.options?.find((o) => o.value === raw)
        value = opt?.label || (opt ? tStored(opt.labelKey) : raw)
      }
      return { label: fieldDisplayLabel(f, t), value }
    })
    openFilledDocumentPdf(
      {
        title: documentDisplayTitle(doc, language.code, t),
        jurisdiction: doc.jurisdiction,
        sourceName: doc.source.name,
        sourceUrl: doc.source.url,
        version: doc.version,
        lastVerified: doc.lastVerified ?? doc.source.lastVerified,
        templateNeedsLegalReview: doc.templateNeedsLegalReview,
        fields,
        needsReviewLabel: t('docs.templateNeedsReview'),
        disclaimerAccuracy: t('osm.disclaimer.accuracy'),
        disclaimerNotAdvice: t('osm.disclaimer.notAdvice'),
      },
      filledDocumentFilename(documentDisplayTitle(doc, language.code, t)),
    )
  }

  const findSpecialist = (query: string, categorySlug?: string) => {
    const params = new URLSearchParams()
    params.set('q', query)
    params.set('tab', 'professionals')
    if (location.city) params.set('city', location.city)
    if (location.country) params.set('country', location.country)
    if (categorySlug) params.set('category', categorySlug)
    navigateTo(`/search?${params.toString()}`)
  }

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigateTo(appendLocationToPath(`/documents/${doc.subcategory}`, location))}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[#007185]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('docs.backToList')}
        </button>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a8178]">
            {tStored(`docs.type.${doc.documentType}`)} · {tStored(`docs.status.${doc.status}`)}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#2f2a24]">
            {documentDisplayTitle(doc, language.code, t)}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6f665d]">
            {documentDisplayDescription(doc, language.code, t)}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#6f665d]">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {doc.jurisdiction}
            {locationLabel ? ` · ${t('docs.location.headerIs')} ${locationLabel}` : ''}
          </p>
        </header>

        {doc.templateNeedsLegalReview ? (
          <div className="mb-4 rounded-none border border-[#f5c26b] bg-[#fff8eb] px-4 py-3 text-sm text-[#2f2a24]">
            {doc.officialForm ? (
              <>
                <p className="font-semibold">{doc.officialForm.modelName}</p>
                <p className="mt-1 text-[#6f665d]">{doc.officialForm.noticeLocal}</p>
                {language.code === 'en' || language.code === 'uk' ? (
                  <p className="mt-1 text-xs text-[#8a8178]">{doc.officialForm.noticeEn}</p>
                ) : null}
              </>
            ) : (
              t('docs.templateNeedsReview')
            )}
          </div>
        ) : null}

        <div className="mb-4">
          <DocumentFreshnessBadge
            verificationStatus={documentVerificationStatus(doc)}
            lastVerifiedAt={doc.lastVerified}
            sourceName={doc.source.name}
            sourceUrl={doc.source.url}
            trustTier="national_government"
          />
        </div>

        {doc.relatedPortals?.length ? (
          <section className="mb-6 rounded-none border-2 border-[#007185]/40 bg-[#f0fafb] p-4">
            <h2 className="text-base font-bold text-[#2f2a24]">{t('docs.vehicleCheck.title')}</h2>
            <p className="mt-1 text-xs text-[#6f665d]">{t('docs.vehicleCheck.hint')}</p>
            <div className="mt-3 flex flex-col gap-2">
              {doc.relatedPortals.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 rounded-none bg-[#007185] px-4 py-3 text-sm font-semibold text-white hover:bg-[#005f6b]"
                >
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    {p.name}
                    <span className="mt-0.5 block text-xs font-normal text-white/85">
                      {language.code === 'uk' ? p.purposeUk : p.purposeEn}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mb-6 space-y-2 rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4 text-sm">
          <MetaRow label={t('docs.meta.country')} value={doc.countryCode} />
          {doc.region ? <MetaRow label={t('docs.meta.region')} value={doc.region} /> : null}
          {doc.city ? <MetaRow label={t('docs.meta.city')} value={doc.city} /> : null}
          <MetaRow label={t('docs.meta.version')} value={doc.version} />
          <MetaRow label={t('docs.meta.source')} value={doc.source.name} />
          {isLicense && doc.licenseRequirement ? (
            <MetaRow
              label={t('docs.meta.licenseRequired')}
              value={tStored(`docs.license.${doc.licenseRequirement}`)}
            />
          ) : null}
          {doc.issuerKey ? <MetaRow label={t('docs.meta.issuer')} value={tStored(doc.issuerKey)} /> : null}
          {doc.costKey ? <MetaRow label={t('docs.meta.cost')} value={tStored(doc.costKey)} /> : null}
          {doc.durationKey ? (
            <MetaRow label={t('docs.meta.duration')} value={tStored(doc.durationKey)} />
          ) : null}
        </section>

        {doc.requirementsKeys.length > 0 ? (
          <section className="mb-6">
            <h2 className="mb-2 text-base font-bold text-[#2f2a24]">{t('docs.requirements')}</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#6f665d]">
              {doc.requirementsKeys.map((key) => (
                <li key={key}>{tStored(key)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {steps.length > 0 ? (
          <ProcedurePanel
            doc={doc}
            stepIndex={stepIndex}
            setStepIndex={setStepIndex}
            t={t}
          />
        ) : null}

        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href={doc.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-none bg-[#2f2a24] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {t('docs.openOfficial')}
          </a>
          {doc.formFields?.length ? (
            <button
              type="button"
              onClick={() => setFilling((v) => !v)}
              className="inline-flex items-center gap-2 rounded-none border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2.5 text-sm font-semibold text-[#2f2a24]"
            >
              <FileSignature className="h-4 w-4" aria-hidden />
              {filling ? t('docs.hideForm') : t('docs.fillOnline')}
            </button>
          ) : null}
        </div>

        {filling && doc.formFields ? (
          <FillForm
            fields={doc.formFields}
            values={values}
            setValues={setValues}
            t={t}
            onPdf={onDownloadPdf}
            onSign={() => setSignOpen(true)}
            modelName={doc.officialForm?.modelName}
            checkPortals={doc.relatedPortals}
            langCode={language.code}
          />
        ) : null}

        {signOpen ? (
          <div className="mb-6 rounded-none border border-[rgba(148,163,184,0.22)] bg-[#f3f0ea] p-4 text-sm text-[#2f2a24]">
            <p className="font-semibold">{t('docs.esign.title')}</p>
            <p className="mt-1 text-[#6f665d]">{t('docs.esign.body')}</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[#007185]"
              onClick={() => setSignOpen(false)}
            >
              {t('common.close')}
            </button>
          </div>
        ) : null}

        {doc.specialists.length > 0 ? (
          <section className="mb-6">
            <h2 className="mb-2 text-base font-bold text-[#2f2a24]">{t('docs.findSpecialist')}</h2>
            <div className="flex flex-wrap gap-2">
              {doc.specialists.map((s) => (
                <button
                  key={s.labelKey}
                  type="button"
                  onClick={() => findSpecialist(s.searchQuery, s.categorySlug)}
                  className="inline-flex items-center gap-2 rounded-none border border-[rgba(148,163,184,0.35)] bg-white px-3 py-2 text-sm font-semibold text-[#2f2a24]"
                >
                  <UserSearch className="h-4 w-4" aria-hidden />
                  {tStored(s.labelKey)}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-2 space-y-3">
          <LegalContentDisclaimer />
          <p className="text-xs leading-5 text-[#6f665d]">{t('docs.disclaimer.short')}</p>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
      <span className="font-semibold text-[#2f2a24]">{label}:</span>
      <span className="text-[#6f665d]">{value}</span>
    </div>
  )
}

function ProcedurePanel({
  doc,
  stepIndex,
  setStepIndex,
  t,
}: {
  doc: DocumentRecord
  stepIndex: number
  setStepIndex: (n: number) => void
  t: TranslateFn
}) {
  const tStored = (key: string) => t(key as TranslationKey)
  const steps = doc.procedureSteps ?? []
  const step = steps[stepIndex]
  if (!step) return null
  return (
    <section className="mb-6 rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#2f2a24]">{t('docs.procedure.title')}</h2>
        <span className="text-xs font-semibold text-[#8a8178]">
          {t('docs.procedure.progress')
            .replace('{current}', String(stepIndex + 1))
            .replace('{total}', String(steps.length))}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[rgba(148,163,184,0.22)]">
        <div
          className="h-full rounded-full bg-[#007185]"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      <p className="font-semibold text-[#2f2a24]">{tStored(step.titleKey)}</p>
      <p className="mt-1 text-sm text-[#6f665d]">{tStored(step.bodyKey)}</p>
      {step.whatIsKey ? (
        <p className="mt-2 text-sm">
          <strong>{t('docs.procedure.whatIs')}</strong> {tStored(step.whatIsKey)}
        </p>
      ) : null}
      {step.whatNeededKey ? (
        <p className="mt-1 text-sm">
          <strong>{t('docs.procedure.whatNeeded')}</strong> {tStored(step.whatNeededKey)}
        </p>
      ) : null}
      {step.whereKey ? (
        <p className="mt-1 text-sm">
          <strong>{t('docs.procedure.where')}</strong> {tStored(step.whereKey)}
        </p>
      ) : null}
      {step.source ? (
        <a
          href={step.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#007185]"
        >
          {step.source.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
          className="rounded-none border border-[rgba(148,163,184,0.35)] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
        >
          {t('docs.procedure.prev')}
        </button>
        <button
          type="button"
          disabled={stepIndex >= steps.length - 1}
          onClick={() => setStepIndex(Math.min(steps.length - 1, stepIndex + 1))}
          className="rounded-none bg-[#2f2a24] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t('docs.procedure.next')}
        </button>
      </div>
    </section>
  )
}

function FillForm({
  fields,
  values,
  setValues,
  t,
  onPdf,
  onSign,
  modelName,
  checkPortals,
  langCode,
}: {
  fields: FormFieldDef[]
  values: Record<string, string>
  setValues: (v: Record<string, string>) => void
  t: TranslateFn
  onPdf: () => void
  onSign: () => void
  modelName?: string
  checkPortals?: DocumentRecord['relatedPortals']
  langCode?: string
}) {
  const [busy, setBusy] = useState(false)
  const tStored = (key: string) => t(key as TranslationKey)
  let lastSection = ''
  return (
    <section className="mb-6 rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-4">
      <h2 className="mb-1 text-base font-bold text-[#2f2a24]">{t('docs.form.title')}</h2>
      {modelName ? <p className="mb-2 text-xs font-semibold text-[#007185]">{modelName}</p> : null}
      <p className="mb-3 text-xs text-[#6f665d]">{t('docs.form.autofillHint')}</p>
      {checkPortals?.length ? (
        <div className="mb-4 rounded-none border border-[#007185]/25 bg-[#f0fafb] p-3">
          <p className="text-xs font-bold text-[#2f2a24]">{t('docs.vehicleCheck.title')}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {checkPortals.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#007185] underline-offset-2 hover:underline"
              >
                {p.name}
                <span className="ml-1 font-normal text-[#6f665d]">
                  — {langCode === 'uk' ? p.purposeUk : p.purposeEn}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
      <div className="space-y-3">
        {fields.map((field) => {
          const section = field.section
          const showSection = section && section !== lastSection
          if (section) lastSection = section
          return (
            <div key={field.id}>
              {showSection ? (
                <p className="mb-2 mt-3 text-xs font-bold uppercase tracking-wide text-[#8a8178]">
                  {section}
                </p>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-[#2f2a24]">
                  {fieldDisplayLabel(field, t)}
                  {field.required ? ' *' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.id] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    rows={3}
                    placeholder={field.placeholder}
                    className="w-full rounded-none border border-[rgba(148,163,184,0.35)] px-3 py-2 text-sm"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={values[field.id] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    className="w-full rounded-none border border-[rgba(148,163,184,0.35)] px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label || tStored(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'date'
                          ? 'date'
                          : field.type === 'email'
                            ? 'email'
                            : field.type === 'phone'
                              ? 'tel'
                              : 'text'
                    }
                    value={values[field.id] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-none border border-[rgba(148,163,184,0.35)] px-3 py-2 text-sm"
                  />
                )}
              </label>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setBusy(true)
            try {
              onPdf()
            } finally {
              setBusy(false)
            }
          }}
          className="inline-flex items-center gap-2 rounded-none bg-[#007185] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t('docs.downloadPdf')}
        </button>
        <button
          type="button"
          onClick={onSign}
          className="inline-flex items-center gap-2 rounded-none border border-[rgba(148,163,184,0.35)] px-4 py-2.5 text-sm font-semibold text-[#2f2a24]"
        >
          <Send className="h-4 w-4" aria-hidden />
          {t('docs.sendForSignature')}
        </button>
      </div>
    </section>
  )
}
