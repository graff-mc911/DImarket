import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PRESENCE_CHANNEL = 'dimarket-online-visitors'

function presenceSessionKey(): string {
  const key = 'dimarket_presence_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

function countPresence(channel: ReturnType<typeof supabase.channel>): number {
  const state = channel.presenceState()
  const n = Object.keys(state).length
  return n > 0 ? n : 1
}

/** Кількість відвідувачів на сайті зараз (Supabase Realtime presence). */
export function useOnlineVisitors(): number {
  const [onlineCount, setOnlineCount] = useState(1)

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: presenceSessionKey() } },
    })

    const sync = () => setOnlineCount(countPresence(channel))

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
          sync()
        }
      })

    return () => {
      void channel.untrack()
      void supabase.removeChannel(channel)
    }
  }, [])

  return onlineCount
}
