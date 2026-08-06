# Categories — Source of Truth

**Updated:** 2026-08-06  
**Companion:** `docs/ARCHITECTURE_SSOT.md`

---

## Active Categories Source (Home page cards)

```
src/config/categories.ts  →  export const serviceCategories
```

### Runtime chain

```
Home.tsx
  → fetchHomeMarketplaceData()           // fetches Supabase categories
  → MainCategoriesSection
       ⚠ still paints serviceCategories (static Serviya)
       ✓ Labels → categoriesI18n.ts
       ✓ Subcategory → serviceTaxonomy.ts
```

**Conclusion:** Home cards are still static Serviya. Supabase fetch is unused for this section paint.

---

## Parallel systems

| # | System | File(s) | Used by |
|---|--------|---------|---------|
| 1 | Home cards (ACTIVE) | `config/categories.ts` | `MainCategoriesSection` |
| 2 | Supabase mains | `marketplaceCategories.ts` + DB | Mega-menu, `/category/:slug`, Search |
| 3 | Site chrome | `siteCategories.ts` | Professionals, listings paths |
| 4 | Work catalog | `categoryCatalog.ts` + `*WorkGroups.ts` | Create ad, settings |
| 5 | Matching helpers | `categoryMatching.ts` | Prefix / loose work-slug match |

---

## Alias conflicts (same concept, different IDs)

| Concept | Serviya | Site / DB |
|---------|---------|-----------|
| Buy & Sell | `buy-sell` | `sell-rent` |
| Jobs | `jobs` | `vacancies` |
| Legal | `legal-services` | `legal-notary` |
| Auto | `automotive` | `electrical` |
| Handyman | `home-services` | `handyman` |

---

## Consolidation status (2026-08-06)

- [x] `categoryMatching.ts` — shared `matchesWorkPrefix` / `matchesWorkLoose`
- [x] Professionals + marketplace category pages use matching helpers
- [x] Telegram bot icons synced to `SITE_CATEGORY_CONFIG` (handyman 🛠️, sell-rent 🛒)
- [ ] Home cards consume DB mains via adapter (next phase — behavior-preserving)
- [ ] Collapse Serviya i18n into DB / one slug map after Home migration

---

## Recommended end state

1. **Browsable mains:** Supabase only (`marketplaceCategories.ts`).
2. **Home:** adapter over DB (+ explicit Serviya→site alias map until URLs unify).
3. **Work catalog:** stays for listing specialization.
4. **Matching:** only `categoryMatching` + `serviceTaxonomy` matchers.
5. Until Home migrates: edit Home only via `categories.ts` + `categoriesI18n.ts` + `serviceTaxonomy`.
