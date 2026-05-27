import { Fragment } from 'react'

const FLAG_RE = /\p{Regional_Indicator}{2}/gu

function twemojiSrc(raw: string): string {
  const codepoints = [...raw].map((char) => char.codePointAt(0)!.toString(16))
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints.join('-')}.svg`
}

export function EmojiText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const parts = text.split(FLAG_RE)
  const flags = text.match(FLAG_RE) || []

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={`${index}-${part.slice(0, 12)}`}>
          {part}
          {flags[index] ? (
            <img
              src={twemojiSrc(flags[index])}
              alt={flags[index]}
              className="mx-0.5 inline-block h-[1em] w-[1em] align-[-0.12em]"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </Fragment>
      ))}
    </span>
  )
}
