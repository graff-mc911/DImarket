# Новий домен для DImarket (через Vercel)

Старий `dimarket.market` (Name.com + NS1/Bolt) важко прив’язати. Простіше **купити новий** у Vercel — DNS і SSL налаштуються автоматично.

## Вільні домени (перевірено, 21.05.2026)

| Домен | Перший рік | Примітка |
|-------|------------|----------|
| **dimarket.site** | **$1.99** | рекомендовано — дешево, коротко |
| **dimarket.store** | **$1.99** | для маркетплейсу |
| **dimarket.website** | **$1.99** | |
| **dimarket.shop** | **$2.99** | |
| **dimarket.pro** | **$4.99** | |
| **dimarket.app** | **$9.99** | |
| **getdimarket.com** | **$11.25** | .com, зайве «get» |
| **mydimarket.com** | **$11.25** | |
| **dimarket.net** | **$13.50** | |

**Зайняті / недоступні:** `dimarket.com`, `dimarket.io`, `dimarket.online`

## Купівля (ви в терміналі або в браузері)

### Варіант A — Vercel Dashboard

1. https://vercel.com/dashboard/domains  
2. Пошук: `dimarket.site` (або інший з таблиці)  
3. **Buy** → оплата карткою в акаунті Vercel  
4. Після покупки: **Add to Project** → **dimarket** → Production  

### Варіант B — термінал (інтерактивно)

```powershell
cd C:\Users\PC\Documents\DImarket
npx vercel domains buy dimarket.site
```

Підтвердіть ціну, auto-renew, контактні дані реєстранта.

## Після покупки

1. Vercel → **dimarket** → **Settings → Domains** → додати новий домен як **Production**  
2. (Опційно) редірект `www` → apex або навпаки  
3. У коді оновити canonical/OG URLs у `index.html` — напишіть агенту новий домен  
4. Старий `dimarket.market` можна залишити або не продовжувати на Name.com  

## Рекомендація

**`dimarket.site`** — ~$2 за перший рік, одразу працює з Vercel без Name.com/NS1.
