---
name: construction-quote-builder
description: Use this skill whenever Ivan Sovban asks for a construction/renovation quote, cost estimate, or invoice for a job in Germany — triggers include "quote", "estimate", "invoice", "кошторис", "рахунок", "прайс", "порахуй роботу", or a description of renovation work (drywall, painting, flooring, wallpaper, demolition) with an amount of m²/m³/h/lm/pcs. Produces a line-itemized document in Ivan's existing SKB-style format with 19% German VAT applied.
---

# Construction Quote / Invoice Builder

This skill turns a plain-language description of renovation work into a finished, itemized quote or invoice, in the same format Ivan already uses in his Drive (see his "SKB Light" / "SKB App" spreadsheets): Client, Date, Document No., line items with quantity type (m²/m³/ft²/h/lm/pcs), unit price, line total, Total Net, 19% VAT, Total Gross, and price-per-m² summaries.

## When to use it

Trigger this whenever Ivan describes renovation/construction work and wants a price, a quote to send a client, or an invoice for completed work. Examples: "зроби кошторис: гіпсокартонна стіна 18м², фарбування стелі 24м² в 2 шари, ламінат 30м²" or "виставь рахунок клієнту Petro за минулий тиждень: 40 годин".

## Workflow

1. **Gather the essentials.** Ask only for what's missing:
   - Client name
   - Date (default: today)
   - Document number (default: DDMMYY-01 style, matching his existing convention, incrementing if he tells you the last number used)
   - Quote vs. invoice (quote = estimate before work; invoice = bill for work done/in progress)
   - The list of work items, each with a quantity and unit (m², m³, h, lm, pcs)

2. **Price each line item.** Look up `references/rate_card_germany_2025.md` for Ivan's standard German 2025 rates. Use the midpoint of the listed range as the default unit price. If Ivan gives an explicit price for an item, always use his number instead. If an item isn't in the rate card, ask him for the rate rather than guessing — note it as "rate TBD" if he's not available to answer.

3. **Calculate.**
   - Line total = quantity × unit price
   - Total (Net) = sum of line totals
   - Tax = Total Net × 19% (unless Ivan specifies a different VAT rate)
   - Total (Gross) = Total Net + Tax
   - If a total project area is given or derivable, also show Net and Gross price per m²

4. **Build the output.** Use the xlsx skill to produce a spreadsheet matching this column layout (mirroring his existing files):
   - Header rows: Client / Date / Document No.
   - Table: Description | Quantity (m²/m³/ft²/h/lm/pcs) | Price | Total
   - Footer rows: Total (Net) Netto | м² Netto S | Tax (%) MwSt 19% | Total (Gross) Brutto | м² Brutto S | Total Project Area
   - Name the file `<ClientName>_<DocumentNo>.xlsx`

5. **Deliver.** Send the finished file with SendUserFile. Offer to also save it into his "SKBLight" Drive folder (or wherever he keeps quotes) using the Google Drive tools, keeping the same naming pattern as his existing files there.

## Notes

- Always show your line-item math plainly so Ivan can sanity-check it before sending anything to a client.
- If he later gives you a correction to a rate, treat that as an update worth remembering for next time — mention it back to him so he can confirm it should become the new default.
