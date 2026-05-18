// ============================================================
// Favorites.tsx — Збережені оголошення та профілі
//
// Користувач може зберігати:
// - оголошення (listing)
// - профілі майстрів/компаній (profile)
//
// Дані зберігаються в таблиці saved_items у Supabase.
// Якщо таблиця ще не створена — показуємо інструкцію.
// ============================================================

import { useEffect, useState } from 'react'
import {
  Bookmark,
  BookmarkX,
  Building2,
  FileText,
  Heart,
  MapPin,
  Search,
  Star,
  User,
} from 'lucide-react'
import { supabase }       from '../lib/supabase'
import { useApp }         from '../contexts/AppContext'
import { navigateTo }     from '../lib/navigation'
import { AdBanner }       from '../components/AdBanner'
import type { Listing, Profile } from '../lib/types'

// Тип збереженого елемента з деталями
interface SavedListingItem {
  id: string
  item_id: string
  item_type: 'listing'
  created_at: string
  listing: Listing | null
}

interface SavedProfileItem {
  id: string
  item_id: string
  item_type: 'profile'
  created_at: string
  profile: Profile | null
}

type SavedItem = SavedListingItem | SavedProfileItem

// Активний таб
type ActiveTab = 'listings' | 'profiles'

export function Favorites() {
  const { user, t } = useApp()

  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([])
  const [savedProfiles, setSavedProfiles] = useState<SavedProfileItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState<ActiveTab>('listings')
  // Якщо таблиця saved_items ще не існує в базі
  const [tableNotFound, setTableNotFound] = useState(false)

  useEffect(() => {
    if (user) {
      void loadFavorites()
    } else {
      navigateTo('/login')
    }
  }, [user])

  // Завантаження збережених елементів з Supabase
  const loadFavorites = async () => {
    setLoading(true)
    try {
      // Завантажуємо збережені оголошення
      const { data: listingsData, error: listingsError } = await supabase
        .from('saved_items')
        .select('id, item_id, item_type, created_at')
        .eq('user_id', user!.id)
        .eq('item_type', 'listing')
        .order('created_at', { ascending: false })

      // Перевіряємо чи таблиця існує
      if (listingsError) {
        if (listingsError.code === '42P01') {
          // Таблиця saved_items не створена в базі
          setTableNotFound(true)
          return
        }
        throw listingsError
      }

      // Для кожного збереженого оголошення завантажуємо деталі
      if (listingsData && listingsData.length > 0) {
        const ids = listingsData.map(item => item.item_id)
        const { data: listingDetails } = await supabase
          .from('listings')
          .select('*')
          .in('id', ids)
          .eq('status', 'active')

        const merged: SavedListingItem[] = listingsData.map(saved => ({
          id: saved.id,
          item_id: saved.item_id,
          item_type: 'listing' as const,
          created_at: saved.created_at,
          listing: listingDetails?.find(l => l.id === saved.item_id) || null,
        }))
        setSavedListings(merged)
      } else {
        setSavedListings([])
      }

      // Завантажуємо збережені профілі
      const { data: profilesData, error: profilesError } = await supabase
        .from('saved_items')
        .select('id, item_id, item_type, created_at')
        .eq('user_id', user!.id)
        .eq('item_type', 'profile')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      if (profilesData && profilesData.length > 0) {
        const ids = profilesData.map(item => item.item_id)
        const { data: profileDetails } = await supabase
          .from('profiles')
          .select('*')
          .in('id', ids)

        const merged: SavedProfileItem[] = profilesData.map(saved => ({
          id: saved.id,
          item_id: saved.item_id,
          item_type: 'profile' as const,
          created_at: saved.created_at,
          profile: profileDetails?.find(p => p.id === saved.item_id) || null,
        }))
        setSavedProfiles(merged)
      } else {
        setSavedProfiles([])
      }

    } catch (error) {
      console.error('Помилка завантаження збережених:', error)
    } finally {
      setLoading(false)
    }
  }

  // Видалення зі збережених
  const removeFromFavorites = async (savedId: string, type: ActiveTab) => {
    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', savedId)
        .eq('user_id', user!.id)

      if (error) throw error

      // Оновлюємо локальний стан без перезавантаження
      if (type === 'listings') {
        setSavedListings(prev => prev.filter(item => item.id !== savedId))
      } else {
        setSavedProfiles(prev => prev.filter(item => item.id !== savedId))
      }
    } catch (error) {
      console.error('Помилка видалення зі збережених:', error)
    }
  }

  // Форматування дати збереження
  const formatSavedDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })

  // --- Екран завантаження ---
  if (loading) {
    return (
      <div className="page-bg min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
          <p className="muted-text mt-4 text-sm">Завантаження збережених...</p>
        </div>
      </div>
    )
  }

  // --- Якщо таблиця не створена в базі ---
  if (tableNotFound) {
    return (
      <div className="page-bg min-h-screen px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="glass-panel p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(242,171,116,0.18)]" style={{ color: 'var(--accent-700)' }}>
              <Bookmark className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Збережені
            </h1>
            <p className="muted-text mx-auto mt-4 max-w-md text-sm leading-7">
              Функція збережених потребує таблицю <code className="rounded bg-[rgba(0,0,0,0.06)] px-1.5 py-0.5 text-xs">saved_items</code> у вашій базі Supabase.
            </p>
            <div className="mt-6 rounded-[20px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.4)] p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ink-500)' }}>
                SQL для створення таблиці
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[14px] bg-[rgba(0,0,0,0.05)] p-4 text-xs leading-relaxed" style={{ color: 'var(--ink-900)' }}>
{`CREATE TABLE saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('listing','profile')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved items"
ON saved_items FOR ALL USING (auth.uid() = user_id);`}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/listings')}
              className="btn-primary mt-6 rounded-full"
            >
              <Search className="h-4 w-4" />
              Перейти до каталогу
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-bg min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">

          {/* Ліва рекламна колонка */}
          <div className="hidden lg:block w-1/5">
            <AdBanner position="left" sticky={true} />
          </div>

          {/* Основний контент */}
          <div className="flex-1 lg:w-3/5">

            {/* Заголовок */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-[-0.03em]" style={{ color: 'var(--ink-900)' }}>
                {t('header.favorites')}
              </h1>
              <p className="muted-text mt-1 text-sm">
                Оголошення та майстри які ви зберегли
              </p>
            </div>

            {/* Таби */}
            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                style={activeTab === 'listings'
                  ? { background: 'var(--accent-700)', color: '#fff' }
                  : { background: 'var(--glass-bg)', color: 'var(--ink-700)', border: '1px solid var(--glass-border)' }}
              >
                <FileText className="h-4 w-4" />
                Оголошення
                {savedListings.length > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                    style={activeTab === 'listings'
                      ? { background: 'rgba(255,255,255,0.25)' }
                      : { background: 'var(--glass-border)', color: 'var(--ink-700)' }}>
                    {savedListings.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profiles')}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                style={activeTab === 'profiles'
                  ? { background: 'var(--accent-700)', color: '#fff' }
                  : { background: 'var(--glass-bg)', color: 'var(--ink-700)', border: '1px solid var(--glass-border)' }}
              >
                <User className="h-4 w-4" />
                Майстри
                {savedProfiles.length > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                    style={activeTab === 'profiles'
                      ? { background: 'rgba(255,255,255,0.25)' }
                      : { background: 'var(--glass-border)', color: 'var(--ink-700)' }}>
                    {savedProfiles.length}
                  </span>
                )}
              </button>
            </div>

            {/* Список збережених оголошень */}
            {activeTab === 'listings' && (
              <div>
                {savedListings.length === 0 ? (
                  <div className="glass-card py-16 text-center">
                    <Heart className="mx-auto mb-4 h-14 w-14" style={{ color: 'var(--glass-border-strong)' }} />
                    <p className="font-semibold" style={{ color: 'var(--ink-700)' }}>
                      Немає збережених оголошень
                    </p>
                    <p className="muted-text mt-2 text-sm">
                      Натисніть серце на оголошенні щоб зберегти його тут
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo('/listings')}
                      className="btn-primary mt-5 rounded-full"
                    >
                      <Search className="h-4 w-4" />
                      Переглянути оголошення
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedListings.map((item) => {
                      const listing = item.listing
                      if (!listing) return null

                      return (
                        <div key={item.id} className="glass-card overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">

                              {/* Інформація про оголошення */}
                              <button
                                type="button"
                                onClick={() => navigateTo('/listing/' + listing.id)}
                                className="flex-1 min-w-0 text-left"
                              >
                                <h3 className="truncate font-bold transition" style={{ color: 'var(--ink-900)' }}>
                                  {listing.title}
                                </h3>
                                <p className="muted-text mt-1 line-clamp-2 text-sm">
                                  {listing.description}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--ink-500)' }}>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {listing.location}
                                  </span>
                                  {listing.price && (
                                    <span className="font-bold" style={{ color: 'var(--ink-900)' }}>
                                      {listing.price.toLocaleString()} {listing.currency}
                                    </span>
                                  )}
                                  <span style={{ color: 'var(--ink-400)' }}>
                                    Збережено {formatSavedDate(item.created_at)}
                                  </span>
                                </div>
                              </button>

                              {/* Кнопка видалення зі збережених */}
                              <button
                                type="button"
                                onClick={() => removeFromFavorites(item.id, 'listings')}
                                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110"
                                style={{ background: 'rgba(239,68,68,0.10)', color: '#b91c1c' }}
                                title="Видалити зі збережених"
                              >
                                <BookmarkX className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Список збережених профілів */}
            {activeTab === 'profiles' && (
              <div>
                {savedProfiles.length === 0 ? (
                  <div className="glass-card py-16 text-center">
                    <User className="mx-auto mb-4 h-14 w-14" style={{ color: 'var(--glass-border-strong)' }} />
                    <p className="font-semibold" style={{ color: 'var(--ink-700)' }}>
                      Немає збережених майстрів
                    </p>
                    <p className="muted-text mt-2 text-sm">
                      Зберігайте профілі майстрів щоб швидко знаходити їх тут
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo('/professionals')}
                      className="btn-primary mt-5 rounded-full"
                    >
                      <Search className="h-4 w-4" />
                      Знайти майстрів
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProfiles.map((item) => {
                      const profile = item.profile
                      if (!profile) return null

                      // Ініціали для аватара
                      const initials = profile.full_name
                        ? profile.full_name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('')
                        : '?'

                      return (
                        <div key={item.id} className="glass-card overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">

                              {/* Інформація про профіль */}
                              <button
                                type="button"
                                onClick={() => navigateTo('/professional/' + profile.id)}
                                className="flex flex-1 min-w-0 items-center gap-3 text-left"
                              >
                                {/* Аватар */}
                                {profile.profile_photo || profile.avatar_url ? (
                                  <img
                                    src={profile.profile_photo || profile.avatar_url || ''}
                                    alt={profile.full_name || ''}
                                    className="h-12 w-12 shrink-0 rounded-[14px] object-cover"
                                  />
                                ) : (
                                  <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold"
                                    style={{ background: 'rgba(199,138,96,0.15)', color: 'var(--accent-700)' }}
                                  >
                                    {initials}
                                  </div>
                                )}

                                {/* Ім'я та деталі */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="truncate font-bold" style={{ color: 'var(--ink-900)' }}>
                                      {profile.full_name || 'Майстер'}
                                    </h3>
                                    {profile.is_verified && (
                                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}>
                                        ✓ Верифікований
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: 'var(--ink-500)' }}>
                                    {profile.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {profile.location}
                                      </span>
                                    )}
                                    {profile.rating > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-current text-[#c78a60]" />
                                        {profile.rating.toFixed(1)}
                                        <span style={{ color: 'var(--ink-400)' }}>
                                          ({profile.total_reviews})
                                        </span>
                                      </span>
                                    )}
                                    {profile.is_professional && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        Майстер
                                      </span>
                                    )}
                                  </div>

                                  {profile.bio && (
                                    <p className="muted-text mt-1 line-clamp-1 text-xs">
                                      {profile.bio}
                                    </p>
                                  )}
                                </div>
                              </button>

                              {/* Кнопка видалення зі збережених */}
                              <button
                                type="button"
                                onClick={() => removeFromFavorites(item.id, 'profiles')}
                                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110"
                                style={{ background: 'rgba(239,68,68,0.10)', color: '#b91c1c' }}
                                title="Видалити зі збережених"
                              >
                                <BookmarkX className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Права рекламна колонка */}
          <div className="hidden lg:block w-1/5">
            <AdBanner position="right" sticky={true} />
          </div>

        </div>
      </div>
    </div>
  )
}