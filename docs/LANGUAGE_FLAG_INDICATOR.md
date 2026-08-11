# Language flag indicator — report

## Goal
Header (and synced surfaces) show the **interface language** as a circular flag + ISO-style code (`🇺🇦 UA`, `🇬🇧 EN`), not the user’s country.

## Files modified
| File | Change |
|------|--------|
| `src/lib/languageDisplay.ts` | Flag emoji + display codes (`uk`→`UA`, `en`→`EN`); spoken-tag normalizer |
| `src/components/LanguageFlag.tsx` | Circular Twemoji flag (default 24×24) |
| `src/components/LanguageSelector.tsx` | Accessible listbox (flag + native name + code) |
| `src/components/Header.tsx` | Desktop + mobile language UI → `LanguageSelector` |
| `src/components/Footer.tsx` | Language chips → flag + code + name |
| `src/pages/Settings.tsx` | Options show flag/name/code; sync with AppContext language |
| `src/pages/Login.tsx` / `Register.tsx` | Same selector |
| `src/index.css` | Styles for flag, selector, footer chips |

## Convention
| Layer | Ukrainian |
|-------|-----------|
| UI locale file / `document.lang` | `uk` (ISO 639-1) |
| Visible badge in header/footer | **UA** |
| Spoken languages on profiles / CA | **UA** |
| Country United Kingdom | `UK` / `United Kingdom` (unchanged) |

Legacy tags `UK` / `uk` / `ua` in language arrays are normalized to **UA** on display, save, match, and filter.

## Language state
- **Source of truth:** `AppContext` (`language` / `setLanguage`)
- **Persistence:** `localStorage` key `dimarket_language` (unchanged; still stores `uk`)
- Switch updates `document.documentElement.lang` / `dir` via existing context effects
- No full page reload — React re-renders via `t()` / `language.code`

## Verification
- Display codes: Ukrainian → **UA** (flag 🇺🇦), English → **EN** (flag 🇬🇧)
- Header / footer / settings / login / register all call `setLanguage` from the same context
- Optional DB patch: `supabase/migrations/FIX_UKRAINIAN_LANG_CODE_UA.sql`
