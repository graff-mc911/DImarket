import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { VerificationAdminPanel } from '../components/verification/VerificationAdminPanel'
import { AdCampaign, Announcement, FeedbackMessage, Message, Profile } from '../lib/types'
import { isSiteOwner } from '../lib/siteOwner'
import { OwnerAdManager } from '../components/OwnerAdManager'
import { OwnerMarketHealth } from '../components/OwnerMarketHealth'

interface OwnerStats {
  totalVisits: number
  totalListings: number
  activeListings: number
  totalAds: number
  pendingAds: number
  feedbackMessages: number
  internalMessages: number
}

interface RecentListing {
  id: string
  title: string
  location: string
  status: 'active' | 'expired' | 'sold' | 'deleted'
  created_at: string
}

const EMPTY_STATS: OwnerStats = {
  totalVisits: 0,
  totalListings: 0,
  activeListings: 0,
  totalAds: 0,
  pendingAds: 0,
  feedbackMessages: 0,
  internalMessages: 0,
}

export function Dashboard() {
  const { user } = useApp()

  // Окремо зберігаємо профіль, щоб перевірити роль власника сайту.
  const [profile, setProfile] = useState<Profile | null>(null)

  // У цей стан складаємо зведені метрики для кабінету власника.
  const [stats, setStats] = useState<OwnerStats>(EMPTY_STATS)

  // Показуємо останні оголошення для швидкого контролю контенту.
  const [recentListings, setRecentListings] = useState<RecentListing[]>([])

  // Тут зберігаємо рекламні кампанії для модерації прямо в кабінеті owner.
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([])

  // Тут зберігаємо повідомлення із форми зворотного зв'язку.
  const [feedbackInbox, setFeedbackInbox] = useState<FeedbackMessage[]>([])

  // Тут зберігаємо внутрішні повідомлення платформи.
  const [internalInbox, setInternalInbox] = useState<Message[]>([])

  // Через ці стани показуємо глобальні й локальні дії користувачу.
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [campaignActionId, setCampaignActionId] = useState<string | null>(null)
  const [feedbackActionId, setFeedbackActionId] = useState<string | null>(null)
  const [listingActionId, setListingActionId] = useState<string | null>(null)
  const [messageActionId, setMessageActionId] = useState<string | null>(null)

  useEffect(() => {
    // Перевіряємо користувача через контекст і, за потреби, напряму через Supabase,
    // щоб не перекинути owner-профіль на /login під час першого монтування.
    void loadOwnerDashboard()
  }, [user])

  const loadOwnerDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const activeUser = user ?? (await supabase.auth.getUser()).data.user ?? null

      if (!activeUser) {
        navigateTo('/login')
        return
      }

      // Спочатку завжди перевіряємо профіль, бо саме він вирішує,
      // чи можна відкривати особистий кабінет власника сайту.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      if (!profileData) {
        navigateTo('/login')
        return
      }

      const resolvedProfile: Profile = {
        ...profileData,
        // Якщо прапорець у базі ще не спрацював,
        // даємо доступ owner-кабінету по точному email.
        is_site_owner: profileData.is_site_owner || isSiteOwner(profileData, activeUser.email),
      }

      setProfile(resolvedProfile)

      // Якщо це не власник сайту, далі owner-дані навіть не запитуємо.
      if (!resolvedProfile.is_site_owner) {
        return
      }

      // Завантажуємо основні цифри, останні оголошення, рекламні кампанії
      // і всі два типи повідомлень в один прохід.
      const [
        siteStatsResult,
        listingsCountResult,
        activeListingsCountResult,
        adsCountResult,
        pendingAdsCountResult,
        feedbackCountResult,
        messagesCountResult,
        recentListingsResult,
        adCampaignsResult,
        feedbackInboxResult,
        internalInboxResult,
      ] = await Promise.all([
        supabase
          .from('app_site_stats')
          .select('total_visits')
          .eq('id', 1)
          .maybeSingle(),

        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'deleted'),

        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),

        supabase
          .from('ad_campaigns')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'deleted'),

        supabase
          .from('ad_campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_review'),

        supabase
          .from('feedback_messages')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('listings')
          .select('id, title, location, status, created_at')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })
          .limit(8),

        supabase
          .from('ad_campaigns')
          .select('*, advertiser:profiles!advertiser_id(full_name, bio, website)')
          .order('created_at', { ascending: false })
          .limit(100),

        supabase
          .from('feedback_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12),

        supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12),
      ])

      // Формуємо зручний об'єкт статистики для карток на сторінці.
      setStats({
        totalVisits: siteStatsResult.data?.total_visits || 0,
        totalListings: listingsCountResult.count || 0,
        activeListings: activeListingsCountResult.count || 0,
        totalAds: adsCountResult.count || 0,
        pendingAds: pendingAdsCountResult.count || 0,
        feedbackMessages: feedbackCountResult.count || 0,
        internalMessages: messagesCountResult.count || 0,
      })

      setRecentListings((recentListingsResult.data as RecentListing[] | null) || [])
      setAdCampaigns((adCampaignsResult.data as AdCampaign[] | null) || [])
      setFeedbackInbox((feedbackInboxResult.data as FeedbackMessage[] | null) || [])
      setInternalInbox((internalInboxResult.data as Message[] | null) || [])
    } catch (loadError) {
      console.error('Помилка завантаження owner-кабінету:', loadError)
      setError('Не вдалося завантажити особистий кабінет власника сайту.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkFeedbackRead = async (messageId: string) => {
    setFeedbackActionId(messageId)
    setNotice('')
    setError('')

    try {
      // Позначаємо повідомлення як прочитане, не змінюючи його основний статус.
      const { error: updateError } = await supabase
        .from('feedback_messages')
        .update({
          is_read: true,
        })
        .eq('id', messageId)

      if (updateError) {
        throw updateError
      }

      setNotice('Повідомлення позначено як прочитане.')
      await loadOwnerDashboard()
    } catch (actionError) {
      console.error('Помилка оновлення повідомлення:', actionError)
      setError('Не вдалося позначити повідомлення як прочитане.')
    } finally {
      setFeedbackActionId(null)
    }
  }

  const handleResolveFeedback = async (messageId: string) => {
    setFeedbackActionId(messageId)
    setNotice('')
    setError('')

    try {
      // Коли питання вже закрите, переводимо повідомлення в resolved.
      const { error: updateError } = await supabase
        .from('feedback_messages')
        .update({
          is_read: true,
          status: 'resolved',
        })
        .eq('id', messageId)

      if (updateError) {
        throw updateError
      }

      setNotice('Повідомлення позначено як вирішене.')
      await loadOwnerDashboard()
    } catch (actionError) {
      console.error('Помилка завершення повідомлення:', actionError)
      setError('Не вдалося позначити повідомлення як вирішене.')
    } finally {
      setFeedbackActionId(null)
    }
  }

  const handleDeleteFeedback = async (messageId: string) => {
    const confirmed = window.confirm(
      'Ви впевнені, що хочете видалити це повідомлення?'
    )

    if (!confirmed) {
      return
    }

    setFeedbackActionId(messageId)
    setNotice('')
    setError('')

    try {
      // Видаляємо повідомлення, якщо воно вже не потрібне в inbox.
      const { error: deleteError } = await supabase
        .from('feedback_messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) {
        throw deleteError
      }

      setNotice('Повідомлення видалено.')
      await loadOwnerDashboard()
    } catch (actionError) {
      console.error('Помилка видалення повідомлення:', actionError)
      setError('Не вдалося видалити повідомлення.')
    } finally {
      setFeedbackActionId(null)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    const confirmed = window.confirm(
      'Ви впевнені, що хочете видалити це оголошення?'
    )

    if (!confirmed) {
      return
    }

    setListingActionId(listingId)
    setNotice('')
    setError('')

    try {
      // Технічно видаляємо оголошення через статус deleted,
      // щоб не ламати пов'язані дані і водночас прибрати його з публічного показу.
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId)

      if (updateError) {
        throw updateError
      }

      setNotice('Оголошення позначено як видалене.')
      await loadOwnerDashboard()
    } catch (actionError) {
      console.error('Помилка видалення оголошення:', actionError)
      setError('Не вдалося видалити оголошення.')
    } finally {
      setListingActionId(null)
    }
  }

  const handleDeleteInternalMessage = async (messageId: string) => {
    const confirmed = window.confirm(
      'Ви впевнені, що хочете видалити це внутрішнє повідомлення?'
    )

    if (!confirmed) {
      return
    }

    setMessageActionId(messageId)
    setNotice('')
    setError('')

    try {
      // Видаляємо внутрішнє повідомлення з owner-кабінету,
      // якщо воно більше не потрібне для контролю платформи.
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) {
        throw deleteError
      }

      setNotice('Внутрішнє повідомлення видалено.')
      await loadOwnerDashboard()
    } catch (actionError) {
      console.error('Помилка видалення внутрішнього повідомлення:', actionError)
      setError('Не вдалося видалити внутрішнє повідомлення.')
    } finally {
      setMessageActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel p-10 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(148,163,184,0.18)] border-t-[#64748b]" />
            <p className="mt-4 text-sm text-[#6f665d]">
              Завантажуємо особистий кабінет...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile?.is_site_owner) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-3xl">
          <div className="glass-panel p-8 text-center md:p-10">
            {/* Цей блок показуємо всім, хто зайшов на /dashboard без owner-ролі. */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(239,68,68,0.12)] text-[#b91c1c]">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#2f2a24]">
              Доступ заборонено
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6f665d] md:text-base">
              Особистий кабінет власника сайту відкривається тільки для вашого
              owner-профілю. Для інших користувачів ця сторінка недоступна.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigateTo('/')}
                type="button"
                className="btn-secondary rounded-full"
              >
                На головну
              </button>

              <button
                onClick={() => navigateTo('/settings')}
                type="button"
                className="btn-primary rounded-full"
              >
                Відкрити мій профіль
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      icon: BarChart3,
      title: 'Трафік сайту',
      value: stats.totalVisits,
      text: 'Загальна кількість відвідувань платформи.',
    },
    {
      icon: FileText,
      title: 'Оголошення',
      value: stats.totalListings,
      text: `Активних зараз: ${stats.activeListings}.`,
    },
    {
      icon: Sparkles,
      title: 'Реклама',
      value: stats.totalAds,
      text: `На модерації зараз: ${stats.pendingAds}.`,
    },
    {
      icon: MessageSquare,
      title: 'Повідомлення',
      value: stats.feedbackMessages + stats.internalMessages,
      text: `Зворотний зв'язок: ${stats.feedbackMessages}.`,
    },
  ]

  return (
    <div className="py-8 pb-24 lg:pb-8">
            <section className="glass-panel p-5 md:p-6 xl:p-8">
              {/* Шапка owner-кабінету з коротким поясненням призначення сторінки. */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/42 bg-[rgba(248,250,252,0.70)] px-4 py-2 text-sm font-semibold text-[#64748b]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Особистий кабінет власника</span>
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#2f2a24] md:text-4xl">
                  Вітаю, {profile.full_name || 'власнику сайту'}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6f665d] md:text-base">
                  Тут бачите тільки ви: загальні цифри сайту, оголошення, рекламу
                  та вхідні повідомлення.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-[22px] border border-[rgba(221,138,120,0.35)] bg-[rgba(255,237,232,0.92)] px-4 py-3 text-sm text-[#a44a3a]">
                  {error}
                </div>
              )}

              {notice && (
                <div className="mb-6 rounded-[22px] border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] px-4 py-3 text-sm text-[#3d7a52]">
                  {notice}
                </div>
              )}

              <div className="mb-8 rounded-[22px] border border-[var(--glass-border)] bg-white/50 p-5">
                <h2 className="text-lg font-extrabold text-[#2f2a24]">Верифікація підрядників</h2>
                <p className="mt-1 text-sm text-[#6f665d]">Заявки на перевірку документів</p>
                <div className="mt-4">
                  <VerificationAdminPanel />
                </div>
              </div>

              {/* Верхній рядок ключових owner-метрик. */}
              <OwnerMarketHealth />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <div
                    key={card.title}
                    className="glass-card p-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(148,163,184,0.14)] text-[#64748b]">
                      <card.icon className="h-6 w-6" />
                    </div>

                    <div className="mt-4 text-3xl font-extrabold text-[#2f2a24]">
                      {card.value.toLocaleString()}
                    </div>

                    <h2 className="mt-2 text-lg font-extrabold text-[#2f2a24]">
                      {card.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                {/* Лівий блок показує останні оголошення для швидкого контролю контенту. */}
                <section className="glass-card p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#2f2a24]">
                        Останні оголошення
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                        Найновіший контент на платформі для швидкої перевірки і видалення.
                      </p>
                    </div>

                    <button
                      onClick={() => navigateTo('/listings')}
                      type="button"
                      className="btn-secondary rounded-full"
                    >
                      Відкрити всі
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {recentListings.length > 0 ? (
                      recentListings.map((listing) => {
                        const isBusy = listingActionId === listing.id
                        const isDeleted = listing.status === 'deleted'

                        return (
                          <div
                            key={listing.id}
                            className="rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-base font-bold text-[#2f2a24]">
                                      {listing.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-[#6f665d]">
                                      {listing.location}
                                    </p>
                                  </div>

                                  <span className="inline-flex self-start rounded-full bg-[rgba(148,163,184,0.14)] px-3 py-1 text-xs font-semibold text-[#475569]">
                                    {getListingStatusLabel(listing.status)}
                                  </span>
                                </div>

                                <p className="mt-3 text-xs text-[#7a7168]">
                                  Створено: {new Date(listing.created_at).toLocaleString()}
                                </p>
                              </div>

                              {/* Кнопка дає owner швидко прибрати оголошення з публічного показу. */}
                              <div className="flex shrink-0">
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  type="button"
                                  disabled={isBusy || isDeleted}
                                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[rgba(239,68,68,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {isDeleted ? 'Видалено' : 'Видалити'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-[#7a7168]">
                        Поки що немає оголошень для відображення.
                      </p>
                    )}
                  </div>
                </section>

                {/* Правий блок підказує, що саме вже доступно власнику. */}
                <section className="glass-card p-5 md:p-6">
                  <h2 className="text-xl font-extrabold text-[#2f2a24]">
                    Що вже під контролем
                  </h2>

                  <div className="mt-5 space-y-3 text-sm text-[#6f665d]">
                    <OwnerFeatureRow text="Тільки owner-профіль бачить цей кабінет." />
                    <OwnerFeatureRow text="Ви бачите загальний трафік сайту та кількість оголошень." />
                    <OwnerFeatureRow text="Ви можете прибирати оголошення зі статусом deleted." />
                    <OwnerFeatureRow text="Ви бачите кількість рекламних кампаній і заявок на модерацію." />
                    <OwnerFeatureRow text="Ви бачите зворотний зв'язок та внутрішні повідомлення." />
                  </div>
                </section>
              </div>

              <OwnerAdManager
                ownerId={profile.id}
                campaigns={adCampaigns}
                onRefresh={loadOwnerDashboard}
                onNotice={setNotice}
                onError={setError}
                campaignActionId={campaignActionId}
                setCampaignActionId={setCampaignActionId}
              />

              {/* Тут показуємо всі повідомлення із форми зворотного зв'язку,
                  щоб owner міг читати і обробляти їх прямо в кабінеті. */}
              <section className="glass-card mt-6 p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      Зворотний зв'язок
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                      Тут відображаються всі повідомлення, які користувачі надсилають через форму зворотного зв'язку.
                    </p>
                  </div>

                  <div className="rounded-full bg-[rgba(148,163,184,0.14)] px-4 py-2 text-sm font-semibold text-[#475569]">
                    Усього: {stats.feedbackMessages}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {feedbackInbox.length > 0 ? (
                    feedbackInbox.map((message) => {
                      const isBusy = feedbackActionId === message.id

                      return (
                        <div
                          key={message.id}
                          className="rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <h3 className="truncate text-lg font-extrabold text-[#2f2a24]">
                                    {message.subject}
                                  </h3>
                                  <p className="mt-1 text-sm text-[#6f665d]">
                                    {message.name} • {message.email}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {!message.is_read && (
                                    <span className="inline-flex rounded-full bg-[rgba(245,158,11,0.14)] px-3 py-1 text-xs font-semibold text-[#b45309]">
                                      Непрочитане
                                    </span>
                                  )}
                                  <FeedbackStatusBadge status={message.status} />
                                </div>
                              </div>

                              {message.phone && (
                                <p className="mt-3 text-sm text-[#6f665d]">
                                  Телефон: {message.phone}
                                </p>
                              )}

                              <div className="mt-4 rounded-[18px] bg-[rgba(255,255,255,0.34)] p-4 text-sm leading-6 text-[#2f2a24]">
                                {message.message}
                              </div>

                              <div className="mt-3 text-xs text-[#7a7168]">
                                Отримано: {message.created_at ? new Date(message.created_at).toLocaleString() : '—'}
                              </div>
                            </div>

                            {/* Кнопки дозволяють owner швидко керувати вхідними зверненнями. */}
                            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                              <button
                                onClick={() => handleMarkFeedbackRead(message.id)}
                                type="button"
                                disabled={isBusy || message.is_read}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(59,130,246,0.12)] px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:bg-[rgba(59,130,246,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Eye className="h-4 w-4" />
                                Прочитано
                              </button>

                              <button
                                onClick={() => handleResolveFeedback(message.id)}
                                type="button"
                                disabled={isBusy || message.status === 'resolved'}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(34,197,94,0.14)] px-4 py-2 text-sm font-semibold text-[#15803d] transition hover:bg-[rgba(34,197,94,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Вирішено
                              </button>

                              <button
                                onClick={() => handleDeleteFeedback(message.id)}
                                type="button"
                                disabled={isBusy}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[rgba(239,68,68,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Видалити
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.24)] p-5 text-sm text-[#7a7168]">
                      Поки що немає повідомлень із форми зворотного зв'язку.
                    </div>
                  )}
                </div>
              </section>

              {/* Тут owner бачить внутрішні повідомлення між користувачами платформи. */}
              <section className="glass-card mt-6 p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#2f2a24]">
                      Внутрішні повідомлення
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f665d]">
                      Тут відображається листування, яке проходить усередині платформи.
                    </p>
                  </div>

                  <div className="rounded-full bg-[rgba(148,163,184,0.14)] px-4 py-2 text-sm font-semibold text-[#475569]">
                    Усього: {stats.internalMessages}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {internalInbox.length > 0 ? (
                    internalInbox.map((message) => {
                      const isBusy = messageActionId === message.id

                      return (
                        <div
                          key={message.id}
                          className="rounded-[24px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.30)] p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <h3 className="truncate text-lg font-extrabold text-[#2f2a24]">
                                    {getMessageSenderLabel(message)}
                                  </h3>
                                  <p className="mt-1 text-sm text-[#6f665d]">
                                    {message.sender_email || 'Email не вказано'}
                                  </p>
                                </div>

                                {!message.is_read && (
                                  <span className="inline-flex rounded-full bg-[rgba(245,158,11,0.14)] px-3 py-1 text-xs font-semibold text-[#b45309]">
                                    Непрочитане
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 rounded-[18px] bg-[rgba(255,255,255,0.34)] p-4 text-sm leading-6 text-[#2f2a24]">
                                {message.content}
                              </div>

                              <div className="mt-4 grid gap-2 text-xs text-[#7a7168] md:grid-cols-2">
                                <div>
                                  Розмова: {message.conversation_id}
                                </div>
                                <div>
                                  Отримувач: {message.recipient_id}
                                </div>
                                <div>
                                  Оголошення: {message.listing_id || 'Немає'}
                                </div>
                                <div>
                                  Створено: {new Date(message.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {/* Тут owner може швидко очистити непотрібне внутрішнє листування. */}
                            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                              {message.listing_id && (
                                <button
                                  onClick={() => navigateTo(`/listing/${message.listing_id}`)}
                                  type="button"
                                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(59,130,246,0.12)] px-4 py-2 text-sm font-semibold text-[#2563eb] transition hover:bg-[rgba(59,130,246,0.18)]"
                                >
                                  <Eye className="h-4 w-4" />
                                  До оголошення
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteInternalMessage(message.id)}
                                type="button"
                                disabled={isBusy}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(239,68,68,0.12)] px-4 py-2 text-sm font-semibold text-[#b91c1c] transition hover:bg-[rgba(239,68,68,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Видалити
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-[22px] border border-[rgba(148,163,184,0.16)] bg-[rgba(255,255,255,0.24)] p-5 text-sm text-[#7a7168]">
                      Поки що немає внутрішніх повідомлень.
                    </div>
                  )}
                </div>
              </section>

              {/* ===== СЕКЦІЯ: Управління банерами (оголошення від власника) ===== */}
              {/* Власник може додавати повідомлення які показуються всім у шапці сайту */}
              <AnnouncementsManager />

            </section>
    </div>
  )
}

// ============================================================
// AnnouncementsManager — секція управління банерами у Dashboard
// Власник може створювати, активувати та видаляти банери
// ============================================================
function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]             = useState(true)
  const [message, setMessage]             = useState('')
  const [type, setType]                   = useState<Announcement['type']>('info')
  const [saving, setSaving]               = useState(false)
  const [actionId, setActionId]           = useState<string | null>(null)
  const [notice, setNotice]               = useState('')
  const [error, setError]                 = useState('')

  useEffect(() => {
    void loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    setLoading(true)
    try {
      const { data, error: qError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (qError) {
        // Таблиця ще не створена — показуємо підказку
        if (qError.code === '42P01') {
          setAnnouncements([])
          setError('sql_missing')
          return
        }
        throw qError
      }

      setAnnouncements((data as Announcement[] | null) || [])
    } catch (e) {
      console.error('Помилка завантаження банерів:', e)
    } finally {
      setLoading(false)
    }
  }

  // Створення нового банера
  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSaving(true)
    setNotice('')
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('announcements')
        .insert({
          message: message.trim(),
          type,
          is_active: true,
        })

      if (insertError) throw insertError

      setMessage('')
      setNotice('Банер створено і активовано.')
      await loadAnnouncements()
    } catch (e) {
      console.error('Помилка створення банера:', e)
      setError('Не вдалося створити банер.')
    } finally {
      setSaving(false)
    }
  }

  // Увімкнути/вимкнути банер
  const toggleAnnouncement = async (id: string, isActive: boolean) => {
    setActionId(id)
    try {
      await supabase
        .from('announcements')
        .update({ is_active: !isActive })
        .eq('id', id)

      setNotice(isActive ? 'Банер вимкнено.' : 'Банер увімкнено.')
      await loadAnnouncements()
    } catch (e) {
      console.error('Помилка зміни статусу банера:', e)
      setError('Помилка.')
    } finally {
      setActionId(null)
    }
  }

  // Видалити банер
  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Видалити цей банер?')) return
    setActionId(id)
    try {
      await supabase.from('announcements').delete().eq('id', id)
      setNotice('Банер видалено.')
      await loadAnnouncements()
    } catch (e) {
      console.error('Помилка видалення банера:', e)
      setError('Помилка.')
    } finally {
      setActionId(null)
    }
  }

  // Кольори типів банерів
  const typeStyles: Record<Announcement['type'], { bg: string; color: string; label: string }> = {
    info:    { bg: 'rgba(59,130,246,0.12)',  color: '#1d4ed8', label: 'Інформація' },
    warning: { bg: 'rgba(245,158,11,0.12)',  color: '#92400e', label: 'Попередження' },
    success: { bg: 'rgba(34,197,94,0.12)',   color: '#15803d', label: 'Успіх' },
    promo:   { bg: 'rgba(199,138,96,0.12)', color: '#92400e', label: 'Акція' },
  }

  return (
    <section className="glass-card mt-6 p-5 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <Bell className="h-6 w-6 text-[#c96d2c]" />
        <div>
          <h2 className="text-xl font-extrabold text-[#2f2a24]">
            Глобальні оголошення
          </h2>
          <p className="text-sm text-[#6f665d] mt-1">
            Банери які показуються всім користувачам у шапці сайту
          </p>
        </div>
      </div>

      {notice && (
        <div className="mb-4 rounded-[18px] border border-[rgba(120,181,140,0.35)] bg-[rgba(236,250,240,0.92)] px-4 py-3 text-sm text-[#3d7a52]">
          {notice}
        </div>
      )}

      {/* Підказка якщо таблиця не існує */}
      {error === 'sql_missing' ? (
        <div className="rounded-[20px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.4)] p-5">
          <p className="text-sm font-semibold text-[#2f2a24] mb-3">
            Для роботи банерів створіть таблицю в Supabase:
          </p>
          <pre className="overflow-x-auto rounded-[14px] bg-[rgba(0,0,0,0.05)] p-4 text-xs leading-relaxed text-[#2f2a24]">
{`CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info','warning','success','promo')) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);`}
          </pre>
        </div>
      ) : (
        <>
          {/* Форма створення нового банера */}
          <form onSubmit={createAnnouncement} className="rounded-[22px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.3)] p-5 mb-5">
            <h3 className="text-base font-extrabold text-[#2f2a24] mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#c96d2c]" />
              Новий банер
            </h3>

            {/* Текст банера */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#5f5a54] mb-1.5">
                Текст повідомлення *
              </label>
              <input
                type="text"
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Наприклад: Нова функція! Тепер можна зберігати профілі майстрів."
                className="input-glass w-full"
                maxLength={300}
              />
              <p className="text-xs text-[#9a8776] mt-1 text-right">{message.length}/300</p>
            </div>

            {/* Тип банера */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#5f5a54] mb-1.5">
                Тип банера
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.entries(typeStyles) as [Announcement['type'], typeof typeStyles[keyof typeof typeStyles]][]).map(([key, style]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className="rounded-[16px] border px-3 py-2 text-xs font-semibold transition"
                    style={{
                      background:   type === key ? style.bg   : 'rgba(255,255,255,0.4)',
                      borderColor:  type === key ? style.color : 'rgba(148,163,184,0.2)',
                      color:        type === key ? style.color : '#6f665d',
                    }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Попередній перегляд */}
            {message.trim() && (
              <div
                className="mb-4 flex items-center gap-2 rounded-[16px] border px-4 py-2.5 text-sm font-semibold"
                style={{
                  background:  typeStyles[type].bg,
                  borderColor: typeStyles[type].color + '50',
                  color:       typeStyles[type].color,
                }}
              >
                <Bell className="h-4 w-4 shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !message.trim()}
              className="btn-primary rounded-full disabled:opacity-50"
            >
              {saving ? 'Створення...' : 'Створити і показати всім'}
            </button>
          </form>

          {/* Список існуючих банерів */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#6f665d] py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(148,163,184,0.3)] border-t-[#64748b]" />
              Завантаження...
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-[#7a7168] py-4">
              Банерів ще немає. Створіть перший вище.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => {
                const style = typeStyles[ann.type]
                const isBusy = actionId === ann.id
                return (
                  <div
                    key={ann.id}
                    className="rounded-[22px] border p-4"
                    style={{
                      borderColor: ann.is_active ? style.color + '40' : 'rgba(148,163,184,0.2)',
                      background:  ann.is_active ? style.bg : 'rgba(255,255,255,0.25)',
                      opacity:     ann.is_active ? 1 : 0.6,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Текст банера */}
                        <p className="font-semibold text-sm" style={{ color: ann.is_active ? style.color : '#6f665d' }}>
                          {ann.message}
                        </p>
                        {/* Метадані */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7a7168]">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {style.label}
                          </span>
                          <span>
                            {ann.is_active ? '✓ Активний' : '○ Вимкнений'}
                          </span>
                          <span>
                            {new Date(ann.created_at).toLocaleString('uk-UA')}
                          </span>
                        </div>
                      </div>

                      {/* Кнопки дій */}
                      <div className="flex shrink-0 gap-2">
                        {/* Увімкнути/вимкнути */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                          style={ann.is_active
                            ? { background: 'rgba(148,163,184,0.14)', color: '#475569' }
                            : { background: 'rgba(34,197,94,0.14)',   color: '#15803d' }}
                        >
                          {ann.is_active ? 'Вимкнути' : 'Увімкнути'}
                        </button>

                        {/* Видалити */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => deleteAnnouncement(ann.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#b91c1c' }}
                          title="Видалити банер"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function OwnerFeatureRow({ text }: { text: string }) {
  return (
    // Короткий рядок-пояснення для owner-функцій.
    <div className="flex items-start gap-3">
      <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[rgba(148,163,184,0.55)]" />
      <span>{text}</span>
    </div>
  )
}

function FeedbackStatusBadge({ status }: { status: FeedbackMessage['status'] }) {
  const styles: Record<FeedbackMessage['status'], string> = {
    new: 'bg-[rgba(245,158,11,0.14)] text-[#b45309]',
    in_progress: 'bg-[rgba(59,130,246,0.12)] text-[#2563eb]',
    resolved: 'bg-[rgba(34,197,94,0.14)] text-[#15803d]',
    archived: 'bg-[rgba(148,163,184,0.14)] text-[#475569]',
  }

  const labels: Record<FeedbackMessage['status'], string> = {
    new: 'Нове',
    in_progress: 'В роботі',
    resolved: 'Вирішено',
    archived: 'Архів',
  }

  return (
    // Бейдж статусу зворотного зв'язку допомагає швидко сортувати звернення візуально.
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function getListingStatusLabel(status: RecentListing['status']) {
  const labels: Record<RecentListing['status'], string> = {
    active: 'Активне',
    expired: 'Завершене',
    sold: 'Закрите',
    deleted: 'Видалене',
  }

  return labels[status]
}

function getMessageSenderLabel(message: Message) {
  // Показуємо найзрозуміліше джерело повідомлення:
  // спочатку ім'я, потім email, і лише потім запасний підпис.
  return message.sender_name || message.sender_email || 'Невідомий відправник'
}