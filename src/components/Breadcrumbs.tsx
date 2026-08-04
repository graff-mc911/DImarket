import { ChevronRight } from 'lucide-react'
import { navigateTo } from '../lib/navigation'

export type BreadcrumbItem = {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/** Compact breadcrumb trail — reuses existing ink/link tokens, no new visual system. */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-[var(--ink-500)] ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden /> : null}
              {item.href && !isLast ? (
                <button
                  type="button"
                  className="amazon-link font-medium text-[var(--ink-700)] hover:underline"
                  onClick={() => navigateTo(item.href!)}
                >
                  {item.label}
                </button>
              ) : (
                <span className={isLast ? 'font-semibold text-[var(--ink-900)]' : undefined} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
