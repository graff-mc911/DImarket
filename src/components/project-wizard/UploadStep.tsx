import { FileText, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { fileKindFromMime, type WizardDraftFile } from '../../lib/projectWizard'

type UploadStepProps = {
  files: WizardDraftFile[]
  onChange: (files: WizardDraftFile[]) => void
  dropLabel: string
  help: string
}

const MAX_FILES = 12
const MAX_MB = 25

export function UploadStep({ files, onChange, dropLabel, help }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    setLocalError(null)
    const next = [...files]
    for (const file of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        setLocalError(`Maximum ${MAX_FILES} files`)
        break
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setLocalError(`Each file must be under ${MAX_MB} MB`)
        continue
      }
      const ok =
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type === 'application/pdf'
      if (!ok) {
        setLocalError('Only images, video, and PDF are allowed')
        continue
      }
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
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={
          'flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-4 py-12 text-center transition ' +
          (dragOver
            ? 'border-[#2f2a24] bg-[#f3f0ea]'
            : 'border-[rgba(148,163,184,0.35)] bg-[#fafafa] hover:border-[#aeaeb2]')
        }
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <Upload className="h-6 w-6 text-[#2f2a24]" />
        </div>
        <p className="text-[15px] font-semibold text-[#2f2a24]">{dropLabel}</p>
        <p className="mt-1 max-w-xs text-[13px] text-[#8a8178]">{help}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {localError ? <p className="mt-3 text-center text-[13px] text-[#c41e3a]">{localError}</p> : null}

      {files.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f, i) => (
            <li
              key={f.previewUrl}
              className="relative overflow-hidden rounded-[18px] border border-[rgba(148,163,184,0.22)] bg-[#fafafa]"
            >
              {f.kind === 'photo' ? (
                <img src={f.previewUrl} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center">
                  <FileText className="h-7 w-7 text-[#6f665d]" />
                  <span className="line-clamp-2 text-[11px] font-medium text-[#2f2a24]">{f.file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(i)
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
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
