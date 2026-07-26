import { useEffect, useState } from 'react'
import { Columns2 } from 'lucide-react'
import {
  isInCompare,
  subscribeCompare,
  toggleCompare,
  MAX_COMPARE,
} from '../../lib/compare'

export function CompareToggle({
  professionalId,
  className = '',
  size = 'md',
  label = false,
  onLimit,
}: {
  professionalId: string
  className?: string
  size?: 'sm' | 'md'
  label?: boolean
  onLimit?: (message: string) => void
}) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(isInCompare(professionalId))
    return subscribeCompare((ids) => setActive(ids.includes(professionalId)))
  }, [professionalId])

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const res = toggleCompare(professionalId)
    setActive(res.ids.includes(professionalId))
    if (!res.ok && res.reason) onLimit?.(res.reason)
  }

  const pad = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? 'Remove from comparison' : `Add to comparison (max ${MAX_COMPARE})`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border transition ${
        active
          ? 'border-[#0066cc] bg-[#e8f1ff] text-[#0066cc]'
          : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]'
      } ${label ? 'px-3 py-1.5 text-[12px] font-semibold' : pad} ${className}`}
    >
      <Columns2 className={icon} />
      {label ? (active ? 'Comparing' : 'Compare') : null}
    </button>
  )
}
