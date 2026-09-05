import type { ReactNode } from 'react'
import type { PipelineNextAction } from '../../lib/pipelineNext'

type ChipProps = {
  action: PipelineNextAction
  t: (key: never) => string
  className?: string
}

export function PipelineStageChip({ action, t, className = '' }: ChipProps) {
  const label =
    t(action.stageLabelKey as never) !== action.stageLabelKey
      ? t(action.stageLabelKey as never)
      : action.stageLabelEn
  return (
    <span
      className={`inline-flex rounded-full bg-[#f3f0ea] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#6f665d] ${className}`}
    >
      {label}
    </span>
  )
}

type CtaProps = {
  action: PipelineNextAction
  t: (key: never) => string
  onClick: () => void
  primary?: boolean
  children?: ReactNode
}

export function PipelineNextCta({ action, t, onClick, primary = true, children }: CtaProps) {
  const label =
    children ||
    (t(action.labelKey as never) !== action.labelKey
      ? t(action.labelKey as never)
      : action.labelEn)
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? 'rounded-full bg-[#2f2a24] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black'
          : 'rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2 text-[13px] font-semibold text-[#2f2a24]'
      }
    >
      {label}
    </button>
  )
}
