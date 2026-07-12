interface LogoProps {
  compact?: boolean
  size?: 'sm' | 'md' | 'header' | 'lg' | 'xl'
  variant?: 'full' | 'text'
  className?: string
  animated?: boolean
  shimmer?: boolean
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

const wordmarkFont = 'var(--font-logo), "Libre Bodoni", "Didot", "Bodoni MT", Georgia, serif'
const marketFont = 'var(--font-sans), Inter, system-ui, sans-serif'

function Wordmark({
  className = '',
  animated = false,
}: {
  className?: string
  animated?: boolean
}) {
  return (
    <div className={`inline-flex items-baseline tracking-[-0.03em] ${className}`}>
      <span
        className={`logo-letter-d font-bold ${animated ? 'logo-build-letter logo-build-letter--d' : ''}`}
        style={{ fontFamily: wordmarkFont }}
      >
        D
      </span>
      <span
        className={`logo-letter-i font-bold ${animated ? 'logo-build-letter logo-build-letter--i' : ''}`}
        style={{ fontFamily: wordmarkFont }}
      >
        I
      </span>
      <span
        className={`font-semibold text-[var(--ink-900)] ${animated ? 'logo-build-letter logo-build-letter--market' : ''}`}
        style={{ fontFamily: marketFont }}
      >
        market
      </span>
    </div>
  )
}

function ConstructionScene() {
  return (
    <span className="logo-construction-scene" aria-hidden="true">
      <span className="logo-scene-builder">
        <span className="logo-builder-head" />
        <span className="logo-builder-body" />
        <span className="logo-builder-arm logo-builder-arm--left" />
        <span className="logo-builder-arm logo-builder-arm--right" />
        <span className="logo-builder-leg logo-builder-leg--left" />
        <span className="logo-builder-leg logo-builder-leg--right" />
      </span>
      <span className="logo-scene-actor logo-scene-ladder">🪜</span>
      <span className="logo-scene-actor logo-scene-tools">🧰</span>
      <span className="logo-scene-actor logo-scene-brick">🧱</span>
      <span className="logo-scene-actor logo-scene-hammer">🔨</span>
      <span className="logo-scene-actor logo-scene-spackle">🪣</span>
      <span className="logo-scene-actor logo-scene-paint">🎨</span>
      <span className="logo-scene-actor logo-scene-bulldozer">🚜</span>
    </span>
  )
}

export function Logo({
  compact = false,
  size = 'md',
  variant = 'text',
  className = '',
  animated = false,
  shimmer = false,
}: LogoProps) {
  const current = sizes[size]
  const shimmerClass = shimmer ? 'logo-shimmer' : ''

  if (variant === 'text' || compact) {
    return (
      <div
        role="img"
        aria-label="DImarket logo"
        className={animated ? `logo-construction relative ${className}` : className}
      >
        <Wordmark className={`${current.title} ${shimmerClass}`.trim()} animated={animated} />
        {animated && <ConstructionScene />}
      </div>
    )
  }

  return (
    <div
      className={`leading-none ${animated ? 'logo-construction relative ' : ''}${className}`}
      role="img"
      aria-label="DImarket logo"
    >
      <Wordmark className={`${current.title} ${shimmerClass}`.trim()} animated={animated} />
      {animated && <ConstructionScene />}
      {current.subtitle !== 'hidden' && (
        <div className={`${current.subtitle} mt-1.5 uppercase tracking-[0.22em] text-[#5C4D41]`}>
          Build & Renovate
        </div>
      )}
    </div>
  )
}
