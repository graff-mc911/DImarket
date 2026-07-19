import { Upload, X } from 'lucide-react'
import { useRef } from 'react'
import { fileKindFromMime, type WizardDraftFile } from '../../lib/projectWizard'

type UploadStepProps = {
  files: WizardDraftFile[]
  onChange: (files: WizardDraftFile[]) => void
  dropLabel: string
  help: string
}

export function UploadStep({ files, onChange, dropLabel, help }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const next = [...files]
    for (const file of Array.from(list)) {
      if (next.length >= 12) break
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
        kind: fileKindFromMime(file.type, file.name),
      })
    }
    onChange(next)
  }

  const removeAt = (index: number) => {
    const copy = [...files]
    URL.revokeObjectURL(copy[index].previewUrl)
    copy.splice(index, 1)
    onChange(copy)
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#d5d9d9] bg-[#f7fafa] px-4 py-10 text-center hover:border-[#ff9900]"
      >
        <Upload className="mb-2 h-8 w-8 text-[#565959]" />
        <p className="text-sm font-semibold text-[var(--ink-900)]">{dropLabel}</p>
        <p className="mt-1 text-xs text-[var(--ink-500)]">{help}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f, i) => (
            <li key={f.previewUrl} className="relative overflow-hidden rounded-sm border border-[#d5d9d9] bg-white">
              {f.kind === 'photo' ? (
                <img src={f.previewUrl} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-[#f0f2f2] p-2 text-center text-xs font-medium text-[var(--ink-700)]">
                  {f.file.name}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
