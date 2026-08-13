/** Build auto-draft markdown when official source hash changes — never auto-publish. */

export function autoDraftVersionNumber(at: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `auto-${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}-${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}`
}

export function buildAutoDraftMarkdown(input: {
  documentTitle: string
  sourceName: string
  sourceUrl: string
  changeId: string
  oldHash: string | null
  newHash: string | null
  oldExcerpt: string | null
  newExcerpt: string | null
}): string {
  const oldSnap = input.oldExcerpt?.trim() || '_(no previous snapshot)_'
  const newSnap = input.newExcerpt?.trim() || '_(empty snapshot)_'

  return `# Auto-draft — ${input.documentTitle}

> **NOT published.** DImarket detected a change at the official source. Edit manually and publish only after legal review. No silent AI rewrite.

## Official source
- **${input.sourceName}**
- ${input.sourceUrl}

## Change reference
- Change ID: \`${input.changeId}\`
- Previous hash: \`${input.oldHash ?? '—'}\`
- New hash: \`${input.newHash ?? '—'}\`

## Previous excerpt (normalized)
\`\`\`
${oldSnap.slice(0, 800)}
\`\`\`

## New excerpt (normalized)
\`\`\`
${newSnap.slice(0, 800)}
\`\`\`

## Next steps
1. Open the official source and verify what changed.
2. Update this draft with accurate informational content.
3. Publish from admin only after review.`
}

export function isAutoDraftVersion(versionNumber: string): boolean {
  return versionNumber.startsWith('auto-')
}
