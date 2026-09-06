import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bot, Check, Copy, Loader2, Sparkles } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { PROJECT_TRADES } from '../lib/projectWizard'
import {
  ASSISTANT_TOOLS,
  listMyConversations,
  runAssistantTool,
  toolsForAudience,
  type AssistantAudience,
  type AssistantTool,
  type AssistantToolId,
} from '../lib/ai/assistantTools'
import { saveEstimatorAiPrefill } from '../lib/ai/estimatorPrefill'

const inputClass =
  'w-full rounded-none border border-[rgba(148,163,184,0.35)] bg-white px-3 py-2.5 text-[13px] text-[#2f2a24] outline-none transition focus:border-[#2f2a24] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]'

export function AiAssistant() {
  const { user, profile, language, t } = useApp()
  const defaultAudience: AssistantAudience =
    profile?.user_role === 'professional' ||
    profile?.user_role === 'company' ||
    Boolean(profile?.is_professional)
      ? 'professional'
      : 'customer'

  const [audience, setAudience] = useState<AssistantAudience>(defaultAudience)
  const [toolId, setToolId] = useState<AssistantToolId | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [fallback, setFallback] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [conversations, setConversations] = useState<
    Array<{ id: string; label: string; updated_at?: string }>
  >([])

  const [description, setDescription] = useState('')
  const [trade, setTrade] = useState('general')
  const [city, setCity] = useState(profile?.location || '')
  const [areaSqm, setAreaSqm] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [budget, setBudget] = useState('')
  const [extra, setExtra] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [transcript, setTranscript] = useState('')

  useEffect(() => {
    setAudience(defaultAudience)
  }, [defaultAudience])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tool') as AssistantToolId | null
    if (t && ASSISTANT_TOOLS.some((x) => x.id === t)) {
      setToolId(t)
      const tool = ASSISTANT_TOOLS.find((x) => x.id === t)
      if (tool) setAudience(tool.audience)
    }
  }, [])

  useEffect(() => {
    if (!user || audience !== 'professional') return
    void listMyConversations(user.id).then(setConversations)
  }, [user?.id, audience])

  const tools = useMemo(() => toolsForAudience(audience), [audience])
  const activeTool = tools.find((t) => t.id === toolId) || ASSISTANT_TOOLS.find((t) => t.id === toolId)

  const selectTool = (tool: AssistantTool) => {
    if (tool.href) {
      navigateTo(tool.href)
      return
    }
    if (tool.needsAuth && !user) {
      navigateTo('/login')
      return
    }
    setToolId(tool.id)
    setResult('')
    setError('')
    setFallback(false)
    window.history.replaceState({}, '', `/assistant?tool=${tool.id}`)
  }

  const run = async () => {
    if (!activeTool) return
    if (activeTool.needsAuth && !user) {
      navigateTo('/login')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await runAssistantTool({
        tool: activeTool.id,
        locale: language?.code || 'en',
        description,
        trade,
        city,
        areaSqm: areaSqm ? Number(areaSqm) : undefined,
        jobTitle,
        clientName,
        proName: profile?.full_name || undefined,
        budget,
        extra,
        conversationId: conversationId || undefined,
        transcript: transcript || undefined,
        profile:
          activeTool.id === 'improve_profile' && description.trim()
            ? { ...profile, bio: description }
            : profile,
      })
      if (!res.ok) {
        setError(res.error || 'Generation failed')
      } else {
        setResult(res.text)
        setFallback(Boolean(res.fallback))
        if (res.data?.category) {
          setTrade(String(res.data.category))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="py-8 pb-24 lg:pb-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <header className="space-y-3">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8178]">
            <Bot className="h-4 w-4" />
            AI Assistant
          </p>
          <h1 className="text-[32px] font-semibold tracking-tight text-[#2f2a24] sm:text-[36px]">
            Customer & professional AI tools
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[#6f665d]">
            Create projects, estimate budgets, choose categories — or generate quotes, invoices,
            proposals, contracts, chat summaries, and stronger profiles.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAudience('customer')
              setToolId(null)
            }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              audience === 'customer' ? 'bg-[#2f2a24] text-white' : 'bg-[#f3f0ea] text-[#2f2a24]'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setAudience('professional')
              setToolId(null)
            }}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              audience === 'professional' ? 'bg-[#2f2a24] text-white' : 'bg-[#f3f0ea] text-[#2f2a24]'
            }`}
          >
            Professional
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/assistant/job')}
            className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2 text-[13px] font-semibold"
          >
            Job request chat
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/cost-estimator')}
            className="rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-4 py-2 text-[13px] font-semibold"
          >
            Full cost estimator
          </button>
        </div>

        {!toolId ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectTool(tool)}
                  className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-5 text-left shadow-sm transition hover:border-[#2f2a24]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#f3f0ea] text-[#2f2a24]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-3 text-[16px] font-semibold text-[#2f2a24]">{tool.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#6f665d]">{tool.description}</p>
                </button>
              )
            })}
          </section>
        ) : (
          <section className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setToolId(null)
                window.history.replaceState({}, '', '/assistant')
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6f665d]"
            >
              <ArrowLeft className="h-4 w-4" />
              All tools
            </button>

            <div className="rounded-none border border-[rgba(148,163,184,0.22)] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                {activeTool ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#f3f0ea]">
                    {(() => {
                      const Icon = activeTool.icon
                      return <Icon className="h-5 w-5" />
                    })()}
                  </div>
                ) : null}
                <div>
                  <h2 className="text-[20px] font-semibold text-[#2f2a24]">{activeTool?.title}</h2>
                  <p className="mt-1 text-[13px] text-[#6f665d]">{activeTool?.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(toolId === 'estimate_budget' ||
                  toolId === 'choose_category' ||
                  toolId === 'generate_quote' ||
                  toolId === 'generate_invoice' ||
                  toolId === 'write_proposal' ||
                  toolId === 'write_contract') && (
                  <>
                    {(toolId === 'generate_quote' ||
                      toolId === 'generate_invoice' ||
                      toolId === 'write_proposal' ||
                      toolId === 'write_contract') && (
                      <>
                        <input
                          className={inputClass}
                          placeholder="Job title"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                        <input
                          className={inputClass}
                          placeholder="Client name"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </>
                    )}
                    {(toolId === 'estimate_budget' ||
                      toolId === 'generate_quote' ||
                      toolId === 'write_proposal' ||
                      toolId === 'write_contract') && (
                      <select
                        className={inputClass}
                        value={trade}
                        onChange={(e) => setTrade(e.target.value)}
                      >
                        {PROJECT_TRADES.map((trade) => (
                          <option key={trade.id} value={trade.id}>
                            {t(trade.labelKey as never) || trade.labelEn}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      className={inputClass}
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                    {toolId === 'estimate_budget' ? (
                      <input
                        className={inputClass}
                        placeholder="Area m²"
                        type="number"
                        min={0}
                        value={areaSqm}
                        onChange={(e) => setAreaSqm(e.target.value)}
                      />
                    ) : null}
                    {(toolId === 'generate_quote' || toolId === 'generate_invoice') && (
                      <input
                        className={inputClass}
                        placeholder="Budget hint (optional)"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    )}
                    <textarea
                      className={`${inputClass} min-h-[120px] sm:col-span-2`}
                      placeholder={
                        toolId === 'choose_category'
                          ? 'Describe the job…'
                          : 'Describe the work / scope…'
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    {(toolId === 'write_proposal' || toolId === 'write_contract') && (
                      <textarea
                        className={`${inputClass} min-h-[80px] sm:col-span-2`}
                        placeholder="Extra notes (timeline, materials, warranty…)"
                        value={extra}
                        onChange={(e) => setExtra(e.target.value)}
                      />
                    )}
                  </>
                )}

                {toolId === 'summarize_chat' && (
                  <>
                    {conversations.length ? (
                      <select
                        className={`${inputClass} sm:col-span-2`}
                        value={conversationId}
                        onChange={(e) => setConversationId(e.target.value)}
                      >
                        <option value="">Select a conversation</option>
                        {conversations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <textarea
                      className={`${inputClass} min-h-[140px] sm:col-span-2`}
                      placeholder="Or paste chat transcript here…"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </>
                )}

                {toolId === 'improve_profile' && (
                  <div className="sm:col-span-2 rounded-none bg-[#f3f0ea] px-4 py-3 text-[13px] text-[#3a3a3c]">
                    Uses your current profile ({profile?.full_name || 'guest'}). Sign in for best
                    results. You can also add notes below.
                    <textarea
                      className={`${inputClass} mt-3 min-h-[100px]`}
                      placeholder="Optional focus (e.g. bathroom renovations in Berlin)…"
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                    />
                    <textarea
                      className={`${inputClass} mt-3 min-h-[80px]`}
                      placeholder="Override bio draft input (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {error ? (
                <p className="mt-4 rounded-none border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void run()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2f2a24] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Generating…' : 'Generate'}
                </button>
                {toolId === 'choose_category' && result ? (
                  <button
                    type="button"
                    onClick={() => navigateTo('/create-project')}
                    className="rounded-full border border-[rgba(148,163,184,0.35)] px-4 py-2.5 text-[13px] font-semibold"
                  >
                    Continue to create project
                  </button>
                ) : null}
                {toolId === 'estimate_budget' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const desc = [
                        description.trim(),
                        trade ? `Trade: ${trade}` : '',
                        city ? `City: ${city}` : '',
                        areaSqm ? `Area: ${areaSqm} m²` : '',
                      ]
                        .filter(Boolean)
                        .join('\n')
                      if (desc.length >= 8) {
                        saveEstimatorAiPrefill({
                          description: desc,
                          source: 'ai_assistant',
                        })
                      }
                      navigateTo('/cost-estimator')
                    }}
                    className="rounded-full border border-[rgba(148,163,184,0.35)] px-4 py-2.5 text-[13px] font-semibold"
                  >
                    Open full estimator
                  </button>
                ) : null}
              </div>

              {result ? (
                <div className="mt-5 rounded-none border border-[rgba(148,163,184,0.22)] bg-[#fbfbfd] p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8178]">
                      Result {fallback ? '· offline fallback' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copy()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.35)] bg-white px-3 py-1 text-[12px] font-semibold"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#2f2a24]">
                    {result}
                  </pre>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
