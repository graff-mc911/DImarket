import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Building2,
  Check,
  Clock,
  Download,
  FileSpreadsheet,
  Hammer,
  ImagePlus,
  Package,
  Sparkles,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { EstimatorShell } from '../components/cost-estimator/EstimatorShell'
import { LocationStep } from '../components/project-wizard/LocationStep'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { useApp } from '../contexts/AppContext'
import { formatEuro } from '../lib/costEstimator'
import { runFullCostEstimate, tierLabel } from '../lib/costEstimatorEngine'
import {
  downloadCsv,
  downloadExcelCsv,
  estimateToCsv,
  openEstimatePdfPrint,
} from '../lib/costEstimatorExport'
import {
  fetchEstimatorMatches,
  type EstimatorMarketplaceMatches,
  type EstimatorMatchProfile,
} from '../lib/costEstimatorMatch'
import { listCostEstimates, saveCostEstimate } from '../lib/costEstimatorPersist'
import {
  EMPTY_ESTIMATOR_STATE,
  ESTIMATOR_PROJECT_TYPES,
  fileKindFromMime,
  getProjectType,
  type EstimatorDraftFile,
  type EstimatorProjectTypeId,
  type EstimatorState,
  type EstimatorStep,
  type FullCostEstimate,
  type PricingTierId,
} from '../lib/costEstimatorTypes'
import { navigateTo } from '../lib/navigation'
import type { Profile } from '../lib/types'

const field =
  'w-full rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]'

const PREFILL_KEY = 'dimarket_estimator_project_prefill'

/** AI Cost Estimator — /cost-estimator · /estimate */
export function CostEstimator() {
  const { t, location: globalLoc, user } = useApp()
  const [state, setState] = useState<EstimatorState>(() => ({
    ...EMPTY_ESTIMATOR_STATE,
    location: {
      ...EMPTY_ESTIMATOR_STATE.location,
      country: globalLoc.country || '',
      region: globalLoc.region || '',
      province: globalLoc.province || '',
      city: globalLoc.city || '',
      locationLabel: [globalLoc.city, globalLoc.province, globalLoc.country]
        .filter(Boolean)
        .join(', '),
      latitude: globalLoc.originLat,
      longitude: globalLoc.originLng,
    },
  }))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [estimate, setEstimate] = useState<FullCostEstimate | null>(null)
  const [matches, setMatches] = useState<EstimatorMarketplaceMatches | null>(null)
  const [tier, setTier] = useState<PricingTierId>('standard')
  const [selectedPros, setSelectedPros] = useState<Set<string>>(new Set())
  const [savedId, setSavedId] = useState<string | null>(null)
  const [historyCount, setHistoryCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const patch = (partial: Partial<EstimatorState>) =>
    setState((prev) => ({ ...prev, ...partial }))

  useEffect(() => {
    void listCostEstimates(user?.id ?? null).then((rows) => setHistoryCount(rows.length))
  }, [user?.id, savedId])

  // Sync global location when user hasn't typed a custom city yet
  useEffect(() => {
    if (state.step !== 4) return
    if (state.location.city && state.location.city !== globalLoc.city) return
    patch({
      location: {
        ...state.location,
        country: globalLoc.country || state.location.country,
        region: globalLoc.region || state.location.region,
        province: globalLoc.province || state.location.province,
        city: globalLoc.city || state.location.city,
        locationLabel:
          state.location.locationLabel ||
          [globalLoc.city, globalLoc.province, globalLoc.country].filter(Boolean).join(', '),
        latitude: globalLoc.originLat ?? state.location.latitude,
        longitude: globalLoc.originLng ?? state.location.longitude,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalLoc.city, globalLoc.country, state.step])

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files)
    setState((prev) => {
      const next = [...prev.files]
      for (const file of list.slice(0, 12 - prev.files.length)) {
        next.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          kind: fileKindFromMime(file.type, file.name),
        })
      }
      return { ...prev, files: next.slice(0, 12) }
    })
  }

  const removeFile = (id: string) => {
    setState((prev) => {
      const item = prev.files.find((f) => f.id === id)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return { ...prev, files: prev.files.filter((f) => f.id !== id) }
    })
  }

  const validateStep = (step: EstimatorStep): string | null => {
    if (step === 1 && !state.projectTypeId) return 'Please choose a project type'
    if (step === 2 && state.description.trim().length < 15)
      return 'Please write at least 15 characters'
    if (step === 5) {
      const area = Number(state.measurements.areaSqm)
      if (!(area > 0)) return 'Enter area in m²'
    }
    return null
  }

  const goNext = async () => {
    const err = validateStep(state.step)
    if (err) {
      setError(err)
      return
    }
    setError(null)

    if (state.step === 5) {
      setBusy(true)
      setProgress(0)
      try {
        // Derive area from L×W if user filled dimensions
        let nextState = state
        if (
          (!state.measurements.areaSqm || state.measurements.areaSqm <= 0) &&
          state.measurements.lengthM &&
          state.measurements.widthM
        ) {
          nextState = {
            ...state,
            measurements: {
              ...state.measurements,
              areaSqm: Math.round(state.measurements.lengthM * state.measurements.widthM * 10) / 10,
            },
          }
          setState(nextState)
        }
        const result = await runFullCostEstimate(nextState, (pct, label) => {
          setProgress(pct)
          setProgressLabel(label)
        })
        setEstimate(result)
        setState((s) => ({ ...s, step: 6 }))
        setBusy(false)
        void fetchEstimatorMatches(result, nextState.location).then(setMatches)
        void saveCostEstimate({
          userId: user?.id ?? null,
          state: nextState,
          estimate: result,
        }).then((r) => setSavedId(r.id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Estimate failed')
        setBusy(false)
      }
      return
    }

    patch({ step: (state.step + 1) as EstimatorStep })
  }

  const goBack = () => {
    setError(null)
    if (state.step === 6) {
      setEstimate(null)
      setMatches(null)
    }
    patch({ step: Math.max(1, state.step - 1) as EstimatorStep })
  }

  const storePrefill = () => {
    if (!estimate) return
    const type = getProjectType(state.projectTypeId)
    const payload = {
      tradeId: type.tradeId,
      subcategorySlug: type.subcategorySlug,
      description: [
        state.description,
        '',
        `Reference budget (Standard): ${formatEuro(estimate.totals.standard.grandTotal)}`,
        `Economy–Premium: ${formatEuro(estimate.totals.economy.grandTotal)} – ${formatEuro(estimate.totals.premium.grandTotal)}`,
        `Area: ${state.measurements.areaSqm} m²`,
        `Timeline: ${estimate.totalDaysMin}–${estimate.totalDaysMax} days`,
        `Specialists: ${estimate.specialists.map((s) => s.label).join(', ')}`,
      ].join('\n'),
      country: state.location.country,
      city: state.location.city,
      postalCode: state.location.postalCode,
      locationLabel: state.location.locationLabel,
      latitude: state.location.latitude,
      longitude: state.location.longitude,
      budgetMin: estimate.totals.economy.grandTotal,
      budgetMax: estimate.totals.premium.grandTotal,
      selectedProfessionalIds: [...selectedPros],
      estimateId: savedId,
    }
    try {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify(payload))
    } catch {
      /* ignore */
    }
  }

  const convertToProject = () => {
    storePrefill()
    navigateTo('/create-project')
  }

  const requestQuotes = () => {
    storePrefill()
    if (selectedPros.size === 0) {
      navigateTo('/create-project')
      return
    }
    navigateTo('/create-project')
  }

  const searchPros = () => {
    const type = getProjectType(state.projectTypeId)
    const q = encodeURIComponent(type.labelEn)
    const city = encodeURIComponent(state.location.city || '')
    navigateTo(`/search?q=${q}&tab=professionals&city=${city}`)
  }

  const searchCompanies = () => {
    const type = getProjectType(state.projectTypeId)
    navigateTo(
      `/companies?q=${encodeURIComponent(type.labelEn)}&city=${encodeURIComponent(state.location.city || '')}`,
    )
  }

  const searchShops = () => {
    const q = encodeURIComponent(estimate?.materials[0]?.searchQuery || 'building materials')
    navigateTo(`/sell-rent?q=${q}`)
  }

  const togglePro = (id: string) => {
    setSelectedPros((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const typeLabel = (id: EstimatorProjectTypeId) => {
    const item = ESTIMATOR_PROJECT_TYPES.find((x) => x.id === id)!
    const key = item.labelKey as never
    const translated = t(key)
    return translated === item.labelKey ? item.labelEn : translated
  }

  if (busy && state.step === 5) {
    return (
      <EstimatorShell
        step={5}
        title={t('costEstimator.analyzing')}
        subtitle={progressLabel || t('costEstimator.sub')}
        busy
      >
        <div className="mx-auto max-w-md py-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 animate-pulse text-[#1d1d1f]" />
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
            <div
              className="h-full rounded-full bg-[#1d1d1f] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-[13px] text-[#86868b]">{progress}%</p>
        </div>
      </EstimatorShell>
    )
  }

  if (state.step === 6 && estimate) {
    const totals = estimate.totals[tier]
    return (
      <div className="min-h-[80vh] bg-[#f5f5f7] pb-24">
        <div className="border-b border-[#e8e8ed] bg-white">
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                <Sparkles className="h-3 w-3" />
                {t('costEstimator.referenceBadge')}
              </span>
              <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]">
                {estimate.confidence}% · {estimate.source === 'local' ? 'Model' : 'AI + model'}
              </span>
              {savedId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-3 py-1 text-[12px] font-semibold text-[#047857]">
                  <Check className="h-3 w-3" />
                  {t('costEstimator.saved')}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-[#1d1d1f] md:text-[36px]">
              {estimate.tradeLabel} · {state.measurements.areaSqm} m²
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-[#6e6e73]">{estimate.explanation}</p>
            <p className="mt-2 text-[13px] font-medium text-[#86868b]">{t('costEstimator.disclaimer')}</p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-6">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <ActionBtn icon={<Users className="h-4 w-4" />} onClick={searchPros}>
              {t('costEstimator.findPros')}
            </ActionBtn>
            <ActionBtn icon={<Building2 className="h-4 w-4" />} onClick={searchCompanies}>
              {t('costEstimator.findCompanies')}
            </ActionBtn>
            <ActionBtn icon={<Store className="h-4 w-4" />} onClick={searchShops}>
              {t('costEstimator.findShops')}
            </ActionBtn>
            <ActionBtn icon={<Hammer className="h-4 w-4" />} onClick={convertToProject} primary>
              {t('costEstimator.createProject')}
            </ActionBtn>
            <ActionBtn
              icon={<Download className="h-4 w-4" />}
              onClick={() => openEstimatePdfPrint(estimate, state, tier)}
            >
              {t('costEstimator.exportPdf')}
            </ActionBtn>
            <ActionBtn
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() =>
                downloadCsv(
                  `dimarket-estimate-${Date.now()}.csv`,
                  estimateToCsv(estimate, state),
                )
              }
            >
              {t('costEstimator.exportCsv')}
            </ActionBtn>
            <ActionBtn
              icon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() =>
                downloadExcelCsv(
                  `dimarket-estimate-${Date.now()}.xls`,
                  estimateToCsv(estimate, state),
                )
              }
            >
              Excel
            </ActionBtn>
            <button
              type="button"
              className="rounded-full px-4 py-2 text-[13px] font-medium text-[#6e6e73] hover:bg-white"
              onClick={goBack}
            >
              ← Edit inputs
            </button>
            {historyCount > 0 ? (
              <button
                type="button"
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#6e6e73] hover:bg-white"
                onClick={() => navigateTo('/cost-estimator/history')}
              >
                {t('costEstimator.history')} ({historyCount})
              </button>
            ) : null}
          </div>

          {/* Tiers */}
          <div className="grid gap-3 md:grid-cols-3">
            {(['economy', 'standard', 'premium'] as PricingTierId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTier(id)}
                className={`rounded-[22px] border p-5 text-left transition ${
                  tier === id
                    ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
                    : 'border-[#e8e8ed] bg-white text-[#1d1d1f] hover:border-[#d2d2d7]'
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                  {t(
                    id === 'economy'
                      ? 'costEstimator.economy'
                      : id === 'premium'
                        ? 'costEstimator.premium'
                        : 'costEstimator.standard',
                  )}
                </p>
                <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">
                  {formatEuro(estimate.totals[id].grandTotal)}
                </p>
                <p className={`mt-1 text-[12px] ${tier === id ? 'opacity-70' : 'text-[#86868b]'}`}>
                  {id === 'standard' ? 'Most common' : id === 'economy' ? 'Budget-friendly' : 'High-end finish'}
                </p>
              </button>
            ))}
          </div>

          {/* Metrics */}
          <div className="grid gap-3 rounded-[24px] border border-[#e8e8ed] bg-white p-5 sm:grid-cols-4">
            <Metric icon={<Hammer className="h-4 w-4" />} label={t('costEstimator.labor')} value={formatEuro(totals.labor)} />
            <Metric icon={<Package className="h-4 w-4" />} label={t('costEstimator.materials')} value={formatEuro(totals.materials)} />
            <Metric icon={<Wallet className="h-4 w-4" />} label={t('costEstimator.equipment')} value={formatEuro(totals.equipment)} />
            <Metric
              icon={<Clock className="h-4 w-4" />}
              label={t('costEstimator.timeline')}
              value={`${estimate.totalDaysMin}–${estimate.totalDaysMax}d`}
            />
          </div>

          {/* Breakdown */}
          <Section title="Cost breakdown">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[#86868b]">
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 font-semibold">{t('costEstimator.economy')}</th>
                    <th className="pb-2 font-semibold">{t('costEstimator.standard')}</th>
                    <th className="pb-2 font-semibold">{t('costEstimator.premium')}</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.breakdown.map((b) => (
                    <tr key={b.id} className="border-t border-[#f0f0f2]">
                      <td className="py-2.5 text-[#1d1d1f]">{b.label}</td>
                      <td className="py-2.5 tabular-nums">{formatEuro(b.amountEconomy)}</td>
                      <td className="py-2.5 tabular-nums font-medium">{formatEuro(b.amountStandard)}</td>
                      <td className="py-2.5 tabular-nums">{formatEuro(b.amountPremium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Timeline */}
          <Section title={t('costEstimator.timeline')}>
            <p className="mb-3 text-[13px] text-[#6e6e73]">
              Est. completion{' '}
              <strong className="text-[#1d1d1f]">
                {new Date(estimate.estimatedCompletionIso).toLocaleDateString()}
              </strong>
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {estimate.timeline.map((ph) => (
                <div key={ph.id} className="rounded-2xl bg-[#f5f5f7] px-4 py-3">
                  <p className="text-[12px] font-semibold text-[#86868b]">{ph.label}</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#1d1d1f]">
                    {ph.daysMin}–{ph.daysMax} days
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Work stages + specialists */}
          <Section title={t('costEstimator.specialists')}>
            <ol className="space-y-2">
              {estimate.specialists.map((sp, i) => {
                const counts = matches?.specialistCounts[sp.id]
                return (
                  <li
                    key={sp.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f0f0f2] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f5f7] text-[12px] font-bold text-[#1d1d1f]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-[#1d1d1f]">{sp.label}</p>
                        <p className="text-[12px] text-[#86868b]">~{sp.laborHours} labour hours</p>
                      </div>
                    </div>
                    {counts ? (
                      <p className="text-[12px] text-[#6e6e73]">
                        {counts.pros} pros · {counts.companies} companies nearby
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </Section>

          {/* Materials */}
          <Section title={t('costEstimator.materials')}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[#86868b]">
                    <th className="pb-2 font-semibold">Material</th>
                    <th className="pb-2 font-semibold">Qty</th>
                    <th className="pb-2 font-semibold">Category</th>
                    <th className="pb-2 font-semibold">{tierLabel(tier)}</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.materials.map((m) => {
                    const unit =
                      tier === 'economy'
                        ? m.unitPriceEconomy
                        : tier === 'premium'
                          ? m.unitPricePremium
                          : m.unitPriceStandard
                    return (
                      <tr key={m.id} className="border-t border-[#f0f0f2]">
                        <td className="py-2.5">{m.name}</td>
                        <td className="py-2.5 tabular-nums">
                          {m.quantity} {m.unit}
                        </td>
                        <td className="py-2.5 text-[#86868b]">{m.category}</td>
                        <td className="py-2.5 tabular-nums">{formatEuro(unit * m.quantity)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {matches?.materialListings?.length ? (
              <div className="mt-4 space-y-2">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
                  {t('costEstimator.materialShops')}
                </p>
                {matches.materialListings.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => navigateTo(`/listing/${l.id}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#f0f0f2] px-4 py-3 text-left hover:bg-[#fafafa]"
                  >
                    <span className="text-[14px] font-medium text-[#1d1d1f]">{l.title}</span>
                    <span className="text-[13px] text-[#6e6e73]">
                      {l.price != null ? formatEuro(l.price) : '—'}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </Section>

          {/* Insights */}
          <Section title={t('costEstimator.insights')}>
            <ul className="space-y-2">
              {estimate.insights.map((ins) => (
                <li
                  key={ins.id}
                  className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[13px] leading-relaxed text-[#3a3a3c]"
                >
                  <span className="mr-2 text-[11px] font-bold uppercase tracking-wide text-[#86868b]">
                    {ins.kind}
                  </span>
                  {ins.text}
                </li>
              ))}
            </ul>
          </Section>

          {/* Recommended pros */}
          <Section title={t('costEstimator.recommendedPros')}>
            {!matches ? (
              <p className="text-[13px] text-[#86868b]">Loading matches…</p>
            ) : matches.professionals.length === 0 ? (
              <p className="text-[13px] text-[#86868b]">
                No specialists found nearby — broaden location or publish a project.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.professionals.map((p) => (
                  <MatchPickCard
                    key={p.id}
                    profile={p}
                    selected={selectedPros.has(p.id)}
                    onToggle={() => togglePro(p.id)}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={t('costEstimator.recommendedCompanies')}>
            {!matches?.companies.length ? (
              <p className="text-[13px] text-[#86868b]">No companies matched yet in this area.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {matches.companies.map((p) => (
                  <MatchPickCard
                    key={p.id}
                    profile={p}
                    selected={selectedPros.has(p.id)}
                    onToggle={() => togglePro(p.id)}
                  />
                ))}
              </div>
            )}
          </Section>

          <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-[24px] border border-[#e8e8ed] bg-white/95 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.1)] backdrop-blur">
            <button
              type="button"
              onClick={requestQuotes}
              className="flex-1 rounded-full bg-[#1d1d1f] px-5 py-3.5 text-[14px] font-semibold text-white"
            >
              {t('costEstimator.sendQuotes')}
              {selectedPros.size ? ` (${selectedPros.size})` : ''}
            </button>
            <button
              type="button"
              onClick={convertToProject}
              className="rounded-full border border-[#d2d2d7] bg-white px-5 py-3.5 text-[14px] font-semibold text-[#1d1d1f]"
            >
              {t('costEstimator.createProject')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Steps 1–5
  const titles: Record<number, { title: string; sub: string }> = {
    1: { title: t('costEstimator.stepTypeTitle'), sub: t('costEstimator.stepTypeSub') },
    2: { title: t('costEstimator.stepDescTitle'), sub: t('costEstimator.stepDescSub') },
    3: { title: t('costEstimator.stepFilesTitle'), sub: t('costEstimator.stepFilesSub') },
    4: { title: t('costEstimator.stepLocTitle'), sub: t('costEstimator.stepLocSub') },
    5: { title: t('costEstimator.stepSizeTitle'), sub: t('costEstimator.stepSizeSub') },
  }
  const meta = titles[state.step] || titles[1]

  return (
    <EstimatorShell
      step={state.step}
      title={meta.title}
      subtitle={meta.sub}
      onBack={state.step > 1 ? goBack : undefined}
      onNext={() => void goNext()}
      nextLabel={state.step === 5 ? 'Run AI estimate' : 'Continue'}
      nextDisabled={busy}
      busy={busy}
      error={error}
      footerExtra={
        <button
          type="button"
          className="rounded-full px-3 py-2 text-[12px] font-medium text-[#86868b] hover:bg-[#f5f5f7]"
          onClick={() => navigateTo('/cost-estimator/history')}
        >
          {t('costEstimator.history')}
        </button>
      }
    >
      {state.step === 1 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {ESTIMATOR_PROJECT_TYPES.map((pt) => {
            const Icon = pt.icon
            const active = state.projectTypeId === pt.id
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => patch({ projectTypeId: pt.id })}
                className={`flex flex-col items-start gap-2 rounded-[18px] border px-3 py-3 text-left transition ${
                  active
                    ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                    : 'border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] hover:border-[#d2d2d7]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[12px] font-semibold leading-tight">{typeLabel(pt.id)}</span>
              </button>
            )
          })}
        </div>
      )}

      {state.step === 2 && (
        <textarea
          value={state.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={7}
          placeholder='e.g. "I want to renovate my 8 m² bathroom with new tiles, shower and vanity."'
          className={field + ' resize-y'}
        />
      )}

      {state.step === 3 && (
        <div>
          <div
            className="rounded-[18px] border-2 border-dashed border-[#d2d2d7] bg-[#fafafa] px-4 py-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
            }}
          >
            <ImagePlus className="mx-auto h-7 w-7 text-[#86868b]" />
            <p className="mt-2 text-[14px] font-medium text-[#1d1d1f]">
              Photos, video, PDF or CAD
            </p>
            <button
              type="button"
              className="mt-3 rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
              onClick={() => inputRef.current?.click()}
            >
              Upload files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*,.pdf,.dwg,.dxf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          {state.files.length > 0 ? (
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {state.files.map((f) => (
                <FileThumb key={f.id} file={f} onRemove={() => removeFile(f.id)} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-center text-[12px] text-[#86868b]">Optional — skip if none</p>
          )}
        </div>
      )}

      {state.step === 4 && (
        <LocationStep
          country={state.location.country}
          city={state.location.city}
          postalCode={state.location.postalCode}
          locationLabel={state.location.locationLabel}
          onChange={(p) =>
            patch({
              location: {
                ...state.location,
                country: p.country ?? state.location.country,
                city: p.city ?? state.location.city,
                postalCode: p.postalCode ?? state.location.postalCode,
                locationLabel: p.locationLabel ?? state.location.locationLabel,
                latitude: p.latitude !== undefined ? p.latitude : state.location.latitude,
                longitude: p.longitude !== undefined ? p.longitude : state.location.longitude,
              },
            })
          }
          labels={{
            country: 'Country',
            city: 'City',
            postal: 'Postal code',
            search: 'Search address',
          }}
        />
      )}

      {state.step === 5 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <NumField
            label="Area (m²) *"
            value={state.measurements.areaSqm}
            onChange={(n) =>
              patch({ measurements: { ...state.measurements, areaSqm: n } })
            }
          />
          <NumField
            label="Rooms"
            value={state.measurements.rooms}
            onChange={(n) =>
              patch({ measurements: { ...state.measurements, rooms: n || null } })
            }
          />
          <NumField
            label="Length (m)"
            value={state.measurements.lengthM}
            onChange={(n) =>
              patch({ measurements: { ...state.measurements, lengthM: n || null } })
            }
          />
          <NumField
            label="Width (m)"
            value={state.measurements.widthM}
            onChange={(n) =>
              patch({ measurements: { ...state.measurements, widthM: n || null } })
            }
          />
          <NumField
            label="Height (m)"
            value={state.measurements.heightM}
            onChange={(n) =>
              patch({ measurements: { ...state.measurements, heightM: n || null } })
            }
          />
          <NumField
            label="Floors"
            value={state.measurements.floors}
            onChange={(n) =>
              patch({ measurements: { ...state.measurements, floors: n || null } })
            }
          />
        </div>
      )}
    </EstimatorShell>
  )
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (n: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step="any"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={field}
      />
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[#e8e8ed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] px-3 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#1d1d1f]">
        {value}
      </p>
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  icon,
  primary,
}: {
  children: ReactNode
  onClick: () => void
  icon: ReactNode
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
        primary
          ? 'bg-[#1d1d1f] text-white hover:bg-black'
          : 'border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#fafafa]'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function FileThumb({ file, onRemove }: { file: EstimatorDraftFile; onRemove: () => void }) {
  return (
    <li className="relative aspect-square overflow-hidden rounded-xl bg-[#f5f5f7]">
      {file.previewUrl ? (
        <img src={file.previewUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center p-2 text-center text-[10px] font-medium text-[#6e6e73]">
          {file.kind.toUpperCase()}
          <br />
          {file.file.name.slice(0, 18)}
        </div>
      )}
      <button
        type="button"
        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
        onClick={onRemove}
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  )
}

function MatchPickCard({
  profile,
  selected,
  onToggle,
}: {
  profile: EstimatorMatchProfile
  selected: boolean
  onToggle: () => void
}) {
  // ProfessionalCard expects Profile-like — use compact row if types don't match
  const asProfile = profile as unknown as Profile
  return (
    <div
      className={`relative rounded-[20px] border p-2 transition ${
        selected ? 'border-[#1d1d1f] ring-2 ring-[#1d1d1f]/ring-offset-2' : 'border-[#e8e8ed]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          selected ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
        }`}
      >
        {selected ? 'Selected' : 'Select'}
      </button>
      <ProfessionalCard professional={asProfile} compact />
      {profile.distanceKm != null ? (
        <p className="px-3 pb-2 text-[11px] text-[#86868b]">
          ~{profile.distanceKm < 10 ? profile.distanceKm.toFixed(1) : Math.round(profile.distanceKm)}{' '}
          km
        </p>
      ) : null}
    </div>
  )
}
