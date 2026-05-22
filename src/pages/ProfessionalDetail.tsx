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
  Send,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { navigateTo }  from '../lib/navigation'
import type { Profile, Review } from '../lib/types'

interface ProfessionalDetailProps {
  profileId: string
}

// Тип форми відгуку
interface ReviewForm {
  rating: number
  comment: string
}

type ActiveTab = 'about' | 'portfolio' | 'reviews'

export function ProfessionalDetail({ profileId }: ProfessionalDetailProps) {
  const { user, profile: myProfile, t } = useApp()

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
  const [reviewForm, setReviewForm]     = useState<ReviewForm>({ rating: 5, comment: '' })
  const [submittingReview, setSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError]   = useState('')

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

  // Відправка відгуку
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { navigateTo('/login'); return }
    if (!reviewForm.comment.trim()) {
      setReviewError('Напишіть коментар')
      return
    }

    setSubmitting(true)
    setReviewError('')

    try {
      const { error } = await supabase.from('reviews').insert({
        professional_id: profileId,
        reviewer_id:     user.id,
        reviewer_name:   myProfile?.full_name || 'Користувач',
        reviewer_email:  user.email,
        reviewer_role:   myProfile?.is_professional ? 'professional' : 'client',
        rating:          reviewForm.rating,
        comment:         reviewForm.comment.trim(),
        is_approved:     true,
        is_hidden:       false,
      })

      if (error) throw error

      // Додаємо відгук локально
      setReviews(prev => [{
        id:              Date.now().toString(),
        professional_id: profileId,
        reviewer_id:     user.id,
        reviewer_name:   myProfile?.full_name || 'Користувач',
        reviewer_email:  user.email || null,
        reviewer_role:   myProfile?.is_professional ? 'professional' : 'client',
        rating:          reviewForm.rating,
        comment:         reviewForm.comment.trim(),
        listing_id:      null,
        is_approved:     true,
        is_hidden:       false,
        created_at:      new Date().toISOString(),
      } as any, ...prev])

      setReviewForm({ rating: 5, comment: '' })
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 4000)
    } catch (e) {
      console.error('Помилка відгуку:', e)
      setReviewError('Помилка збереження відгуку. Спробуйте ще раз.')
    } finally {
      setSubmitting(false)
    }
  }

  // Початок розмови з майстром
  const startConversation = () => {
    if (!user) { navigateTo('/login'); return }
    // Генеруємо conversation_id на основі обох учасників
    const convId = [user.id, profileId].sort().join('-')
    navigateTo('/messages')
    // Зберігаємо conversation_id щоб Messages відкрив потрібну розмову
    sessionStorage.setItem('open_conversation', convId)
    sessionStorage.setItem('conversation_with', profileId)
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
              color: i < rating ? '#c78a60' : 'var(--glass-border-strong)',
              fill:  i < rating ? '#c78a60' : 'none',
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
    <div className="py-8 pb-24 lg:pb-8">
          <div className="space-y-5">

            {/* Кнопка назад */}
            <button
              type="button"
              onClick={() => navigateTo('/professionals')}
              className="btn-ghost rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              До каталогу майстрів
            </button>

            {/* ===== Шапка профілю ===== */}
            <div className="glass-panel overflow-hidden">

              {/* Преміум або featured смужка */}
              {isPremium && (
                <div className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(90deg,#c96d2c,#e8964a)' }}>
                  <Star className="h-3 w-3 fill-current" />
                  Преміум майстер
                </div>
              )}
              {isFeatured && !isPremium && (
                <div className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}>
                  <Zap className="h-3 w-3 fill-current" />
                  Рекомендований майстер
                </div>
              )}

              {/* Обкладинка */}
              <div className="relative h-32 rounded-t-[26px]"
                style={{ background: 'linear-gradient(135deg,#8d5636,#a96942,#c78a60)' }}>

                {/* Кнопки у правому куті обкладинки */}
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  {/* Збереження */}
                  {user && user.id !== profileId && (
                    <button
                      type="button"
                      onClick={toggleSave}
                      disabled={savingProfile}
                      title={isSaved ? 'Видалити зі збережених' : 'Зберегти майстра'}
                      className="flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition hover:scale-110"
                      style={{
                        background: isSaved ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                        color:      isSaved ? 'var(--accent-700)' : '#fff',
                        border:     '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      {isSaved
                        ? <BookmarkCheck className="h-4 w-4" />
                        : <Bookmark className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6">
                {/* Аватар */}
                <div className="-mt-14 mb-4">
                  {profile.profile_photo || profile.avatar_url ? (
                    <img
                      src={profile.profile_photo || profile.avatar_url || ''}
                      alt={profile.full_name || 'Майстер'}
                      className="h-24 w-24 rounded-[22px] border-4 border-white object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[22px] border-4 border-white text-xl font-bold shadow-lg"
                      style={{ background: 'rgba(255,248,241,0.9)', color: 'var(--accent-700)' }}>
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                  {/* Ліва частина: ім'я, рейтинг, опис */}
                  <div className="flex-1">
                    {/* Ім'я і верифікація */}
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold tracking-[-0.03em]"
                        style={{ color: 'var(--ink-900)' }}>
                        {profile.full_name || 'Майстер'}
                      </h1>
                      {isVerified && (
                        <span
                          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}
                          title="Верифікований майстер"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Верифікований
                        </span>
                      )}
                    </div>

                    {/* Локація */}
                    {profile.location && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink-500)' }}>
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{profile.location}</span>
                      </div>
                    )}

                    {/* Рейтинг */}
                    <div className="mt-3 flex items-center gap-2">
                      {renderStars(Math.round(profile.rating))}
                      <span className="font-bold text-sm" style={{ color: 'var(--ink-900)' }}>
                        {profile.rating > 0 ? profile.rating.toFixed(1) : 'Новий'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
                        ({profile.total_reviews} відгуків)
                      </span>
                    </div>

                    {/* Дата реєстрації */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-400)' }}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>На платформі з {formatDate(profile.created_at)}</span>
                    </div>
                  </div>

                  {/* Права частина: контакти і кнопки */}
                  <div className="flex flex-col gap-3 sm:min-w-[200px]">
                    {/* Телефон */}
                    {phoneHref && (
                      <a
                        href={phoneHref}
                        className="flex items-center gap-2 text-sm transition"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        <Phone className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                        {profile.phone}
                      </a>
                    )}

                    {/* Вебсайт */}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm transition"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        <Globe className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                        <span className="truncate max-w-[150px]">
                          {profile.website.replace(/^https?:\/\//, '')}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}

                    {/* Кнопка написати повідомлення */}
                    {user && user.id !== profileId && (
                      <button
                        type="button"
                        onClick={startConversation}
                        className="btn-primary mt-2 rounded-full"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Написати
                      </button>
                    )}

                    {/* Якщо не авторизований */}
                    {!user && (
                      <button
                        type="button"
                        onClick={() => navigateTo('/login')}
                        className="btn-secondary mt-2 rounded-full"
                      >
                        Увійти щоб написати
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Таби ===== */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                { key: 'about',     label: 'Про майстра' },
                { key: 'portfolio', label: 'Портфоліо (' + portfolioImages.filter(Boolean).length + ')' },
                { key: 'reviews',   label: 'Відгуки (' + reviews.length + ')' },
              ] as { key: ActiveTab; label: string }[]).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                  style={activeTab === tab.key
                    ? { background: 'var(--accent-700)', color: '#fff' }
                    : { background: 'var(--glass-bg)', color: 'var(--ink-700)', border: '1px solid var(--glass-border)' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===== Таб: Про майстра ===== */}
            {activeTab === 'about' && (
              <div className="glass-card p-6">
                <h2 className="mb-4 text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  Про майстра
                </h2>
                {profile.bio ? (
                  <p className="muted-text whitespace-pre-wrap leading-relaxed text-sm">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="muted-text text-sm">Опис ще не додано.</p>
                )}
              </div>
            )}

            {/* ===== Таб: Портфоліо ===== */}
            {activeTab === 'portfolio' && (
              <div className="glass-card p-6">
                <h2 className="mb-4 text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  Портфоліо
                </h2>
                {portfolioImages.filter(Boolean).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {portfolioImages.filter(Boolean).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block aspect-square overflow-hidden rounded-[18px]"
                        style={{ background: 'rgba(255,248,241,0.4)' }}
                      >
                        <img
                          src={url}
                          alt={'Робота ' + (i + 1)}
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
                  <div className="py-10 text-center">
                    <ImageIcon className="mx-auto mb-3 h-12 w-12" style={{ color: 'var(--glass-border-strong)' }} />
                    <p className="muted-text text-sm">Портфоліо ще не додано</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== Таб: Відгуки ===== */}
            {activeTab === 'reviews' && (
              <div className="space-y-5">

                {/* Список відгуків */}
                <div className="glass-card p-6">
                  <h2 className="mb-4 text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                    Відгуки клієнтів
                  </h2>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-[20px] border p-4"
                          style={{ borderColor: 'var(--glass-border)', background: 'rgba(255,252,248,0.5)' }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="font-bold text-sm" style={{ color: 'var(--ink-900)' }}>
                                {review.reviewer_name}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                                {formatDate(review.created_at)}
                              </div>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          {review.comment && (
                            <p className="muted-text text-sm leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Star className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--glass-border-strong)' }} />
                      <p className="muted-text text-sm">Відгуків ще немає</p>
                    </div>
                  )}
                </div>

                {/* Форма для відгуку (тільки для авторизованих) */}
                {user && user.id !== profileId && (
                  <div className="glass-card p-6">
                    <h2 className="mb-4 text-lg font-extrabold" style={{ color: 'var(--ink-900)' }}>
                      Залишити відгук
                    </h2>

                    {reviewSuccess && (
                      <div className="mb-4 rounded-[16px] p-3 text-sm font-semibold"
                        style={{ background: 'rgba(34,197,94,0.12)', color: '#15803d' }}>
                        Дякуємо! Ваш відгук збережено.
                      </div>
                    )}

                    {reviewError && (
                      <div className="mb-4 rounded-[16px] p-3 text-sm font-semibold"
                        style={{ background: 'rgba(239,68,68,0.10)', color: '#b91c1c' }}>
                        {reviewError}
                      </div>
                    )}

                    <form onSubmit={submitReview} className="space-y-4">
                      {/* Оцінка зірками */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-700)' }}>
                          Ваша оцінка
                        </label>
                        {renderStars(reviewForm.rating, true, (r) =>
                          setReviewForm(prev => ({ ...prev, rating: r }))
                        )}
                      </div>

                      {/* Коментар */}
                      <div>
                        <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-700)' }}>
                          Коментар
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          rows={4}
                          placeholder="Розкажіть про ваш досвід роботи з цим майстром..."
                          className="input-glass w-full resize-none"
                          maxLength={1000}
                        />
                        <p className="mt-1 text-right text-xs" style={{ color: 'var(--ink-400)' }}>
                          {reviewForm.comment.length}/1000
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="btn-primary rounded-full disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        {submittingReview ? 'Збереження...' : 'Надіслати відгук'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Якщо не авторизований */}
                {!user && (
                  <div className="glass-card p-6 text-center">
                    <p className="muted-text text-sm mb-4">
                      Увійдіть щоб залишити відгук
                    </p>
                    <button
                      type="button"
                      onClick={() => navigateTo('/login')}
                      className="btn-primary rounded-full"
                    >
                      Увійти
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
    </div>
  )
}