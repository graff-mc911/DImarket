import { ArrowRight, Hammer } from 'lucide-react'
import { Category } from '../lib/types'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useApp()

  const translateUnsafe = (key: string) => {
    return t(key as never)
  }

  const nameKey = `category.name.${category.slug}`
  const legacyNameKey = `category.${category.slug}`
  const descriptionKey = `category.${category.slug}Desc`

  const translatedName = translateUnsafe(nameKey)
  const legacyName = translateUnsafe(legacyNameKey)
  const translatedDescription = translateUnsafe(descriptionKey)

  const title =
    translatedName !== nameKey
      ? translatedName
      : legacyName !== legacyNameKey
        ? legacyName
        : category.name

  // Даємо картці читабельний fallback,
  // якщо опис ще не винесений у переклади.
  const description =
    translatedDescription !== descriptionKey
      ? translatedDescription
      : category.description || 'Construction service'

  return (
    <button
      onClick={() => navigateTo(`/listings?category=${category.slug}`)}
      type="button"
      className="glass-card group flex h-full flex-col items-start p-5 text-left transition duration-200 hover:-translate-y-0.5"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(245,166,109,0.18)] text-[#c96d2c] shadow-[0_10px_24px_rgba(176,126,85,0.12)]">
          {category.icon ? (
            <span className="text-2xl leading-none">{category.icon}</span>
          ) : (
            <Hammer className="h-6 w-6" />
          )}
        </div>

        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#c3a58d] transition group-hover:text-[#9a5525]" />
      </div>

      <h3 className="mt-5 text-lg font-extrabold leading-tight text-[#2f2a24] transition group-hover:text-[#9a5525]">
        {title}
      </h3>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6f665d]">
        {description}
      </p>
    </button>
  )
}
