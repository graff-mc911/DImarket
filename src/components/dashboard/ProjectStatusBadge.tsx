import {
  PROJECT_LIFECYCLE_LABELS,
  lifecycleProgress,
  lifecycleTone,
  type ProjectLifecycle,
} from '../../lib/dashboard/projectStatus'

export function ProjectStatusBadge({ status }: { status: ProjectLifecycle }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${lifecycleTone(status)}`}
    >
      {PROJECT_LIFECYCLE_LABELS[status]}
    </span>
  )
}

export function ProjectProgressBar({ status }: { status: ProjectLifecycle }) {
  const pct = lifecycleProgress(status)
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[11px] text-[#86868b]">
        <span>Timeline</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e8e8ed]">
        <div
          className="h-full rounded-full bg-[#1d1d1f] transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
