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
import { getListingThemeImageUrl } from '../lib/listingThemeImage'
import type { ListingWithImages, Profile } from '../lib/types'
import { ContractorMatches } from '../components/matching/ContractorMatches'
import { ListingInlineChat } from '../components/listing/ListingInlineChat'
import { MobileAdBanner } from '../components/MobileAdBanner'
import { isFavorite, toggleFavorite } from '../lib/favorites'

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
  }, [listingId, user])

  useEffect(() => {
    if (user && listing) void checkIfSaved()
  }, [user?.id, listing?.id, listing?.listing_type])

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

  const favoriteType =
    listing?.listing_type === 'service_request' ? ('project' as const) : ('listing' as const)

  // Перевірка чи збережено
  const checkIfSaved = async () => {
    try {
      setIsSaved(await isFavorite(favoriteType, listingId))
    } catch { /* ігноруємо */ }
  }

  // Зберегти / видалити зі збережених
  const toggleSave = async () => {
    if (!user) { navigateTo('/login'); return }
    setSavingItem(true)
    try {
      const result = await toggleFavorite({
        itemType: favoriteType,
        itemId: listingId,
        title: listing?.title,
      })
      if (!result.error) setIsSaved(result.saved)
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

  // Фото оголошення або тематична заглушка за видом робіт
  const images = listing.images?.length > 0
    ? listing.images.map(img => img.image_url)
    : [getListingThemeImageUrl(listing, 1200)]

  // Скільки днів залишилось
  const daysLeft = Math.ceil(
    (new Date(listing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="py-6 pb-24 lg:pb-8">
      <button
        type="button"
        onClick={() => navigateTo('/listings')}
        className="amazon-link mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('listing.backToListings')}
      </button>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
        {/* Ліва колонка: фото + опис */}
        <div>
          <div className="amazon-pdp-image">
            <div className="relative aspect-square overflow-hidden bg-[#f7fafa] sm:aspect-[4/3]">
              <img
                src={images[activeImage]}
                alt={listing.title}
                className="h-full w-full object-contain"
              />
              <div
                className="absolute left-3 top-3 rounded-sm px-2 py-1 text-xs font-bold text-white"
                style={{ background: getTypeBg(listing.listing_type) }}
              >
                {getTypeLabel(listing.listing_type)}
              </div>
              {listing.is_premium && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-sm bg-[#cc0c39] px-2 py-1 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-current" />
                  {t('listing.premium')}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-[#e7e7e7] p-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-sm border-2 transition"
                    style={{
                      borderColor: i === activeImage ? '#e77600' : '#d5d9d9',
                      opacity: i === activeImage ? 1 : 0.7,
                    }}
                  >
                    <img src={img} alt={'Фото ' + (i + 1)} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 lg:hidden">
            <h1 className="text-xl font-normal leading-snug text-[var(--ink-900)]">{listing.title}</h1>
            <p className="mt-2 text-2xl font-normal text-[var(--ink-900)]">{formatPrice(listing.price)}</p>
          </div>

          <div className="amazon-section-card mt-4">
            <h2 className="text-lg font-bold text-[var(--ink-900)]">Про оголошення</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-700)]">
              {listing.description}
            </p>

            <div className="amazon-pdp-divider" />

            <div className="grid gap-2 text-sm text-[var(--ink-600)] sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{listing.location}</span>
              </div>
              {listing.visibility_radius && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0" />
                  <span>{getVisibilityLabel(listing.visibility_radius)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span style={daysLeft <= 3 && daysLeft > 0 ? { color: '#b91c1c' } : {}}>
                  {daysLeft > 0 ? 'Ще ' + daysLeft + ' ' + t('listing.daysLeft') : 'Термін завершився'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 shrink-0" />
                <span>{listing.views_count} {t('listing.views')}</span>
              </div>
            </div>

            {listing.listing_type === 'service_request' && user?.id === listing.author_id && (
              <div className="mt-4">
                <ContractorMatches listingId={listing.id} />
              </div>
            )}

            {listing.author_id && (
              <div className="mt-4">
                <ListingInlineChat listingId={listing.id} authorId={listing.author_id} />
              </div>
            )}
          </div>
        </div>

        {/* Права колонка: buy box */}
        <aside className="amazon-buy-box amazon-buy-box--sticky mt-4 lg:mt-0">
          <h1 className="hidden text-xl font-normal leading-snug text-[var(--ink-900)] lg:block">
            {listing.title}
          </h1>

          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="amazon-star h-4 w-4 fill-current" />
            ))}
            <Star className="amazon-star h-4 w-4 fill-current opacity-40" />
            <span className="ml-1 text-sm amazon-link">{listing.views_count} {t('listing.views')}</span>
          </div>

          <p className="mt-2 text-3xl font-normal text-[var(--ink-900)]">
            {formatPrice(listing.price)}
          </p>

          {listing.category && (
            <p className="mt-1 text-sm text-[var(--ink-600)]">{listing.category.name}</p>
          )}

          <div className="amazon-pdp-divider" />

          <div className="space-y-2">
            {user ? (
              <button
                type="button"
                onClick={toggleSave}
                disabled={savingItem}
                className="btn-primary w-full py-2.5 text-sm"
              >
                <Heart className="h-4 w-4" style={{ fill: isSaved ? 'currentColor' : 'none' }} />
                {isSaved ? 'В збережених' : 'Зберегти оголошення'}
              </button>
            ) : (
              <button type="button" onClick={() => navigateTo('/login')} className="btn-primary w-full py-2.5 text-sm">
                Увійти для контакту
              </button>
            )}
            <button type="button" onClick={() => navigateTo('/create-ad')} className="btn-secondary w-full py-2.5 text-sm">
              Створити схоже оголошення
            </button>
          </div>

          <div className="amazon-pdp-divider" />

          <div>
            <h3 className="text-sm font-bold text-[var(--ink-900)]">Контакти</h3>
            <div className="mt-2 space-y-2 text-sm text-[var(--ink-700)]">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--accent-600)]" />
                <span>{listing.contact_name}</span>
              </div>
              {contactPhone && (
                <a href={contactPhone} className="amazon-link flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4" />
                  {listing.contact_phone}
                </a>
              )}
              {contactEmail && (
                <a href={contactEmail} className="amazon-link flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{listing.contact_email}</span>
                </a>
              )}
            </div>
          </div>

          {author && (
            <>
              <div className="amazon-pdp-divider" />
              <div>
                <h3 className="text-sm font-bold text-[var(--ink-900)]">Про автора</h3>
                <button
                  type="button"
                  onClick={() => navigateTo('/professional/' + author.id)}
                  className="mt-2 flex w-full items-center gap-3 text-left"
                >
                  {author.profile_photo || author.avatar_url ? (
                    <img
                      src={author.profile_photo || author.avatar_url || ''}
                      alt={author.full_name || ''}
                      className="h-12 w-12 shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#f7fafa] text-sm font-bold text-[var(--accent-600)]">
                      {authorInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm text-[var(--ink-900)]">
                      {author.full_name || 'Автор'}
                    </p>
                    {author.rating > 0 && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs">
                        <Star className="amazon-star h-3 w-3 fill-current" />
                        <span>{author.rating.toFixed(1)}</span>
                        <span className="text-[var(--ink-500)]">({author.total_reviews})</span>
                      </div>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/professional/' + author.id)}
                  className="amazon-link mt-2 text-sm"
                >
                  Переглянути профіль →
                </button>
              </div>
            </>
          )}

          <div className="amazon-pdp-divider" />
          <p className="text-xs text-[var(--ink-500)]">
            Опубліковано {formatDate(listing.created_at)}
          </p>
        </aside>
      </div>

      <MobileAdBanner variant="horizontal" page="default" outerClassName="mt-6" />
    </div>
  )
}