---
name: consulting-outreach-assistant
description: Use this skill when Ivan Sovban wants help executing his Business Process Optimization / AI Automation consulting launch — writing a LinkedIn post from his content calendar, drafting an outreach or follow-up message to a lead, or updating his lead-tracking CRM sheet. Triggers include "LinkedIn пост", "напиши лід", "outreach", "follow-up", "додай в CRM", or naming a company/contact he wants to reach out to.
---

# Consulting Content & Outreach Assistant

This skill executes Ivan's existing 30-day launch plan for his process/AI-automation consulting offer (see `references/launch_plan.md` for his services, pricing, content calendar, and CRM structure) — turning the plan from a checklist into drafted posts, messages, and an up-to-date lead tracker.

## When to use it

- Ivan asks for a LinkedIn post (by topic number or subject from his calendar, or a new topic in the same spirit)
- Ivan names a lead/company and wants a first-touch or follow-up message drafted
- Ivan reports contact with a lead (sent, replied, call booked, audit done, deal closed) and wants the CRM tracker updated

## Workflow

### Writing a LinkedIn post
1. Pull the topic from `references/launch_plan.md` (or use a new topic Ivan gives you in the same spirit — practical, example-driven, SME/construction-adjacent where natural).
2. Draft a short LinkedIn post (150–250 words, no heavy jargon, one clear takeaway, a light call-to-action such as inviting a DM or comment). Avoid generic AI-hype language; anchor claims in concrete, plausible examples.
3. Show Ivan the draft for approval before treating it as final — don't post on his behalf.

### Drafting outreach or follow-up
1. Ask for (or use what's already known from the CRM tracker): contact name, role, company, industry, and what pain point prompted the outreach.
2. Match the message to the funnel stage: first-touch LinkedIn/email message → offers a specific observation + the Business Process Audit (€250–500) as a low-commitment entry point; follow-up → short, no guilt-tripping, one new angle or question; discovery-call proposal → suggest a 15-minute call.
3. Keep messages short (3–5 sentences), personalized to the lead's specifics, and never invent facts about the lead's company — ask Ivan if key details are missing.

### Updating the CRM tracker
1. When Ivan reports any lead activity, update (or create, using the column structure in `references/launch_plan.md`) his lead-tracking spreadsheet: contact date, response, call/audit/deal status, deal value, next follow-up date, notes.
2. After updating, give a one-line confirmation of what changed and what the next action/date is.
3. Deliver the updated sheet with SendUserFile (via the xlsx skill) and offer to save it back to the same Drive location as the launch-plan file.

## Notes

- This skill drafts; Ivan approves and sends. Never send messages or publish posts autonomously.
- If Ivan wants a batch (e.g. "give me all 10 posts" or "draft outreach for these 5 companies"), produce them all in one pass rather than one at a time.
