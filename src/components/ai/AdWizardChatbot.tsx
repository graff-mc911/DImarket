/**
 * AdWizardChatbot — чат-фахівець для розміщення реклами прямо у float-панелі.
 * Містить: схему слотів, upload фото, live preview, вибір гео/тривалості, ціну, checkout.
 */
import { useRef, useEffect, useState } from 'react'
import { ImagePlus, Loader2, RefreshCw, Send } from 'lucide-react'
import { useAdWizardChat } from '../../hooks/useAdWizardChat'
import { AdPlacementSitePreview } from '../AdPlacementSitePreview'
import { AdMediaDisplay } from '../AdMediaDisplay'
type Props = {
  compact?: boolean
  className?: string
}

export function AdWizardChatbot({ compact = false, className = '' }: Props) {
  const {
    step,
    messages,
    loading,
    error,
    pickSlot,
    uploadFile,
    sendMessage,
    resetWizard,
  } = useAdWizardChat()

  const [input, setInput] = useState('')
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await uploadFile(file)
  }

  const handleSlotChange = (slots: string[]) => {
    setSelectedSlots(slots)
    if (slots.length > 0 && step === 'slot_pick') {
      pickSlot(slots[slots.length - 1])
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.55)] shadow-[0_8px_32px_rgba(67,44,26,0.08)] ${compact ? 'max-h-[32rem]' : 'min-h-[28rem]'} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(148,163,184,0.15)] px-4 py-2">
        <p className="text-sm font-semibold text-[#2f2a24]">AI помічник гід по сайту</p>
        <button
          type="button"
          onClick={resetWizard}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-[#6366f1]"
          title="Почати спочатку"
        >
          <RefreshCw className="h-3 w-3" />
          Скинути
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex max-w-[92%] flex-col gap-2">
              {/* Текст повідомлення */}
              <div
                className={`whitespace-pre-wrap rounded-[14px] px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#6366f1] text-white'
                    : 'border border-[rgba(148,163,184,0.2)] bg-white/80 text-[#2f2a24]'
                }`}
              >
                {msg.content}
              </div>

              {/* Схема слотів */}
              {msg.showSlotMap && (
                <div className="rounded-[12px] border border-[rgba(148,163,184,0.2)] bg-white/60 p-2">
                  <AdPlacementSitePreview
                    compact
                    selected={selectedSlots}
                    onChange={handleSlotChange}
                  />
                </div>
              )}

              {/* Live preview банера */}
              {msg.previewImageUrl && (
                <div className="overflow-hidden rounded-[12px] border border-[rgba(99,102,241,0.25)]">
                  <p className="bg-[rgba(99,102,241,0.08)] px-2 py-1 text-[10px] font-semibold text-[#6366f1]">
                    Превʼю банера
                  </p>
                  <div className="relative h-[9rem] w-full">
                    <AdMediaDisplay
                      src={msg.previewImageUrl}
                      alt="preview"
                      mediaType="image"
                      layoutKey="side"
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#6f665d]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Обробляю…
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mx-3 mb-1 text-[11px] font-medium text-[#c45a4a]">{error}</p>
      )}

      {/* Upload image button — показуємо лише коли крок image_upload */}
      {step === 'image_upload' && (
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(99,102,241,0.35)] bg-[rgba(99,102,241,0.06)] py-2 text-sm font-semibold text-[#6366f1] disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            📎 Додати зображення
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[rgba(148,163,184,0.15)] p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            step === 'slot_pick'
              ? 'Оберіть слот на схемі вище…'
              : step === 'image_upload'
              ? 'Або вставте URL зображення…'
              : step === 'geo_duration'
              ? 'Країна або місто, тижні (напр. «Україна, 2 тижні»)'
              : 'Ваша відповідь…'
          }
          disabled={loading || step === 'checkout' || step === 'done'}
          className="input-glass min-w-0 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || step === 'checkout' || step === 'done'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
