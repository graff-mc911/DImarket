import { myersLineDiff, summarizeLineDiff, lineDiffSides } from '../../lib/officialSources/lineDiff'

type Props = {
  oldText: string
  newText: string
  hint?: string
}

export function LineDiffView({ oldText, newText, hint }: Props) {
  const ops = myersLineDiff(oldText, newText)
  const summary = summarizeLineDiff(ops)
  const sides = lineDiffSides(ops)

  return (
    <div>
      {hint ? <p className="mb-2 text-xs text-[#6f665d]">{hint}</p> : null}
      <p className="mb-2 text-xs font-semibold text-[#8a8178]">
        +{summary.added} / −{summary.removed} / ={summary.unchanged}
      </p>
      <div className="grid max-h-96 gap-2 overflow-auto md:grid-cols-2">
        <div className="rounded-none border border-rose-100 bg-rose-50/50 p-2">
          <p className="mb-1 px-1 text-[10px] font-bold uppercase text-rose-800">Old</p>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-4 text-rose-950">
            {sides.left.map((row, i) => (
              <div
                key={`l-${i}`}
                className={
                  row.kind === 'delete'
                    ? 'bg-rose-200/60 line-through'
                    : row.text
                      ? ''
                      : 'text-transparent'
                }
              >
                {row.text || ' '}
              </div>
            ))}
          </pre>
        </div>
        <div className="rounded-none border border-emerald-100 bg-emerald-50/50 p-2">
          <p className="mb-1 px-1 text-[10px] font-bold uppercase text-emerald-800">New</p>
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-4 text-emerald-950">
            {sides.right.map((row, i) => (
              <div
                key={`r-${i}`}
                className={row.kind === 'insert' ? 'bg-emerald-200/60' : row.text ? '' : 'text-transparent'}
              >
                {row.text || ' '}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}
