"use server"
import { prisma } from "@/lib/prisma";

// Funkcja czyszcząca tekst do wyszukiwania
function normalize(str: string) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .trim();
}

// Popraw kapitalizację nazwy ulicy
function fixStreetCapitalization(name: string): string {
  if (!name) return "";
  
  // Lista skrótów które powinny pozostać UPPERCASE
  const abbreviations = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  
  return name
    .split(' ')
    .map(word => {
      if (!word) return word;
      
      // Jeśli to skrót z listy - zostaw uppercase
      if (abbreviations.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      // Jeśli zawiera "-" (np. "Ścibora-Rylskiego") - obsłuż każdą część osobno
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-');
      }
      
      // Standardowa kapitalizacja: Pierwsza wielka, reszta małe
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    // Popraw cudzysłowy
    .replace(/„/g, '„')
    .replace(/"/g, '"');
}

// 🔧 NOWA: Sprawdź czy ulica powinna być pominięta (redundantny prefix)
function shouldSkipStreet(name: string): boolean {
  // Pomijaj "Al. Aleja..."
  if (name.startsWith("Al. Aleja")) return true;
  
  // Pomijaj "Os. Osiedle..."
  if (name.startsWith("Os. Osiedle")) return true;
  
  // Pomijaj "Ul. Ulica..."
  if (name.startsWith("Ul. Ulica")) return true;
  
  return false;
}

// 1. SZUKANIE MIAST
export async function searchMiejscowosci(query: string) {
  if (!query || query.length < 3) return [];
  const queryNorm = normalize(query);

  try {
    const results = await prisma.searchMiejscowosc.findMany({
      where: {
        nazwa_normalized: { contains: queryNorm, mode: 'insensitive' }
      },
      orderBy: { waga: 'desc' },
      take: 5,
    });

    if (results.length > 0) {
      console.log("🔍 [DEBUG BAZA] Pierwszy wynik dla zapytania '" + query + "':");
      console.log(`   Nazwa: ${results[0].nazwa}`);
      console.log(`   SIMC (w bazie): ${results[0].simc}`);
    }

    return results.map(c => ({
      simc: c.simc,
      label: c.nazwa,
      powiat: c.powiat_label || "",
      teryt: c.teryt 
    }));
  } catch (error) {
    console.error("❌ [MIASTA] Błąd:", error);
    return [];
  }
}

// 2. SZUKANIE ULIC - UŻYWA search_ulice
export async function safeSearchUlice(
  citySimc: string,
  terytPowiat: string,
  query: string = ""
) {
  console.log(`🔍 [ULICE START] Szukam ulic dla SIMC: "${citySimc}" | Fraza: "${query}"`);

  if (!citySimc) {
    console.log("❌ [ULICE] Brak kodu SIMC miasta.");
    return [];
  }

  if (query.length > 0 && query.length < 3) {
    console.log("⏳ [ULICE] Czekam na 3 znaki...");
    return [];
  }

  const qNorm = normalize(query);

  try {
    const results = await prisma.searchUlica.findMany({
      where: {
        simc: citySimc,
        ulica_norm: query.length > 0 ? { contains: qNorm } : undefined
      },
      orderBy: { ulica: 'asc' },
      take: 100,  // 🔧 Zwiększone z 50 na 100 żeby mieć więcej opcji przed filtrowaniem
      select: { 
        id_ulicy: true, 
        ulica: true
      }
    });

    // Filtruj duplikaty i popraw nazwy
    const uniqueStreets = new Map<string, any>();
    
    for (const street of results) {
      const originalName = street.ulica || "";
      
      // 🔧 Pomijaj redundantne prefixy (Al. Aleja, Os. Osiedle, Ul. Ulica)
      if (shouldSkipStreet(originalName)) {
        continue;
      }
      
      // Popraw kapitalizację
      const cleanName = fixStreetCapitalization(originalName);
      
      // Zapisz unikalną ulicę (deduplikacja po nazwie)
      if (!uniqueStreets.has(cleanName)) {
        uniqueStreets.set(cleanName, {
          ...street,
          ulica: cleanName
        });
      }
    }
    
    // Ogranicz do 50 wyników
    const finalResults = Array.from(uniqueStreets.values()).slice(0, 50);
    
    console.log(`✅ [ULICE WYNIK] Znaleziono: ${finalResults.length} ulic (po deduplikacji i czyszczeniu).`);
    return finalResults;
  } catch (error) {
    console.error("❌ [ULICE CRASH] Błąd Prismy:", error);
    return [];
  }
}

// 3. SZUKANIE NUMERÓW
export async function searchNumbers(citySimc: string, id_ulicy: string) {
  try {
    return await prisma.searchNumer.findMany({
      where: { 
        id_ulicy: id_ulicy
      },
      orderBy: [{ nr_int: 'asc' }, { nr: 'asc' }],
      take: 300
    });
  } catch (error) { 
    console.error("❌ [NUMERY] Błąd:", error);
    return []; 
  }
}