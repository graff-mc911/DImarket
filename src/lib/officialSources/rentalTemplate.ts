/** Informational rental agreement skeleton — never auto-publish, no invented legal clauses. */

export function buildRentalTemplateMarkdown(input: {
  countryName: string
  landlordLabel?: string
  tenantLabel?: string
  currency?: string
}): string {
  const landlord = input.landlordLabel ?? 'Landlord'
  const tenant = input.tenantLabel ?? 'Tenant'
  const currency = input.currency ?? 'EUR'

  return `# Residential rental agreement — informational template (${input.countryName})

> **Not legal advice.** Verify every clause against the official source for ${input.countryName} before use. DImarket does not guarantee legal correctness.

## Parties
- **${landlord}:** [Full legal name, ID, address]
- **${tenant}:** [Full legal name, ID, address]

## Property
- **Address:** [Full address]
- **Registry reference (if known):** [Cadastral / land registry ID]

## Term
- **Start date:** [YYYY-MM-DD]
- **End date / duration:** [Fixed term or indefinite — verify at official source]
- **Notice period:** [Per current official rules — verify at source]

## Rent and payments
- **Monthly rent (${currency}):** [Amount]
- **Payment method / due date:** [Bank transfer, day of month]
- **Deposit:** [Amount — verify legal limits at official source]

## Official verification
Before signing, confirm current requirements at the official source linked on this document.

---
*Template structure for data entry only. Publish after admin review.*`
}

export const RENTAL_DRAFT_VERSION = '2026.08-draft'
