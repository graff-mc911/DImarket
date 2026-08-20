---
name: crew-payroll-tracker
description: Use this skill whenever Ivan Sovban reports hours worked by himself or his crew (names like Іван, Паша, Владік, Томаш, or others) on a job site, or asks about monthly income, payroll, or net income after expenses — triggers include "години", "оплата", "зарплата", "дохід за місяць", "скільки заробили", or a message listing a worker, a site, and hours/days. Updates a running payroll and income tracker in the same format as his "SCWOI Light" spreadsheet.
---

# Crew Payroll & Income Tracker

This skill maintains a running log of hours worked per person per site, calculates pay, and rolls it up into monthly income after fixed costs — mirroring Ivan's existing "SCWOI Light" spreadsheet.

## When to use it

Trigger this whenever Ivan reports a day's or week's work (his own or his crew's), e.g. "сьогодні Паша відпрацював 8 годин на праксіс за ставкою 30", or asks for a monthly income summary. He may report entries informally, in a batch, or even as a photo of a handwritten note.

## Data model (matches his existing sheet)

Columns per entry: Дата (date) | Роботодавець (worker name) | Об'єкт (site/job) | quantity type (h / d / m² / m³ / lm / pcs) | Кількість (quantity) | Ставка (rate) | Брутто (gross = quantity × rate) | Податок % (tax %, if applicable) | Нетто (net) | Інші доходи (other income) | Підсумкова сума (running total) | Статус (Paid ✔ / Unpaid) | Примітки (notes)

Summary section: Місячний дохід (monthly income) | Річний дохід (annual income, running) | Комунальні витрати / місяць (monthly utilities) | Кредит / місяць (monthly loan payment) | Чистий дохід після всіх витрат (net income after all expenses)

## Workflow

1. **Capture the entry.** From Ivan's message (text or photo), extract: date, worker name, site/object, quantity + unit, and rate (ask if the rate isn't given and isn't already known for that worker/site from a prior entry).
2. **Calculate.** Gross = quantity × rate. Net = Gross minus any tax/deductions Ivan specifies (default: no deduction unless he says otherwise). Mark status as "✔ Paid" only if Ivan confirms payment was made, otherwise "Unpaid".
3. **Update the running sheet.** Append the new row(s) to the tracker spreadsheet (create one in the same layout if this is the first entry of a new month/project). Recalculate Місячний дохід as the sum of the current month's Підсумкова сума, and Чистий дохід after subtracting Комунальні витрати and Кредит (use the fixed amounts Ivan has previously given, or ask once and remember).
4. **Report back.** Give Ivan a short plain-language summary after each update — e.g. "Додав: Паша, 8 год на праксіс, 240€ брутто. Місячний дохід тепер 2 622€, чистий дохід після витрат — 1 422€" — plus the updated file.
5. **Deliver.** Use the xlsx skill to produce/update the spreadsheet, send it with SendUserFile, and offer to save it back into the same Drive location as his current tracker (keeping one running file per month or per year, matching his existing habit).

## Notes

- Don't invent rates or worker names — always confirm with Ivan the first time a new worker or rate appears, then reuse it automatically for that worker afterward unless he corrects it.
- If Ivan sends several days at once, process them all in one pass and give one combined summary rather than one message per entry.
