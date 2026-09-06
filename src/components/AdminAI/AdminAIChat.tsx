import { useEffect, useRef } from 'react'
import { Bot, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { AdminAiMessage } from '../../lib/adminAI/adminAiApi'

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-sm leading-relaxed whitespace-pre-wrap">
      {lines.map((line, i) => {
        const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: bold }}
            className="text-[#e8e4df]"
          />
        )
      })}
    </div>
  )
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null
  const cols = Object.keys(rows[0])
  return (
    <div className="mt-2 overflow-x-auto rounded-none border border-[rgba(148,163,184,0.2)]">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-[rgba(30,30,35,0.6)]">
            {cols.map((c) => (
              <th key={c} className="px-2 py-1.5 font-semibold text-[#a8a29e] capitalize">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-[rgba(148,163,184,0.12)]">
              {cols.map((c) => (
                <td key={c} className="px-2 py-1.5 text-[#d6d3d1]">
                  {String(row[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded p-1 text-[#78716c] hover:text-[#d6d3d1]"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function AdminAIChat({ messages, loading }: { messages: AdminAiMessage[]; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2">
      {messages.length === 0 && (
        <div className="rounded-none bg-[rgba(30,30,35,0.5)] p-4 text-center text-xs text-[#a8a29e]">
          Привіт! Я Admin AI. Спробуйте /stats або «покажи топ 5 майстрів».
        </div>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          {m.role === 'assistant' && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c96d2c] text-white">
              <Bot className="h-4 w-4" />
            </div>
          )}
          <div
            className={`group relative max-w-[85%] rounded-none px-3 py-2 ${
              m.role === 'user'
                ? 'bg-[#3f3f46] text-[#fafaf9]'
                : 'bg-[rgba(30,30,35,0.85)] border border-[rgba(148,163,184,0.15)]'
            }`}
          >
            <SimpleMarkdown text={m.content} />
            {m.table && <DataTable rows={m.table} />}
            {m.role === 'assistant' && (
              <div className="absolute -right-1 -top-1 opacity-0 transition group-hover:opacity-100">
                <CopyButton text={m.content} />
              </div>
            )}
            <time className="mt-1 block text-[10px] text-[#78716c] opacity-0 group-hover:opacity-100">
              {new Date(m.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[#a8a29e]">
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c96d2c]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c96d2c] [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c96d2c] [animation-delay:0.3s]" />
          </span>
          Думаю…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
