// ============================================================
// ProfessionalDetail.tsx — Публічна сторінка профілю майстра
//
// Показує:
// - Фото, ім'я, локацію, рейтинг, верифікацію
// - Опис, контакти, вебсайт
// - Портфоліо (фото робіт)
// - Відгуки клієнтів
// - Форму для написання відгуку
// - Кнопку "Написати повідомлення"
// - Кнопку збереження в обрані
// ============================================================

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { navigateTo }  from '../lib/navigation'
import { MobileAdBanner } from '../components/MobileAdBanner'
import type { Profile, Review } from '../lib/types'
import { ReviewFormV2 } from '../components/reviews/ReviewFormV2'

interface ProfessionalDetailProps {
  profileId: string
}

// Тип форми відгуку

type ActiveTab = 'about' | 'portfolio' | 'reviews'

export function ProfessionalDetail({ profileId }: ProfessionalDetailProps) {
  const { user } = useApp()

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [reviews, setReviews]           = useState<Review[]>([])
  const [portfolioImages, setPortfolio] = useState<string[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [activeTab, setActiveTab]       = useState<ActiveTab>('about')

  // Збереження профілю
  const [isSaved, setIsSaved]           = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Форма відгуку
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    void loadProfile()
    if (user) void checkIfSaved()
  }, [profileId, user])

  // Завантаження профілю та відгуків
  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    let cancelled = false

    try {
      const { data, error: qError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()

      if (cancelled) return

      if (qError) { setError(qError.message); return }
      if (!data)  { setError('Профіль не знайдено.'); return }

      setProfile(data)
      setPortfolio(data.portfolio_images || [])

      // Завантажуємо відгуки
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('professional_id', profileId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      if (!cancelled) setReviews(reviewsData || [])
    } catch (e) {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      if (!cancelled) setLoading(false)
    }

    return () => { cancelled = true }
  }

  // Перевірка чи збережено
  const checkIfSaved = async () => {
    try {
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user!.id)
        .eq('item_type', 'profile')
        .eq('item_id', profileId)
        .maybeSingle()
      setIsSaved(!!data)
    } catch { /* ігноруємо */ }
  }

  // Зберегти/видалити зі збережених
  const toggleSave = async () => {
    if (!user) { navigateTo('/login'); return }
    setSavingProfile(true)
    try {
      if (isSaved) {
        await supabase.from('saved_items').delete()
          .eq('user_id', user.id).eq('item_type', 'profile').eq('item_id', profileId)
        setIsSaved(false)
      } else {
        await supabase.from('saved_items').insert({
          user_id: user.id, item_type: 'profile', item_id: profileId,
        })
        setIsSaved(true)
      }
    } catch (e) {
      console.error('Помилка збереження:', e)
    } finally {
      setSavingProfile(false)
    }
  }


  // Початок розмови з майстром
  const startConversation = () => {
    if (!user) { navigateTo('/login'); return }
    sessionStorage.setItem('conversation_with', profileId)
    sessionStorage.removeItem('open_conversation')
    navigateTo('/messages')
  }

  // Рендер зірочок рейтингу
  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type={interactive ? 'button' : 'submit'}
          disabled={!interactive}
          onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          className={interactive ? 'cursor-pointer transition hover:scale-110' : 'cursor-default'}
        >
          <Star
            className="h-5 w-5"
            style={{
              color: i < rating ? '#ffa41c' : '#d5d9d9',
              fill:  i < rating ? '#ffa41c' : 'none',
            }}
          />
        </button>
      ))}
    </div>
  )

  // Форматування дати
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })

  // Ініціали для аватара
  const initials = profile?.full_name
    ? profile.full_name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('')
    : 'DI'

  // --- Завантаження ---
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

  // --- Помилка ---
  if (!profile) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => navigateTo('/professionals')}
            className="btn-ghost mb-6 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            До каталогу майстрів
          </button>
          <div className="glass-panel p-8 text-center">
            <p className="muted-text">{error || 'Профіль недоступний.'}</p>
          </div>
        </div>
      </div>
    )
  }

  const isPremium  = (profile as any).is_premium  === true
  const isFeatured = (profile as any).is_featured === true
  const isVerified = profile.is_verified === true
  const phoneHref  = profile.phone ? 'tel:' + profile.phone : ''

  return (
    <div className="py-6 pb-24 lg:pb-8">
      <button
        type="button"
        onClick={() => navigateTo('/professionals')}
        className="amazon-link mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        До каталогу майстрів
      </button>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        {/* Ліва колонка */}
        <div>
          <div className="amazon-pdp-image">
            {profile.profile_photo || profile.avatar_url ? (
              <div className="aspect-square bg-[#f7fafa] sm:aspect-[4/3]">
                <img
                  src={profile.profile_photo || profile.avatar_url || ''}
                  alt={profile.full_name || 'Майстер'}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-[#f7fafa] text-4xl font-bold text-[var(--accent-600)] sm:aspect-[4/3]">
                {initials}
              </div>
            )}
          </div>

          <div className="mt-4 lg:hidden">
            <h1 className="text-xl font-normal text-[var(--ink-900)]">{profile.full_name || 'Майстер'}</h1>
            {profile.location && (
              <p className="mt-1 text-sm text-[var(--ink-600)]">{profile.location}</p>
            )}
          </div>

          {/* Таби */}
          <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#e7e7e7]">
            {([
              { key: 'about', label: 'Про майстра' },
              { key: 'portfolio', label: 'Портфоліо (' + portfolioImages.filter(Boolean).length + ')' },
              { key: 'reviews', label: 'Відгуки (' + reviews.length + ')' },
            ] as { key: ActiveTab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'border-[#e77600] text-[var(--ink-900)]'
                    : 'border-transparent text-[var(--ink-600)] hover:text-[var(--ink-900)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'about' && (
            <div className="amazon-section-card mt-4">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">Про майстра</h2>
              {profile.bio ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-700)]">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-3 text-sm text-[var(--ink-500)]">Опис ще не додано.</p>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="amazon-section-card mt-4">
              <h2 className="text-lg font-bold text-[var(--ink-900)]">Портфоліо</h2>
              {portfolioImages.filter(Boolean).length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {portfolioImages.filter(Boolean).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block aspect-square overflow-hidden rounded-sm border border-[#d5d9d9] bg-[#f7fafa]"
                    >
                      <img
                        src={url}
                        alt={'Робота ' + (i + 1)}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <ImageIcon className="mx-auto mb-3 h-12 w-12 text-[var(--ink-400)]" />
                  <p className="text-sm text-[var(--ink-500)]">Портфоліо ще не додано</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="mt-4 space-y-4">
              <div className="amazon-section-card">
                <h2 className="text-lg font-bold text-[var(--ink-900)]">Відгуки клієнтів</h2>
                {reviews.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-sm border border-[#e7e7e7] p-3">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-sm text-[var(--ink-900)]">
                              {review.reviewer_name}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--ink-500)]">
                              {formatDate(review.created_at)}
                            </div>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                          <p className="text-sm leading-relaxed text-[var(--ink-700)]">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Star className="mx-auto mb-3 h-10 w-10 text-[var(--ink-400)]" />
                    <p className="text-sm text-[var(--ink-500)]">Відгуків ще немає</p>
                  </div>
                )}
              </div>

              {user && user.id !== profileId && !reviewSuccess && (
                <ReviewFormV2
                  professionalId={profileId}
                  onSuccess={() => {
                    setReviewSuccess(true)
                    void supabase
                      .from('reviews')
                      .select('*')
                      .eq('professional_id', profileId)
                      .order('created_at', { ascending: false })
                      .then(({ data }) => setReviews(data || []))
                  }}
                />
              )}

              {user && user.id !== profileId && reviewSuccess && (
                <div className="amazon-section-card p-4">
                  <p className="text-sm font-medium text-[#067d62]">Дякуємо! Ваш відгук збережено.</p>
                </div>
              )}

              {!user && (
                <div className="amazon-section-card p-6 text-center">
                  <p className="mb-4 text-sm text-[var(--ink-600)]">Увійдіть щоб залишити відгук</p>
                  <button type="button" onClick={() => navigateTo('/login')} className="btn-primary text-sm">
                    Увійти
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buy box */}
        <aside className="amazon-buy-box amazon-buy-box--sticky mt-4 lg:mt-0">
          {isPremium && (
            <div className="mb-3 flex items-center gap-1 rounded-sm bg-[#cc0c39] px-2 py-1 text-xs font-bold text-white">
              <Star className="h-3 w-3 fill-current" />
              Преміум майстер
            </div>
          )}
          {isFeatured && !isPremium && (
            <div className="mb-3 flex items-center gap-1 rounded-sm bg-[#ff9900] px-2 py-1 text-xs font-bold text-[#0f1111]">
              <Zap className="h-3 w-3 fill-current" />
              Рекомендований
            </div>
          )}

          <h1 className="hidden text-xl font-normal text-[var(--ink-900)] lg:block">
            {profile.full_name || 'Майстер'}
          </h1>

          <div className="mt-2 flex items-center gap-2">
            {renderStars(Math.round(profile.rating))}
            <span className="text-sm amazon-link">
              {profile.rating > 0 ? profile.rating.toFixed(1) : 'Новий'}
            </span>
            <span className="text-sm text-[var(--ink-500)]">({profile.total_reviews} відгуків)</span>
          </div>

          {isVerified && (
            <div className="mt-2 flex items-center gap-1 text-sm font-medium text-[#067d62]">
              <ShieldCheck className="h-4 w-4" />
              Верифікований
            </div>
          )}

          {profile.location && (
            <p className="mt-2 flex items-center gap-1 text-sm text-[var(--ink-600)]">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </p>
          )}

          <div className="amazon-pdp-divider" />

          {user && user.id !== profileId ? (
            <button type="button" onClick={startConversation} className="btn-primary w-full py-2.5 text-sm">
              <MessageCircle className="h-4 w-4" />
              Написати повідомлення
            </button>
          ) : !user ? (
            <button type="button" onClick={() => navigateTo('/login')} className="btn-primary w-full py-2.5 text-sm">
              Увійти щоб написати
            </button>
          ) : null}

          {user && user.id !== profileId && (
            <button
              type="button"
              onClick={toggleSave}
              disabled={savingProfile}
              className="btn-secondary mt-2 w-full py-2.5 text-sm"
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isSaved ? 'В збережених' : 'Зберегти майстра'}
            </button>
          )}

          <div className="amazon-pdp-divider" />

          <div className="space-y-2 text-sm">
            {phoneHref && (
              <a href={phoneHref} className="amazon-link flex items-center gap-2 font-medium">
                <Phone className="h-4 w-4" />
                {profile.phone}
              </a>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="amazon-link flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}
          </div>

          <div className="amazon-pdp-divider" />

          <div className="flex items-center gap-1.5 text-xs text-[var(--ink-500)]">
            <Calendar className="h-3.5 w-3.5" />
            <span>На платформі з {formatDate(profile.created_at)}</span>
          </div>
        </aside>
      </div>

      <MobileAdBanner variant="horizontal" page="default" outerClassName="mt-6" />
    </div>
  )
}
