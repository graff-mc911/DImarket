/** Curated official-source pointer markdown — no invented legal clauses. */

export function buildOfficialPointerMarkdown(input: {
  sourceName: string
  sourceUrl: string
  jurisdiction?: string | null
}): string {
  const place = input.jurisdiction?.trim()
  const intro = place
    ? `Informational entry for **${place}**. DImarket does **not** host the full legal text.`
    : 'DImarket does **not** host the full legal text.'

  return `# Official source pointer

${intro} Open the official source below for the authoritative version.

## Official source
- **${input.sourceName}**
- ${input.sourceUrl}

Always verify against the official publication on the date you rely on this information.

> Informational entry point only — not legal advice. No silent AI rewrite.`
}

export const POINTER_VERSION_NUMBER = '2026.08-pointer'
