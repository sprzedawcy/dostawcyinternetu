# 🔍 ANALIZA PROJEKTU DostawcyInternetu.pl

## 📊 CO MAMY

### ✅ Gotowe i działające:
| Element | Status | Pliki |
|---------|--------|-------|
| Routing `/internet/[miasto]/[ulica]/[numer]` | ✅ OK | `page.tsx` |
| Szukajka adresu z autocomplete | ✅ OK | `SearchManager.tsx` |
| Modal walidacji adresu | ✅ OK | `AddressModal.tsx` |
| Lista ofert z filtrowaniem | ✅ OK | `OffersList.tsx` |
| Strony Miasto/Ulica/Adres | ✅ OK | `*Page.tsx` |
| API KPO Leads | ✅ OK | `route.ts` |
| Sanityzacja inputów | ✅ OK | w komponentach |
| Prisma schema (pełne) | ✅ OK | `schema.prisma` |
| Indeksy bazy danych | ✅ OK | `migration-ALL.sql` |

### ⚠️ Problemy do rozwiązania:

#### 1. **STYLE W KOMPONENTACH (NIE GLOBALNE)**
```tsx
// ❌ Teraz - style inline w każdym pliku:
<div className="bg-gray-50">
<div className="p-5 bg-white rounded-2xl border-2">
<button className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl">
```

#### 2. **DANE HARDCODED W KODZIE**
```tsx
// ❌ Teraz - tekst w komponentach:
"Internet", "Porównaj oferty", "DostawcyInternetu.pl"
"Sprawdź dostępność", "532 274 808"
```

#### 3. **BRAK CDN / CACHE**
- Obrazy ładowane bezpośrednio
- Brak lazy loading
- Brak cache na ofertach/adresach

---

## 🎯 PLAN DZIAŁANIA

### PRIORYTET 1: Style globalne (Tailwind + CSS Vars)

```
src/
├── styles/
│   ├── globals.css         # Bazowe zmienne CSS
│   ├── components.css      # Komponenty wielokrotnego użytku
│   └── themes/
│       └── default.ts      # Konfiguracja tematyczna
├── components/
│   ├── ui/                 # Atomic components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   └── layout/
│       ├── Container.tsx
│       ├── Breadcrumbs.tsx
│       └── Section.tsx
```

**globals.css - zmienne:**
```css
:root {
  /* Kolory brandingu */
  --color-primary: #2563eb;    /* blue-600 */
  --color-primary-dark: #1d4ed8;
  --color-success: #16a34a;    /* green-600 */
  --color-warning: #d97706;    /* amber-600 */
  --color-danger: #dc2626;
  
  /* Oferty */
  --offer-card-bg: #ffffff;
  --offer-card-border: #e5e7eb;
  --offer-featured-border: #facc15;
  
  /* Spacing */
  --section-padding: 2rem;
  --card-padding: 1.25rem;
  
  /* Radiusy */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}
```

---

### PRIORYTET 2: Tabela `ui_content` (teksty z bazy)

```sql
CREATE TABLE ui_content (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value_pl TEXT NOT NULL,
  value_en TEXT,
  value_ua TEXT,
  category VARCHAR(50),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Przykładowe wpisy:
INSERT INTO ui_content (key, value_pl, category) VALUES
('brand.name', 'DostawcyInternetu.pl', 'brand'),
('brand.phone', '532 274 808', 'brand'),
('brand.tagline', 'Porównaj oferty internetu', 'brand'),
('search.title', 'Sprawdź dostępność internetu', 'search'),
('search.button', 'SPRAWDŹ OFERTY', 'search'),
('offer.order_button', 'Zamów teraz', 'offers'),
('offer.check_button', 'Sprawdź dostępność', 'offers'),
('meta.title_template', 'Internet {miasto} - Porównaj oferty | DostawcyInternetu.pl', 'seo'),
('meta.description_template', 'Sprawdź oferty internetu w {miasto}. Porównaj ceny i prędkości.', 'seo');
```

**Użycie w kodzie:**
```tsx
// lib/content.ts
export async function getContent(key: string, locale: string = 'pl') {
  const row = await prisma.uiContent.findUnique({ where: { key } });
  if (!row) return key;
  
  const field = locale === 'en' ? 'value_en' : 
                locale === 'ua' ? 'value_ua' : 'value_pl';
  return row[field] || row.value_pl;
}

// Batch load
export async function getContentBatch(keys: string[], locale: string = 'pl') {
  const rows = await prisma.uiContent.findMany({
    where: { key: { in: keys } }
  });
  // ...
}
```

---

### PRIORYTET 3: CDN + Cache

#### A) Cloudflare (rekomendowane):
```
1. DNS przez Cloudflare
2. Cache Rules:
   - /api/offers/* → 5 min cache
   - /api/coverage/* → 1 hour cache  
   - /images/* → 1 year cache
   - /_next/static/* → immutable
```

#### B) Next.js Image + Statyczne assety:
```tsx
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.dostawcyinternetu.pl'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  }
}
```

#### C) React Query cache (frontend):
```tsx
// Oferty cache 5 min
const { data: offers } = useQuery({
  queryKey: ['offers', simc],
  queryFn: () => fetchOffers(simc),
  staleTime: 5 * 60 * 1000,
  cacheTime: 30 * 60 * 1000,
});
```

---

### PRIORYTET 4: Tabela `ui_config` (konfiguracja)

```sql
CREATE TABLE ui_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ui_config (key, value) VALUES
('offers.items_per_page', '12'),
('offers.sort_options', '["default","price-asc","price-desc","speed-desc"]'),
('search.debounce_ms', '300'),
('search.min_chars', '2'),
('contact.phone', '"532274808"'),
('contact.email', '"kontakt@dostawcyinternetu.pl"'),
('features.kpo_enabled', 'true'),
('features.map_enabled', 'false'),
('seo.default_robots', '"index, follow"');
```

---

## 🏗️ NOWA STRUKTURA PLIKÓW

```
src/
├── styles/
│   ├── globals.css              # CSS variables + base
│   └── tailwind.config.ts       # Tailwind z custom theme
│
├── lib/
│   ├── prisma.ts
│   ├── content.ts               # getContent(), getContentBatch()
│   ├── config.ts                # getConfig()
│   └── cache.ts                 # Redis/memory cache helpers
│
├── components/
│   ├── ui/                      # Atomic - bezstanowe
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   │
│   ├── offers/                  # Domain - oferty
│   │   ├── OfferCard.tsx
│   │   ├── OffersList.tsx
│   │   ├── OffersFilters.tsx
│   │   └── OfferBadge.tsx
│   │
│   ├── search/                  # Domain - szukajka
│   │   ├── SearchBox.tsx
│   │   ├── AddressAutocomplete.tsx
│   │   └── AddressModal.tsx
│   │
│   └── layout/                  # Layout
│       ├── Container.tsx
│       ├── Breadcrumbs.tsx
│       ├── Header.tsx
│       └── Footer.tsx
│
├── hooks/
│   ├── useContent.ts            # Hook do pobierania tekstów
│   ├── useConfig.ts             # Hook do konfiguracji
│   └── useOffers.ts             # Hook do ofert z cache
│
└── features/
    ├── coverage/
    │   └── actions/search.ts
    └── offers/
        └── actions/search.ts
```

---

## 📋 CHECKLIST IMPLEMENTACJI

### Faza 1: Style globalne (1-2 dni)
- [ ] Stworzyć `globals.css` z CSS variables
- [ ] Stworzyć komponenty UI: Button, Card, Badge, Input, Modal
- [ ] Przerobić `OffersList.tsx` na użycie komponentów
- [ ] Przerobić `AddressModal.tsx` na użycie komponentów
- [ ] Przerobić strony `*Page.tsx` na użycie komponentów

### Faza 2: Teksty do bazy (1 dzień)
- [ ] Migracja SQL dla `ui_content`
- [ ] Stworzyć `lib/content.ts`
- [ ] Hook `useContent` dla client components
- [ ] Server function dla SSR
- [ ] Zamienić hardcoded teksty na `getContent()`

### Faza 3: Konfiguracja do bazy (0.5 dnia)
- [ ] Migracja SQL dla `ui_config`
- [ ] Stworzyć `lib/config.ts`
- [ ] Zamienić magic numbers na `getConfig()`

### Faza 4: CDN + Cache (1 dzień)
- [ ] Skonfigurować Cloudflare
- [ ] Dodać nagłówki cache w `next.config.js`
- [ ] Zoptymalizować obrazy (next/image)
- [ ] Dodać React Query dla ofert

### Faza 5: Bezpieczeństwo audit (0.5 dnia)
- [ ] Sprawdzić wszystkie inputy (sanityzacja ✅)
- [ ] Sprawdzić SQL injection (Prisma ✅)
- [ ] Sprawdzić XSS (React escaping ✅)
- [ ] Dodać rate limiting na API
- [ ] Dodać CSRF protection

---

## ⚡ QUICK WINS (można zrobić od razu)

### 1. Lazy loading obrazów (5 min)
```tsx
// Zamienić:
<img src={logo} />

// Na:
import Image from 'next/image';
<Image src={logo} alt="" loading="lazy" />
```

### 2. Skeleton loading (15 min)
```tsx
// OfferCard placeholder
function OfferCardSkeleton() {
  return (
    <div className="p-5 bg-white rounded-2xl border-2 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
```

### 3. Error boundary (10 min)
```tsx
// components/ErrorBoundary.tsx
'use client';
export default function ErrorBoundary({ children }) {
  // ... standard error boundary
}
```

---

## 🔐 BEZPIECZEŃSTWO - STATUS

| Zagrożenie | Status | Gdzie |
|------------|--------|-------|
| SQL Injection | ✅ OK | Prisma (parametryzowane) |
| XSS | ✅ OK | React auto-escaping |
| Input sanitization | ✅ OK | `sanitize()` w komponentach |
| CSRF | ⚠️ Do dodania | Next.js middleware |
| Rate limiting | ⚠️ Do dodania | API routes |
| Sensitive data exposure | ✅ OK | Env variables |

---

## 📈 PERFORMANCE - REKOMENDACJE

1. **Database**: 
   - ✅ Indeksy są OK
   - Dodać connection pooling (PgBouncer)
   
2. **Frontend**:
   - Dodać lazy loading komponentów
   - Dodać prefetch dla popularnych stron
   - Minifikacja CSS/JS (Next.js robi automatycznie)

3. **CDN**:
   - Cloudflare free tier wystarczy
   - Cache statycznych assetów
   - Cache API responses (5-60 min)

---

## 💡 DECYZJE DO PODJĘCIA

1. **CDN**: Cloudflare (darmowy) vs Vercel Edge (wbudowany)?
2. **Cache**: Redis vs in-memory vs Cloudflare KV?
3. **i18n**: next-intl vs custom rozwiązanie?
4. **Mapa**: Usunąć vs prawdziwa mapa zasięgów?

---

## 🚀 NASTĘPNE KROKI

1. **Dziś**: Decyzja o CDN i architekturze stylów
2. **Jutro**: Implementacja komponentów UI
3. **Pojutrze**: Migracja tekstów do bazy
4. **Tydzień**: Pełna refaktoryzacja + CDN
