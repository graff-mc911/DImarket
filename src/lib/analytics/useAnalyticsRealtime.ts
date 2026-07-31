import { useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { analyticsCacheInvalidate } from './cache'

const TABLES = [
  'listings',
  'quotes',
  'reviews',
  'profile_view_events',
  'search_events',
  'payments',
  'project_applications',
] as const

/**
 * Subscribe to Supabase Realtime and invoke onChange (debounced) for live dashboards.
 */
export function useAnalyticsRealtime(
  enabled: boolean,
  onChange: () => void,
  channelName = 'analytics-live',
) {
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const bump = () => {
      analyticsCacheInvalidate()
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => cb.current(), 600)
    }

    const channel = supabase.channel(channelName)
    for (const table of TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => bump(),
      )
    }
    channel.subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [enabled, channelName])
}
