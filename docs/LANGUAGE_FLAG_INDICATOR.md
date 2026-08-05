# Language flag indicator — report

## Goal
Header (and synced surfaces) show the **interface language** as a circular flag + ISO-style code (`🇺🇦 UK`, `🇬🇧 EN`), not the user’s country.

## Files modified
| File | Change |
|------|--------|
| `src/lib/languageDisplay.ts` | **New** — flag emoji + display codes (`uk`→`UK`, `en`→`EN`) |
| `src/components/LanguageFlag.tsx` | **New** — circular Twemoji flag (default 24×24) |
| `src/components/LanguageSelector.tsx` | **New** — accessible listbox (flag + native name + code) |
| `src/components/Header.tsx` | Desktop + mobile language UI → `LanguageSelector` |
| `src/components/Footer.tsx` | Language chips → flag + code + name |
| `src/pages/Settings.tsx` | Options show flag/name/code; sync with AppContext language |
| `src/pages/Login.tsx` / `Register.tsx` | Same selector |
| `src/index.css` | Styles for flag, selector, footer chips |

## Language state
- **Source of truth:** `AppContext` (`language` / `setLanguage`)
- **Persistence:** `localStorage` key `dimarket_language` (unchanged)
- Switch updates `document.documentElement.lang` / `dir` via existing context effects
- No full page reload — React re-renders via `t()` / `language.code`

## Verification
- `tsc --noEmit` passes
- Display codes: Ukrainian → **UK** (flag 🇺🇦), English → **EN** (flag 🇬🇧)
- Header / footer / settings / login / register all call `setLanguage` from the same context
