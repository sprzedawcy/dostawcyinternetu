'use server';

import { prisma } from "@/lib/prisma";

export async function getOperatorBuildings(
  operatorId: number, 
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }
) {
  // 1. Zabezpieczenie: Sprawdzamy, czy obszar nie jest za duży
  // Jeśli różnica jest większa niż ~0.05 stopnia (ok. 5x5 km), zwracamy flagę tooLarge
  if ((bounds.maxLat - bounds.minLat) > 0.05 || (bounds.maxLon - bounds.minLon) > 0.05) {
    return { tooLarge: true, data: [] }; 
  }

  try {
    // 2. RAW SQL - Łączymy tabelę zasięgów z tabelą adresową
    // Używamy nazwy tabeli 'zasiegi_operatorow' zgodnie z Twoim schema (@@map)
    const rawBuildings = await prisma.$queryRaw`
      SELECT 
        p.miejscowosc, p.ulica, p.nr, p.lat, p.lon
      FROM zasiegi_operatorow z
      JOIN polska p ON (z.simc = p.simc AND z.id_ulicy = p.id_ulicy AND z.nr = p.nr)
      WHERE 
        z.operator_id = ${operatorId}
        AND z.aktywny = true
        AND p.lat BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND p.lon BETWEEN ${bounds.minLon} AND ${bounds.maxLon}
      LIMIT 1000
    `;

    // 3. Formatowanie danych (Decimal -> Number)
    const formatted = (rawBuildings as any[]).map(b => ({
      miejscowosc: b.miejscowosc,
      ulica: b.ulica,
      nr: b.nr,
      lat: Number(b.lat),
      lon: Number(b.lon)
    }));

    // Zwracamy w formacie, którego oczekuje BtsMap.tsx
    return { tooLarge: false, data: formatted };

  } catch (e) {
    console.error("Błąd pobierania budynków:", e);
    // W razie błędu zwracamy pustą listę, ale bez flagi tooLarge
    return { tooLarge: false, data: [] };
  }
}