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
      className={`group flex w-[4.75rem] shrink-0 flex-col items-center gap-2 sm:w-[5.25rem] ${className}`}
    >
      <span className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--brand-primary)] transition group-hover:border-[var(--brand-primary)] sm:h-14 sm:w-14">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="max-w-full text-center text-[11px] font-semibold leading-tight text-[var(--ink-700)] group-hover:text-[var(--brand-primary)]">
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
