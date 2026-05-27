import { useCallback, useEffect, useRef, useState } from 'react'
import {
  adminAiApi,
  parseLocalShortcut,
  type AdminAiAlert,
  type AdminAiMessage,
} from '../lib/adminAI/adminAiApi'
import { runLocalAdminCommand } from '../lib/adminAI/localActions'
import { fetchLocalPlatformStats, formatAdminAiInvokeError } from '../lib/adminAI/localStats'
import { startSystemMonitor, subscribeAdminAlerts } from '../lib/adminAI/monitor'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useAdminAI(lang = 'uk-UA') {
  const [messages, setMessages] = useState<AdminAiMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [voiceOut, setVoiceOut] = useState(false)
  const [alerts, setAlerts] = useState<AdminAiAlert[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const cmdHistory = useRef<string[]>([])
  const pendingConfirm = useRef(false)

  useEffect(() => {
    const unsubMonitor = startSystemMonitor()
    const unsubAlerts = subscribeAdminAlerts((incoming) => {
      setAlerts((prev) => [...incoming, ...prev].slice(0, 20))
    })
    return () => {
      unsubMonitor()
      unsubAlerts()
    }
  }, [])

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const sendMessage = useCallback(async (raw: string) => {
    const text = raw.trim()
    if (!text) return

    const localHelp = parseLocalShortcut(text)
    if (localHelp) {
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'user', content: text, timestamp: Date.now() },
        { id: uid(), role: 'assistant', content: localHelp, timestamp: Date.now() },
      ])
      return
    }

    const localAction = await runLocalAdminCommand(text)
    if (localAction) {
      const userMsg: AdminAiMessage = {
        id: uid(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }
      setMessages((m) => [
        ...m,
        userMsg,
        {
          id: uid(),
          role: 'assistant',
          content: localAction.reply,
          table: localAction.table,
          timestamp: Date.now(),
        },
      ])
      return
    }

    if (text.trim().toLowerCase() === '/stats') {
      const userMsg: AdminAiMessage = {
        id: uid(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }
      setMessages((m) => [...m, userMsg])
      setLoading(true)
      try {
        const data = await fetchLocalPlatformStats()
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: data.reply,
            table: data.table,
            timestamp: Date.now(),
          },
        ])
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: formatAdminAiInvokeError(e),
            timestamp: Date.now(),
          },
        ])
      } finally {
        setLoading(false)
      }
      return
    }

    cmdHistory.current = [text, ...cmdHistory.current.filter((c) => c !== text)].slice(0, 50)
    setHistoryIndex(-1)

    const userMsg: AdminAiMessage = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    try {
      const history = messagesRef.current.map((m) => ({ role: m.role, content: m.content }))
      const confirmed = pendingConfirm.current || text.toUpperCase() === 'ПІДТВЕРДЖУЮ'
      const data = await adminAiApi.chat(text, history, confirmed)

      if (data.pendingConfirmation) {
        pendingConfirm.current = true
      } else {
        pendingConfirm.current = false
      }

      const assistantMsg: AdminAiMessage = {
        id: uid(),
        role: 'assistant',
        content: data.reply,
        table: data.table,
        timestamp: Date.now(),
      }
      setMessages((m) => [...m, assistantMsg])

      if (voiceOut) {
        const { speakText } = await import('./useVoiceInput')
        speakText(data.reply, lang)
      }
    } catch (e) {
      const retryLocal = await runLocalAdminCommand(text)
      if (retryLocal) {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: retryLocal.reply,
            table: retryLocal.table,
            timestamp: Date.now(),
          },
        ])
      } else {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            content: formatAdminAiInvokeError(e),
            timestamp: Date.now(),
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }, [voiceOut, lang])

  const navigateHistory = useCallback((dir: 'up' | 'down') => {
    const list = cmdHistory.current
    if (!list.length) return null
    let next = historyIndex
    if (dir === 'up') next = Math.min(next + 1, list.length - 1)
    else next = Math.max(next - 1, -1)
    setHistoryIndex(next)
    return next >= 0 ? list[next] : ''
  }, [historyIndex])

  const dismissAlert = useCallback((id: string) => {
    setAlerts((a) => a.filter((x) => x.id !== id))
  }, [])

  return {
    messages,
    loading,
    expanded,
    setExpanded,
    voiceOut,
    setVoiceOut,
    alerts,
    dismissAlert,
    sendMessage,
    navigateHistory,
    unreadCount: alerts.length,
  }
}
