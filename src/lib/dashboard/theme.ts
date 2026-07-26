export const DASHBOARD_THEME_KEY = 'dimarket_dashboard_theme'

export type DashboardTheme = 'light' | 'dark'

export function loadDashboardTheme(fallbackKey?: string): boolean {
  try {
    const v = localStorage.getItem(DASHBOARD_THEME_KEY) || (fallbackKey ? localStorage.getItem(fallbackKey) : null)
    return v === 'dark'
  } catch {
    return false
  }
}

export function saveDashboardTheme(dark: boolean): void {
  try {
    localStorage.setItem(DASHBOARD_THEME_KEY, dark ? 'dark' : 'light')
  } catch {
    /* ignore */
  }
}

export type DashboardTone = {
  dark: boolean
  page: string
  card: string
  ink: string
  muted: string
  soft: string
  chip: string
  btnGhost: string
  btnPrimary: string
  hoverRow: string
  sidebar: string
  border: string
  input: string
}

export function dashboardTone(dark: boolean): DashboardTone {
  return {
    dark,
    page: dark ? 'bg-[#0a0a0c] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]',
    card: dark
      ? 'rounded-[22px] border border-white/[0.08] bg-white/[0.04]'
      : 'rounded-[22px] border border-[#e8e8ed] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
    ink: dark ? 'text-white' : 'text-[#1d1d1f]',
    muted: dark ? 'text-white/45' : 'text-[#86868b]',
    soft: dark ? 'text-white/70' : 'text-[#6e6e73]',
    chip: dark ? 'bg-white/10 text-white/75' : 'bg-[#f5f5f7] text-[#6e6e73]',
    btnGhost: dark
      ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
      : 'border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]',
    btnPrimary: dark
      ? 'bg-white text-[#0b0b0f] hover:bg-white/90'
      : 'bg-[#1d1d1f] text-white hover:bg-black',
    hoverRow: dark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#fafafa]',
    sidebar: dark
      ? 'border-white/10 bg-[#0b0b0f]/95'
      : 'border-[#e8e8ed] bg-white/95',
    border: dark ? 'border-white/10' : 'border-[#e8e8ed]',
    input: dark
      ? 'border-white/15 bg-white/5 text-white placeholder:text-white/35'
      : 'border-[#e8e8ed] bg-[#fafafa] text-[#1d1d1f] placeholder:text-[#aeaeb2]',
  }
}
