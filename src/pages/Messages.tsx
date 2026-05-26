// Messages — premium realtime messenger (Phase 1)
import { useEffect } from 'react'
import { ChatMessenger } from '../components/chat/ChatMessenger'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'

export function Messages() {
  const { user } = useApp()

  useEffect(() => {
    if (!user) navigateTo('/login')
  }, [user])

  if (!user) return null

  return <ChatMessenger />
}
