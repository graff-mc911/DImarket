interface LogoProps {
  compact?: boolean
  size?: 'sm' | 'md' | 'header' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  className?: string
}

const sizes = {
  /** Шапка / футер — текстовий знак ~3× від попереднього header (1.1rem → 3.3rem) */
  header: {
    gap: 'gap-0',
    mark: 'h-0 w-0',
    title: 'text-[2.25rem] leading-none sm:text-[3.3rem]',
    subtitle: 'hidden',
  },
  sm: {
    gap: 'gap-2',
    mark: 'h-9 w-9',
    title: 'text-[1.2rem]',
    subtitle: 'text-[8px]',
  },
  md: {
    gap: 'gap-2.5',
    mark: 'h-[52px] w-[52px]',
    title: 'text-[1.65rem]',
    subtitle: 'text-[9px]',
  },
  lg: {
    gap: 'gap-3',
    mark: 'h-[62px] w-[62px]',
    title: 'text-[2rem]',
    subtitle: 'text-[10px]',
  },
  xl: {
    gap: 'gap-4',
    mark: 'h-[76px] w-[76px]',
    title: 'text-[2.45rem]',
    subtitle: 'text-[11px]',
  },
} as const

const wordmarkFont = "Georgia, 'Times New Roman', Times, serif"

export function Logo({
  compact = false,
  size = 'md',
  variant = 'text',
  className = '',
}: LogoProps) {
  const current = sizes[size]

  const mark = (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={`${current.mark} shrink-0 ${className}`}
      aria-hidden
    >
      <rect width="160" height="160" rx="28" fill="#FAF3E8" />
      <path
        d="M34 58 L80 24 L126 58"
        fill="none"
        stroke="#C47A3D"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="108" y="29" width="13" height="25" rx="1.5" fill="#C47A3D" />
      <rect x="70" y="48" width="9" height="9" fill="#C47A3D" />
      <rect x="82" y="48" width="9" height="9" fill="#C47A3D" />
      <rect x="70" y="60" width="9" height="9" fill="#C47A3D" />
      <rect x="82" y="60" width="9" height="9" fill="#C47A3D" />
      <text
        x="32"
        y="125"
        fontFamily={wordmarkFont}
        fontSize="88"
        fontWeight="500"
        fill="#241B14"
      >
        D
      </text>
      <text
        x="92"
        y="125"
        fontFamily={wordmarkFont}
        fontSize="88"
        fontWeight="500"
        fill="#C47A3D"
      >
        I
      </text>
    </svg>
  )

  const wordmark = (
    <div
      className={`${current.title} font-medium tracking-[-0.03em] ${className}`}
      style={{ fontFamily: wordmarkFont }}
    >
      <span className="text-[#C47A3D]">DI</span>
      <span className="text-[#241B14]">market</span>
    </div>
  )

  const wordmarkWithSubtitle = (
    <div className="leading-none">
      {wordmark}
      {current.subtitle !== 'hidden' && (
        <div className={`${current.subtitle} mt-1.5 uppercase tracking-[0.22em] text-[#5C4D41]`}>
          Build & Renovate
        </div>
      )}
    </div>
  )

  if (variant === 'text') {
    return (
      <div role="img" aria-label="DImarket logo" className={className}>
        {wordmark}
      </div>
    )
  }

  if (compact || variant === 'icon') {
    return (
      <svg
        viewBox="0 0 160 160"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizes.md.mark} shrink-0 ${className}`}
        aria-label="DImarket logo"
        role="img"
      >
        <rect width="160" height="160" rx="28" fill="#FAF3E8" />
        <path
          d="M34 58 L80 24 L126 58"
          fill="none"
          stroke="#C47A3D"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="108" y="29" width="13" height="25" rx="1.5" fill="#C47A3D" />
        <text
          x="32"
          y="125"
          fontFamily={wordmarkFont}
          fontSize="88"
          fontWeight="500"
          fill="#241B14"
        >
          D
        </text>
        <text
          x="92"
          y="125"
          fontFamily={wordmarkFont}
          fontSize="88"
          fontWeight="500"
          fill="#C47A3D"
        >
          I
        </text>
      </svg>
    )
  }

  return (
    <div className={`flex items-center ${current.gap} ${className}`} role="img" aria-label="DImarket logo">
      {mark}
      {wordmarkWithSubtitle}
    </div>
  )
}
