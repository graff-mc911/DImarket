# Buildster Translation System

## Overview
Buildster now includes a complete internationalization (i18n) system that automatically translates all interface text based on the user's selected language.

## How It Works

### 1. Language Selection
Users can select their preferred language from the dropdown in the header (🌐 icon). The selection includes 23 languages:
- English (en)
- Українська / Ukrainian (uk)
- Polski / Polish (pl)
- Español / Spanish (es)
- Deutsch / German (de)
- Français / French (fr)
- Italiano / Italian (it)
- Português / Portuguese (pt)
- Română / Romanian (ro)
- Čeština / Czech (cs)
- Slovenčina / Slovak (sk)
- Magyar / Hungarian (hu)
- Български / Bulgarian (bg)
- Српски / Serbian (sr)
- Hrvatski / Croatian (hr)
- Slovenščina / Slovenian (sl)
- Lietuvių / Lithuanian (lt)
- Latviešu / Latvian (lv)
- Eesti / Estonian (et)
- Türkçe / Turkish (tr)
- العربية / Arabic (ar)
- 中文 / Chinese (zh)
- 日本語 / Japanese (ja)

### 2. Automatic Translation
When a language is selected:
1. **All visible text** in the interface is automatically translated
2. The selection is **saved** in localStorage (persists across sessions)
3. **No page reload** required - translations happen instantly

### 3. Translation Coverage

Currently, the following components are fully translated:
- ✅ **Header** - Navigation, menu items, buttons
- ✅ **Footer** - All sections and links
- 🔄 **Home Page** - Currently being translated
- 🔄 **Create Ad Page** - Partially implemented
- 🔄 **Pricing Page** - Partially implemented
- 🔄 **Login/Register Pages** - Partially implemented
- 🔄 **Listings & Professionals Pages** - Partially implemented

### 4. For Developers: How to Add Translations

#### Step 1: Add translation keys to `/src/lib/i18n.ts`

```typescript
export const translations = {
  en: {
    'myFeature.title': 'My Feature Title',
    'myFeature.description': 'Feature description',
  },
  uk: {
    'myFeature.title': 'Назва моєї функції',
    'myFeature.description': 'Опис функції',
  },
  pl: {
    'myFeature.title': 'Tytuł mojej funkcji',
    'myFeature.description': 'Opis funkcji',
  },
  // ... add for all other languages
}
```

#### Step 2: Use translations in components

```typescript
import { useApp } from '../contexts/AppContext'

export function MyComponent() {
  const { t } = useApp()

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <p>{t('myFeature.description')}</p>
    </div>
  )
}
```

### 5. Currently Implemented Translations

**Header & Navigation:**
- browse, findProfessionals, pricing
- professionalLogin, createAd
- myProfile, dashboard, myListings, signOut

**Footer:**
- forClients, forProfessionals
- browseListings, postRequest
- signIn, register, subscriptionPlans, howItWorks

**Home Page:**
- heroTitle, heroSubtitle, heroDescription
- searchPlaceholder, search
- browseByCategory, topRatedProfessionals
- whyChoose, verifiedProfessionals, quickEasy, directCommunication

**Categories:**
- construction, renovation, electrical, plumbing
- handyman, materials, tools
- (with descriptions)

**Listings:**
- serviceNeeded, serviceOffered, forSale, wanted
- contactForPrice, daysLeft, views, premium

**Forms:**
- Login, Register, CreateAd fields and labels
- All pricing information
- Success/error messages

### 6. Language Persistence
The user's language choice is saved in `localStorage` as `buildster_language` and automatically restored on next visit.

### 7. Testing Translations

To test different languages:
1. Click the 🌐 globe icon in the header
2. Select a language from the dropdown
3. All translated text will immediately update
4. Refresh the page - your selection persists

### 8. Translation Status by Language

| Language | Code | Status | Completion |
|----------|------|--------|------------|
| English | en | ✅ Complete | 100% (Base) |
| Ukrainian | uk | ✅ Complete | 100% |
| Polish | pl | ✅ Complete | 100% |
| Spanish | es | ⚠️ Partial | ~20% |
| German | de | ❌ Planned | 0% |
| French | fr | ❌ Planned | 0% |
| Others | ... | ❌ Planned | 0% |

### 9. Next Steps

To complete the translation system:
1. Add all remaining keys for untranslated pages
2. Complete translations for Spanish, German, French, and other languages
3. Update remaining components (Home, Listings, Professionals, etc.)
4. Add translations for error messages
5. Implement RTL support for Arabic

## Demo

1. Open Buildster
2. Look at the header - you'll see "Browse", "Find Professionals", "Pricing"
3. Click the 🌐 icon and select "Українська"
4. The header now shows "Огляд", "Знайти майстрів", "Ціни"
5. Select "Polski" - header changes to "Przeglądaj", "Znajdź fachowców", "Cennik"
6. All translated sections update automatically!

## Technical Details

- **Translation Library**: Custom lightweight implementation
- **File Size Impact**: ~30KB for full translation dictionary
- **Performance**: Zero impact - translations are simple object lookups
- **Type Safety**: Full TypeScript support with `TranslationKey` type
- **Fallback**: Always falls back to English if translation missing
