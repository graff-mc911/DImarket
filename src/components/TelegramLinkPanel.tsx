import { useEffect, useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'

interface TelegramLinkPanelProps {
  userId: string
  telegramChatId?: number | null
  emailDigestEnabled: boolean
  onDigestChange: (enabled: boolean) => void
}

export function TelegramLinkPanel({
  userId,
  telegramChatId,
  emailDigestEnabled,
  onDigestChange,
}: TelegramLinkPanelProps) {
  const { t } = useApp()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadCode()
  }, [userId])

  const loadCode = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('ensure_telegram_link_code', {
        p_user_id: userId,
      })
      if (!error && typeof data === 'string') setCode(data)
    } finally {
      setLoading(false)
    }
  }

  const botName = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? 'dimarket_bot'
  const linkCommand = code ? `/link ${code}` : ''

  const copyCommand = async () => {
    if (!linkCommand) return
    try {
      await navigator.clipboard.writeText(linkCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-6 rounded-none border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.05)] p-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#4338ca]" />
        <span className="font-semibold text-[#2f2a24]">{t('settings.telegramTitle')}</span>
      </div>
      <p className="mt-2 text-sm text-[#6f665d]">{t('settings.telegramText')}</p>

      {telegramChatId ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">{t('settings.telegramLinked')}</p>
      ) : loading ? (
        <p className="mt-3 text-sm text-[#6f665d]">{t('common.loading')}</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-mono text-[#4338ca]">
            {linkCommand}
          </code>
          <button
            type="button"
            onClick={() => void copyCommand()}
            className="inline-flex items-center gap-1 rounded-full border border-[rgba(99,102,241,0.3)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#4338ca]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t('referral.copied') : t('settings.telegramCopy')}
          </button>
          <a
            href={`https://t.me/${botName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#4338ca] underline"
          >
            @{botName}
          </a>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[rgba(99,102,241,0.15)] pt-4">
        <div>
          <p className="text-sm font-semibold text-[#2f2a24]">{t('settings.digestTitle')}</p>
          <p className="text-xs text-[#6f665d]">{t('settings.digestText')}</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={emailDigestEnabled}
            onChange={(event) => onDigestChange(event.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-[#6366f1] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
        </label>
      </div>
    </div>
  )
}
