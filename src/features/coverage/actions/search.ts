"use server"
import { prisma } from "@/lib/prisma";

// Funkcja normalizująca polskie znaki
function normalize(str: string) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .trim();
}

// Usuń redundantne prefixy z nazwy ulicy
function cleanStreetPrefix(name: string): string {
  if (!name) return "";
  
  // Wzorce do usunięcia (case-insensitive)
  const patterns = [
    /^os\.\s*osiedle\s*/i,   // Os. Osiedle → Osiedle
    /^al\.\s*aleja\s*/i,     // Al. Aleja → Aleja
    /^al\.\s*aleje\s*/i,     // Al. Aleje → Aleje
    /^ul\.\s*ulica\s*/i,     // Ul. Ulica → Ulica
    /^pl\.\s*plac\s*/i,      // Pl. Plac → Plac
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(name)) {
      return name.replace(pattern, '');
    }
  }
  
  return name;
}

// Popraw kapitalizację nazwy ulicy (obsługuje polskie znaki)
function fixStreetCapitalization(name: string): string {
  if (!name) return "";
  
  const abbreviations = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  
  return name
    .split(' ')
    .map(word => {
      if (!word) return word;
      
      if (abbreviations.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLocaleLowerCase('pl'))
          .join('-');
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase('pl');
    })
    .join(' ');
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

// 1.5. SPRAWDŹ CZY MIEJSCOWOŚĆ MA ULICE (prawdziwe, nie "brak ulicy")
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
    take: 100  // więcej, bo będziemy deduplikować
  });
  
  // Wyczyść prefixy i deduplikuj
  const uniqueStreets = new Map<string, typeof streets[0] & { ulica: string }>();
  
  for (const street of streets) {
    const cleaned = cleanStreetPrefix(street.ulica || '');
    const fixed = fixStreetCapitalization(cleaned);
    
    if (!uniqueStreets.has(fixed)) {
      uniqueStreets.set(fixed, { ...street, ulica: fixed });
    }
  }
  
  return Array.from(uniqueStreets.values()).slice(0, 50).map(street => ({
    id: street.id,
    ulica: street.ulica,
    id_ulicy: street.id_ulicy,
  }));
}

// 3. WYSZUKAJ NUMERY NA ULICY (z deduplikacją)
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