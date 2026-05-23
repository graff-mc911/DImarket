interface LogoProps {
  compact?: boolean
  size?: 'sm' | 'md' | 'header' | 'lg' | 'xl'
  /** text — лише напис; brand — зображення DI на мобільному; icon — квадратна іконка */
  variant?: 'full' | 'icon' | 'text' | 'brand'
  className?: string
}

const ICON_SRC = '/apple-touch-icon.png?v=2'
const MARK_SRC = '/logo-header.png?v=2'

const sizes = {
  header: {
    gap: 'gap-2',
    mark: 'h-9 w-9 sm:h-10 sm:w-10',
    markWide: 'h-9 max-w-[148px] sm:h-10 sm:max-w-[168px]',
    title: 'text-[2.25rem] leading-none sm:text-[3.3rem]',
    subtitle: 'hidden',
  },
  sm: {
    gap: 'gap-2',
    mark: 'h-9 w-9',
    markWide: 'h-9 max-w-[132px]',
    title: 'text-[1.2rem]',
    subtitle: 'text-[8px]',
  },
  md: {
    gap: 'gap-2.5',
    mark: 'h-11 w-11',
    markWide: 'h-11 max-w-[160px]',
    title: 'text-[1.65rem]',
    subtitle: 'text-[9px]',
  },
  lg: {
    gap: 'gap-3',
    mark: 'h-12 w-12',
    markWide: 'h-12 max-w-[180px]',
    title: 'text-[2rem]',
    subtitle: 'text-[10px]',
  },
  xl: {
    gap: 'gap-4',
    mark: 'h-14 w-14',
    markWide: 'h-14 max-w-[200px]',
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

  /** Мобільна шапка: горизонтальний знак DI з вашого макета */
  if (variant === 'brand') {
    return (
      <div
        role="img"
        aria-label="DImarket logo"
        className={`flex items-center ${current.gap} ${className}`}
      >
        <img
          src={MARK_SRC}
          alt=""
          className={`${current.markWide} w-auto shrink-0 object-contain object-left md:hidden`}
          width={168}
          height={40}
          decoding="async"
        />
        <img
          src={ICON_SRC}
          alt=""
          className={`${current.mark} hidden shrink-0 rounded-[14px] object-cover md:block`}
          width={40}
          height={40}
          decoding="async"
        />
        <Wordmark className={`hidden md:block ${current.title}`} />
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div role="img" aria-label="DImarket logo" className={className}>
        <Wordmark className={current.title} />
      </div>
    )
  }

  if (compact || variant === 'icon') {
    return (
      <img
        src={ICON_SRC}
        alt="DImarket"
        className={`${current.mark} shrink-0 rounded-[14px] object-cover ${className}`}
        width={44}
        height={44}
        decoding="async"
      />
    )
  }

  return (
    <div className={`flex items-center ${current.gap} ${className}`} role="img" aria-label="DImarket logo">
      <img
        src={ICON_SRC}
        alt=""
        className={`${current.mark} shrink-0 rounded-[14px] object-cover`}
        width={44}
        height={44}
        decoding="async"
      />
      <div className="leading-none">
        <Wordmark className={current.title} />
        {current.subtitle !== 'hidden' && (
          <div className={`${current.subtitle} mt-1.5 uppercase tracking-[0.22em] text-[#5C4D41]`}>
            Build & Renovate
          </div>
        )}
      </div>
    </div>
  )
}
