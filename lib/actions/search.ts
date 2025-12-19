"use server"
import { prisma } from "@/lib/prisma";

/**
 * Funkcja czyszcząca nazwy ulic i osiedli.
 * Eliminuje duplikaty wynikające z przedrostków i wielkości liter.
 */
function normalizeStreetName(name: string): string {
  if (!name) return "";
  let clean = name
    .replace(/^(ulica|ul\.|os\.)\s+/i, "") // Usuwa przedrostki na początku
    .replace(/^osiedle\s+/i, "")           // Tymczasowo usuwa słowo osiedle do czyszczenia
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Jeśli oryginał zawierał frazę "osiedle" (w dowolnej formie), dodajemy ją poprawnie na początek
  if (/osiedle|os\./i.test(name)) {
    return `Osiedle ${clean}`;
  }
  return clean;
}

export async function searchMiejscowosci(query: string) {
  if (!query || query.length < 3) return [];
  try {
    const results = await prisma.$queryRawUnsafe(`
      SELECT miejscowosc, gmina, simc, adresy
      FROM "miejscowosci_slug"
      WHERE (unaccent(miejscowosc) ILIKE unaccent($1) OR miejscowosc ILIKE $1)
      ORDER BY adresy DESC LIMIT 100
    `, `${query}%`) as any[];

    const uniqueMap = new Map();
    results.forEach((m: any) => {
      const key = `${m.miejscowosc}-${m.gmina}`.toLowerCase();
      if (!uniqueMap.has(key)) {
        const formatGmina = (n: string) => n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : "";
        uniqueMap.set(key, {
          label: m.miejscowosc,
          sublabel: m.gmina ? `gm. ${formatGmina(m.gmina)}` : '',
          simc: String(m.simc)
        });
      }
    });
    return Array.from(uniqueMap.values()).slice(0, 15);
  } catch (e) { return []; }
}

export async function searchUlice(query: string, simc: string) {
  if (!simc || query.length < 2) return [];
  try {
    const rawResults = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT ulica 
      FROM "polska" 
      WHERE simc = $1 AND (unaccent(ulica) ILIKE unaccent($2) OR ulica ILIKE $2)
    `, String(simc), `%${query}%`) as any[];

    const uniqueStreets = new Map();

    rawResults.forEach((r: any) => {
      const display = normalizeStreetName(r.ulica);
      const key = display.toLowerCase();

      if (!uniqueStreets.has(key)) {
        // sortKey ignoruje "Osiedle " przy sortowaniu, żeby "Osińska" była przy "Os. Sikorskiego"
        const sortKey = display.replace(/^Osiedle\s+/i, "").toLowerCase();
        
        uniqueStreets.set(key, {
          ulica: display,
          sortKey: sortKey,
          rawVariants: [r.ulica, r.ulica.toLowerCase(), r.ulica.toUpperCase()]
        });
      } else {
        // Jeśli klucz już istnieje, tylko dopisujemy warianty dla bazy (zasięgi)
        uniqueStreets.get(key).rawVariants.push(r.ulica);
      }
    });

    // Sortowanie alfabetyczne po nazwie właściwej (ignorując słowo Osiedle)
    return Array.from(uniqueStreets.values())
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey, 'pl'))
      .slice(0, 25);
  } catch (e) { return []; }
}

export async function searchNumbers(simc: string, streetNames: string[], query: string) {
  if (!simc || !streetNames.length) return [];
  try {
    const results = await prisma.polska.findMany({
      where: {
        simc: String(simc),
        ulica: { in: streetNames },
        nr: { contains: query, mode: 'insensitive' }
      },
      take: 200
    });

    return JSON.parse(JSON.stringify(results)).sort((a: any, b: any) => 
      a.nr.localeCompare(b.nr, 'pl', { numeric: true })
    );
  } catch (e) { return []; }
}