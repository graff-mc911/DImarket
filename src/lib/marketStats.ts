import { supabase } from './supabase'
import {
  ALL_TRACKED_MARKETS,
  LAUNCH_MARKETS,
  locationMatchesMarket,
  type LaunchMarket,
} from './launchMarkets'

export interface MarketHealthRow {
  market: LaunchMarket
  professionals: number
  companies: number
  activeRequests: number
  activeListings: number
  readinessPercent: number
}

function readinessPercent(
  market: LaunchMarket,
  professionals: number,
  companies: number,
  activeRequests: number,
): number {
  const { seedTargets } = market
  const proScore = Math.min(professionals / seedTargets.professionals, 1)
  const companyScore = Math.min(companies / seedTargets.companies, 1)
  const requestScore = Math.min(activeRequests / seedTargets.requests, 1)
  return Math.round(((proScore + companyScore + requestScore) / 3) * 100)
}

interface ProfileRow {
  location: string | null
  user_role: string | null
}

interface ListingRow {
  location: string
  listing_type: string
  status: string
  expires_at: string
}

export async function fetchMarketHealthRows(
  markets: LaunchMarket[] = ALL_TRACKED_MARKETS,
): Promise<MarketHealthRow[]> {
  const now = new Date().toISOString()

  const [profilesResult, listingsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('location, user_role')
      .eq('is_professional', true),
    supabase
      .from('listings')
      .select('location, listing_type, status, expires_at')
      .eq('status', 'active')
      .gte('expires_at', now),
  ])

  const profiles = (profilesResult.data as ProfileRow[] | null) ?? []
  const listings = (listingsResult.data as ListingRow[] | null) ?? []

  return markets.map((market) => {
    const marketProfiles = profiles.filter((p) =>
      locationMatchesMarket(p.location, market),
    )
    const professionals = marketProfiles.filter(
      (p) => p.user_role !== 'company',
    ).length
    const companies = marketProfiles.filter(
      (p) => p.user_role === 'company',
    ).length
    const marketListings = listings.filter((l) =>
      locationMatchesMarket(l.location, market),
    )
    const activeRequests = marketListings.filter(
      (l) => l.listing_type === 'service_request',
    ).length

    return {
      market,
      professionals,
      companies,
      activeRequests,
      activeListings: marketListings.length,
      readinessPercent: readinessPercent(
        market,
        professionals,
        companies,
        activeRequests,
      ),
    }
  })
}

export async function fetchLaunchMarketHealth(): Promise<MarketHealthRow[]> {
  return fetchMarketHealthRows(LAUNCH_MARKETS)
}
