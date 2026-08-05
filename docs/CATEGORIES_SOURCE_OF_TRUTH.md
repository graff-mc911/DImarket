# Categories — Source of Truth Audit

**Date:** 2026-08-05  
**Branch:** `cursor/categories-audit-buy-sell-jobs-81bd`  
**Mode:** Audit first, then change only the active Home source.

---

## Active Categories Source (Home page cards)

```
src/config/categories.ts  →  export const serviceCategories
```

### Runtime chain (verified by reading code, not assumptions)

```
index.html
  → src/main.tsx
    → src/App.tsx  (route `/` → <Home />)
      → src/pages/Home.tsx
        → fetchHomeMarketplaceData()           // fetches Supabase categories
        → <HomeCategoriesPreview categories={...} />
          → <MainCategoriesSection ... />
               ⚠ IGNORES props `categories` / `loading` / `showSearch`
               ✓ Renders `serviceCategories` from src/config/categories.ts
               ✓ Labels via serviyaLabel() → src/config/categoriesI18n.ts
               ✓ Subcategory click → servicesPath() → src/lib/serviceTaxonomy.ts
```

**Conclusion:** Home Categories cards are **static Serviya config**. The Supabase fetch on Home is unused for painting this section.

---

## Parallel systems (STOP conflict)

| # | System | File(s) | Used by |
|---|--------|---------|---------|
| 1 | **Home cards (ACTIVE)** | `src/config/categories.ts` (`serviceCategories`) | `MainCategoriesSection` (Home) |
| 2 | **Supabase mains** | `src/lib/marketplaceCategories.ts` + DB `categories` | Header mega-menu, `/category/:slug`, Search |
| 3 | **Header quick tiles** | `src/lib/homeCategoryTiles.ts` + `siteCategories.ts` + `categoryCatalog.ts` | Header only |
| 4 | **Listing work groups** | `*WorkGroups.ts` → `categoryCatalog.ts` | Create ad, settings, matching |

These three UI surfaces are **not the same taxonomy**. Editing one does not update the others.

---

## Dead / never-imported files (recommend delete later)

| File | Status |
|------|--------|
| `src/components/ChooseCategorySection.tsx` | Never imported |
| `src/components/CategoryCircleTile.tsx` | Never imported |
| `src/components/CategoryCard.tsx` | Deprecated; no consumers |
| `src/components/home/HomeCategoryCard.tsx` | Exported but unused |
| `src/lib/homeFeaturedWorkTypes.ts` | Never imported |

**Do not edit these for category changes.**

---

## Recommended Single Source of Truth (next refactor)

1. **Browsable mains/services:** Supabase `categories` via `marketplaceCategories.ts` only.  
2. **Home `MainCategoriesSection`:** must consume the same API (or a thin adapter), not a second static list.  
3. **Work-slug catalog** stays as listing/profile specialization keyed by DB slugs.  
4. Until then: **Home edits go only to `src/config/categories.ts` + `categoriesI18n.ts` + `serviceTaxonomy.ts` routing.**

---

## Buy & Sell / Jobs (this change)

Added as top-level cards in **active** `serviceCategories`:

| Card | Icon | Routes to |
|------|------|-----------|
| Buy & Sell | 🛒 | `/sell-rent` (alias `/buy-sell`) |
| Jobs | 💼 | `/vacancies` (alias `/jobs`) |

Also updated `siteCategories` labels and Header tile labels; mega-menu gets injected quick entries so Navigation shows them without waiting for a DB seed.

---

## Verification checklist

- [x] Active source identified before edits
- [x] Dead files not modified for this feature
- [x] Home shows Buy & Sell + Jobs (`serviceCategories`)
- [x] Click opens `/sell-rent` / `/vacancies` (aliases `/buy-sell`, `/jobs`)
- [x] i18n (en/uk + Serviya label maps)
- [x] Header tiles + mega-menu quick links
- [x] Typecheck passes (`tsc --noEmit`)

## Files modified

- `docs/CATEGORIES_SOURCE_OF_TRUTH.md` (audit report)
- `src/config/categories.ts` (active Home source — added Buy & Sell, Jobs)
- `src/config/categoriesI18n.ts`
- `src/components/MainCategoriesSection.tsx`
- `src/components/CategoriesMegaMenu.tsx`
- `src/lib/serviceTaxonomy.ts`
- `src/lib/siteCategories.ts`
- `src/lib/Translations/en.ts`, `uk.ts`
- `src/App.tsx` (route aliases)