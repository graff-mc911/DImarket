import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, FileText, Globe as Globe2, Users } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'

interface CountryRankingItem {
  country: string
  score: number
  professionals: number
  listings: number
  responses: number
}

interface FooterStatsData {
  total_visits: number
  total_listings_created: number
  total_successful_listings: number
  total_professionals: number
  country_ranking: CountryRankingItem[]
  updated_at: string | null
}

const EMPTY_STATS: FooterStatsData = {
  total_visits: 0,
  total_listings_created: 0,
  total_successful_listings: 0,
  total_professionals: 0,
  country_ranking: [],
  updated_at: null,
}

const localeMap: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  kk: 'kk-KZ',
  pl: 'pl-PL',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  ro: 'ro-RO',
  cs: 'cs-CZ',
  sk: 'sk-SK',
  hu: 'hu-HU',
  bg: 'bg-BG',
  sr: 'sr-RS',
  hr: 'hr-HR',
  sl: 'sl-SI',
  lt: 'lt-LT',
  lv: 'lv-LV',
  et: 'et-EE',
  tr: 'tr-TR',
  ar: 'ar-SA',
  zh: 'zh-CN',
  ja: 'ja-JP',
}

export function FooterStats({ compact = false }: { compact?: boolean }) {
  const { t, language } = useApp()

  // Основний стан статистики, який показується у футері.
  const [stats, setStats] = useState<FooterStatsData>(EMPTY_STATS)

  // Поки дані не завантажились, показуємо loading-стан.
  const [loading, setLoading] = useState(true)

  // Підбираємо локаль для форматування чисел і дати
  // відповідно до поточної мови інтерфейсу.
  const locale = useMemo(() => {
    return localeMap[language.code] ?? 'en-US'
  }, [language.code])

  useEffect(() => {
    // Завантажуємо статистику один раз при монтуванні компонента.
    void loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)

    try {
      // refresh_app_site_stats доступна лише service_role — читаємо напряму
      const { data, error } = await supabase
        .from('app_site_stats')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (error || !data) {
        if (error) {
          console.error('Помилка завантаження статистики:', error)
        }

        setStats(EMPTY_STATS)
        return
      }

      // Нормалізуємо відповідь, щоб компонент не падав на порожніх значеннях.
      setStats({
        total_visits: data.total_visits || 0,
        total_listings_created: data.total_listings_created || 0,
        total_successful_listings: data.total_successful_listings || 0,
        total_professionals: data.total_professionals || 0,
        country_ranking: Array.isArray(data.country_ranking) ? data.country_ranking : [],
        updated_at: data.updated_at || null,
      })
    } catch (error) {
      console.error('Неочікувана помилка статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  // Єдина функція для красивого форматування чисел у всьому блоці статистики.
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale).format(value || 0)
  }

  // Опис карток верхнього ряду зі статистикою.
  const statCards = [
    {
      icon: Eye,
      label: t('footerStats.visits'),
      value: stats.total_visits,
      color: 'text-sky-600',
    },
    {
      icon: FileText,
      label: t('footerStats.listings'),
      value: stats.total_listings_created,
      color: 'text-slate-600',
    },
    {
      icon: CheckCircle2,
      label: t('footerStats.successful'),
      value: stats.total_successful_listings,
      color: 'text-emerald-600',
    },
    {
      icon: Users,
      label: t('footerStats.professionals'),
      value: stats.total_professionals,
      color: 'text-cyan-700',
    },
    {
      icon: Globe2,
      label: t('footerStats.countries'),
      value: stats.country_ranking.length,
      color: 'text-indigo-600',
    },
  ]

  if (compact) {
    return (
      <section className="border-t border-[rgba(148,163,184,0.18)] pt-4 text-center">
        <div className="grid grid-cols-2 justify-items-center gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="flex w-full max-w-[11rem] flex-col items-center gap-1.5 rounded-[18px] border border-white/40 bg-[rgba(255,255,255,0.35)] px-3 py-3"
            >
              <card.icon className={`h-6 w-6 shrink-0 ${card.color}`} />
              <span className="text-center text-[11px] font-medium leading-snug text-[#6f665d] sm:text-xs">
                {card.label}
              </span>
              <span className="text-xl font-extrabold leading-none text-[#2f2a24] sm:text-2xl">
                {loading ? '…' : formatNumber(card.value)}
              </span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-4 border-t border-[rgba(148,163,184,0.18)] pt-3">
      <div className="mb-3">
        <h3 className="text-sm font-extrabold text-[#2f2a24]">
          {t('footerStats.title')}
        </h3>
        <p className="mt-1 text-xs leading-5 text-[#6f665d]">
          {t('footerStats.subtitle')}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[16px] border border-white/38 bg-[rgba(255,255,255,0.30)] p-2.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] backdrop-blur-xl"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              <span className="text-[11px] font-medium text-[#6f665d]">{card.label}</span>
            </div>

            <div className="text-lg font-extrabold text-[#2f2a24]">
              {loading ? '...' : formatNumber(card.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-white/38 bg-[rgba(255,255,255,0.30)] p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="mb-2 flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-[#2f2a24]">
              {t('footerStats.rankingTitle')}
            </h4>
            <p className="mt-0.5 text-xs leading-5 text-[#6f665d]">
              {t('footerStats.rankingSubtitle')}
            </p>
          </div>

          {/* Показуємо дату оновлення тільки якщо вона є і статистика вже завантажилась */}
          {stats.updated_at && !loading && (
            <span className="text-xs text-[#7a7168]">
              {t('footerStats.updatedPrefix')}{' '}
              {new Date(stats.updated_at).toLocaleString(locale)}
            </span>
          )}
        </div>

        {/* Loading-стан блоку рейтингу */}
        {loading ? (
          <div className="text-sm text-[#7a7168]">{t('footerStats.loading')}</div>
        ) : stats.country_ranking.length === 0 ? (
          // Якщо даних немає — показуємо зрозуміле повідомлення замість порожнього контейнера.
          <div className="text-sm text-[#7a7168]">{t('footerStats.empty')}</div>
        ) : (
          <div className="space-y-1.5">
            {stats.country_ranking.map((item, index) => (
              <div
                key={`${item.country}-${index}`}
                className="flex flex-col gap-1.5 rounded-[14px] border border-[rgba(148,163,184,0.14)] bg-[rgba(248,250,252,0.54)] p-2 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(148,163,184,0.14)] text-[10px] font-bold text-[#475569]">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[#2f2a24]">
                      {item.country}
                    </div>
                    <div className="text-[10px] text-[#7a7168]">
                      {t('footerStats.score')}: {formatNumber(item.score)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <RankingMetric
                    label={t('footerStats.prosShort')}
                    value={item.professionals}
                    locale={locale}
                  />
                  <RankingMetric
                    label={t('footerStats.jobsShort')}
                    value={item.listings}
                    locale={locale}
                  />
                  <RankingMetric
                    label={t('footerStats.repliesShort')}
                    value={item.responses}
                    locale={locale}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function RankingMetric({
  label,
  value,
  locale,
}: {
  label: string
  value: number
  locale: string
}) {
  return (
    // Маленький переиспользовуваний блок однієї метрики в рейтингу.
    <div>
      <div className="text-[#7a7168]">{label}</div>
      <div className="font-semibold text-[#2f2a24]">
        {new Intl.NumberFormat(locale).format(value || 0)}
      </div>
    </div>
  )
}
