// ============================================================
// Profile.tsx — Особиста сторінка профілю авторизованого користувача
// Показує фото, контакти, портфоліо та відгуки.
// Стиль уніфіковано з glass-дизайном проекту.
// ============================================================

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Calendar,
  Edit3,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from 'lucide-react'
import { supabase }                       from '../lib/supabase'
import { useApp }                         from '../contexts/AppContext'
import { navigateTo }                     from '../lib/navigation'
import { Profile as ProfileType, Review } from '../lib/types'

export function Profile() {
  const { user, t } = useApp()

  const [profile, setProfile]                         = useState<ProfileType | null>(null)
  const [reviews, setReviews]                         = useState<Review[]>([])
  const [portfolioImages, setPortfolioImages]         = useState<string[]>([])
  const [activeListingsCount, setActiveListingsCount] = useState(0)
  const [loading, setLoading]                         = useState(true)
  const [activeTab, setActiveTab]                     = useState<'portfolio' | 'reviews'>('portfolio')

  useEffect(() => {
    if (user) {
      void loadProfileData()
    } else {
      navigateTo('/login')
    }
  }, [user])

  if (!user) {
    return null
  }

  const loadProfileData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData)
        setPortfolioImages(profileData.portfolio_images || [])
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('professional_id', user!.id)
        .order('created_at', { ascending: false })

      if (reviewsData) setReviews(reviewsData)

      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user!.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())

      setActiveListingsCount(count || 0)
    } catch (error) {
      console.error('Помилка завантаження профілю:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMemberSince = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={i < Math.round(rating)
          ? 'h-4 w-4 fill-current text-[#c78a60]'
          : 'h-4 w-4 text-[var(--glass-border-strong)]'}
      />
    ))

  // Ініціали для аватара якщо немає фото
  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('')
    : 'DI'

  // Підготовлені значення для href — окремо щоб Babel не плутався
  const phoneHref   = profile?.phone   ? 'tel:' + profile.phone   : ''
  const websiteHref = profile?.website ?? ''
  const websiteText = profile?.website ? profile.website.replace(/^https?:\/\//, '') : ''

  // --- Екран завантаження ---
  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
          <p className="muted-text mt-4 text-sm">Завантаження профілю...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 pb-24 lg:pb-8">
          <div className="space-y-5">

            {/* ===== Шапка профілю ===== */}
            <div className="glass-panel overflow-hidden fade-rise">

              {/* Обкладинка */}
              <div className="relative h-32 rounded-t-[26px] bg-gradient-to-br from-[#8d5636] via-[#a96942] to-[#c78a60]">
                <button
                  type="button"
                  onClick={() => navigateTo('/settings')}
                  className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {t('profile.editProfile')}
                </button>
              </div>

              <div className="px-6 pb-6">
                {/* Аватар — виступає над обкладинкою */}
                <div className="-mt-12 mb-4">
                  {(profile?.profile_photo || profile?.avatar_url) ? (
                    <img
                      src={profile.profile_photo || profile.avatar_url || ''}
                      alt={profile.full_name || 'Profile'}
                      className="h-24 w-24 rounded-[22px] border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] border-4 border-white bg-[rgba(255,248,241,0.9)] text-xl font-bold shadow-lg" style={{ color: 'var(--accent-700)' }}>
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                  {/* Ліва частина */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-[-0.03em]" style={{ color: 'var(--ink-900)' }}>
                      {profile?.full_name || '—'}
                    </h1>

                    {profile?.location && (
                      <div className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink-500)' }}>
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{profile.location}</span>
                      </div>
                    )}

                    {profile && profile.rating > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex">{renderStars(profile.rating)}</div>
                        <span className="text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                          {profile.rating.toFixed(1)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
                          ({profile.total_reviews} відгуків)
                        </span>
                      </div>
                    )}

                    {profile?.bio && (
                      <p className="muted-text mt-3 max-w-xl text-sm leading-relaxed">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Права частина: контакти */}
                  <div className="flex flex-col gap-2.5 text-sm sm:min-w-[200px]">

                    {phoneHref && (
                      <a href={phoneHref} className="flex items-center gap-2 transition" style={{ color: 'var(--ink-700)' }}>
                        <Phone className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                        {profile!.phone}
                      </a>
                    )}

                    {websiteHref && (
                      <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition" style={{ color: 'var(--ink-700)' }}>
                        <Globe className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                        <span className="max-w-[150px] truncate">{websiteText}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}

                    {profile?.created_at && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink-500)' }}>
                        <Calendar className="h-4 w-4" />
                        <span>{t('profile.memberSince')} {formatMemberSince(profile.created_at)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2" style={{ color: 'var(--ink-500)' }}>
                      <MessageCircle className="h-4 w-4" />
                      <span>{activeListingsCount} {t('profile.activeAds')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Таби: Портфоліо / Відгуки ===== */}
            <div className="glass-card overflow-hidden">

              {/* Навігація табів */}
              <div className="flex border-b border-[var(--glass-border)]">

                <button
                  type="button"
                  onClick={() => setActiveTab('portfolio')}
                  className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
                  style={activeTab === 'portfolio'
                    ? { borderBottom: '2px solid var(--accent-700)', color: 'var(--accent-700)' }
                    : { color: 'var(--ink-500)' }}
                >
                  <ImageIcon className="h-4 w-4" />
                  {t('profile.portfolio')}
                  {portfolioImages.length > 0 && (
                    <span className="rounded-full border border-[var(--glass-border)] bg-[rgba(255,252,248,0.6)] px-2 py-0.5 text-xs">
                      {portfolioImages.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
                  style={activeTab === 'reviews'
                    ? { borderBottom: '2px solid var(--accent-700)', color: 'var(--accent-700)' }
                    : { color: 'var(--ink-500)' }}
                >
                  <Star className="h-4 w-4" />
                  {t('profile.reviews')}
                  {reviews.length > 0 && (
                    <span className="rounded-full border border-[var(--glass-border)] bg-[rgba(255,252,248,0.6)] px-2 py-0.5 text-xs">
                      {reviews.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Портфоліо */}
              {activeTab === 'portfolio' && (
                <div className="p-5">
                  {portfolioImages.filter(Boolean).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {portfolioImages.filter(Boolean).map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block aspect-square overflow-hidden rounded-[18px] bg-[rgba(255,248,241,0.4)]"
                        >
                          <img
                            src={url}
                            alt={'Portfolio ' + (index + 1)}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                            <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <ImageIcon className="mx-auto mb-3 h-12 w-12" style={{ color: 'var(--glass-border-strong)' }} />
                      <p className="muted-text text-sm">{t('profile.noPortfolio')}</p>
                      <button
                        type="button"
                        onClick={() => navigateTo('/settings')}
                        className="mt-3 text-sm font-semibold transition"
                        style={{ color: 'var(--accent-700)' }}
                      >
                        {t('settings.addPortfolioImage')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Відгуки */}
              {activeTab === 'reviews' && (
                <div className="p-5">
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-[20px] border border-[var(--glass-border)] bg-[rgba(255,252,248,0.5)] p-4"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <div className="text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                                {review.reviewer_name}
                              </div>
                              <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-500)' }}>
                                {new Date(review.created_at).toLocaleDateString('uk-UA')}
                              </div>
                            </div>
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                          {review.comment && (
                            <p className="muted-text text-sm leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Star className="mx-auto mb-3 h-12 w-12" style={{ color: 'var(--glass-border-strong)' }} />
                      <p className="muted-text text-sm">{t('profile.noReviews')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Посилання на всі оголошення */}
            <div className="pb-4 text-center">
              <button
                type="button"
                onClick={() => navigateTo('/my-listings')}
                className="inline-flex items-center gap-2 text-sm font-semibold transition"
                style={{ color: 'var(--accent-700)' }}
              >
                {t('profile.viewAllListings')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
    </div>
  )
}
