import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Shield } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { aiDb } from '../../lib/ai/db'
import { fetchAiProviderStatus } from '../../lib/bots/client'
import { getMessagingChannelStatus } from '../../lib/bots'
import { AdminAIAssistantInline } from '../AdminAI/AdminAIAssistantInline'

type FraudRow = {
  id: string
  target_type: string
  target_id: string
  risk_score: number
  flags: string[]
  moderation_status: string
  created_at: string
}

/** Панель адміна: fraud-звіти, статус AI-провайдерів */
export function AiAdminDashboard() {
  const { t } = useApp()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<FraudRow[]>([])
  const [providers, setProviders] = useState({ openai: false, googleVision: false })

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    setLoading(true)
    const [fraud, status] = await Promise.all([
      aiDb
        .from('ai_fraud_reports')
        .select('id, target_type, target_id, risk_score, flags, moderation_status, created_at')
        .eq('moderation_status', 'open')
        .order('created_at', { ascending: false })
        .limit(30),
      fetchAiProviderStatus(),
    ])
    setReports((fraud.data as FraudRow[]) ?? [])
    setProviders(status)
    setLoading(false)
  }

  const channels = getMessagingChannelStatus()

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminAIAssistantInline />

      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#6366f1]" />
          <div>
            <h1 className="text-2xl font-extrabold text-[#2f2a24]">{t('ai.admin.title')}</h1>
            <p className="text-sm text-[#6f665d]">{t('ai.admin.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-4">
          <p className="text-xs font-bold uppercase text-[#9a8776]">{t('ai.admin.providers')}</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>OpenAI: {providers.openai ? '✓' : '—'}</li>
            <li>Google Vision: {providers.googleVision ? '✓' : '—'}</li>
          </ul>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-bold uppercase text-[#9a8776]">{t('ai.admin.messaging')}</p>
          <ul className="mt-2 space-y-1 text-xs text-[#6f665d]">
            {channels.map((c) => (
              <li key={c.channel}>
                {c.channel}: {c.configured ? 'OK' : t('ai.admin.notConfigured')}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#2f2a24]">
            <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
            {t('ai.admin.fraudQueue')}
          </h2>
          <button type="button" onClick={() => void load()} className="text-xs font-semibold text-[#6366f1]">
            {t('ai.retry')}
          </button>
        </div>

        {loading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#6366f1]" />
        ) : reports.length === 0 ? (
          <p className="text-sm text-[#6f665d]">{t('ai.admin.noReports')}</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="rounded-[12px] border border-[rgba(239,68,68,0.2)] bg-[rgba(255,237,232,0.4)] px-3 py-2 text-xs"
              >
                <span className="font-semibold">{r.target_type}</span> / {r.target_id} — risk{' '}
                {r.risk_score}
                <div className="text-[#9a8776]">{r.flags?.join(', ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
