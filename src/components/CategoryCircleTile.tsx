import type { LucideIcon } from 'lucide-react'

interface CategoryCircleTileProps {
  icon: LucideIcon
  label: string
  sublabel?: string
  onClick: () => void
  className?: string
}

export function CategoryCircleTile({
  icon: Icon,
  label,
  sublabel,
  onClick,
  className = '',
}: CategoryCircleTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full shrink-0 flex-col items-center gap-2 ${className}`}
    >
      <span className="flex h-20 w-full items-center justify-center rounded-none border border-[#d5d9d9] bg-[#f7fafa] text-[var(--accent-600)] transition group-hover:border-[#ff9900] group-hover:bg-white sm:h-24">
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </span>
      <span className="line-clamp-2 min-h-[2.5rem] max-w-full text-center text-xs font-medium leading-snug text-[var(--ink-900)] group-hover:text-[var(--accent-600)]">
        {label}
      </span>
      {sublabel && (
        <span className="-mt-1 max-w-full truncate text-center text-[10px] text-[var(--ink-500)]">
          {sublabel}
        </span>
      )}
    </button>
  )
}
