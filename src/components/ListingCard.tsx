// ============================================================
// ListingCard.tsx — Картка оголошення (Amazon product card)
// ============================================================

import { useState, useEffect } from 'react'
import { Eye, Heart, MapPin, Star } from 'lucide-react'
import { useApp }            from '../contexts/AppContext'
import { navigateTo }        from '../lib/navigation'
import { isLaunchExampleListing } from '../lib/launchSeedRequests'
import { listingCityLabel }  from '../lib/listingLocation'
import { getListingDisplayImage } from '../lib/listingThemeImage'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import type { ListingWithImages } from '../lib/types'

interface ListingCardProps {
  listing: ListingWithImages
  /** @deprecated grid cards no longer use row borders */
  isLast?: boolean
  /** Вертикальна картка (Amazon) або горизонтальний ряд */
  variant?: 'grid' | 'row'
}

export function ListingCard({ listing, isLast = false, variant = 'grid' }: ListingCardProps) {
  const { user, currency, t } = useApp()

  const [isSaved, setIsSaved]         = useState(false)
  const [savingInProgress, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      void checkIfSaved()
    }
  }, [user, listing.id])

  const favoriteType =
    listing.listing_type === 'service_request' ? ('project' as const) : ('listing' as const)

  const checkIfSaved = async () => {
    try {
      setIsSaved(await isFavorite(favoriteType, listing.id))
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
      const result = await toggleFavorite({
        itemType: favoriteType,
        itemId: listing.id,
        title: listing.title,
      })
      if (!result.error) setIsSaved(result.saved)
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

  const primaryImage = getListingDisplayImage(listing, 400)

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

  if (variant === 'row') {
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
          'hover:bg-white active:bg-white',
          isLast ? '' : 'border-b border-[var(--glass-border)]',
        ].join(' ')}
      >
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-md bg-[#f7fafa] sm:h-[96px] sm:w-[96px]">
          <img
            src={primaryImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--ink-900)] sm:text-base">
            {listing.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
            <span className="font-bold text-[var(--ink-900)]">{formatPrice(listing.price)}</span>
            <span className="text-[var(--ink-500)]">{city}</span>
          </div>
        </div>
      </article>
    )
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
      className="product-card group cursor-pointer text-left"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-[#f7fafa]">
        <img
          src={primaryImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />

        {listing.is_premium && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-sm bg-[#cc0c39] px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Star className="h-2.5 w-2.5 fill-current" />
            {t('listing.premium')}
          </span>
        )}

        {isPromoted && !listing.is_premium && (
          <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#ff9900] px-1.5 py-0.5 text-[9px] font-bold text-[#0f1111]">
            ↑
          </span>
        )}

        <button
          type="button"
          onClick={toggleSave}
          disabled={savingInProgress}
          title={isSaved ? 'Видалити зі збережених' : 'Зберегти'}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--ink-500)] shadow-sm transition hover:bg-white disabled:opacity-50"
          style={isSaved ? { color: '#ef4444' } : undefined}
        >
          <Heart
            className="h-4 w-4"
            style={{
              fill: isSaved ? 'currentColor' : 'none',
              color: isSaved ? '#ef4444' : 'var(--ink-500)',
            }}
          />
        </button>
      </div>

      <p className="mt-2 line-clamp-1 text-[11px] text-[var(--ink-500)]">{categoryLabel}</p>

      <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-normal leading-snug text-[var(--ink-900)]">
        {listing.title}
      </h3>

      {isExample && (
        <span className="mt-1 inline-flex w-fit rounded-sm bg-[rgba(0,113,133,0.1)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#007185]">
          {t('launch.exampleBadge')}
        </span>
      )}

      <div className="mt-1 flex items-center gap-0.5 text-[#ffa41c]">
        {[1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
        <Star className="h-3 w-3 fill-current opacity-40" />
        <span className="ml-1 text-xs text-[var(--accent-600)]">{listing.views_count || 0}</span>
      </div>

      <p className="mt-1 text-lg font-bold leading-none text-[var(--ink-900)]">
        {formatPrice(listing.price)}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--ink-500)]">
        <span className="inline-flex items-center gap-0.5">
          <Eye className="h-3 w-3 shrink-0" />
          {listing.views_count}
        </span>
        <span className="inline-flex min-w-0 items-center gap-0.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{city}</span>
        </span>
      </div>
    </article>
  )
}
