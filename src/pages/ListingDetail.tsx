// ============================================================
// ListingDetail.tsx — Сторінка деталей оголошення
//
// Показує:
// - Фото галерея з перемиканням
// - Назва, ціна, опис, локація, категорія
// - Контакти автора
// - Кнопка "Написати автору" (відкриває чат)
// - Кнопка збереження в обрані
// - Профіль автора (якщо є)
// - Кількість переглядів і термін дії
// ============================================================

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Eye,
  Globe,
  Heart,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
} from 'lucide-react'
import { supabase }    from '../lib/supabase'
import { useApp }      from '../contexts/AppContext'
import { navigateTo }  from '../lib/navigation'
import type { ListingWithImages, Profile } from '../lib/types'
import { ContractorMatches } from '../components/matching/ContractorMatches'
import { ListingInlineChat } from '../components/listing/ListingInlineChat'

interface ListingDetailProps {
  listingId: string
}

export function ListingDetail({ listingId }: ListingDetailProps) {
  const { user, currency, t } = useApp()

  const [listing, setListing]         = useState<ListingWithImages | null>(null)
  const [author, setAuthor]           = useState<Profile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Галерея фото
  const [activeImage, setActiveImage] = useState(0)

  // Збереження оголошення
  const [isSaved, setIsSaved]         = useState(false)
  const [savingItem, setSavingItem]   = useState(false)

  useEffect(() => {
    void loadListing()
    if (user) void checkIfSaved()
  }, [listingId, user])

  // Завантаження оголошення з фото та категорією
  const loadListing = async () => {
    setLoading(true)
    setError(null)
    let cancelled = false

    try {
      const { data, error: qError } = await supabase
        .from('listings')
        .select('*, images:listing_images(*), category:categories(*)')
        .eq('id', listingId)
        .maybeSingle()

      if (cancelled) return

      if (qError) { setError(qError.message); return }
      if (!data)  { setError('Оголошення не знайдено або знято з публікації.'); return }

      setListing(data as ListingWithImages)

      // Збільшуємо лічильник переглядів
      void supabase
        .from('listings')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', listingId)

      // Завантажуємо профіль автора якщо є author_id
      if (data.author_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.author_id)
          .maybeSingle()
        if (!cancelled && profileData) setAuthor(profileData)
      }
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
        .eq('item_type', 'listing')
        .eq('item_id', listingId)
        .maybeSingle()
      setIsSaved(!!data)
    } catch { /* ігноруємо */ }
  }

  // Зберегти / видалити зі збережених
  const toggleSave = async () => {
    if (!user) { navigateTo('/login'); return }
    setSavingItem(true)
    try {
      if (isSaved) {
        await supabase.from('saved_items').delete()
          .eq('user_id', user.id).eq('item_type', 'listing').eq('item_id', listingId)
        setIsSaved(false)
      } else {
        await supabase.from('saved_items').insert({
          user_id: user.id, item_type: 'listing', item_id: listingId,
        })
        setIsSaved(true)
      }
    } catch (e) {
      console.error('Помилка збереження:', e)
    } finally {
      setSavingItem(false)
    }
  }

  // Форматування ціни
  const formatPrice = (price: number | null) => {
    if (price === null) return t('listing.contactForPrice')
    return currency.symbol + price.toLocaleString()
  }

  // Тип оголошення
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service_request: t('listing.serviceNeeded'),
      service_offer:   t('listing.serviceOffered'),
      item_sale:       t('listing.forSale'),
      item_wanted:     t('listing.wanted'),
    }
    return labels[type] || type
  }

  // Колір бейджа типу
  const getTypeBg = (type: string) => {
    const colors: Record<string, string> = {
      service_request: 'rgba(37,99,235,0.85)',
      service_offer:   'rgba(22,163,74,0.85)',
      item_sale:       'rgba(234,88,12,0.85)',
      item_wanted:     'rgba(124,58,237,0.85)',
    }
    return colors[type] || 'rgba(71,85,105,0.85)'
  }

  // Видимість
  const getVisibilityLabel = (radius: string) => {
    const labels: Record<string, string> = {
      city:     t('visibility.city'),
      district: t('visibility.district'),
      region:   t('visibility.region'),
      country:  t('visibility.country'),
      state:    t('visibility.state'),
      land:     t('visibility.land'),
      global:   t('visibility.global'),
    }
    return labels[radius] || radius
  }

  // Форматування дати
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

  // Ініціали автора
  const authorInitials = author?.full_name
    ? author.full_name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('')
    : '?'

  // Телефони для href
  const contactPhone = listing?.contact_phone ? 'tel:' + listing.contact_phone : ''
  const contactEmail = listing?.contact_email ? 'mailto:' + listing.contact_email : ''

  // --- Завантаження ---
  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
          <p className="muted-text mt-4 text-sm">{t('listings.loading')}</p>
        </div>
      </div>
    )
  }

  // --- Помилка ---
  if (error || !listing) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => navigateTo('/listings')}
            className="btn-ghost mb-6 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            До каталогу оголошень
          </button>
          <div className="glass-panel p-8 text-center">
            <p className="muted-text">{error || 'Оголошення недоступне.'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Фото оголошення
  const images = listing.images?.length > 0
    ? listing.images.map(img => img.image_url)
    : ['https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=1200']

  // Скільки днів залишилось
  const daysLeft = Math.ceil(
    (new Date(listing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="py-8 pb-24 lg:pb-8">
          <div className="space-y-5">

            {/* Кнопка назад */}
            <button
              type="button"
              onClick={() => navigateTo('/listings')}
              className="btn-ghost rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('listing.backToListings')}
            </button>

            {/* Преміум бейдж */}
            {listing.is_premium && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                style={{ background: 'linear-gradient(90deg,#c96d2c,#e8964a)' }}>
                <Star className="h-3.5 w-3.5 fill-current" />
                {t('listing.premium')}
              </div>
            )}

            {/* Основний блок: фото + деталі */}
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

              {/* Ліва колонка: фото */}
              <div className="glass-card overflow-hidden">

                {/* Головне фото */}
                <div className="relative aspect-video overflow-hidden bg-[rgba(255,248,241,0.4)]">
                  <img
                    src={images[activeImage]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />

                  {/* Бейдж типу оголошення */}
                  <div
                    className="absolute left-3 top-3 rounded-lg px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
                    style={{ background: getTypeBg(listing.listing_type) }}
                  >
                    {getTypeLabel(listing.listing_type)}
                  </div>

                  {/* Кнопка збереження */}
                  {user && (
                    <button
                      type="button"
                      onClick={toggleSave}
                      disabled={savingItem}
                      title={isSaved ? 'Видалити зі збережених' : 'Зберегти'}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition hover:scale-110 active:scale-95"
                      style={{
                        background: isSaved ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {isSaved
                        ? <BookmarkCheck className="h-4 w-4 text-white" />
                        : <Bookmark className="h-4 w-4" style={{ color: 'var(--accent-700)' }} />}
                    </button>
                  )}
                </div>

                {/* Мініатюри фото (якщо більше одного) */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] transition"
                        style={{
                          border: i === activeImage
                            ? '2px solid var(--accent-700)'
                            : '2px solid transparent',
                          opacity: i === activeImage ? 1 : 0.6,
                        }}
                      >
                        <img src={img} alt={'Фото ' + (i + 1)} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Опис */}
                <div className="p-5">
                  <h1 className="mb-3 text-xl font-extrabold tracking-[-0.02em]"
                    style={{ color: 'var(--ink-900)' }}>
                    {listing.title}
                  </h1>

                  {/* Ціна */}
                  {listing.price !== null && (
                    <div className="mb-4 text-2xl font-extrabold" style={{ color: 'var(--accent-700)' }}>
                      {formatPrice(listing.price)}
                    </div>
                  )}

                  {/* Метадані */}
                  <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm" style={{ color: 'var(--ink-500)' }}>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{listing.location}</span>
                    </div>
                    {listing.visibility_radius && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4 shrink-0" />
                        <span>{getVisibilityLabel(listing.visibility_radius)}</span>
                      </div>
                    )}
                    {listing.category && (
                      <span
                        className="rounded-full px-3 py-0.5 text-xs font-semibold"
                        style={{ background: 'rgba(199,138,96,0.12)', color: 'var(--accent-700)' }}
                      >
                        {listing.category.name}
                      </span>
                    )}
                  </div>

                  {/* Повний опис */}
                  <p className="muted-text whitespace-pre-wrap leading-relaxed text-sm">
                    {listing.description}
                  </p>

                  {listing.listing_type === 'service_request' &&
                    user?.id === listing.author_id && (
                      <ContractorMatches listingId={listing.id} />
                    )}

                  {listing.author_id && (
                    <ListingInlineChat listingId={listing.id} authorId={listing.author_id} />
                  )}

                  {/* Термін і перегляди */}
                  <div
                    className="mt-5 flex items-center justify-between border-t pt-4 text-xs"
                    style={{ borderColor: 'var(--glass-border)', color: 'var(--ink-400)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span style={daysLeft <= 3 && daysLeft > 0 ? { color: '#b91c1c' } : {}}>
                        {daysLeft > 0 ? 'Ще ' + daysLeft + ' ' + t('listing.daysLeft') : 'Термін завершився'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{listing.views_count} {t('listing.views')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Права колонка: контакти + автор */}
              <div className="space-y-4">

                {/* Блок контактів */}
                <div className="glass-card p-5">
                  <h2 className="mb-4 text-base font-extrabold" style={{ color: 'var(--ink-900)' }}>
                    Контакти
                  </h2>

                  <div className="space-y-3">
                    {/* Ім'я контакту */}
                    <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--ink-700)' }}>
                      <User className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-500)' }} />
                      <span>{listing.contact_name}</span>
                    </div>

                    {/* Телефон */}
                    {contactPhone && (
                      <a
                        href={contactPhone}
                        className="flex items-center gap-2.5 text-sm font-semibold transition"
                        style={{ color: 'var(--accent-700)' }}
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {listing.contact_phone}
                      </a>
                    )}

                    {/* Email */}
                    {contactEmail && (
                      <a
                        href={contactEmail}
                        className="flex items-center gap-2.5 text-sm transition"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-500)' }} />
                        <span className="truncate">{listing.contact_email}</span>
                      </a>
                    )}
                  </div>

                  {/* Кнопка збереження */}
                  {user && (
                    <button
                      type="button"
                      onClick={toggleSave}
                      disabled={savingItem}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition"
                      style={isSaved
                        ? { background: 'rgba(239,68,68,0.10)', color: '#b91c1c' }
                        : { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--ink-700)' }}
                    >
                      <Heart
                        className="h-4 w-4"
                        style={{ fill: isSaved ? '#b91c1c' : 'none', color: isSaved ? '#b91c1c' : 'var(--ink-500)' }}
                      />
                      {isSaved ? 'В збережених' : 'Зберегти'}
                    </button>
                  )}

                </div>

                {/* Профіль автора */}
                {author && (
                  <div className="glass-card p-5">
                    <h2 className="mb-4 text-base font-extrabold" style={{ color: 'var(--ink-900)' }}>
                      Про автора
                    </h2>

                    <button
                      type="button"
                      onClick={() => navigateTo('/professional/' + author.id)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      {/* Аватар автора */}
                      {author.profile_photo || author.avatar_url ? (
                        <img
                          src={author.profile_photo || author.avatar_url || ''}
                          alt={author.full_name || ''}
                          className="h-12 w-12 shrink-0 rounded-[14px] object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold"
                          style={{ background: 'rgba(199,138,96,0.15)', color: 'var(--accent-700)' }}
                        >
                          {authorInitials}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-bold text-sm" style={{ color: 'var(--ink-900)' }}>
                          {author.full_name || 'Автор'}
                        </p>
                        {author.rating > 0 && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: '#c78a60' }}>
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span className="font-semibold">{author.rating.toFixed(1)}</span>
                            <span style={{ color: 'var(--ink-400)' }}>({author.total_reviews})</span>
                          </div>
                        )}
                        {author.location && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'var(--ink-400)' }}>
                            <MapPin className="h-3 w-3" />
                            <span>{author.location}</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Опис автора */}
                    {author.bio && (
                      <p className="muted-text mt-3 line-clamp-3 text-xs leading-relaxed">
                        {author.bio}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => navigateTo('/professional/' + author.id)}
                      className="btn-ghost mt-4 w-full justify-center rounded-full text-sm"
                    >
                      Переглянути профіль
                    </button>
                  </div>
                )}

                {/* Дата публікації */}
                <div className="glass-card p-4 text-center">
                  <p className="muted-text text-xs">
                    Опубліковано {formatDate(listing.created_at)}
                  </p>
                  <p className="muted-text mt-1 text-xs">
                    ID: <code className="rounded bg-[rgba(0,0,0,0.05)] px-1">{listing.id.slice(0, 8)}...</code>
                  </p>
                </div>

              </div>
            </div>
          </div>
    </div>
  )
}