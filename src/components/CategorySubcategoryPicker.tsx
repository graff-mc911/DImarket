import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  categoriesWithSubcategories,
  categoryLabel,
  emptyPickerValue,
  getSubcategoryGroups,
  labelFor,
  subcategoryLabel,
  type CategoryPickerMode,
  type CategoryPickerValue,
  type SubcategoryDef,
} from '../lib/categoryCatalog'

type CategorySubcategoryPickerProps = {
  value: CategoryPickerValue
  onChange: (value: CategoryPickerValue) => void
  /** Одна підкатегорія або кілька */
  allowMultiple?: boolean
  /** Фіксована головна категорія (наприклад construction на сторінці Будівництво) */
  fixedCategorySlug?: string
  required?: boolean
  className?: string
}

export function CategorySubcategoryPicker({
  value,
  onChange,
  allowMultiple = true,
  fixedCategorySlug,
  required = false,
  className = '',
}: CategorySubcategoryPickerProps) {
  const { language, t } = useApp()
  const locale = language.code

  const catalog = useMemo(() => categoriesWithSubcategories(), [])
  const categorySlug = fixedCategorySlug || value.categorySlug
  const groups = categorySlug ? getSubcategoryGroups(categorySlug) : []
  const subs = groups.flatMap((g) => g.subcategories)

  const [mode, setMode] = useState<CategoryPickerMode>(
    value.subcategorySlugs.length > 1 ? 'multiple' : 'single',
  )

  useEffect(() => {
    if (!allowMultiple && value.subcategorySlugs.length > 1) {
      onChange({ categorySlug, subcategorySlugs: value.subcategorySlugs.slice(0, 1) })
    }
  }, [allowMultiple, categorySlug, onChange, value.subcategorySlugs])

  const setCategory = (slug: string) => {
    onChange({ categorySlug: slug, subcategorySlugs: [] })
  }

  const setSingleSub = (slug: string) => {
    if (!categorySlug) return
    onChange({ categorySlug, subcategorySlugs: slug ? [slug] : [] })
  }

  const toggleMultiSub = (slug: string) => {
    if (!categorySlug) return
    const has = value.subcategorySlugs.includes(slug)
    const next = has
      ? value.subcategorySlugs.filter((s) => s !== slug)
      : [...value.subcategorySlugs, slug]
    onChange({ categorySlug, subcategorySlugs: next })
  }

  if (catalog.length === 0) {
    return (
      <p className="text-sm text-[#9a8776]">{t('categoryPicker.catalogEmpty')}</p>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {allowMultiple && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('single')
              onChange({
                categorySlug,
                subcategorySlugs: value.subcategorySlugs.slice(0, 1),
              })
            }}
            className={pickerModeClass(mode === 'single')}
          >
            {t('categoryPicker.modeSingle')}
          </button>
          <button
            type="button"
            onClick={() => setMode('multiple')}
            className={pickerModeClass(mode === 'multiple')}
          >
            {t('categoryPicker.modeMultiple')}
          </button>
        </div>
      )}

      {!fixedCategorySlug && (
        <label className="block text-sm font-semibold text-[#5f5a54]">
          {t('categoryPicker.mainCategory')}
          {required && ' *'}
          <select
            value={value.categorySlug}
            onChange={(e) => setCategory(e.target.value)}
            className="select-glass mt-1.5 w-full bg-white/80"
            required={required && !value.categorySlug}
          >
            <option value="">{t('categoryPicker.selectMain')}</option>
            {catalog.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {labelFor(cat.label, locale, cat.slug)}
              </option>
            ))}
          </select>
        </label>
      )}

      {fixedCategorySlug && (
        <p className="text-sm font-semibold text-[#2f2a24]">
          {t('categoryPicker.mainCategory')}: {categoryLabel(fixedCategorySlug, locale)}
        </p>
      )}

      {categorySlug && subs.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-[#5f5a54]">
            {mode === 'single'
              ? t('categoryPicker.subcategoryOne')
              : t('categoryPicker.subcategoryMany')}
            {required && ' *'}
          </p>

          {mode === 'single' ? (
            <select
              value={value.subcategorySlugs[0] ?? ''}
              onChange={(e) => setSingleSub(e.target.value)}
              className="select-glass mt-2 w-full bg-white/80"
              required={required}
            >
              <option value="">{t('categoryPicker.selectSub')}</option>
              {groups.map((group) => (
                <optgroup key={group.slug} label={labelFor(group.label, locale, group.slug)}>
                  {group.subcategories.map((sub) => (
                    <option key={sub.slug} value={sub.slug}>
                      {labelFor(sub.label, locale, sub.slug)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          ) : (
            <div className="mt-2 max-h-72 space-y-3 overflow-y-auto rounded-none border border-[rgba(148,163,184,0.2)] bg-white/40 p-3">
              {groups.map((group) => (
                <div key={group.slug}>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#6366f1]">
                    {labelFor(group.label, locale, group.slug)}
                  </p>
                  <div className="space-y-1">
                    {group.subcategories.map((sub) => (
                      <SubcategoryCheckbox
                        key={sub.slug}
                        sub={sub}
                        locale={locale}
                        checked={value.subcategorySlugs.includes(sub.slug)}
                        onToggle={() => toggleMultiSub(sub.slug)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {value.subcategorySlugs.length > 0 && (
            <p className="mt-2 text-xs text-[#9a8776]">
              {t('categoryPicker.selected')}:{' '}
              {value.subcategorySlugs
                .map((s) => subcategoryLabel(categorySlug, s, locale))
                .join(', ')}
            </p>
          )}
        </div>
      )}

      {categorySlug && subs.length === 0 && (
        <p className="text-xs text-[#9a8776]">{t('categoryPicker.noSubsYet')}</p>
      )}
    </div>
  )
}

function SubcategoryCheckbox({
  sub,
  locale,
  checked,
  onToggle,
}: {
  sub: SubcategoryDef
  locale: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 hover:bg-[rgba(99,102,241,0.06)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-[rgba(148,163,184,0.4)]"
      />
      <span className="text-sm text-[#2f2a24]">{labelFor(sub.label, locale, sub.slug)}</span>
    </label>
  )
}

function pickerModeClass(active: boolean): string {
  return `rounded-full px-3 py-1 text-xs font-semibold transition ${
    active
      ? 'bg-[#6366f1] text-white'
      : 'border border-[rgba(99,102,241,0.25)] bg-white/60 text-[#5f5a54]'
  }`
}

/** Синхронізує categoryId з БД і picker value */
export function syncPickerWithCategoryId(
  categories: { id: string; slug: string }[],
  categoryId: string,
  current: CategoryPickerValue,
): CategoryPickerValue {
  if (!categoryId) return emptyPickerValue()
  const cat = categories.find((c) => c.id === categoryId)
  if (!cat) return current
  if (cat.slug === current.categorySlug) return current
  return { categorySlug: cat.slug, subcategorySlugs: [] }
}

export function categoryIdFromPicker(
  categories: { id: string; slug: string }[],
  picker: CategoryPickerValue,
): string {
  if (!picker.categorySlug) return ''
  return categories.find((c) => c.slug === picker.categorySlug)?.id ?? ''
}
