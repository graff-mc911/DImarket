import { useCallback, useEffect, useState } from 'react'
import type { DashboardRole } from '../lib/dashboard/roles'
import { parseSection } from '../lib/dashboard/nav'

function readSectionParam(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('section')
  } catch {
    return null
  }
}

/** Sync dashboard section with `?section=` without remounting the app router. */
export function useDashboardSection(role: DashboardRole, basePath: string) {
  const [section, setSectionState] = useState(() => parseSection(role, readSectionParam()))

  useEffect(() => {
    const onPop = () => setSectionState(parseSection(role, readSectionParam()))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [role])

  const setSection = useCallback(
    (next: string) => {
      const id = parseSection(role, next)
      setSectionState(id)
      const url = new URL(window.location.href)
      url.pathname = basePath
      if (id === 'overview') url.searchParams.delete('section')
      else url.searchParams.set('section', id)
      window.history.replaceState({}, '', `${url.pathname}${url.search}`)
    },
    [role, basePath],
  )

  return { section, setSection }
}
