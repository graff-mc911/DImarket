/**
 * Ad Wizard Chat — покроковий фахівець розміщення реклами прямо в чаті.
 *
 * Steps:
 *  slot_pick   → покажи схему, вибери слот
 *  image_upload → завантаж зображення (file input або URL)
 *  preview     → live preview банера, підтверди
 *  geo_duration → вибери країну/місто + тривалість
 *  price_confirm → показуємо ціну, погоджуємось
 *  checkout    → redirect на Stripe / підтвердження оплати
 *  done        → відкриваємо /advertising
 */
import { useCallback, useRef, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { supabase } from '../lib/supabase'
import { createCheckoutSession, eurosToCents } from '../lib/stripe'
import { sanitizeSlotsForPurchase } from '../lib/adPlacementCatalog'

export type AdWizardStep =
  | 'slot_pick'
  | 'image_upload'
  | 'preview'
  | 'geo_duration'
  | 'price_confirm'
  | 'checkout'
  | 'done'

export type AdWizardMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  /** Якщо є — показуємо схему слотів */
  showSlotMap?: boolean
  /** Якщо є — показуємо preview банера */
  previewImageUrl?: string
  previewSlotId?: string
}

export type AdWizardDraft = {
  selectedSlots: string[]
  imageUrl: string
  geoMode: 'global' | 'country' | 'city'
  geoLabel: string
  durationWeeks: number
  totalPrice: number
  campaignId?: string
}

const PRICE_PER_SLOT_PER_WEEK = 25
const GLOBAL_CITIES = 50

function calcPrice(draft: AdWizardDraft): number {
  const cities = draft.geoMode === 'global' ? GLOBAL_CITIES : draft.geoMode === 'country' ? 10 : 1
  return cities * PRICE_PER_SLOT_PER_WEEK * Math.max(1, draft.selectedSlots.length) * Math.max(1, draft.durationWeeks)
}

function emptyDraft(): AdWizardDraft {
  return {
    selectedSlots: [],
    imageUrl: '',
    geoMode: 'global',
    geoLabel: 'Весь світ',
    durationWeeks: 1,
    totalPrice: 0,
  }
}

export function useAdWizardChat() {
  const { user } = useApp()
  const [step, setStep] = useState<AdWizardStep>('slot_pick')
  const [draft, setDraft] = useState<AdWizardDraft>(emptyDraft)
  const [messages, setMessages] = useState<AdWizardMessage[]>([
    {
      role: 'assistant',
      content: 'Відмінно! Покажу схему розміщення банерів. Оберіть слот де ви хочете показувати рекламу.',
      showSlotMap: true,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const addMsg = useCallback((msg: AdWizardMessage) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  /** Користувач обрав слот зі схеми */
  const pickSlot = useCallback((slotId: string, slotLabelText?: string) => {
    const clean = sanitizeSlotsForPurchase([slotId])
    if (!clean.length) return
    setDraft((d) => ({ ...d, selectedSlots: clean }))
    const label = slotLabelText ?? slotId
    addMsg({ role: 'user', content: `Обрав слот: ${label}` })
    addMsg({
      role: 'assistant',
      content: `Чудово! Слот «${label}» обрано.\n\nТепер завантажте зображення для банера. Натисніть кнопку «📎 Додати зображення» нижче або вставте URL.`,
    })
    setStep('image_upload')
  }, [addMsg])

  /** Користувач надіслав файл */
  const uploadFile = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `ads/wizard/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      const url = data.publicUrl
      setDraft((d) => ({ ...d, imageUrl: url }))
      addMsg({ role: 'user', content: `[Завантажено зображення]` })
      addMsg({
        role: 'assistant',
        content: 'Зображення завантажено! Перевірте як воно виглядає на банері нижче. Якщо все добре — напишіть «так» або «підтверджую».',
        previewImageUrl: url,
        previewSlotId: draft.selectedSlots[0],
      })
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [addMsg, draft.selectedSlots])

  /** Користувач надіслав URL зображення */
  const setImageUrl = useCallback((url: string) => {
    const clean = url.trim()
    if (!clean.startsWith('http')) {
      setError('Введіть повне посилання (https://…)')
      return
    }
    setDraft((d) => ({ ...d, imageUrl: clean }))
    addMsg({ role: 'user', content: clean })
    addMsg({
      role: 'assistant',
      content: 'Зображення отримано! Перевірте превʼю нижче і напишіть «так» щоб підтвердити.',
      previewImageUrl: clean,
      previewSlotId: draft.selectedSlots[0],
    })
    setStep('preview')
  }, [addMsg, draft.selectedSlots])

  /** Обробка текстових повідомлень на різних кроках */
  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setError(null)

    if (step === 'image_upload') {
      if (trimmed.startsWith('http')) {
        setImageUrl(trimmed)
        return
      }
      addMsg({ role: 'user', content: trimmed })
      addMsg({ role: 'assistant', content: 'Вставте URL зображення (https://…) або натисніть «📎 Додати зображення».' })
      return
    }

    if (step === 'preview') {
      addMsg({ role: 'user', content: trimmed })
      if (/^(так|yes|підтвер|ok|добре|гарно)/i.test(trimmed)) {
        addMsg({
          role: 'assistant',
          content: 'Відмінно! Тепер оберіть регіон показу та тривалість:\n\n• Напишіть країну або місто (або «весь світ»)\n• Потім кількість тижнів (наприклад «2 тижні»)\n\nПриклад: «Україна, 4 тижні»',
        })
        setStep('geo_duration')
      } else {
        addMsg({
          role: 'assistant',
          content: 'Хочете змінити зображення? Завантажте нове або вставте інший URL.',
        })
        setStep('image_upload')
      }
      return
    }

    if (step === 'geo_duration') {
      addMsg({ role: 'user', content: trimmed })
      // Парсимо гео і тривалість
      let geoMode: AdWizardDraft['geoMode'] = 'global'
      let geoLabel = 'Весь світ'
      let durationWeeks = 1

      const lc = trimmed.toLowerCase()
      if (/(весь світ|всесвіт|global|worldwide|all)/i.test(lc)) {
        geoMode = 'global'
        geoLabel = 'Весь світ'
      } else if (
        /(країн|country|nation|ukraine|польщ|germany|česk|slov|німеч|france|spain|italy)/i.test(lc)
      ) {
        geoMode = 'country'
        geoLabel = trimmed.split(',')[0].trim()
      } else {
        geoMode = 'city'
        geoLabel = trimmed.split(',')[0].trim()
      }

      const weeksMatch = lc.match(/(\d+)\s*(тижн|week)/i)
      if (weeksMatch) durationWeeks = Math.min(52, Math.max(1, parseInt(weeksMatch[1])))
      const monthMatch = lc.match(/(\d+)\s*(міся|month)/i)
      if (monthMatch) durationWeeks = Math.min(52, Math.max(1, parseInt(monthMatch[1]) * 4))

      const newDraft = { ...draft, geoMode, geoLabel, durationWeeks }
      newDraft.totalPrice = calcPrice(newDraft)
      setDraft(newDraft)

      const priceEur = newDraft.totalPrice.toFixed(0)
      addMsg({
        role: 'assistant',
        content: `Підсумок замовлення:\n\n• Слот: ${newDraft.selectedSlots.map((s) => s).join(', ')}\n• Регіон: ${geoLabel}\n• Тривалість: ${durationWeeks} тижн.\n• Вартість: €${priceEur}\n\nПогоджуєтесь? Напишіть «так» для оплати.`,
      })
      setStep('price_confirm')
      return
    }

    if (step === 'price_confirm') {
      addMsg({ role: 'user', content: trimmed })
      if (/^(так|yes|ok|оплат|сплат|погодж)/i.test(trimmed)) {
        void startCheckout()
      } else {
        addMsg({ role: 'assistant', content: 'Хочете щось змінити? Напишіть що саме (слот, зображення, регіон, тривалість).' })
        setStep('geo_duration')
      }
      return
    }

    // Будь-який крок — просто показуємо підказку
    addMsg({ role: 'user', content: trimmed })
    addMsg({ role: 'assistant', content: 'Будь ласка, слідуйте підказкам вище. Якщо хочете почати спочатку — натисніть «Скинути».' })
  }, [step, draft, addMsg, setImageUrl])

  const startCheckout = useCallback(async () => {
    if (!user) {
      addMsg({ role: 'assistant', content: 'Для оплати потрібно увійти в акаунт. Переходжу на сторінку входу…' })
      navigateTo('/login')
      return
    }
    setLoading(true)
    addMsg({ role: 'assistant', content: '⏳ Створюю рахунок для оплати через Stripe…' })
    try {
      // Зберігаємо слоти у sessionStorage щоб /advertising підхопив
      sessionStorage.setItem('dimarket_ad_preset_slots', JSON.stringify(draft.selectedSlots))
      if (draft.imageUrl) sessionStorage.setItem('dimarket_ad_wizard_image', draft.imageUrl)

      const result = await createCheckoutSession({
        payment_type: 'ad_campaign',
        user_id: user.id,
        amount: eurosToCents(draft.totalPrice || 25),
        currency: 'eur',
        description: `Реклама на DImarket — ${draft.selectedSlots.length} слот(ів), ${draft.durationWeeks} тижн.`,
      })
      addMsg({
        role: 'assistant',
        content: 'Переходжу на сторінку оплати Stripe. Після оплати автоматично відкрию кабінет рекламодавця.',
      })
      setStep('checkout')
      // Коротка затримка щоб повідомлення встигло відобразитись
      setTimeout(() => { window.location.href = result.url }, 900)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка оплати')
      addMsg({ role: 'assistant', content: `Помилка: ${e instanceof Error ? e.message : 'Спробуйте ще раз'}` })
    } finally {
      setLoading(false)
    }
  }, [user, draft, addMsg])

  const resetWizard = useCallback(() => {
    setStep('slot_pick')
    setDraft(emptyDraft())
    setError(null)
    setMessages([
      {
        role: 'assistant',
        content: 'Починаємо спочатку. Оберіть слот на схемі де хочете показувати рекламу.',
        showSlotMap: true,
      },
    ])
  }, [])

  return {
    step,
    draft,
    messages,
    loading,
    error,
    fileInputRef,
    pickSlot,
    uploadFile,
    sendMessage,
    resetWizard,
  }
}
