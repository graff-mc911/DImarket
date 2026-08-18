import {
  Briefcase,
  Building2,
  Clock,
  FolderOpen,
  FileText,
  Search,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  fetchSearchSuggestions,
  type SearchEntityType,
  type SearchSuggestion,
} from '../../lib/advancedSearch'
import { navigateTo } from '../../lib/navigation'
import { getPopularSearches, getRecentSearches, pushRecentSearch } from '../../lib/searchHistory'
import { VoiceSearchButton } from './VoiceSearchButton'

const TYPE_ICON: Record<SearchEntityType, typeof UserRound> = {
  professional: UserRound,
  category: FolderOpen,
  service: Wrench,
  project: Briefcase,
  material: Building2,
  document: FileText,
}

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
  compact?: boolean
  hideSubmit?: boolean
  popularFallback?: string[]
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus,
  compact = false,
  hideSubmit = false,
  popularFallback = [],
}: SearchAutocompleteProps) {
  const { t, language } = useApp()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recent, setRecent] = useState(() => getRecentSearches())
  const [popular, setPopular] = useState(() => getPopularSearches(popularFallback))

  useEffect(() => {
    setPopular(getPopularSearches(popularFallback))
  }, [popularFallback])

  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      void fetchSearchSuggestions(q, language.code).then((rows) => {
        if (cancelled) return
        setSuggestions(rows)
        setLoading(false)
        setActiveIndex(-1)
      })
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value, language.code])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showIdleHints = open && value.trim().length < 2
  const showSuggestions = open && value.trim().length >= 2

  const commit = (query: string) => {
    const q = query.trim()
    if (!q) return
    pushRecentSearch(q)
    setRecent(getRecentSearches())
    setPopular(getPopularSearches(popularFallback))
    setOpen(false)
    onSubmit(q)
  }

  const pickSuggestion = (s: SearchSuggestion) => {
    pushRecentSearch(s.label)
    setRecent(getRecentSearches())
    setOpen(false)
    onChange(s.label)
    navigateTo(s.path)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    const items = showSuggestions ? suggestions : []
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault()
        pickSuggestion(items[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`adv-search__ac ${compact ? 'adv-search__ac--compact' : ''}`}
    >
      <form
        className="adv-search__bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          commit(value)
        }}
      >
        <Search className="adv-search__bar-icon" aria-hidden />
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder || t('advancedSearch.placeholder')}
          aria-label={placeholder || t('advancedSearch.placeholder')}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {value ? (
          <button
            type="button"
            className="adv-search__clear"
            aria-label={t('advancedSearch.clear')}
            onClick={() => {
              onChange('')
              setOpen(true)
            }}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <VoiceSearchButton
          onResult={(text) => {
            onChange(text)
            commit(text)
          }}
        />
        {!hideSubmit ? (
          <button type="submit" className="adv-search__submit">
            {t('advancedSearch.search')}
          </button>
        ) : null}
      </form>

      {(showIdleHints || showSuggestions) && (
        <div id={listId} className="adv-search__dropdown" role="listbox">
          {showIdleHints && (
            <>
              {recent.length > 0 && (
                <div className="adv-search__group">
                  <p className="adv-search__group-title">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {t('advancedSearch.recent')}
                  </p>
                  {recent.map((item) => (
                    <button
                      key={`${item.query}-${item.at}`}
                      type="button"
                      className="adv-search__hint"
                      onClick={() => {
                        onChange(item.query)
                        commit(item.query)
                      }}
                    >
                      <Clock className="h-4 w-4 opacity-50" aria-hidden />
                      <span>{item.query}</span>
                    </button>
                  ))}
                </div>
              )}
              {popular.length > 0 && (
                <div className="adv-search__group">
                  <p className="adv-search__group-title">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {t('advancedSearch.popular')}
                  </p>
                  <div className="adv-search__chips">
                    {popular.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="adv-search__chip"
                        onClick={() => {
                          onChange(q)
                          commit(q)
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {showSuggestions && (
            <div className="adv-search__group">
              <p className="adv-search__group-title">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                {loading ? t('advancedSearch.loading') : t('advancedSearch.suggestions')}
              </p>
              {!loading && suggestions.length === 0 && (
                <p className="adv-search__empty">{t('advancedSearch.noSuggestions')}</p>
              )}
              {suggestions.map((s, idx) => {
                const Icon = TYPE_ICON[s.type]
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={idx === activeIndex}
                    className={`adv-search__hint ${idx === activeIndex ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => pickSuggestion(s)}
                  >
                    <Icon className="h-4 w-4 opacity-60" aria-hidden />
                    <span className="adv-search__hint-text">
                      <strong>{s.label}</strong>
                      {s.sublabel ? <em>{s.sublabel}</em> : null}
                    </span>
                    <span className="adv-search__type">
                      {s.type === 'professional'
                        ? t('advancedSearch.type.professional')
                        : s.type === 'category'
                          ? t('advancedSearch.type.category')
                          : s.type === 'service'
                            ? t('advancedSearch.type.service')
                            : s.type === 'project'
                              ? t('advancedSearch.type.project')
                              : t('advancedSearch.type.material')}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
