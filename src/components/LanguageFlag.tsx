import {
  languageDisplayCode,
  languageFlagEmoji,
  twemojiFlagSrc,
} from '../lib/languageDisplay'

type LanguageFlagProps = {
  /** App language code (`en`, `uk`, …) — not a country code. */
  languageCode: string
  size?: number
  className?: string
}

/** Circular Twemoji flag for the selected interface language (24×24 by default). */
export function LanguageFlag({ languageCode, size = 24, className = '' }: LanguageFlagProps) {
  const emoji = languageFlagEmoji(languageCode)
  const src = twemojiFlagSrc(emoji)
  const label = languageDisplayCode(languageCode)

  return (
    <span
      className={`lang-flag ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
      title={label}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </span>
  )
}
