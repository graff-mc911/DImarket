import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { LANGUAGES } from '../lib/types'
import {
  languageDisplayCode,
  languageOptionLabel,
  type AppLanguage,
} from '../lib/languageDisplay'
import { LanguageFlag } from './LanguageFlag'

type LanguageSelectorProps = {
  /** Controlled open state (header coordinates with other menus). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Visual variant — header keeps amazon chrome; menu is denser on mobile. */
  variant?: 'header' | 'menu' | 'footer'
  className?: string
  /** Restrict options (e.g. footer primary langs). Default: all LANGUAGES. */
  languages?: readonly AppLanguage[]
  id?: string
}

export function LanguageSelector({
  open: openProp,
  onOpenChange,
  variant = 'header',
  className = '',
  languages = LANGUAGES,
  id,
}: LanguageSelectorProps) {
  const { language, setLanguage, t } = useApp()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      languages.findIndex((l) => l.code === language.code),
    ),
  )
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const reactId = useId()
  const listboxId = id ?? `lang-listbox-${reactId}`
  const labelId = `${listboxId}-label`

  const open = openProp ?? uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  useEffect(() => {
    const idx = languages.findIndex((l) => l.code === language.code)
    if (idx >= 0) setActiveIndex(idx)
  }, [language.code, languages])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.focus()
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-lang-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const selectLang = (lang: AppLanguage) => {
    setLanguage(lang)
    setOpen(false)
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex(
        Math.max(
          0,
          languages.findIndex((l) => l.code === language.code),
        ),
      )
    }
  }

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % languages.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + languages.length) % languages.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(languages.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const lang = languages[activeIndex]
      if (lang) selectLang(lang)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const currentCode = languageDisplayCode(language.code)
  const isFooter = variant === 'footer'
  const isMenu = variant === 'menu'

  const triggerClass = isFooter
    ? 'lang-selector__trigger lang-selector__trigger--footer'
    : isMenu
      ? 'lang-selector__trigger lang-selector__trigger--menu'
      : 'amazon-header-lang lang-selector__trigger'

  const panelClass = isMenu
    ? 'lang-selector__panel lang-selector__panel--menu'
    : isFooter
      ? 'lang-selector__panel lang-selector__panel--footer'
      : 'lang-selector__panel'

  return (
    <div ref={rootRef} className={`lang-selector lang-selector--${variant} ${className}`.trim()}>
      <span id={labelId} className="sr-only">
        {t('header.language')}
      </span>
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={labelId}
        aria-label={`${t('header.language')}: ${language.name} (${currentCode})`}
        onClick={() => setOpen(!open)}
        onKeyDown={onTriggerKeyDown}
      >
        <LanguageFlag languageCode={language.code} size={isMenu ? 22 : 24} />
        <span className="lang-selector__code">{currentCode}</span>
        {isMenu || isFooter ? (
          <span className="lang-selector__name">{language.name}</span>
        ) : null}
        <ChevronDown
          className={`lang-selector__chevron ${open ? 'is-open' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${listboxId}-opt-${activeIndex}`}
          className={panelClass}
          onKeyDown={onListKeyDown}
        >
          {languages.map((lang, index) => {
            const selected = language.code === lang.code
            const active = index === activeIndex
            return (
              <button
                key={lang.code}
                id={`${listboxId}-opt-${index}`}
                type="button"
                role="option"
                data-lang-index={index}
                aria-selected={selected}
                className={`lang-selector__option ${selected ? 'is-selected' : ''} ${
                  active ? 'is-active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectLang(lang)}
              >
                <LanguageFlag languageCode={lang.code} size={24} />
                <span className="lang-selector__option-text">
                  <span className="lang-selector__option-name">{lang.name}</span>
                  <span className="lang-selector__option-code" aria-hidden="true">
                    — {languageDisplayCode(lang.code)}
                  </span>
                </span>
                <span className="sr-only">{languageOptionLabel(lang)}</span>
                {selected ? <Check className="lang-selector__check" aria-hidden /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
