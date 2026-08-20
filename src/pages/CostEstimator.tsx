import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Building2,
  Check,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  Hammer,
  ImagePlus,
  Mic,
  MicOff,
  Package,
  Sparkles,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { EstimatorShell } from '../components/cost-estimator/EstimatorShell'
import {
  BUILDZOOM_INTAKE_CARDS,
  EstimatorIntake,
  matchProjectType,
} from '../components/cost-estimator/EstimatorIntake'
import { EstimatorQuoteWizard } from '../components/cost-estimator/EstimatorQuoteWizard'
import { EstimatorProcurementPanel } from '../components/cost-estimator/EstimatorProcurementPanel'
import { LocationStep } from '../components/project-wizard/LocationStep'
import { ProfessionalCard } from '../components/ProfessionalCard'
import { useApp } from '../contexts/AppContext'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { formatEuro } from '../lib/costEstimator'
import {
  appendClarificationsToDescription,
  buildAnalystQuestions,
} from '../lib/aiAnalyst'
import { buildFullCostEstimateLocal, runFullCostEstimate, tierLabel } from '../lib/costEstimatorEngine'
import { estimatorTypeFromCatalogId } from '../lib/estimatorMainCategories'
import {
  BZ_POPULAR_PROJECTS,
  EMPTY_BZ_QUOTE,
  areaSqmFromBudget,
  budgetTierFromBand,
  initialQuoteScreen,
  isLowBudget,
  nextScreenAfter,
  prevScreenBefore,
  screensForQuoteType,
  validateQuoteScreen,
  type BzQuoteDraft,
  type BzQuoteScreen,
} from '../lib/buildzoomQuoteFlow'
import { clearQuoteSession, loadQuoteSession, saveQuoteSession } from '../lib/buildzoomQuoteSession'
import { supabase } from '../lib/supabase'
import { savePendingRegistration } from '../lib/profileSync'
import { flattenWorkFeatureIds } from '../lib/estimatorObjectTypes'
import { GEO_RADIUS_OPTIONS, radiusModeToKm } from '../lib/geoSearch'
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
import {
  getCostEstimateById,
  linkEstimateToListing,
  listCostEstimates,
  saveCostEstimate,
  saveCostEstimateOutcome,
} from '../lib/costEstimatorPersist'
import {
  buildTenderPrefill,
  ESTIMATOR_PREFILL_KEY,
  wizardStateFromTenderPrefill,
} from '../lib/costEstimatorTender'
import {
  EMPTY_ESTIMATOR_STATE,
  ESTIMATOR_PROJECT_TYPES,
  fileKindFromMime,
  getProjectType,
  type EstimatorDraftFile,
  type EstimatorObjectTypeId,
  type EstimatorProjectTypeId,
  type EstimatorState,
  type EstimatorStep,
  type EstimatorWorkPackage,
  type FullCostEstimate,
  type PricingTierId,
} from '../lib/costEstimatorTypes'
import { PROJECT_TRADES } from '../lib/projectWizard'
import { submitProjectWizard } from '../lib/submitProjectWizard'
import { readEstimatorAiPrefill } from '../lib/ai/estimatorPrefill'
import { applyPageSeo } from '../lib/pageSeo'
import { navigateTo } from '../lib/navigation'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import { PageContentAds } from '../components/CenterPageAd'
import type { Profile } from '../lib/types'

const EstimatorResultsMap = lazyWithRetry(() =>
  import('../components/cost-estimator/EstimatorResultsMap').then((m) => ({
    default: m.EstimatorResultsMap,
  })),
)

const field =
  'w-full rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]'

const PREFILL_KEY = ESTIMATOR_PREFILL_KEY

const ESTIMATOR_VOICE_LANG: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  ru: 'ru-RU',
  de: 'de-DE',
  pl: 'pl-PL',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
}

/** AI Cost Estimator — /cost-estimator · /estimate */
function EstimatorAdBanner() {
  return (
    <div className="layout-page-gutter">
      <PageContentAds page="estimator" outerClassName="mt-3 mb-1" />
    </div>
  )
}

export function CostEstimator() {
  const { t, location: globalLoc, user, profile, setLocation, language } = useApp()
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
      radiusKm: radiusModeToKm(globalLoc.radius) ?? 25,
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
  const [actualTotal, setActualTotal] = useState('')
  const [outcomeConsent, setOutcomeConsent] = useState(false)
  const [outcomeSaved, setOutcomeSaved] = useState(false)
  const [publishingTender, setPublishingTender] = useState(false)
  const [typeQuery, setTypeQuery] = useState('')
  const [quoteScreen, setQuoteScreen] = useState<BzQuoteScreen | null>(null)
  const [quoteDraft, setQuoteDraft] = useState<BzQuoteDraft>(EMPTY_BZ_QUOTE)
  const [quoteFarthest, setQuoteFarthest] = useState<BzQuoteScreen>('title')
  const [quoteFieldError, setQuoteFieldError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const onVoiceFinal = useCallback((text: string) => {
    const cleaned = text.trim()
    if (!cleaned) return
    setState((prev) => ({
      ...prev,
      description: `${prev.description}${prev.description ? ' ' : ''}${cleaned}`.trim(),
    }))
  }, [])

  const {
    listening,
    supported: voiceSupported,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceInput({
    lang: ESTIMATOR_VOICE_LANG[language.code] || 'en-US',
    onFinal: onVoiceFinal,
  })

  const patch = (partial: Partial<EstimatorState>) =>
    setState((prev) => ({ ...prev, ...partial }))

  useEffect(() => {
    void listCostEstimates(user?.id ?? null).then((rows) => setHistoryCount(rows.length))
  }, [user?.id, savedId])

  useEffect(
    () =>
      applyPageSeo({
        title: t('costEstimator.seoTitle'),
        description: t('costEstimator.seoDescription'),
        canonicalPath: '/cost-estimator',
      }),
    [language.code, t],
  )

  const quoteAuth = {
    signedIn: Boolean(user?.id),
    hasPhone: Boolean(profile?.phone?.trim()),
  }

  useEffect(() => {
    const session = loadQuoteSession()
    if (!session) return
    setQuoteDraft(session.draft)
    if (session.screen && session.screen !== 'loading') {
      setQuoteScreen(session.screen)
      setQuoteFarthest(session.farthest)
    }
    // Restore mid-flow answers after refresh — once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!quoteScreen || quoteScreen === 'loading') return
    saveQuoteSession({ screen: quoteScreen, farthest: quoteFarthest, draft: quoteDraft })
  }, [quoteScreen, quoteFarthest, quoteDraft])

  // Prefill from AI sales chat (“повний ремонт + кошторис”)
  useEffect(() => {
    const parsed = readEstimatorAiPrefill()
    if (!parsed) return
    const desc = parsed.description?.trim()
    if (!desc && !parsed.projectTypeId) return
    const typeOk =
      parsed.projectTypeId &&
      ESTIMATOR_PROJECT_TYPES.some((t) => t.id === parsed.projectTypeId)
        ? (parsed.projectTypeId as EstimatorProjectTypeId)
        : undefined
    setState((prev) => ({
      ...prev,
      // Type selected + description ready → land on description step to review/continue
      step: typeOk && desc ? 2 : desc ? 2 : typeOk ? 1 : prev.step,
      description: desc || prev.description,
      projectTypeId: typeOk || prev.projectTypeId,
    }))
  }, [])

  // Re-open a saved estimate from history (?id=)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (!id) return
    let cancelled = false
    ;(async () => {
      const row = await getCostEstimateById(id, user?.id ?? null)
      if (cancelled || !row?.estimate_json) return
      setEstimate(row.estimate_json)
      setSavedId(row.id)
      const input = (row.input_json || {}) as {
        projectTypeId?: EstimatorProjectTypeId
        objectTypeId?: EstimatorObjectTypeId
        calculatorTypeId?: string
        workPackages?: EstimatorWorkPackage[]
        description?: string
        location?: EstimatorState['location']
        measurements?: EstimatorState['measurements']
        selectedFeatureIds?: string[]
        includeMaterials?: boolean
        budgetTier?: PricingTierId
      }
      const catalogId = input.calculatorTypeId || input.projectTypeId || input.workPackages?.[0]?.workTypeId || null
      const selectedFeatureIds =
        input.selectedFeatureIds?.length
          ? input.selectedFeatureIds
          : flattenWorkFeatureIds(input.workPackages)
      setState((prev) => ({
        ...prev,
        step: 6,
        projectTypeId:
          input.projectTypeId ||
          (catalogId ? estimatorTypeFromCatalogId(String(catalogId)) : prev.projectTypeId),
        objectTypeId: null,
        calculatorTypeId: catalogId ? String(catalogId) : prev.calculatorTypeId,
        workPackages: [],
        description: input.description || prev.description,
        location: input.location ? { ...prev.location, ...input.location } : prev.location,
        selectedFeatureIds: selectedFeatureIds.length > 0 ? selectedFeatureIds : prev.selectedFeatureIds,
        includeMaterials: input.includeMaterials ?? prev.includeMaterials,
        budgetTier: input.budgetTier || prev.budgetTier,
        measurements: {
          ...prev.measurements,
          ...(input.measurements || {}),
          areaSqm: input.measurements?.areaSqm ?? row.area_sqm ?? prev.measurements.areaSqm,
        },
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

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
        radiusKm: radiusModeToKm(globalLoc.radius) ?? state.location.radiusKm ?? 25,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalLoc.city, globalLoc.country, globalLoc.radius, state.step])

  // Write estimator location back into AppContext (SSoT) when leaving location step
  useEffect(() => {
    if (state.step < 5) return
    if (!state.location.city && !state.location.country) return
    setLocation({
      ...globalLoc,
      country: state.location.country || globalLoc.country,
      region: state.location.region || globalLoc.region,
      province: state.location.province || globalLoc.province,
      city: state.location.city || globalLoc.city,
      originLat: state.location.latitude ?? globalLoc.originLat,
      originLng: state.location.longitude ?? globalLoc.originLng,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step])

  // Ensure marketplace matches load when estimate is restored from history
  useEffect(() => {
    if (!estimate || matches) return
    void fetchEstimatorMatches(estimate, state.location).then(setMatches)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimate])

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
    if (step === 1 && !state.projectTypeId) return t('costEstimator.chooseTypeError')
    if (step === 2 && state.description.trim().length < 15)
      return t('costEstimator.describeError')
    if (step === 5) {
      const area = Number(state.measurements.areaSqm)
      if (!(area > 0)) return t('costEstimator.areaError')
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
        }
        // Apply AI Analyst clarifications into description for the engine
        const clarifiedDesc = appendClarificationsToDescription(
          nextState.description,
          nextState.clarifications || {},
        )
        nextState = { ...nextState, description: clarifiedDesc }
        setState(nextState)

        const analyst = buildAnalystQuestions(nextState, nextState.clarifications || {})
        if (!analyst.readyForEstimate) {
          setBusy(false)
          setError(analyst.missing.find((q) => q.required)?.question || 'Please answer the clarifying questions')
          return
        }

        const result = await runFullCostEstimate(nextState, (pct, label) => {
          setProgress(pct)
          setProgressLabel(label)
        })
        setEstimate(result)
        setState((s) => ({ ...s, step: 6 }))
        setProgressLabel('Searching professionals & companies…')
        setBusy(false)
        void fetchEstimatorMatches(result, nextState.location).then((m) => {
          setMatches(m)
          setProgressLabel('Searching materials…')
        })
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

  const storePrefill = (opts?: { tender?: boolean }) => {
    if (!estimate || !state.projectTypeId) return
    const type = getProjectType(state.projectTypeId)
    const payload = opts?.tender
      ? buildTenderPrefill({
          estimate,
          state,
          tier,
          selectedProfessionalIds: [...selectedPros],
          estimateId: savedId,
          tradeId: type.tradeId,
          subcategorySlug: type.subcategorySlug,
        })
      : {
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
          tenderMode: false,
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

  const createTender = async () => {
    if (!estimate || !state.projectTypeId || publishingTender) return
    const type = getProjectType(state.projectTypeId)
    const prefill = buildTenderPrefill({
      estimate,
      state,
      tier,
      selectedProfessionalIds: [...selectedPros],
      estimateId: savedId,
      tradeId: type.tradeId,
      subcategorySlug: type.subcategorySlug,
    })
    // Soften location: fill gaps from global DImarket location; postal optional for tender
    const city = prefill.city || globalLoc.city || ''
    const country = prefill.country || globalLoc.country || ''
    const enriched = {
      ...prefill,
      city,
      country,
      postalCode: prefill.postalCode || '',
      locationLabel:
        prefill.locationLabel ||
        [city, globalLoc.province || globalLoc.region, country].filter(Boolean).join(', '),
      latitude: prefill.latitude ?? globalLoc.originLat ?? null,
      longitude: prefill.longitude ?? globalLoc.originLng ?? null,
    }

    if (!user?.id) {
      try {
        sessionStorage.setItem(PREFILL_KEY, JSON.stringify(enriched))
      } catch {
        /* ignore */
      }
      navigateTo('/login')
      return
    }

    const contactName = (profile?.full_name || '').trim()
    const contactEmail = (user.email || '').trim()
    const contactPhone = (profile?.phone || '').trim()
    const canOneClick =
      Boolean(contactName) &&
      Boolean(contactEmail || contactPhone) &&
      Boolean(city && country) &&
      Boolean(enriched.scopeOfWork?.trim() || enriched.description?.trim())

    if (!canOneClick) {
      try {
        sessionStorage.setItem(PREFILL_KEY, JSON.stringify(enriched))
      } catch {
        /* ignore */
      }
      navigateTo('/create-project')
      return
    }

    setPublishingTender(true)
    setError(null)
    try {
      const wizardState = wizardStateFromTenderPrefill(enriched, {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        language: language.code || 'en',
      })
      const trade = PROJECT_TRADES.find((x) => x.id === wizardState.tradeId)
      const tradeKey = trade?.labelKey as never
      const tradeLabel =
        trade && t(tradeKey) !== trade.labelKey ? t(tradeKey) : trade?.labelEn || estimate.tradeLabel
      const result = await submitProjectWizard(user.id, wizardState, tradeLabel)
      if ('error' in result) {
        try {
          sessionStorage.setItem(PREFILL_KEY, JSON.stringify(enriched))
        } catch {
          /* ignore */
        }
        navigateTo('/create-project')
        return
      }
      if (savedId) {
        try {
          await linkEstimateToListing(savedId, result.listingId, user.id)
        } catch {
          /* non-blocking */
        }
      }
      navigateTo(`/project/${result.listingId}/matches`)
    } catch {
      try {
        sessionStorage.setItem(PREFILL_KEY, JSON.stringify(enriched))
      } catch {
        /* ignore */
      }
      navigateTo('/create-project')
    } finally {
      setPublishingTender(false)
    }
  }

  const requestQuotes = () => {
    storePrefill({ tender: selectedPros.size > 0 })
    navigateTo('/create-project')
  }

  const submitActualCost = async () => {
    if (!user?.id || !estimate || !outcomeConsent) return
    const actual = Number(actualTotal.replace(',', '.'))
    if (!(actual > 0)) return
    const res = await saveCostEstimateOutcome({
      userId: user.id,
      estimateId: savedId,
      projectType: estimate.projectTypeId,
      country: state.location.country,
      region: state.location.region || state.location.province,
      areaSqm: state.measurements.areaSqm,
      estimatedStandard: estimate.totals.standard.grandTotal,
      actualTotal: actual,
      currency: estimate.currency,
      consented: true,
    })
    if (res.ok) setOutcomeSaved(true)
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
    const featured =
      BUILDZOOM_INTAKE_CARDS.find((card) => card.id === id) ||
      BZ_POPULAR_PROJECTS.find((card) => card.id === id)
    if (featured) {
      const translated = t(featured.labelKey as never)
      if (translated !== featured.labelKey) return translated
    }
    const item = ESTIMATOR_PROJECT_TYPES.find((x) => x.id === id)
    if (!item) return id
    const key = item.labelKey as never
    const translated = t(key)
    return translated === item.labelKey ? item.labelEn : translated
  }

  useEffect(() => {
    if (quoteScreen !== 'title' || !quoteDraft.typeId) return
    const featured =
      BUILDZOOM_INTAKE_CARDS.find((card) => card.id === quoteDraft.typeId) ||
      BZ_POPULAR_PROJECTS.find((card) => card.id === quoteDraft.typeId)
    if (!featured) return
    const localized = t(featured.labelKey as never)
    if (!localized || localized === featured.labelKey) return
    setQuoteDraft((prev) => (prev.title === localized ? prev : { ...prev, title: localized }))
  }, [quoteScreen, quoteDraft.typeId, language.code, t])

  const runQuotesFromIntake = (
    typeId: EstimatorProjectTypeId,
    queryText: string,
    draft: BzQuoteDraft = quoteDraft,
  ) => {
    const label = typeLabel(typeId)
    const q = queryText.trim()
    const urgency = draft.urgency
      ? t(`costEstimator.quote.urgency.${draft.urgency}` as never)
      : ''
    const extra = [
      urgency,
      draft.propertyType
        ? t(`costEstimator.quote.property.${draft.propertyType}` as never)
        : '',
      draft.land ? t(`costEstimator.quote.land.${draft.land}` as never) : '',
      draft.relationship
        ? t(`costEstimator.quote.relationship.${draft.relationship}` as never)
        : '',
      draft.designStatus
        ? t(`costEstimator.quote.design.${draft.designStatus}` as never)
        : '',
      draft.bids ? String(draft.bids) : '',
      draft.financing ? t('costEstimator.quote.financing') : '',
    ]
      .filter(Boolean)
      .join('. ')
    const desc =
      draft.description.trim().length >= 15
        ? draft.description.trim()
        : q.length >= 15
          ? `${q}. ${extra}`.trim()
          : `${label}. ${q || label}. ${extra} ${draft.city || state.location.city || ''}`.trim()
    const perSqm = getProjectType(typeId).perSqm
    const area =
      Number(state.measurements.areaSqm) > 0
        ? Number(state.measurements.areaSqm)
        : areaSqmFromBudget(draft.budget, perSqm)
    const nextState: EstimatorState = {
      ...state,
      projectTypeId: typeId,
      calculatorTypeId: typeId,
      objectTypeId: null,
      workPackages: [],
      description: desc,
      budgetTier: budgetTierFromBand(draft.budget),
      location: {
        ...state.location,
        city: draft.city || state.location.city,
        country: draft.country || state.location.country,
        region: draft.region || state.location.region,
        postalCode: draft.postalCode || state.location.postalCode,
        locationLabel:
          draft.locationLabel ||
          [draft.city, draft.region, draft.country].filter(Boolean).join(', ') ||
          state.location.locationLabel,
        latitude: draft.latitude ?? state.location.latitude,
        longitude: draft.longitude ?? state.location.longitude,
      },
      measurements: { ...state.measurements, areaSqm: area },
    }
    setError(null)
    setBusy(true)
    try {
      const result = buildFullCostEstimateLocal(nextState)
      setEstimate(result)
      setTier(nextState.budgetTier || 'standard')
      setState({ ...nextState, step: 6 })
      setQuoteScreen(null)
      clearQuoteSession()
      void fetchEstimatorMatches(result, nextState.location).then(setMatches)
      void saveCostEstimate({
        userId: user?.id ?? null,
        state: nextState,
        estimate: result,
      }).then((r) => setSavedId(r.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Estimate failed')
    } finally {
      setBusy(false)
    }
  }

  const locateDraft = (draft: BzQuoteDraft): BzQuoteDraft => ({
    ...draft,
    city: draft.city || state.location.city,
    country: draft.country || state.location.country,
    region: draft.region || state.location.region || state.location.province,
    postalCode: draft.postalCode || state.location.postalCode,
    locationLabel: draft.locationLabel || state.location.locationLabel,
    latitude: draft.latitude ?? state.location.latitude,
    longitude: draft.longitude ?? state.location.longitude,
    email: draft.email || user?.email || '',
    name: draft.name || profile?.full_name || '',
    phone: draft.phone || profile?.phone || '',
  })

  const markFarthest = (screen: BzQuoteScreen, typeId: EstimatorProjectTypeId | null) => {
    const list = screensForQuoteType(typeId, quoteAuth)
    setQuoteFarthest((prev) => (list.indexOf(screen) > list.indexOf(prev) ? screen : prev))
  }

  const goQuoteScreen = (screen: BzQuoteScreen, draft: BzQuoteDraft) => {
    setQuoteFieldError(null)
    setQuoteScreen(screen)
    markFarthest(screen, draft.typeId)
  }

  /** Homepage Get quotes / card click — same as BuildZoom setInitialScreen. */
  const openQuoteWizard = (draft: BzQuoteDraft) => {
    setQuoteDraft(draft)
    setQuoteFarthest('title')
    goQuoteScreen(initialQuoteScreen(draft), draft)
  }

  const pickType = (id: EstimatorProjectTypeId, advance: boolean) => {
    const label = typeLabel(id)
    setTypeQuery(label)
    setError(null)
    patch({ projectTypeId: id })
    if (advance) {
      openQuoteWizard(locateDraft({ ...EMPTY_BZ_QUOTE, title: label, typeId: id }))
    }
  }

  const submitIntake = () => {
    const fromQuery = matchProjectType(typeQuery, typeLabel)
    const matched = fromQuery || state.projectTypeId
    const title = typeQuery.trim() || (matched ? typeLabel(matched) : '')
    setError(null)
    openQuoteWizard(
      locateDraft({
        ...EMPTY_BZ_QUOTE,
        title,
        typeId: matched || (title ? 'other' : null),
      }),
    )
  }

  const closeQuoteWizard = () => {
    setQuoteScreen(null)
    setQuoteFieldError(null)
    setQuoteFarthest('title')
    clearQuoteSession()
  }

  const quoteBack = () => {
    if (!quoteScreen || quoteScreen === 'title') {
      closeQuoteWizard()
      return
    }
    const prev = prevScreenBefore(quoteScreen, quoteDraft.typeId, quoteAuth)
    if (!prev) {
      closeQuoteWizard()
      return
    }
    goQuoteScreen(prev, quoteDraft)
  }

  const quoteForward = () => {
    if (!quoteScreen) return
    const next = nextScreenAfter(quoteScreen, quoteDraft.typeId, quoteAuth)
    const list = screensForQuoteType(quoteDraft.typeId, quoteAuth)
    if (next === 'loading') return
    if (list.indexOf(next) > list.indexOf(quoteFarthest)) return
    goQuoteScreen(next, quoteDraft)
  }

  const continueQuoteTitle = () => {
    const title = quoteDraft.title.trim()
    const err = validateQuoteScreen('title', { ...quoteDraft, title })
    if (err) {
      setQuoteFieldError(t(err as never))
      return
    }
    const matched = matchProjectType(title, typeLabel) || quoteDraft.typeId || 'other'
    setError(null)
    const next = { ...quoteDraft, title, typeId: matched }
    setQuoteDraft(next)
    patch({ projectTypeId: matched })
    goQuoteScreen('urgency', next)
  }

  const selectPopular = (id: EstimatorProjectTypeId, label: string) => {
    setTypeQuery(label)
    patch({ projectTypeId: id })
    const next = { ...quoteDraft, title: label, typeId: id }
    setQuoteDraft(next)
    setError(null)
    goQuoteScreen('urgency', next)
  }

  const advanceQuote = (draft: BzQuoteDraft, from: BzQuoteScreen) => {
    const next = nextScreenAfter(from, draft.typeId, quoteAuth)
    goQuoteScreen(next, draft)
  }

  const continueQuote = () => {
    if (!quoteScreen) return
    const err = validateQuoteScreen(quoteScreen, quoteDraft)
    if (err) {
      setQuoteFieldError(t(err as never))
      return
    }
    advanceQuote(quoteDraft, quoteScreen)
  }

  const finishQuote = useCallback(
    (draft: BzQuoteDraft) => {
      const typeId = draft.typeId || state.projectTypeId || 'other'
      runQuotesFromIntake(typeId, draft.title, draft)
    },
    // runQuotesFromIntake closes over latest state/t
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, t, user?.id],
  )

  const submitQuotePassword = async (password: string) => {
    const err = validateQuoteScreen('password', quoteDraft, { password })
    if (err) {
      setQuoteFieldError(t(err as never))
      return
    }
    const locationStr = [quoteDraft.city, quoteDraft.region, quoteDraft.country]
      .filter(Boolean)
      .join(', ')
    savePendingRegistration({
      role: 'client',
      full_name: quoteDraft.name.trim() || undefined,
      phone: quoteDraft.phone.trim() || undefined,
      location: locationStr || undefined,
    })
    if (quoteDraft.email.trim()) {
      try {
        await supabase.auth.signUp({
          email: quoteDraft.email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: quoteDraft.name.trim(),
              user_role: 'client',
              phone: quoteDraft.phone.trim() || null,
              location: locationStr || null,
            },
          },
        })
      } catch {
        /* Dimarket auth is best-effort; the quote still continues like BZ after password. */
      }
    }
    goQuoteScreen('loading', quoteDraft)
  }

  if (busy && state.step === 5) {
    return (
      <>
        <EstimatorAdBanner />
      <EstimatorShell
        step={5}
        title={t('costEstimator.analyzing')}
        subtitle={progressLabel || t('costEstimator.sub')}
        busy
      >
        <div className="mx-auto max-w-md py-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 animate-pulse text-[#ff9900]" />
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e8e0d6]">
            <div
              className="h-full rounded-full bg-[#ff9900] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-[13px] text-[#86868b]">{progress}%</p>
        </div>
      </EstimatorShell>
      </>
    )
  }

  if (state.step === 6 && estimate) {
    const totals = estimate.totals[tier]
    return (
      <div className="min-h-[80vh] bg-[#f5f5f7] pb-24">
        <EstimatorAdBanner />
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
            {estimate.factors.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {estimate.factors.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#6e6e73]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : null}
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
            <ActionBtn icon={<Hammer className="h-4 w-4" />} onClick={convertToProject}>
              {t('costEstimator.createProject')}
            </ActionBtn>
            <ActionBtn
              icon={<ClipboardList className="h-4 w-4" />}
              onClick={() => void createTender()}
              primary
              disabled={publishingTender}
            >
              {publishingTender
                ? t('costEstimator.publishingTender')
                : t('costEstimator.createTender')}
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
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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

          {/* Work breakdown structure */}
          <Section title={t('costEstimator.workBreakdown')}>
            <ol className="space-y-2">
              {[...estimate.workStages]
                .sort((a, b) => a.order - b.order)
                .map((stage, i) => (
                  <li
                    key={stage.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f0f0f2] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d1d1f] text-[12px] font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-[#1d1d1f]">{stage.label}</p>
                        <p className="text-[12px] text-[#86868b]">Trade: {stage.tradeId}</p>
                      </div>
                    </div>
                    <p className="text-[13px] font-medium tabular-nums text-[#1d1d1f]">
                      ~{stage.laborHours} h
                    </p>
                  </li>
                ))}
            </ol>
          </Section>

          {/* Interactive map — EuropeMarketplaceMap SSoT */}
          <Section title={t('costEstimator.mapTitle')}>
            <Suspense fallback={<p className="text-[13px] text-[#6e6e73]">{t('costEstimator.working')}</p>}>
              <EstimatorResultsMap
                preferKinds={['professional', 'company', 'marketplace', 'project', 'job']}
                subcategorySlug={estimate.specialists[0]?.subcategorySlug || getProjectType(state.projectTypeId).subcategorySlug}
                serviceQuery={estimate.tradeLabel}
              />
            </Suspense>
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
                    <th className="pb-2 font-semibold">Shop</th>
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
                        <td className="py-2.5">
                          <button
                            type="button"
                            className="text-[12px] font-semibold text-[#0066cc] hover:underline"
                            onClick={() =>
                              navigateTo(`/sell-rent?q=${encodeURIComponent(m.searchQuery)}`)
                            }
                          >
                            Find offers
                          </button>
                        </td>
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

          <Section title="AI Procurement">
            <EstimatorProcurementPanel
              materials={estimate.materials}
              city={state.location.city}
              lat={state.location.latitude}
              lng={state.location.longitude}
              listingId={null}
              estimateId={savedId}
            />
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

          {/* Learning loop — actual final cost */}
          <Section title={t('costEstimator.actualCostTitle')}>
            <p className="mb-3 text-[13px] text-[#6e6e73]">{t('costEstimator.actualCostHint')}</p>
            {outcomeSaved ? (
              <p className="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-[13px] font-medium text-[#047857]">
                {t('costEstimator.actualCostThanks')}
              </p>
            ) : (
              <div className="space-y-3">
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={actualTotal}
                  onChange={(e) => setActualTotal(e.target.value)}
                  placeholder={t('costEstimator.actualCostPlaceholder')}
                  className={field}
                />
                <label className="flex items-start gap-2 text-[13px] text-[#3a3a3c]">
                  <input
                    type="checkbox"
                    checked={outcomeConsent}
                    onChange={(e) => setOutcomeConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{t('costEstimator.actualCostConsent')}</span>
                </label>
                <button
                  type="button"
                  disabled={!user || !outcomeConsent || !actualTotal}
                  onClick={() => void submitActualCost()}
                  className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  {t('costEstimator.actualCostSubmit')}
                </button>
                {!user ? (
                  <p className="text-[12px] text-[#86868b]">{t('costEstimator.actualCostLogin')}</p>
                ) : null}
              </div>
            )}
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
    <div data-estimator-chunk="v2">
    {quoteScreen || state.step === 1 ? null : <EstimatorAdBanner />}
    <EstimatorShell
      variant={state.step === 1 ? 'intake' : 'wizard'}
      step={state.step}
      title={state.step === 1 ? undefined : meta.title}
      subtitle={state.step === 1 ? undefined : meta.sub}
      onBack={state.step > 1 ? goBack : undefined}
      onNext={state.step === 1 ? undefined : () => void goNext()}
      nextLabel={state.step === 5 ? t('costEstimator.runEstimate') : t('common.continue')}
      nextDisabled={busy}
      busy={busy}
      error={quoteScreen ? null : error}
      footerExtra={
        quoteScreen ? undefined : (
        <button
          type="button"
          className="rounded-full px-3 py-2 text-[12px] font-medium text-[#6f665d] hover:bg-[#f6f4f1]"
          onClick={() => navigateTo('/cost-estimator/history')}
        >
          {t('costEstimator.history')}
        </button>
        )
      }
    >
      {state.step === 1 && quoteScreen ? (
        <EstimatorQuoteWizard
          draft={quoteDraft}
          screen={quoteScreen}
          auth={quoteAuth}
          fieldError={quoteFieldError}
          files={state.files}
          onTitleChange={(value) => {
            setQuoteFieldError(null)
            setQuoteDraft((prev) => ({ ...prev, title: value }))
          }}
          onSelectPopular={selectPopular}
          onContinueTitle={continueQuoteTitle}
          onSelectUrgency={(id) => {
            const next = { ...quoteDraft, urgency: id }
            setQuoteDraft(next)
            advanceQuote(next, 'urgency')
          }}
          onSelectLand={(id) => {
            const next = { ...quoteDraft, land: id }
            setQuoteDraft(next)
            advanceQuote(next, 'land')
          }}
          onSelectProperty={(id) => {
            const next = { ...quoteDraft, propertyType: id }
            setQuoteDraft(next)
            advanceQuote(next, 'property')
          }}
          onSelectRelationship={(id) => {
            const next = { ...quoteDraft, relationship: id }
            setQuoteDraft(next)
            advanceQuote(next, 'relationship')
          }}
          onSelectDesign={(id) => {
            const next = { ...quoteDraft, designStatus: id }
            setQuoteDraft(next)
            advanceQuote(next, 'design')
          }}
          onPatch={(patchDraft) => {
            setQuoteDraft((prev) => ({ ...prev, ...patchDraft }))
            if (patchDraft.budget && isLowBudget(patchDraft.budget)) {
              setQuoteFieldError(t('costEstimator.quote.errors.lowBudget'))
              return
            }
            setQuoteFieldError(null)
          }}
          onContinue={continueQuote}
          onSubmitPassword={(password) => {
            void submitQuotePassword(password)
          }}
          onAttachFiles={addFiles}
          onRemoveFile={removeFile}
          onBack={quoteBack}
          onClose={closeQuoteWizard}
          onForward={quoteForward}
          canForward={
            quoteScreen !== 'loading' &&
            screensForQuoteType(quoteDraft.typeId, quoteAuth).indexOf(quoteScreen) <
              screensForQuoteType(quoteDraft.typeId, quoteAuth).indexOf(quoteFarthest)
          }
          onLoadingComplete={() => finishQuote(quoteDraft)}
        />
      ) : null}

      {state.step === 1 ? (
        <EstimatorIntake
          query={typeQuery}
          selectedId={state.projectTypeId}
          typeLabel={typeLabel}
          onQueryChange={(value) => {
            setError(null)
            setTypeQuery(value)
          }}
          onPick={pickType}
          onSubmit={submitIntake}
        />
      ) : null}

      {state.step === 2 && (
        <div className="space-y-3">
          <textarea
            value={state.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={7}
            placeholder='e.g. "I want to renovate my 8 m² bathroom with new tiles, shower and vanity."'
            className={field + ' resize-y'}
          />
          <button
            type="button"
            onClick={() => (listening ? stopVoice() : startVoice())}
            disabled={!voiceSupported}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold disabled:opacity-40 ${
              listening
                ? 'bg-[#c41e3a] text-white'
                : 'border border-[#d2d2d7] bg-white text-[#1d1d1f]'
            }`}
          >
            {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {listening ? t('costEstimator.voiceStop') : t('costEstimator.voiceStart')}
          </button>
        </div>
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
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
                onClick={() => inputRef.current?.click()}
              >
                Gallery / files
              </button>
              <button
                type="button"
                className="rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[12px] font-semibold text-[#1d1d1f]"
                onClick={() => cameraRef.current?.click()}
              >
                Camera
              </button>
            </div>
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
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
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
        <div className="space-y-4">
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
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                Region
              </span>
              <input
                className={field}
                value={state.location.region}
                onChange={(e) =>
                  patch({ location: { ...state.location, region: e.target.value } })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                Province
              </span>
              <input
                className={field}
                value={state.location.province}
                onChange={(e) =>
                  patch({ location: { ...state.location, province: e.target.value } })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                Radius
              </span>
              <select
                className={field}
                value={String(state.location.radiusKm ?? 25)}
                onChange={(e) => {
                  const km = Number(e.target.value) || 25
                  patch({ location: { ...state.location, radiusKm: km } })
                  const mode =
                    GEO_RADIUS_OPTIONS.find((o) => o.km === km)?.id ||
                    (km <= 25 ? '25' : km <= 50 ? '50' : '100')
                  setLocation({ ...globalLoc, radius: mode as typeof globalLoc.radius })
                }}
              >
                {GEO_RADIUS_OPTIONS.filter((o) => o.km != null).map((o) => (
                  <option key={o.id} value={String(o.km)}>
                    {o.km} km
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {state.step === 5 && (
        <div className="space-y-5">
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
              onChange={(n) => {
                const lengthM = n || null
                const widthM = state.measurements.widthM
                const areaSqm =
                  lengthM && widthM
                    ? Math.round(lengthM * widthM * 10) / 10
                    : state.measurements.areaSqm
                patch({ measurements: { ...state.measurements, lengthM, areaSqm } })
              }}
            />
            <NumField
              label="Width (m)"
              value={state.measurements.widthM}
              onChange={(n) => {
                const widthM = n || null
                const lengthM = state.measurements.lengthM
                const areaSqm =
                  lengthM && widthM
                    ? Math.round(lengthM * widthM * 10) / 10
                    : state.measurements.areaSqm
                patch({ measurements: { ...state.measurements, widthM, areaSqm } })
              }}
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

          {/* AI Analyst clarifying questions */}
          {(() => {
            const analyst = buildAnalystQuestions(state, state.clarifications || {})
            if (!analyst.missing.length && !analyst.workHints.length) return null
            return (
              <div className="rounded-[18px] border border-[#e8e8ed] bg-[#fafafa] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b]">
                  AI Analyst
                </p>
                {analyst.workHints.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {analyst.workHints.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#1d1d1f] ring-1 ring-[#e8e8ed]"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                ) : null}
                {analyst.missing.length ? (
                  <ul className="mt-3 space-y-3">
                    {analyst.missing.map((q) => (
                      <li key={q.id}>
                        <label className="block">
                          <span className="text-[13px] font-semibold text-[#1d1d1f]">
                            {q.question}
                            {q.required ? ' *' : ''}
                          </span>
                          {q.hint ? (
                            <span className="mt-0.5 block text-[12px] text-[#86868b]">{q.hint}</span>
                          ) : null}
                          <input
                            type="text"
                            className={field + ' mt-1.5'}
                            value={state.clarifications?.[q.field] || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const clarifications = {
                                ...(state.clarifications || {}),
                                [q.field]: value,
                              }
                              const patchState: Partial<EstimatorState> = { clarifications }
                              if (q.field === 'area') {
                                const n = Number(value.replace(',', '.'))
                                if (n > 0) {
                                  patchState.measurements = {
                                    ...state.measurements,
                                    areaSqm: n,
                                  }
                                }
                              }
                              if (q.field === 'city' && value.trim()) {
                                patchState.location = {
                                  ...state.location,
                                  city: value.trim(),
                                }
                              }
                              patch(patchState)
                            }}
                            placeholder="Your answer"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[13px] text-[#248a3d]">Ready for estimate</p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </EstimatorShell>
    </div>
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
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  icon: ReactNode
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
