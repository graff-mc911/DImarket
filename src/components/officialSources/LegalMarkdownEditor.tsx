import { useCallback, useRef, useState } from 'react'
import {
  Bold,
  Code2,
  Eye,
  EyeOff,
  FileText,
  Heading2,
  Heading3,
  Link2,
  List,
  Quote,
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

type Props = {
  value: string
  onChange: (next: string) => void
  rows?: number
  placeholder?: string
  templateSnippet?: string
}

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder = '',
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || placeholder
  const next =
    textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end)
  return { next, cursor: start + before.length + selected.length + after.length }
}

function insertLinePrefix(textarea: HTMLTextAreaElement, prefix: string) {
  const start = textarea.selectionStart
  const value = textarea.value
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', start)
  const end = lineEnd === -1 ? value.length : lineEnd
  const line = value.slice(lineStart, end)
  const stripped = line.replace(/^#+\s*/, '').replace(/^-\s*/, '').replace(/^>\s*/, '')
  const nextLine = `${prefix}${stripped}`
  const next = value.slice(0, lineStart) + nextLine + value.slice(end)
  return { next, cursor: lineStart + nextLine.length }
}

export function LegalMarkdownEditor({
  value,
  onChange,
  rows = 10,
  placeholder,
  templateSnippet,
}: Props) {
  const { t } = useApp()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  const apply = useCallback(
    (fn: (el: HTMLTextAreaElement) => { next: string; cursor: number }) => {
      const el = ref.current
      if (!el) return
      const { next, cursor } = fn(el)
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(cursor, cursor)
      })
    },
    [onChange],
  )

  const previewHtml = value
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-3 mb-1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<p class="ml-3">• $1</p>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-[#d2d2d7] pl-2 text-[#6e6e73]">$1</blockquote>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[#f5f5f7] px-1">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')

  return (
    <div className="rounded-xl border border-[#d2d2d7] bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e8e8ed] px-2 py-1.5">
        <button
          type="button"
          title={t('osm.editor.bold')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() =>
            apply((el) => wrapSelection(el, '**', '**', t('osm.editor.boldPlaceholder')))
          }
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('osm.editor.heading')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() => apply((el) => insertLinePrefix(el, '## '))}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('osm.editor.heading3')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() => apply((el) => insertLinePrefix(el, '### '))}
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('osm.editor.list')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() => apply((el) => insertLinePrefix(el, '- '))}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('osm.editor.quote')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() => apply((el) => insertLinePrefix(el, '> '))}
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('osm.editor.code')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() =>
            apply((el) => wrapSelection(el, '`', '`', t('osm.editor.codePlaceholder')))
          }
        >
          <Code2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('osm.editor.link')}
          className="rounded p-1 hover:bg-[#f5f5f7]"
          onClick={() =>
            apply((el) => wrapSelection(el, '[', '](https://)', t('osm.editor.linkText')))
          }
        >
          <Link2 className="h-4 w-4" />
        </button>
        {templateSnippet ? (
          <button
            type="button"
            title={t('osm.editor.insertTemplate')}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold hover:bg-[#f5f5f7]"
            onClick={() => onChange(templateSnippet)}
          >
            <FileText className="h-3.5 w-3.5" />
            {t('osm.editor.insertTemplate')}
          </button>
        ) : null}
        <span className="mx-1 h-4 w-px bg-[#e8e8ed]" />
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold hover:bg-[#f5f5f7]"
          onClick={() => setPreview((p) => !p)}
        >
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {preview ? t('osm.editor.edit') : t('osm.editor.preview')}
        </button>
      </div>
      {preview ? (
        <div
          className="min-h-[120px] px-3 py-2 text-xs leading-5 text-[#1d1d1f]"
          dangerouslySetInnerHTML={{
            __html: previewHtml || `<p class="text-[#86868b]">${placeholder ?? ''}</p>`,
          }}
        />
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-y rounded-b-xl border-0 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-0"
        />
      )}
    </div>
  )
}
