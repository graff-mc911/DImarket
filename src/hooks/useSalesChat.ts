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

const STORAGE_KEY = 'dimarket_ai_sales_chat_v2'

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
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const initialized = useRef(false)
  const sessionIdRef = useRef<string | null>(null)

  const salesCategories = useMemo(
    () => categories.filter((c) => !JOB_CATEGORY_BLOCKLIST.has(c.slug)),
    [categories],
  )

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of salesCategories) {
      map[c.slug] = categoryLabel(c.slug, t)
    }
    return map
  }, [salesCategories, t])

  const botContext = useMemo(
    () => ({
      locale: language.code,
      categories: salesCategories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
      categoryLabels,
      profileName: profile?.full_name ?? undefined,
      profileEmail: user?.email ?? undefined,
      profilePhone: profile?.phone ?? undefined,
      currencyCode: currency.code,
    }),
    [salesCategories, categoryLabels, language.code, profile, user, currency.code],
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

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data ?? [])
    })()
  }, [])

  useEffect(() => {
    if (!salesCategories.length || initialized.current) return
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
  }, [salesCategories.length, botContext, t])

  /** Переклад повідомлень бота та підказок категорій при зміні мови. */
  useEffect(() => {
    setMessages((prev) => remapAssistantMessages(prev, t))
    if (step === 'category' && salesCategories.length) {
      setQuickReplies(
        salesCategories
          .slice(0, 6)
          .map((c) => categoryLabels[c.slug] || c.name),
      )
    }
  }, [language.code, t, categoryLabels, salesCategories, step, draft, botContext])

  useEffect(() => {
    if (!messages.length) return
    saveStored({ step, draft, messages })
  }, [step, draft, messages])

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
        const turn = await runSalesChatTurn({
          message: trimmed,
          step,
          draft,
          locale: language.code,
          context: botContext,
        })

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
            replyParams: { id: result.listing.id },
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
    ],
  )

  const resetChat = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setListingId(null)
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
    quickReplies,
    sendMessage,
    resetChat,
  }
}
