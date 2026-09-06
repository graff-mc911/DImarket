import { useCallback, useEffect, useState } from 'react'
import {
  BarChart3,
  Globe,
  Loader2,
  Megaphone,
  Play,
  Square,
  Sparkles,
  Check,
  X,
  Send,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  marketingAgentApi,
  type AgentConfig,
  type MarketingPlatform,
  type MarketingPost,
  type MarketTarget,
} from '../../lib/marketing/agentApi'

const ALL_PLATFORMS: MarketingPlatform[] = [
  'facebook',
  'instagram',
  'tiktok',
  'twitter',
  'linkedin',
  'telegram',
  'youtube',
  'email',
  'google_ads',
  'reddit',
  'blog',
]

const MARKET_PRESETS: MarketTarget[] = [
  { countryCode: 'UA', languageCode: 'uk', label: 'Ukraine' },
  { countryCode: 'US', languageCode: 'en', label: 'United States' },
  { countryCode: 'DE', languageCode: 'de', label: 'Germany' },
  { countryCode: 'PL', languageCode: 'pl', label: 'Poland' },
  { countryCode: 'FR', languageCode: 'fr', label: 'France' },
  { countryCode: 'ES', languageCode: 'es', label: 'Spain' },
]

const ROLES = ['client', 'master', 'company', 'advertiser'] as const

export function MarketingAgentDashboard() {
  const { t } = useApp()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({})
  const [posts, setPosts] = useState<MarketingPost[]>([])
  const [analytics, setAnalytics] = useState({
    postsPublished: 0,
    pendingReview: 0,
    attributedRegistrations: 0,
  })
  const [preview, setPreview] = useState<{ body: string; hashtags: string[] } | null>(null)
  const [tab, setTab] = useState<'control' | 'preview' | 'analytics'>('control')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [cfg, status, list, stats] = await Promise.all([
        marketingAgentApi.getConfig(),
        marketingAgentApi.status(),
        marketingAgentApi.listPosts(),
        marketingAgentApi.analytics(),
      ])
      setConfig(cfg)
      setIntegrations(status)
      setPosts(list)
      setAnalytics({
        postsPublished: stats.postsPublished,
        pendingReview: stats.pendingReview,
        attributedRegistrations: stats.attributedRegistrations,
      })
    } catch {
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveConfig = async (patch: Partial<AgentConfig>) => {
    setBusy(true)
    try {
      const updated = await marketingAgentApi.updateConfig(patch)
      setConfig(updated)
    } finally {
      setBusy(false)
    }
  }

  const toggleMarket = (market: MarketTarget) => {
    if (!config) return
    const exists = config.target_markets.some(
      (m) => m.countryCode === market.countryCode && m.languageCode === market.languageCode,
    )
    const target_markets = exists
      ? config.target_markets.filter((m) => m.countryCode !== market.countryCode)
      : [...config.target_markets, market]
    void saveConfig({ target_markets })
  }

  const togglePlatform = (p: MarketingPlatform) => {
    if (!config) return
    const platforms = config.platforms.includes(p)
      ? config.platforms.filter((x) => x !== p)
      : [...config.platforms, p]
    void saveConfig({ platforms })
  }

  const handlePreview = async () => {
    setBusy(true)
    try {
      const role = ROLES[(config?.next_role_index ?? 0) % ROLES.length]
      const market = config?.target_markets[0] ?? MARKET_PRESETS[0]
      const platform = config?.platforms[0] ?? 'telegram'
      const data = await marketingAgentApi.generatePreview({
        role,
        platform,
        languageCode: market.languageCode,
        countryCode: market.countryCode,
      })
      setPreview({ body: data.body, hashtags: data.hashtags })
      setTab('preview')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#6366f1]" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6 sm:space-y-6">
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Megaphone className="h-7 w-7 shrink-0 text-[#6366f1] sm:h-8 sm:w-8" />
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-[#2f2a24] sm:text-2xl">{t('marketing.admin.title')}</h1>
              <p className="text-xs text-[#6f665d] sm:text-sm">{t('marketing.admin.subtitle')}</p>
              <p className="mt-1 hidden text-xs text-[#9a8776] sm:block">{t('marketing.admin.blogHint')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {config?.is_running ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveConfig({ is_running: false })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#fca5a5] px-4 py-2.5 text-sm font-semibold text-[#b91c1c] sm:w-auto"
              >
                <Square className="h-4 w-4" />
                {t('marketing.admin.stop')}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveConfig({ is_running: true })}
                className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm sm:w-auto"
              >
                <Play className="h-4 w-4" />
                {t('marketing.admin.start')}
              </button>
            )}
            <button
              type="button"
              disabled={busy || !config?.is_running}
              onClick={async () => {
                setBusy(true)
                try {
                  await marketingAgentApi.runCycle()
                  await refresh()
                } finally {
                  setBusy(false)
                }
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#c7d2fe] bg-white px-4 py-2.5 text-sm font-semibold text-[#4338ca] sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              {t('marketing.admin.runNow')}
            </button>
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto border-b border-[var(--glass-border)] px-1 pb-2 sm:mx-0 sm:flex-wrap sm:gap-2">
        {(['control', 'preview', 'analytics'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm ${
              tab === id ? 'bg-[#6366f1] text-white' : 'text-[#6f665d] hover:bg-[#f5f0eb]'
            }`}
          >
            {t(`marketing.admin.tab.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'control' && config && (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="glass-card space-y-3 p-4 sm:space-y-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#2f2a24]">
              <Globe className="h-5 w-5 text-[#6366f1]" />
              {t('marketing.admin.markets')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {MARKET_PRESETS.map((m) => {
                const on = config.target_markets.some((x) => x.countryCode === m.countryCode)
                return (
                  <button
                    key={m.countryCode}
                    type="button"
                    onClick={() => toggleMarket(m)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      on ? 'bg-[#6366f1] text-white' : 'border border-[#e7ddd3] text-[#6f665d]'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>

            <label className="block text-xs font-bold uppercase text-[#9a8776]">
              {t('marketing.admin.frequency')}
            </label>
            <select
              className="input-glass w-full"
              value={config.frequency}
              onChange={(e) =>
                void saveConfig({
                  frequency: e.target.value as AgentConfig['frequency'],
                })
              }
            >
              <option value="hourly">{t('marketing.admin.freqHourly')}</option>
              <option value="daily">{t('marketing.admin.freqDaily')}</option>
              <option value="weekly">{t('marketing.admin.freqWeekly')}</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.auto_publish}
                onChange={(e) => void saveConfig({ auto_publish: e.target.checked })}
              />
              {t('marketing.admin.autoPublish')}
            </label>

            <label className="block text-xs font-bold uppercase text-[#9a8776]">
              {t('marketing.admin.budget')}
            </label>
            <input
              type="number"
              min={0}
              step={10}
              className="input-glass w-full"
              value={config.daily_budget_usd}
              onChange={(e) => void saveConfig({ daily_budget_usd: Number(e.target.value) })}
            />
          </div>

          <div className="glass-card space-y-3 p-4 sm:space-y-4 sm:p-6">
            <h2 className="text-base font-bold text-[#2f2a24] sm:text-lg">{t('marketing.admin.platforms')}</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    config.platforms.includes(p)
                      ? 'bg-[#10b981] text-white'
                      : 'border border-[#e7ddd3] text-[#6f665d]'
                  }`}
                >
                  {p}
                  {integrations[p] || integrations[p.replace('_', '')] ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handlePreview()}
              className="text-sm font-semibold text-[#6366f1]"
            >
              {t('marketing.admin.previewGenerate')}
            </button>
          </div>
        </div>
      )}

      {tab === 'preview' && (
        <div className="space-y-4">
          {preview && (
            <div className="glass-card p-6">
              <p className="whitespace-pre-wrap text-sm text-[#2f2a24]">{preview.body}</p>
              <p className="mt-2 text-xs text-[#6366f1]">
                {preview.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
              </p>
            </div>
          )}
          <div className="glass-card p-6">
            <h2 className="mb-4 text-lg font-bold">{t('marketing.admin.queue')}</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-[#6f665d]">{t('marketing.admin.noPosts')}</p>
            ) : (
              <ul className="space-y-3">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-none border border-[#e7ddd3] bg-white/60 p-3 text-sm"
                  >
                    <div className="mb-1 flex flex-wrap gap-2 text-xs font-semibold uppercase text-[#9a8776]">
                      <span>{post.platform}</span>
                      <span>{post.role_target}</span>
                      <span>{post.language_code}</span>
                      <span className="rounded-full bg-[#eef2ff] px-2 text-[#4338ca]">{post.status}</span>
                    </div>
                    <p className="line-clamp-3 text-[#2f2a24]">{post.body}</p>
                    {post.status === 'pending_review' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full bg-[#10b981] px-3 py-1 text-xs font-semibold text-white"
                          onClick={async () => {
                            await marketingAgentApi.approvePost(post.id)
                            await marketingAgentApi.publishPost(post.id)
                            await refresh()
                          }}
                        >
                          <Check className="h-3 w-3" />
                          {t('marketing.admin.approvePublish')}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
                          onClick={async () => {
                            await marketingAgentApi.rejectPost(post.id)
                            await refresh()
                          }}
                        >
                          <X className="h-3 w-3" />
                          {t('marketing.admin.reject')}
                        </button>
                      </div>
                    )}
                    {post.status === 'approved' && (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#6366f1]"
                        onClick={async () => {
                          await marketingAgentApi.publishPost(post.id)
                          await refresh()
                        }}
                      >
                        <Send className="h-3 w-3" />
                        {t('marketing.admin.publish')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card p-4">
            <BarChart3 className="mb-2 h-6 w-6 text-[#6366f1]" />
            <p className="text-2xl font-bold">{analytics.postsPublished}</p>
            <p className="text-xs text-[#6f665d]">{t('marketing.admin.published')}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-2xl font-bold">{analytics.pendingReview}</p>
            <p className="text-xs text-[#6f665d]">{t('marketing.admin.pending')}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-2xl font-bold">{analytics.attributedRegistrations}</p>
            <p className="text-xs text-[#6f665d]">{t('marketing.admin.registrations')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
