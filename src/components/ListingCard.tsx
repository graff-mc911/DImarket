// ============================================================
// ListingCard.tsx — Картка оголошення у списках
//
// Функції:
// - Перехід на сторінку оголошення при кліку
// - Кнопка збереження в обрані (серце)
// - Преміум та promoted бейджи
// - Локалізація типу, видимості, ціни
// ============================================================

import { useState, useEffect } from 'react'
import { Calendar, Globe, Heart, MapPin, Star } from 'lucide-react'
import { supabase }          from '../lib/supabase'
import { useApp }            from '../contexts/AppContext'
import { navigateTo }        from '../lib/navigation'
import type { ListingWithImages } from '../lib/types'

interface ListingCardProps {
  listing: ListingWithImages
}

export function ListingCard({ listing }: ListingCardProps) {
  const { user, currency, t } = useApp()

  // Чи збережено це оголошення поточним користувачем
  const [isSaved, setIsSaved]         = useState(false)
  const [savingInProgress, setSaving] = useState(false)

  // Перевіряємо чи збережено при завантаженні
  useEffect(() => {
    if (user) {
      void checkIfSaved()
    }
  }, [user, listing.id])

  // Перевірка чи оголошення вже в збережених
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
      // Таблиця може не існувати ще — ігноруємо помилку
    }
  }

  // Додати або видалити зі збережених
  const toggleSave = async (e: React.MouseEvent) => {
    // Зупиняємо перехід на сторінку оголошення
    e.stopPropagation()

    if (!user) {
      navigateTo('/login')
      return
    }

    setSaving(true)
    try {
      if (isSaved) {
        // Видаляємо зі збережених
        await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'listing')
          .eq('item_id', listing.id)
        setIsSaved(false)
      } else {
        // Додаємо до збережених
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

  // Форматування ціни з символом валюти
  const formatPrice = (price: number | null) => {
    if (price === null) return t('listing.contactForPrice')
    return currency.symbol + price.toLocaleString()
  }

  // Локалізована мітка типу оголошення
  const getListingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service_request: t('listing.serviceNeeded'),
      service_offer:   t('listing.serviceOffered'),
      item_sale:       t('listing.forSale'),
      item_wanted:     t('listing.wanted'),
    }
    return labels[type] || type
  }

  // Колір бейджа типу оголошення
  const getListingTypeBg = (type: string) => {
    const colors: Record<string, string> = {
      service_request: 'rgba(37,99,235,0.85)',
      service_offer:   'rgba(22,163,74,0.85)',
      item_sale:       'rgba(234,88,12,0.85)',
      item_wanted:     'rgba(124,58,237,0.85)',
    }
    return colors[type] || 'rgba(71,85,105,0.85)'
  }

  // Локалізована мітка радіусу видимості
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

  // Скільки днів залишилось
  const daysRemaining = Math.ceil(
    (new Date(listing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const getDaysLabel = () => {
    if (daysRemaining <= 0) return 'Термін завершився'
    return daysRemaining + ' ' + t('listing.daysLeft')
  }

  // Перше фото або дефолтне зображення
  const primaryImage =
    listing.images?.[0]?.image_url ||
    'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=600'

  // Promoted — платне виділення у видачі
  const isPromoted = (listing as any).is_promoted === true

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigateTo('/listing/' + listing.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigateTo('/listing/' + listing.id)
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-[24px] border text-left transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'var(--glass-bg)',
        borderColor: listing.is_premium
          ? 'rgba(199,138,96,0.5)'
          : isPromoted
          ? 'rgba(99,102,241,0.4)'
          : 'var(--glass-border)',
        boxShadow: listing.is_premium
          ? '0 4px 20px rgba(199,138,96,0.15)'
          : '0 2px 12px rgba(15,23,42,0.06)',
      }}
    >
      {/* Преміум смужка зверху */}
      {listing.is_premium && (
        <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white" style={{ background: 'linear-gradient(90deg, #c96d2c, #e8964a)' }}>
          <Star className="h-3 w-3 fill-current" />
          {t('listing.premium')}
        </div>
      )}

      {/* Promoted смужка зверху */}
      {isPromoted && !listing.is_premium && (
        <div className="px-3 py-1.5 text-xs font-bold text-white" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}>
          ⬆ Рекомендоване
        </div>
      )}

      {/* Зображення */}
      <div className="relative h-48 overflow-hidden bg-[rgba(255,248,241,0.5)]">
        <img
          src={primaryImage}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Бейдж типу оголошення */}
        <div
          className="absolute left-2 top-2 rounded-lg px-2 py-1 text-xs font-bold text-white backdrop-blur-sm"
          style={{ background: getListingTypeBg(listing.listing_type) }}
        >
          {getListingTypeLabel(listing.listing_type)}
        </div>

        {/* Кнопка збереження — серце */}
        {user && (
          <button
            type="button"
            onClick={toggleSave}
            disabled={savingInProgress}
            title={isSaved ? 'Видалити зі збережених' : 'Зберегти'}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
            style={{
              background: isSaved ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.85)',
            }}
          >
            <Heart
              className="h-4 w-4"
              style={{
                color: isSaved ? '#fff' : '#ef4444',
                fill: isSaved ? '#fff' : 'none',
              }}
            />
          </button>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">

        {/* Назва */}
        <h3
          className="mb-2 line-clamp-2 text-base font-bold transition-colors duration-200"
          style={{ color: 'var(--ink-900)' }}
        >
          {listing.title}
        </h3>

        {/* Опис */}
        <p className="muted-text mb-3 line-clamp-2 text-sm">
          {listing.description}
        </p>

        {/* Локація і ціна */}
        <div className="mb-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1 text-sm" style={{ color: 'var(--ink-500)' }}>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {listing.location || t('listing.locationNotSpecified')}
              </span>
            </div>
            <div className="shrink-0 text-base font-bold" style={{ color: 'var(--accent-700)' }}>
              {formatPrice(listing.price)}
            </div>
          </div>

          {/* Радіус видимості */}
          {listing.visibility_radius && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--ink-500)' }}>
              <Globe className="h-3 w-3 shrink-0" />
              <span>{getVisibilityLabel(listing.visibility_radius)}</span>
            </div>
          )}
        </div>

        {/* Категорія */}
        {listing.category && (
          <div
            className="mb-2 inline-block rounded-lg px-2 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(199,138,96,0.12)', color: 'var(--accent-700)' }}
          >
            {listing.category.name}
          </div>
        )}

        {/* Нижній рядок: термін і перегляди */}
        <div
          className="flex items-center justify-between border-t pt-2.5 text-xs"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--ink-500)' }}
        >
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span style={daysRemaining <= 3 && daysRemaining > 0 ? { color: '#b91c1c' } : {}}>
              {getDaysLabel()}
            </span>
          </div>
          <span>{listing.views_count} {t('listing.views')}</span>
        </div>
      </div>
    </div>
  )
}