interface LogoProps {
  compact?: boolean
  size?: 'sm' | 'md' | 'header' | 'lg' | 'xl'
  variant?: 'full' | 'text'
  className?: string
}

const sizes = {
  /** Шапка: менший на мобільному, більший на десктопі */
  header: {
    title: 'text-[1.35rem] leading-none sm:text-[1.85rem] md:text-[2.25rem] xl:text-[3.3rem]',
    subtitle: 'hidden',
  },
  sm: {
    title: 'text-[1.2rem]',
    subtitle: 'text-[8px]',
  },
  md: {
    title: 'text-[1.65rem]',
    subtitle: 'text-[9px]',
  },
  lg: {
    title: 'text-[2rem]',
    subtitle: 'text-[10px]',
  },
  xl: {
    title: 'text-[2.45rem]',
    subtitle: 'text-[11px]',
  },
} as const

const wordmarkFont = "Georgia, 'Times New Roman', Times, serif"

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`font-medium tracking-[-0.03em] ${className}`}
      style={{ fontFamily: wordmarkFont }}
    >
      <span className="text-[#2B231D]">D</span>
      <span className="text-[#A66332]">I</span>
      <span className="text-[#2B231D]">market</span>
    </div>
  )
}

export function Logo({
  compact = false,
  size = 'md',
  variant = 'text',
  className = '',
}: LogoProps) {
  const current = sizes[size]

  if (variant === 'text' || compact) {
    return (
      <div role="img" aria-label="DImarket logo" className={className}>
        <Wordmark className={current.title} />
      </div>
    )
  }

  return (
    <div className={`leading-none ${className}`} role="img" aria-label="DImarket logo">
      <Wordmark className={current.title} />
      {current.subtitle !== 'hidden' && (
        <div className={`${current.subtitle} mt-1.5 uppercase tracking-[0.22em] text-[#5C4D41]`}>
          Build & Renovate
        </div>
      )}
    </div>
  )
}
