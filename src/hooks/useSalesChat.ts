import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { categoryLabel } from '../lib/siteCategories'
import { assistantMessage, remapAssistantMessages } from '../lib/ai/formatBotReply'
import {
  emptyJobRequestDraft,
  type JobRequestDraft,
  type SalesBotStep,
} from '../lib/ai/jobRequestDraft'
import { publishJobRequestFromDraft, validateJobRequestDraft } from '../lib/ai/publishJobRequest'
import { fetchMatchScoresForListing } from '../lib/matching/persistMatches'
import { rankProfessionals } from '../lib/matching/aiMatchService'
import type { TopMatchRow } from '../components/matching/TopMatchCards'
import {
  appendJobLeadMessage,
  createJobLeadSession,
  recordPublishedJob,
  updateJobLeadDraft,
} from '../lib/ai/jobLeadSession'
import { buildDraftTitle } from '../lib/ai/jobRequestDraft'
import { getInitialTurn, type SalesBotMessage } from '../lib/ai/salesBotEngine'
import { runSalesChatTurn } from '../lib/ai/salesBotApi'
import type { Category } from '../lib/types'
import { supabase } from '../lib/supabase'
import { navigateTo } from '../lib/navigation'
import { getCurrentLocationDetailed } from '../lib/geocoding'
import { getViewerGeo } from '../lib/viewerGeo'

const STORAGE_KEY = 'dimarket_ai_sales_chat_v3'
const AD_GUIDE_START_KEY = 'dimarket_ad_guide_start'

type StoredChat = {
  step: SalesBotStep
  draft: JobRequestDraft
  messages: SalesBotMessage[]
}

function loadStored(): StoredChat | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredChat
  } catch {
    return null
  }
}

function saveStored(state: StoredChat) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

const JOB_CATEGORY_BLOCKLIST = new Set(['vacancies', 'sell-rent'])

function applySessionFlags(flags?: Record<string, string>) {
  if (!flags) return
  try {
    for (const [k, v] of Object.entries(flags)) {
      if (k === 'request_geo') continue
      if (k === 'dimarket_ad_guide_start') sessionStorage.setItem(AD_GUIDE_START_KEY, v)
      else sessionStorage.setItem(k, v)
    }
  } catch {
    /* ignore */
  }
}

export function useSalesChat() {
  const { user, profile, currency, language, t } = useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep] = useState<SalesBotStep>('welcome')
  const [draft, setDraft] = useState<JobRequestDraft>(emptyJobRequestDraft)
  const [messages, setMessages] = useState<SalesBotMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listingId, setListingId] = useState<string | null>(null)
  const [topMatches, setTopMatches] = useState<TopMatchRow[]>([])
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [adWizardActive, setAdWizardActive] = useState(false)
  const initialized = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const [geoHint, setGeoHint] = useState<{
    city?: string
    lat?: number | null
    lon?: number | null
  }>({})

  const salesCategories = useMemo(
    () => categories.filter((c) => !JOB_CATEGORY_BLOCKLIST.has(c.slug)),
    [categories],
  )

  /** All categories including vacancies / sell-rent for those intents */
  const allCategoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    [categories],
  )

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of categories) {
      map[c.slug] = categoryLabel(c.slug, t)
    }
    return map
  }, [categories, t])

  const botContext = useMemo(
    () => ({
      locale: language.code,
      categories: allCategoryOptions.length
        ? allCategoryOptions
        : salesCategories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
      categoryLabels,
      profileName: profile?.full_name ?? undefined,
      profileEmail: user?.email ?? undefined,
      profilePhone: profile?.phone ?? undefined,
      currencyCode: currency.code,
      suggestedCity: geoHint.city || getViewerGeo(profile).city || undefined,
      suggestedLat: geoHint.lat,
      suggestedLon: geoHint.lon,
    }),
    [
      allCategoryOptions,
      salesCategories,
      categoryLabels,
      language.code,
      profile,
      user,
      currency.code,
      geoHint,
    ],
  )

  const appendAssistant = useCallback(
    (turn: ReturnType<typeof getInitialTurn>) => {
      setMessages((prev) => [...prev, assistantMessage(turn, t)])
      setStep(turn.step)
      setDraft(turn.draft)
      setQuickReplies(turn.quickReplies ?? [])
    },
    [t],
  )

  const loadMatchesForDraft = useCallback(async (d: JobRequestDraft) => {
    const ranked = await rankProfessionals(
      {
        categorySlug: d.categorySlug,
        city: d.location?.split(',')[0]?.trim(),
        latitude: d.latitude,
        longitude: d.longitude,
        radiusKm: 40,
      },
      5,
    )
    setTopMatches(
      ranked.map((m) => ({
        score: m.score,
        distanceKm: m.distanceKm,
        contractor: {
          id: m.profileId,
          full_name: m.fullName,
          location: m.location,
          rating: m.rating,
          total_reviews: m.totalReviews,
          is_verified: Boolean(m.verificationLevel && m.verificationLevel !== 'none'),
          verification_level: m.verificationLevel ?? null,
        },
      })),
    )
  }, [])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data ?? [])
    })()
  }, [])

  useEffect(() => {
    const viewer = getViewerGeo(profile)
    if (viewer.city) {
      setGeoHint((g) => ({ ...g, city: g.city || viewer.city || undefined }))
    }
  }, [profile])

  useEffect(() => {
    if (!categories.length || initialized.current) return
    initialized.current = true
    const stored = loadStored()
    if (stored?.messages?.length) {
      setStep(stored.step)
      setDraft(stored.draft)
      setMessages(remapAssistantMessages(stored.messages, t, stored.draft, botContext))
      return
    }
    const initial = getInitialTurn(botContext)
    setMessages([assistantMessage(initial, t)])
    setStep(initial.step)
    setDraft(initial.draft)
    setQuickReplies(initial.quickReplies ?? [])
  }, [categories.length, botContext, t])

  useEffect(() => {
    setMessages((prev) => remapAssistantMessages(prev, t))
  }, [language.code, t])

  useEffect(() => {
    if (!messages.length) return
    saveStored({ step, draft, messages })
  }, [step, draft, messages])

  const resolveGeoIntoDraft = useCallback(async (d: JobRequestDraft): Promise<JobRequestDraft> => {
    try {
      const loc = await getCurrentLocationDetailed()
      if (!loc) return d
      const cityLine = [loc.city, loc.country].filter(Boolean).join(', ')
      setGeoHint({ city: loc.city, lat: loc.lat, lon: loc.lon })
      return {
        ...d,
        location: cityLine || d.location,
        latitude: loc.lat,
        longitude: loc.lon,
      }
    } catch {
      return d
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading || publishing) return

      setError(null)
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setLoading(true)
      setQuickReplies([])

      if (user && !sessionIdRef.current) {
        sessionIdRef.current = await createJobLeadSession(user.id, language.code)
      }
      if (sessionIdRef.current) {
        await appendJobLeadMessage(sessionIdRef.current, 'user', trimmed)
      }

      try {
        let workingDraft = draft
        const wantsGeo =
          /^(гео|geo|моє місце|my location|визначити|авто|gps)$/i.test(trimmed) ||
          step === 'geo' ||
          step === 'profile_city'

        if (wantsGeo && /гео|geo|місце|location|gps|авто/i.test(trimmed)) {
          workingDraft = await resolveGeoIntoDraft(workingDraft)
        }

        let turn = await runSalesChatTurn({
          message: trimmed,
          step,
          draft: workingDraft,
          locale: language.code,
          context: botContext,
        })

        applySessionFlags(turn.sessionFlags)

        if (turn.sessionFlags?.request_geo === '1') {
          const geoDraft = await resolveGeoIntoDraft(turn.draft)
          const resumeStep = turn.step === 'profile_city' ? 'profile_city' : 'geo'
          turn = await runSalesChatTurn({
            message: geoDraft.location || trimmed,
            step: resumeStep,
            draft: geoDraft,
            locale: language.code,
            context: { ...botContext, suggestedCity: geoDraft.location },
          })
          applySessionFlags(turn.sessionFlags)
        }

        if (turn.needsMatches) {
          await loadMatchesForDraft(turn.draft)
        }

        if (turn.navigateTo && (turn.step === 'ad_ready' || turn.step === 'profile_ready' || turn.step === 'done')) {
          appendAssistant(turn)
          if (sessionIdRef.current) {
            await updateJobLeadDraft(sessionIdRef.current, turn.draft)
          }
          navigateTo(turn.navigateTo)
          setLoading(false)
          return
        }

        if (turn.canPublish) {
          setPublishing(true)
          const validation = validateJobRequestDraft(turn.draft, t('createAd.contactRequired'))
          if (validation) {
            setError(
              validation === 'description'
                ? t('salesBot.errorDescription')
                : validation === 'location'
                  ? t('salesBot.errorLocation')
                  : validation,
            )
            setPublishing(false)
            setLoading(false)
            appendAssistant({
              ...turn,
              canPublish: false,
              replyKey: 'salesBot.askContact',
              step: 'contact',
            })
            return
          }

          const catLabel = turn.draft.categorySlug
            ? categoryLabels[turn.draft.categorySlug]
            : undefined
          const result = await publishJobRequestFromDraft({
            draft: turn.draft,
            authorId: user?.id ?? null,
            currencyCode: currency.code,
            categoryLabel: catLabel,
          })

          if (!result.ok) {
            setError(result.error)
            setPublishing(false)
            setLoading(false)
            return
          }

          setListingId(result.listing.id)
          if ((turn.draft.listingType ?? 'service_request') === 'service_request') {
            const scores = await fetchMatchScoresForListing(result.listing.id, 5)
            setTopMatches(scores as TopMatchRow[])
          }

          if (sessionIdRef.current) {
            const title = buildDraftTitle(turn.draft, catLabel)
            await recordPublishedJob(
              sessionIdRef.current,
              user?.id ?? null,
              result.listing.id,
              turn.draft,
              title,
              turn.draft.description?.trim() || title,
            )
          }
          const doneTurn = {
            ...turn,
            replyKey: 'salesBot.published' as const,
            replyParams: {
              id: result.listing.id,
              count: String(result.matchCount || 0),
            },
            step: 'done' as const,
            canPublish: false,
          }
          appendAssistant(doneTurn)
          sessionStorage.removeItem(STORAGE_KEY)
          setPublishing(false)
          setLoading(false)
          return
        }

        appendAssistant(turn)
        if (sessionIdRef.current) {
          await updateJobLeadDraft(sessionIdRef.current, turn.draft)
          const botMsg = assistantMessage(turn, t)
          await appendJobLeadMessage(sessionIdRef.current, 'assistant', botMsg.content, {
            step: turn.step,
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : t('salesBot.errorGeneric'))
      } finally {
        setLoading(false)
      }
    },
    [
      loading,
      publishing,
      step,
      draft,
      language.code,
      botContext,
      appendAssistant,
      t,
      user?.id,
      currency.code,
      categoryLabels,
      resolveGeoIntoDraft,
      loadMatchesForDraft,
    ],
  )

  const resetChat = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setListingId(null)
    setTopMatches([])
    setError(null)
    const initial = getInitialTurn(botContext)
    setMessages([assistantMessage(initial, t)])
    setStep(initial.step)
    setDraft(initial.draft)
    setQuickReplies(initial.quickReplies ?? [])
    initialized.current = true
  }, [botContext, t])

  return {
    messages,
    draft,
    step,
    loading,
    publishing,
    error,
    listingId,
    topMatches,
    quickReplies,
    adWizardActive,
    setAdWizardActive,
    sendMessage,
    resetChat,
  }
}
