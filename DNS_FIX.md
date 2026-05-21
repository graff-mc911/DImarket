# DNS для dimarket.market — чому не відкривається

## Діагноз

| URL | Статус |
|-----|--------|
| `dimarket-5w4cm3pd4-...vercel.app` | працює (сайт на Vercel OK) |
| `dimarket.market` / `www.dimarket.market` | **не працюють** — DNS не вказує на Vercel |

Vercel показує: **`misconfigured: true`**

- Nameservers зараз: **NS1** (`dns1.p07.nsone.net` …), не Vercel
- У публічному DNS **немає** A/CNAME на Vercel (`nslookup` — порожньо / domain not found)

Сайт зібраний правильно; потрібно лише **налаштувати DNS** у реєстратора / NS1.

---

## Варіант A (рекомендовано): записи в NS1 / у реєстратора домену

У панелі, де керуєте DNS для `dimarket.market` (NS1 або реєстратор), додайте:

| Тип | Ім’я (Host) | Значення | TTL |
|-----|-------------|----------|-----|
| **A** | `@` (або порожньо) | `76.76.21.21` | 300–3600 |
| **CNAME** | `www` | `cname.vercel-dns.com` | 300–3600 |

Або для `www` можна A-запис: `76.76.21.21` (як радить Vercel CLI).

Після збереження зачекайте **5–30 хв** (інколи до 24 год).

Перевірка в PowerShell:

```powershell
nslookup dimarket.market
nslookup www.dimarket.market
```

Має з’явитися `76.76.21.21` або CNAME на vercel.

---

## Варіант B: передати DNS на Vercel (простіше надалі)

У **реєстраторі домену** (де купили `dimarket.market`) змініть nameservers на:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Потім у Vercel → Project **dimarket** → **Settings → Domains** — домен стане Valid (зелений).

Записи в Vercel для зони вже є (ALIAS / CAA).

---

## Vercel (після DNS)

- **dimarket.market** → редірект на **www.dimarket.market** (так налаштовано в проєкті)
- Production деплой: `d00d2d9` / `dimarket-5w4cm3pd4`

Посилання: https://vercel.com/ivan-sovban-s-projects/dimarket/settings/domains

---

## Що я не можу зробити без вас

Доступ до **NS1 / реєстратора** (логін пароль) — лише ви можете натиснути «зберегти» DNS-записи.  
Напишіть, де куплений домен (Namecheap, GoDaddy, Hostinger, …) — підкажу точні кліки.
