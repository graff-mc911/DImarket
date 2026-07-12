// ============================================================
// ListingCard.tsx — Картка оголошення (горизонтальний ряд, як svoii.biz)
// ============================================================

import { useState, useEffect } from 'react'
import { Eye, Heart, MapPin, Star } from 'lucide-react'
import { supabase }          from '../lib/supabase'
import { useApp }            from '../contexts/AppContext'
import { navigateTo }        from '../lib/navigation'
import { isLaunchExampleListing } from '../lib/launchSeedRequests'
import { listingCityLabel }  from '../lib/listingLocation'
import type { ListingWithImages } from '../lib/types'

interface ListingCardProps {
  listing: ListingWithImages
  /** Останній елемент у списку — без нижньої межі */
  isLast?: boolean
}

export function ListingCard({ listing, isLast = false }: ListingCardProps) {
  const { user, currency, t } = useApp()

  const [isSaved, setIsSaved]         = useState(false)
  const [savingInProgress, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      void checkIfSaved()
    }
  }, [user, listing.id])

  const checkIfSaved = async () => {
    try {
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user!.id)
        .eq('item_type', 'listing')
        .eq('item_id', listing.id)
        .maybeSingle()

      setIsSaved(!!data)
    } catch {
      // ignore
    }
  }

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!user) {
      navigateTo('/login')
      return
    }

    setSaving(true)
    try {
      if (isSaved) {
        await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'listing')
          .eq('item_id', listing.id)
        setIsSaved(false)
      } else {
        await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            item_type: 'listing',
            item_id: listing.id,
          })
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Помилка збереження:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return t('listing.contactForPrice')
    return currency.symbol + price.toLocaleString()
  }

  const getListingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service_request: t('listing.serviceNeeded'),
      service_offer:   t('listing.serviceOffered'),
      item_sale:       t('listing.forSale'),
      item_wanted:     t('listing.wanted'),
    }
    return labels[type] || type
  }

  const primaryImage =
    listing.images?.[0]?.image_url ||
    'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=400'

  const isPromoted = (listing as { is_promoted?: boolean }).is_promoted === true
  const categoryLabel =
    listing.category?.name || getListingTypeLabel(listing.listing_type)
  const city =
    listingCityLabel(listing.location) || t('listing.locationNotSpecified')

  const isExample = isLaunchExampleListing(listing)

  const goToListing = () => {
    if (isExample) {
      navigateTo('/assistant/job')
      return
    }
    navigateTo('/listing/' + listing.id)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToListing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToListing()
        }
      }}
      className={[
        'listing-card-row group flex w-full min-w-0 cursor-pointer gap-3 px-3 py-3.5 text-left transition-colors sm:gap-4 sm:px-4 sm:py-4',
        'hover:bg-[rgba(255,252,248,0.72)] active:bg-[rgba(255,248,241,0.9)]',
        isLast ? '' : 'border-b border-[var(--glass-border)]',
      ].join(' ')}
    >
      {/* Фото */}
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[18px] bg-[rgba(255,248,241,0.6)] sm:h-[96px] sm:w-[96px] sm:rounded-[20px]">
        <img
          src={primaryImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />

        {listing.is_premium && (
          <span
            className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(90deg, #c96d2c, #e8964a)' }}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            {t('listing.premium')}
          </span>
        )}

        {isPromoted && !listing.is_premium && (
          <span
            className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          >
            ↑
          </span>
        )}
      </div>

      {/* Текст */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">
            {categoryLabel}
          </p>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={toggleSave}
              disabled={savingInProgress}
              title={isSaved ? 'Видалити зі збережених' : 'Зберегти'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-500)] transition hover:bg-[rgba(36,27,20,0.06)] active:scale-95 disabled:opacity-50"
              style={isSaved ? { color: '#ef4444' } : undefined}
            >
              <Heart
                className="h-[18px] w-[18px]"
                style={{
                  fill: isSaved ? 'currentColor' : 'none',
                  color: isSaved ? '#ef4444' : 'var(--ink-500)',
                }}
              />
            </button>
          </div>
        </div>

        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.02em] text-[var(--ink-900)] sm:text-base">
          {listing.title}
        </h3>

        {isExample && (
          <span className="mt-1 inline-flex w-fit rounded-full bg-[rgba(99,102,241,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4338ca]">
            {t('launch.exampleBadge')}
          </span>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-[var(--ink-700)]">
          <span className="font-semibold text-[var(--accent-700)]">
            {formatPrice(listing.price)}
          </span>

          <span className="inline-flex items-center gap-1 text-[var(--ink-500)]">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>{listing.views_count}</span>
          </span>

          <span className="inline-flex min-w-0 items-center gap-1 text-[var(--ink-500)]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent-600)]" />
            <span className="truncate">{city}</span>
          </span>
        </div>
      </div>
    </article>
  )
}
