import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  campaignMatchesSlot,
  fetchPaidAdCampaigns,
  type AdCampaignWithAdvertiser,
  type AdPlacement,
} from '../lib/adCampaigns'
import { detectViewerCountryOnce, getViewerGeo } from '../lib/viewerGeo'
import { useApp } from './AppContext'

type PaidAdsContextValue = {
  campaigns: AdCampaignWithAdvertiser[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getForSlots: (slots: (AdPlacement | string)[], limit?: number) => AdCampaignWithAdvertiser[]
}

const PaidAdsContext = createContext<PaidAdsContextValue | null>(null)

export function PaidAdsProvider({ children }: { children: ReactNode }) {
  const { profile } = useApp()
  const [campaigns, setCampaigns] = useState<AdCampaignWithAdvertiser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    detectViewerCountryOnce()
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { city, country } = getViewerGeo(profile)
      const paid = await fetchPaidAdCampaigns({
        slots: [],
        limit: 48,
        viewerCity: city,
        viewerCountry: country,
      })
      setCampaigns(paid)
      if (paid.length === 0) {
        console.warn('[ads] No paid campaigns matched filters for public display')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load ads'
      console.error('[ads] PaidAdsProvider:', message)
      setError(message)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    void load()
  }, [load])

  const getForSlots = useCallback(
    (slots: (AdPlacement | string)[], limit = 12) =>
      campaigns
        .filter((c) => slots.some((slot) => campaignMatchesSlot(c, slot)))
        .slice(0, limit),
    [campaigns],
  )

  const value = useMemo(
    () => ({ campaigns, loading, error, refresh: load, getForSlots }),
    [campaigns, loading, error, load, getForSlots],
  )

  return <PaidAdsContext.Provider value={value}>{children}</PaidAdsContext.Provider>
}

export function usePaidAds() {
  const ctx = useContext(PaidAdsContext)
  if (!ctx) {
    throw new Error('usePaidAds must be used within PaidAdsProvider')
  }
  return ctx
}
