---
name: dimarket-bug-compiler
description: Use this skill when Ivan Sovban shares one or more screenshots or a screen recording from testing his Dimarket app (the construction-marketplace app he's building) and wants the issues documented — triggers include "баг", "помилка", "не працює", "ось скріни", "додай в репорт", or a batch of screenshots showing app errors, broken flows, or unexpected behavior. Produces one structured bug report from a pile of loose screenshots.
---

# Dimarket Bug Report Compiler

This skill turns a batch of raw screenshots or a screen recording from testing the Dimarket app into a single, structured bug report — instead of leaving dozens of unlabeled PNGs sitting loose in Drive, as currently happens.

## When to use it

Trigger this whenever Ivan drops in screenshots from testing Dimarket (web or app), describes something broken while showing an image, or shares a screen recording (.mp4/.mov) of a bug happening. He often tests in Ukrainian UI, so screenshots may contain Ukrainian error text.

## Workflow

1. **Read each screenshot/recording.** For each image, identify: what screen/flow it shows (e.g. onboarding, job posting, account deletion, professional profile), what error or unexpected behavior is visible (read any on-screen error text verbatim), and the approximate severity — blocking (can't proceed at all), major (feature broken but app usable), or minor (cosmetic/UX issue). For a video, describe the sequence of actions that leads to the bug.

2. **Group and de-duplicate.** If multiple screenshots show the same underlying issue (e.g. the same "page could not be loaded" error appearing in several places), group them under one bug entry rather than listing each image separately.

3. **Write the report.** For each distinct bug, produce an entry with:
   - Title (short, specific — e.g. "Account deletion confirmation triggers 'invalid JS MIME type' error")
   - Screen / flow affected
   - Steps to reproduce (inferred from the screenshot sequence/context, or ask Ivan if unclear)
   - Expected vs. actual behavior
   - Severity (blocking / major / minor)
   - The relevant screenshot(s), embedded or referenced by filename
   - Date first observed (from the file's metadata/timestamp)

4. **Output.** Default to a Google Doc or Markdown report titled `Dimarket_Bug_Report_<date>`. If Ivan wants it developer-ready, offer to instead file each bug as a GitHub Issue on his `dimarket` repo (github.com/graff-mc911/dimarket), using the same title/repro/severity structure.

5. **Deliver.** Send the report with SendUserFile (or confirm the GitHub issues were created), and ask whether the original loose screenshots in Drive should be moved into a dated "Dimarket QA" subfolder now that they're captured in the report, so the Drive root stays clean.

## Notes

- Don't guess at root causes — describe symptoms and reproduction steps only; leave diagnosis to whoever fixes it.
- If a screenshot is ambiguous (e.g. just a normal-looking screen with no obvious error), ask Ivan what specifically was wrong rather than inventing an issue.
