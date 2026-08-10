export function slugifyCommercial(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'profile'}-${suffix}`
}
