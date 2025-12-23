"use server"
import { prisma } from "@/lib/prisma";

// Funkcja normalizująca polskie znaki (do wyszukiwania)
function normalize(str: string) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .trim();
}

// Normalizuj nazwę ulicy - zamień skróty na pełne formy
function normalizeStreetName(name: string): string {
  if (!name) return "";
  
  let result = name.trim();
  
  // 1. Zamień duplikaty "AL. ALEJA X" → "Aleja X"
  result = result.replace(/^al\.\s*aleja\s+/i, 'Aleja ');
  result = result.replace(/^al\.\s*aleje\s+/i, 'Aleje ');
  result = result.replace(/^os\.\s*osiedle\s+/i, 'Osiedle ');
  result = result.replace(/^pl\.\s*plac\s+/i, 'Plac ');
  result = result.replace(/^ul\.\s*ulica\s+/i, 'Ulica ');
  
  // 2. Zamień same skróty "Al. X" → "Aleja X" (jeśli nie złapane wyżej)
  result = result.replace(/^al\.\s+/i, 'Aleja ');
  result = result.replace(/^os\.\s+/i, 'Osiedle ');
  result = result.replace(/^pl\.\s+/i, 'Plac ');
  result = result.replace(/^ul\.\s+/i, 'Ulica ');
  
  // 3. Usuń podwójne spacje
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

// Popraw kapitalizację nazwy ulicy
function fixCapitalization(name: string): string {
  if (!name) return "";
  
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XX', 'XXI'];
  const abbreviationsUpper = ['KEN', 'AK', 'WP', 'PKP', 'ZHP', 'ZHR', 'PCK', 'NSZZ'];
  
  return name
    .split(' ')
    .map((word, index) => {
      if (!word) return word;
      
      const upper = word.toUpperCase();
      
      // Rzymskie cyfry - wielkie
      if (romanNumerals.includes(upper)) {
        return upper;
      }
      
      // Skróty organizacji - wielkie
      if (abbreviationsUpper.includes(upper)) {
        return upper;
      }
      
      // Obsługa myślników (np. "Nowaka-Jeziorańskiego")
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => {
            if (!part) return part;
            // Liczby zostawiamy
            if (/^\d+$/.test(part)) return part;
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }
      
      // Liczby zostawiamy
      if (/^\d+/.test(word)) {
        return word;
      }
      
      // Standardowa kapitalizacja
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Klucz sortowania - typ ulicy + nazwa
function getSortKey(name: string): string {
  const normalized = name.toLowerCase();
  
  // Priorytet typów (alfabetycznie po typie, potem po nazwie)
  let prefix = '5_'; // inne
  
  if (normalized.startsWith('aleja ') || normalized.startsWith('aleje ')) {
    prefix = '1_aleja_';
  } else if (normalized.startsWith('osiedle ')) {
    prefix = '2_osiedle_';
  } else if (normalized.startsWith('plac ')) {
    prefix = '3_plac_';
  } else if (normalized.startsWith('ulica ')) {
    prefix = '4_ulica_';
  }
  
  // Usuń przedrostek z nazwy do sortowania
  const nameWithoutPrefix = normalized
    .replace(/^(aleja|aleje|osiedle|plac|ulica)\s+/i, '');
  
  return prefix + nameWithoutPrefix;
}

// 1. WYSZUKAJ MIEJSCOWOŚCI
export async function searchCities(query: string) {
  if (!query || query.length < 2) return [];
  
  const queryNorm = normalize(query);
  
  const cities = await prisma.searchMiejscowosc.findMany({
    where: {
      nazwa_normalized: {
        contains: queryNorm
      }
    },
    orderBy: [
      { waga: 'desc' },
      { nazwa: 'asc' }
    ],
    take: 20
  });
  
  return cities.map(city => ({
    id: city.id,
    nazwa: city.nazwa,
    simc: city.simc,
    teryt: city.teryt,
    powiat: city.powiat_label,
  }));
}

// 1.5. SPRAWDŹ CZY MIEJSCOWOŚĆ MA ULICE
export async function cityHasStreets(simc: string): Promise<boolean> {
  const street = await prisma.searchUlica.findFirst({
    where: { 
      simc,
      ulica: { 
        notIn: ['brak ulicy', 'BRAK ULICY', '']
      }
    }
  });
  
  return street !== null;
}

// 2. WYSZUKAJ ULICE W MIEJSCOWOŚCI
export async function searchStreets(simc: string, query: string) {
  if (!simc || !query || query.length < 2) return [];
  
  const queryNorm = normalize(query);
  
  const streets = await prisma.searchUlica.findMany({
    where: {
      simc: simc,
      ulica_norm: {
        contains: queryNorm
      }
    },
    orderBy: {
      ulica: 'asc'
    },
    take: 200
  });
  
  // Deduplikuj po id_ulicy, normalizuj nazwy
  const uniqueStreets = new Map<string, { id: number; ulica: string; id_ulicy: string; sortKey: string }>();
  
  for (const street of streets) {
    const idUlicy = street.id_ulicy || '';
    
    // Pomijamy jeśli już mamy tę ulicę
    if (uniqueStreets.has(idUlicy)) continue;
    
    // Normalizuj nazwę
    const normalized = normalizeStreetName(street.ulica || '');
    const fixed = fixCapitalization(normalized);
    const sortKey = getSortKey(fixed);
    
    uniqueStreets.set(idUlicy, {
      id: street.id,
      ulica: fixed,
      id_ulicy: idUlicy,
      sortKey: sortKey,
    });
  }
  
  // Sortuj po kluczu (typ + nazwa)
  const sorted = Array.from(uniqueStreets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, 'pl'));
  
  // Zwróć bez klucza sortowania
  return sorted.slice(0, 50).map(s => ({
    id: s.id,
    ulica: s.ulica,
    id_ulicy: s.id_ulicy,
  }));
}

// 3. WYSZUKAJ NUMERY NA ULICY
export async function searchNumbers(id_ulicy: string, query?: string) {
  if (!id_ulicy) return [];
  if (query !== undefined && query.length < 1) return [];
  
  const where: any = {
    id_ulicy: id_ulicy
  };
  
  if (query && query.length > 0) {
    where.nr = {
      startsWith: query
    };
  }
  
  const numbers = await prisma.searchNumer.findMany({
    where,
    orderBy: [
      { nr_int: 'asc' },
      { nr: 'asc' }
    ],
    take: 200
  });
  
  // Deduplikacja po numerze
  const uniqueNumbers = new Map<string, typeof numbers[0]>();
  for (const num of numbers) {
    if (!uniqueNumbers.has(num.nr)) {
      uniqueNumbers.set(num.nr, num);
    }
  }
  
  return Array.from(uniqueNumbers.values()).slice(0, 50).map(num => ({
    id: num.id,
    nr: num.nr,
    teryt: num.teryt,
  }));
}