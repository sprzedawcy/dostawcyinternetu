# 🏠 Strona Główna - Instrukcja Integracji

## Struktura plików

```
components/
├── HomePage.tsx        # Główny wrapper
├── Header.tsx          # Nagłówek z logo, menu, tel, flagi
├── Footer.tsx          # Stopka 3-kolumnowa
├── MapFacade.tsx       # Statyczna mapa SVG (tło)
├── HomeSearchBox.tsx   # Szukajka z autocomplete
└── index.ts            # Eksporty
```

## Instalacja

### 1. Skopiuj folder `components/` do swojego projektu

```bash
cp -r components/ /sciezka/do/projektu/src/components/
```

### 2. Użyj w `app/[locale]/page.tsx`

```tsx
import HomePage from "@/components/HomePage";

export default function Page() {
  return <HomePage />;
}
```

## 🔌 Podłączenie API wyszukiwania

W pliku `HomeSearchBox.tsx` znajdziesz TODO:

```typescript
// Linia ~50 - zamień mock na prawdziwe API
const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
const data = await response.json();
setSuggestions(data.suggestions);
```

### Oczekiwany format odpowiedzi API:

```json
{
  "suggestions": [
    {
      "id": "123",
      "display": "Warszawa, ul. Marszałkowska 1",
      "miejscowosc": "Warszawa",
      "ulica": "Marszałkowska",
      "nr": "1",
      "slug": "warszawa",
      "type": "adres"
    }
  ]
}
```

### Typy `type`:
- `"miejscowosc"` - tylko miasto (ikona niebieska)
- `"ulica"` - miasto + ulica (ikona zielona)
- `"adres"` - pełny adres z numerem (ikona czerwona)

## 🎨 Dostosowanie

### Logo
W `Header.tsx` linia ~35 - zamień SVG na swoje logo:
```tsx
<Image src="/logo.svg" alt="Logo" width={40} height={40} />
```

### Menu
W `Header.tsx` linia ~8:
```typescript
const menuItems = [
  { label: "Porównaj oferty", href: "/" },
  { label: "Operatorzy", href: "/dostawcy-internetu" },
  { label: "Mapa zasięgu", href: "/mapa" },
];
```

### Telefon
W `Header.tsx` linia ~55:
```tsx
<a href="tel:+48TWOJNUMER">
```

### Linki stopki
W `Footer.tsx` obiekt `footerLinks` - dodaj/usuń linki.

### Popularne miasta
W `HomePage.tsx` linia ~45 - dostosuj listę miast.

### Mapa (punkty miast)
W `MapFacade.tsx` tablica `cities` - możesz dodać więcej miast.

## 📱 Responsywność

Layout jest w pełni responsywny:
- **Desktop (>768px):** Pełne menu, telefon widoczny, mapa na całą szerokość
- **Mobile (<768px):** Hamburger menu, floating telefon, mapa mniejsza

## ⚡ Wydajność

- **MapFacade** to czyste SVG (~5KB gzipped)
- Brak Leaflet/Google Maps na stronie głównej
- Szukajka z debounce 300ms
- Lazy loading sugestii

## 🔗 Flow użytkownika

```
[Strona główna]
     │
     │ wpisuje adres
     ▼
[Autocomplete pokazuje sugestie]
     │
     │ wybiera sugestię
     ▼
[Przekierowanie do /internet/{miasto}/{ulica}/{nr}]
     │
     ▼
[Split View: Lista ofert + Mapa Leaflet]  ← TO ZROBIMY W KROKU 2
```

## Następny krok

Po integracji strony głównej, przejdziemy do:
1. **SearchResultsPage** - split view z listą ofert i mapą
2. **OffersMap** - interaktywna mapa Leaflet z budynkami i BTS
3. **BottomSheet** - panel dolny na mobile
