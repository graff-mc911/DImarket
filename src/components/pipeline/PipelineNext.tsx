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
      className={`inline-flex rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#6e6e73] ${className}`}
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
          ? 'rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black'
          : 'rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-semibold text-[#1d1d1f]'
      }
    >
      {label}
    </button>
  )
}
