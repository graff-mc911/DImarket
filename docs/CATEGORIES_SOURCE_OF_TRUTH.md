# Categories — Source of Truth

**Updated:** 2026-08-14  
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
       ✓ Paints serviceCategories (static Home config)
       ✓ Labels → dimarketLabel() in categoriesI18n.ts
       ✓ DB count overlay → homeCategoryAdapter.ts
       ✓ Subcategory paths → serviceTaxonomy.ts
```

**Conclusion:** Home cards are static DImarket config. Supabase fetch enriches counts via `homeCategoryAdapter`.

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

| Concept | Home card | Site / DB |
|---------|-----------|-----------|
| Buy & Sell | `buy-sell` | `sell-rent` |
| Jobs | `jobs` | `vacancies` |
| Legal | `legal-services` | `legal-notary` |
| Auto | `automotive` | `electrical` |
| Handyman | `home-services` | `handyman` |

---

## Consolidation status (2026-08-14)

- [x] `categoryMatching.ts` — shared `matchesWorkPrefix` / `matchesWorkLoose`
- [x] Professionals + marketplace category pages use matching helpers
- [x] Telegram bot icons synced to `SITE_CATEGORY_CONFIG` (handyman 🛠️, sell-rent 🛒)
- [x] `homeCategoryAdapter.ts` — Home ↔ site/DB alias map; Home uses DB counts via props
- [x] Header dept secondary links from `navMap` (`header-dept-extra`)
- [x] i18n keys renamed `serviya.*` → `dimarket.*`; CSS BEM `dimarket-*`
- [ ] Replace Home paint tree with DB mains entirely (would drop marketing-only cards)
- [ ] Collapse Home i18n into DB / one slug map after full Home migration

---

## Recommended end state

1. **Browsable mains:** Supabase only (`marketplaceCategories.ts`).
2. **Home:** adapter over DB (+ explicit Home→site alias map until URLs unify).
3. **Work catalog:** stays for listing specialization.
4. **Matching:** only `categoryMatching` + `serviceTaxonomy` matchers.
5. Until Home migrates: edit Home only via `categories.ts` + `categoriesI18n.ts` + `serviceTaxonomy`.

---

## Top-level Home cards (Buy & Sell, Jobs)

| Card | Icon | Routes to |
|------|------|-----------|
| Buy & Sell | 🛒 | `/sell-rent` (alias `/buy-sell`) |
| Jobs | 💼 | `/vacancies` (alias `/jobs`) |

Also updated `siteCategories` labels and Header tile labels; mega-menu gets injected quick entries so Navigation shows them without waiting for a DB seed.
