import { adminAiApi, type AdminAiAlert } from './adminAiApi'

let alertListeners: ((alerts: AdminAiAlert[]) => void)[] = []

export function subscribeAdminAlerts(cb: (alerts: AdminAiAlert[]) => void) {
  alertListeners.push(cb)
  return () => {
    alertListeners = alertListeners.filter((l) => l !== cb)
  }
}

function emit(alerts: AdminAiAlert[]) {
  alertListeners.forEach((l) => l(alerts))
}

export async function runSystemHealthCheck(): Promise<AdminAiAlert[]> {
  try {
    const health = await adminAiApi.health()
    if (health.ok) return []
    return health.alerts.map((msg, i) => ({
      id: `health-${Date.now()}-${i}`,
      message: msg,
      severity: msg.startsWith('🚨') ? 'error' : 'warning',
      timestamp: Date.now(),
    }))
  } catch {
    return [{
      id: `health-err-${Date.now()}`,
      message: '🚨 Не вдалося перевірити стан системи.',
      severity: 'error',
      timestamp: Date.now(),
    }]
  }
}

export function startSystemMonitor(intervalMs = 300000) {
  let timer: ReturnType<typeof setInterval> | null = null

  const tick = async () => {
    const alerts = await runSystemHealthCheck()
    if (alerts.length) emit(alerts)
  }

  void tick()
  timer = setInterval(() => void tick(), intervalMs)

  return () => {
    if (timer) clearInterval(timer)
  }
}
