import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { navigateTo } from '../../lib/navigation'
import { useApp } from '../../contexts/AppContext'
import {
  isFavorite,
  isSearchFavorite,
  saveSearchFavorite,
  searchKeyFrom,
  toggleFavorite,
} from '../../lib/favorites/favoritesService'
import type { FavoriteMeta, FavoriteType, SavedSearchMeta } from '../../lib/favorites/types'

type Props = {
  itemType: FavoriteType
  itemId?: string
  title?: string | null
  meta?: FavoriteMeta
  search?: SavedSearchMeta
  className?: string
  size?: 'sm' | 'md'
  label?: boolean
}

export function FavoriteButton({
  itemType,
  itemId,
  title,
  meta,
  search,
  className = '',
  size = 'md',
  label = false,
}: Props) {
  const { user } = useApp()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!user) {
        setSaved(false)
        return
      }
      if (itemType === 'search' && search) {
        const key = search.search_key || searchKeyFrom(search)
        const v = await isSearchFavorite(key)
        if (!cancelled) setSaved(v)
        return
      }
      if (!itemId) return
      const v = await isFavorite(itemType, itemId)
      if (!cancelled) setSaved(v)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, itemType, itemId, search?.search_key, search?.query, search?.path])

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigateTo('/login')
      return
    }
    setBusy(true)
    try {
      if (itemType === 'search' && search) {
        const result = await saveSearchFavorite(
          {
            ...search,
            search_key: search.search_key || searchKeyFrom(search),
          },
          title || undefined,
        )
        if (!result.error) setSaved(result.saved)
      } else if (itemId) {
        const result = await toggleFavorite({
          itemType,
          itemId,
          title,
          meta,
        })
        if (!result.error) setSaved(result.saved)
      }
    } finally {
      setBusy(false)
    }
  }

  const pad = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      type="button"
      onClick={(e) => void onClick(e)}
      disabled={busy}
      title={saved ? 'Remove from favorites' : 'Save to favorites'}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border transition disabled:opacity-60 ${
        saved
          ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
          : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
      } ${label ? 'px-3 py-1.5 text-[12px] font-semibold' : pad} ${className}`}
    >
      {busy ? (
        <Loader2 className={`${icon} animate-spin`} />
      ) : saved ? (
        <BookmarkCheck className={icon} />
      ) : (
        <Bookmark className={icon} />
      )}
      {label ? (saved ? 'Saved' : 'Save') : null}
    </button>
  )
}
