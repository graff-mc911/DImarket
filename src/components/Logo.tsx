interface LogoProps {
  compact?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  className?: string
}

const sizes = {
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

export function Logo({
  compact = false,
  size = 'md',
  variant = 'full',
  className = '',
}: LogoProps) {
  const current = sizes[size]

  const mark = (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={`${current.mark} shrink-0 ${className}`}
      aria-label="DImarket logo"
      role="img"
    >
      {/* Теплий світлий фон, щоб знак читався стабільно всюди. */}
      <rect width="160" height="160" rx="28" fill="#FAF3E8" />

      {/* Дах і димар лишаємо мідними, як у затвердженому стилі. */}
      <path
        d="M34 58 L80 24 L126 58"
        fill="none"
        stroke="#C47A3D"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="108" y="29" width="13" height="25" rx="1.5" fill="#C47A3D" />

      {/* Маленьке вікно під дахом. */}
      <rect x="70" y="48" width="9" height="9" fill="#C47A3D" />
      <rect x="82" y="48" width="9" height="9" fill="#C47A3D" />
      <rect x="70" y="60" width="9" height="9" fill="#C47A3D" />
      <rect x="82" y="60" width="9" height="9" fill="#C47A3D" />

      {/* Основна пара літер DI. */}
      <text
        x="32"
        y="125"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="88"
        fontWeight="500"
        fill="#241B14"
      >
        D
      </text>
      <text
        x="92"
        y="125"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="88"
        fontWeight="500"
        fill="#C47A3D"
      >
        I
      </text>
    </svg>
  )

  const wordmark = (
    <div className="leading-none">
      <div
        className={`${current.title} tracking-[-0.04em]`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <span className="text-[#C47A3D]">DI</span>
        <span className="text-[#241B14]">market</span>
      </div>

      {/* Підпис показуємо тільки в повному варіанті. */}
      <div className={`${current.subtitle} mt-1.5 uppercase tracking-[0.22em] text-[#5C4D41]`}>
        Build & Renovate
      </div>
    </div>
  )

  if (variant === 'text') {
    return <div className={className}>{wordmark}</div>
  }

  if (compact || variant === 'icon') {
    return mark
  }

  return (
    <div className={`flex items-center ${current.gap} ${className}`}>
      {mark}
      {wordmark}
    </div>
  )
}
