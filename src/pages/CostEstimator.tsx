import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Camera,
  Clock,
  Hammer,
  ImagePlus,
  Package,
  Ruler,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { PROJECT_TRADES } from '../lib/projectWizard'
import {
  formatEuro,
  runCostEstimate,
  type CostEstimateResult,
} from '../lib/costEstimator'

const field =
  'w-full rounded-[14px] border border-[#e8e8ed] bg-[#fafafa] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#1d1d1f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.06)]'

type PhotoItem = { id: string; file: File; url: string }

/** AI Cost Estimator — /cost-estimator */
export function CostEstimator() {
  const { t } = useApp()
  const [description, setDescription] = useState('')
  const [area, setArea] = useState('40')
  const [tradeId, setTradeId] = useState<string>('general')
  const [city, setCity] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CostEstimateResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canEstimate = description.trim().length >= 15 && Number(area) > 0

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setPhotos((prev) => {
      const next = [...prev]
      for (const file of list.slice(0, 8 - prev.length)) {
        next.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })
      }
      return next.slice(0, 8)
    })
  }

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  const onEstimate = async () => {
    if (!canEstimate) {
      setError('Add a short description (15+ chars) and area in m²')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await runCostEstimate({
        description: description.trim(),
        areaSqm: Number(area),
        tradeId,
        city: city.trim() || undefined,
        photoCount: photos.length,
        currency: 'EUR',
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Estimate failed')
    } finally {
      setBusy(false)
    }
  }

  const tradeLabel = useMemo(
    () => PROJECT_TRADES.find((t) => t.id === tradeId)?.labelEn || 'General',
    [tradeId],
  )

  return (
    <div className="min-h-[80vh] bg-[#f5f5f7] pb-24">
      <div className="relative overflow-hidden border-b border-[#e8e8ed] bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% -10%, #ddd6fe 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 0%, #c7d2fe 0%, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            <Sparkles className="h-3 w-3" />
            AI Cost Estimator
          </div>
          <h1 className="mt-4 max-w-2xl text-[34px] font-semibold tracking-tight text-[#1d1d1f] md:text-[42px]">
            {t('costEstimator.title' as never) || 'Estimate your project cost'}
          </h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[#6e6e73]">
            {t('costEstimator.sub' as never) ||
              'Describe the work, add photos and area — get labor, materials, duration and Low / Average / Premium prices.'}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#e8e8ed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:p-6">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              Category
            </label>
            <div className="mb-5 flex flex-wrap gap-2">
              {PROJECT_TRADES.map((tr) => {
                const Icon = tr.icon
                const active = tradeId === tr.id
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => setTradeId(tr.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                      active
                        ? 'bg-[#1d1d1f] text-white'
                        : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tr.labelEn}
                  </button>
                )
              })}
            </div>

            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="e.g. Repaint 2-bedroom apartment, walls and ceilings, remove old wallpaper…"
              className={field + ' resize-y'}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  <Ruler className="h-3.5 w-3.5" />
                  Area (m²)
                </span>
                <input
                  type="number"
                  min={1}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={field}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                  City (optional)
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                  className={field}
                />
              </label>
            </div>

            <div className="mt-5">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                <Camera className="h-3.5 w-3.5" />
                Photos
              </span>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
                }}
                className={`rounded-[18px] border-2 border-dashed px-4 py-8 text-center transition ${
                  dragOver
                    ? 'border-[#1d1d1f] bg-[#f5f5f7]'
                    : 'border-[#d2d2d7] bg-[#fafafa]'
                }`}
              >
                <ImagePlus className="mx-auto h-7 w-7 text-[#86868b]" />
                <p className="mt-2 text-[14px] font-medium text-[#1d1d1f]">
                  Drag & drop or click to upload
                </p>
                <p className="mt-1 text-[12px] text-[#86868b]">Up to 8 photos — improves accuracy</p>
                <button
                  type="button"
                  className="mt-3 rounded-full bg-[#1d1d1f] px-4 py-2 text-[12px] font-semibold text-white"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose photos
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
              {photos.length > 0 ? (
                <ul className="mt-3 grid grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <li key={p.id} className="relative aspect-square overflow-hidden rounded-xl">
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        onClick={() => removePhoto(p.id)}
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy || !canEstimate}
              onClick={() => void onEstimate()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {busy ? 'Estimating…' : 'Get AI estimate'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!result ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d2d2d7] bg-white/60 px-6 text-center">
              <Wallet className="h-10 w-10 text-[#d2d2d7]" />
              <p className="mt-3 text-[15px] font-semibold text-[#1d1d1f]">Your estimate appears here</p>
              <p className="mt-1 max-w-xs text-[13px] text-[#86868b]">
                Fill in the form and tap Get AI estimate for Low, Average and Premium pricing.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-[24px] border border-[#e8e8ed] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b]">
                      Results · {result.tradeLabel || tradeLabel}
                    </p>
                    <p className="mt-1 text-[14px] text-[#6e6e73]">{result.explanation}</p>
                  </div>
                  <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-semibold text-[#1d1d1f]">
                    {result.confidence}% confidence · {result.source === 'ai' ? 'AI' : 'Model'}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric
                    icon={<Hammer className="h-4 w-4" />}
                    label="Labor"
                    value={formatEuro(result.labor)}
                  />
                  <Metric
                    icon={<Package className="h-4 w-4" />}
                    label="Materials"
                    value={formatEuro(result.materials)}
                  />
                  <Metric
                    icon={<Clock className="h-4 w-4" />}
                    label="Duration"
                    value={`${result.durationDaysMin}–${result.durationDaysMax} days`}
                  />
                </div>

                {result.factors.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {result.factors.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#6e6e73]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3">
                <PriceCard
                  tier="Low"
                  subtitle="Budget-friendly"
                  price={result.lowPrice}
                  accent="from-[#e8e8ed] to-[#f5f5f7]"
                  text="text-[#1d1d1f]"
                  badge="bg-white text-[#6e6e73]"
                />
                <PriceCard
                  tier="Average"
                  subtitle="Most common"
                  price={result.averagePrice}
                  accent="from-[#1d1d1f] to-[#3a3a3c]"
                  text="text-white"
                  badge="bg-white/15 text-white"
                  featured
                />
                <PriceCard
                  tier="Premium"
                  subtitle="High-end finish"
                  price={result.premiumPrice}
                  accent="from-[#4c1d95] to-[#6d28d9]"
                  text="text-white"
                  badge="bg-white/15 text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-full bg-[#1d1d1f] px-4 py-3 text-[13px] font-semibold text-white"
                  onClick={() => navigateTo('/create-project')}
                >
                  Create project with this scope
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#d2d2d7] bg-white px-4 py-3 text-[13px] font-semibold text-[#1d1d1f]"
                  onClick={() => {
                    setResult(null)
                    setPhotos((prev) => {
                      prev.forEach((p) => URL.revokeObjectURL(p.url))
                      return []
                    })
                  }}
                >
                  <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] px-3 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#86868b]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#1d1d1f]">
        {value}
      </p>
    </div>
  )
}

function PriceCard({
  tier,
  subtitle,
  price,
  accent,
  text,
  badge,
  featured,
}: {
  tier: string
  subtitle: string
  price: number
  accent: string
  text: string
  badge: string
  featured?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ${accent} ${text} ${
        featured ? 'ring-2 ring-[#1d1d1f]/ring-offset-2 ring-offset-[#f5f5f7]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge}`}>
            {tier} price
          </span>
          <p className={`mt-2 text-[13px] opacity-80 ${text}`}>{subtitle}</p>
        </div>
        <p className={`text-[32px] font-semibold tabular-nums tracking-tight ${text}`}>
          {formatEuro(price)}
        </p>
      </div>
      {featured ? (
        <p className="mt-3 text-[12px] opacity-70">Recommended for most homeowners</p>
      ) : null}
    </div>
  )
}
