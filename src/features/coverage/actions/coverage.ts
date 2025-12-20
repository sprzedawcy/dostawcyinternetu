"use server"
import { prisma } from "@/lib/prisma";

// Normalizacja polskich znaków
function normalize(str: string) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .trim();
}

// Usuń powiat z nazwy miejscowości "Warszawa (m. Warszawa)" → "Warszawa"
function cleanMiejscowoscName(name: string): string {
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

// Podpowiedzi miejscowości (z powiatami)
export async function suggestMiejscowosci(query: string) {
  if (!query || query.length < 2) return [];
  
  const queryNorm = normalize(query);
  
  const results = await prisma.searchMiejscowosc.findMany({
    where: {
      nazwa_normalized: {
        contains: queryNorm
      }
    },
    orderBy: { waga: 'desc' },
    take: 15,
    select: { nazwa: true, powiat_label: true }
  });
  
  // Zwróć "Nazwa (powiat)" dla lepszej identyfikacji
  return results.map(r => 
    r.powiat_label ? `${r.nazwa} (${r.powiat_label})` : r.nazwa
  );
}

// Podpowiedzi ulic
export async function suggestUlice(query: string, miejscowosc?: string) {
  if (!query || query.length < 2) return [];
  
  const queryNorm = normalize(query);
  
  // Jeśli mamy miejscowość, znajdź jej SIMC
  let simc: string | undefined;
  if (miejscowosc) {
    const cleanName = cleanMiejscowoscName(miejscowosc);
    const city = await prisma.searchMiejscowosc.findFirst({
      where: { nazwa: cleanName },
      select: { simc: true }
    });
    simc = city?.simc;
  }
  
  const where: any = {
    ulica_norm: {
      contains: queryNorm
    }
  };
  
  if (simc) {
    where.simc = simc;
  }
  
  const results = await prisma.searchUlica.findMany({
    where,
    orderBy: { ulica: 'asc' },
    take: 15,
    select: { ulica: true },
    distinct: ['ulica']
  });
  
  return results.map(r => r.ulica).filter(Boolean);
}

interface SearchParams {
  simc?: string;
  miejscowosc?: string;
  ulica?: string;
  page?: number;
  limit?: number;
  sortBy?: 'simc' | 'miejscowosc' | 'ulica' | 'nr';
  sortOrder?: 'asc' | 'desc';
}

// Szukaj adresów z zasięgami (pivot - operatorzy jako kolumny)
export async function searchCoveragePivot(params: SearchParams) {
  const { 
    simc = '', 
    miejscowosc = '', 
    ulica = '',
    page = 1, 
    limit = 50,
    sortBy = 'simc',
    sortOrder = 'asc'
  } = params;
  
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (simc) {
    conditions.push(`p.simc LIKE $${paramIndex}`);
    values.push(`${simc}%`);
    paramIndex++;
  }
  
  if (miejscowosc) {
    // Usuń powiat z nazwy "(powiat)" przed wyszukiwaniem
    const cleanName = cleanMiejscowoscName(miejscowosc);
    conditions.push(`LOWER(p.miejscowosc) = $${paramIndex}`);
    values.push(cleanName.toLowerCase());
    paramIndex++;
  }
  
  if (ulica) {
    const ulicaNorm = normalize(ulica);
    conditions.push(`LOWER(p.ulica) LIKE $${paramIndex}`);
    values.push(`%${ulicaNorm}%`);
    paramIndex++;
  }

  if (conditions.length === 0) {
    return { data: [], total: 0, page, limit, totalPages: 0, operators: [] };
  }

  const whereClause = conditions.join(' AND ');
  
  const operators = await prisma.operator.findMany({
    where: { aktywny: true },
    orderBy: { nazwa: 'asc' }
  });

  const orderColumn = sortBy === 'miejscowosc' ? 'p.miejscowosc' : 
                      sortBy === 'ulica' ? 'p.ulica' : 
                      sortBy === 'nr' ? 'p.nr' : 'p.simc';

  const operatorColumns = operators.map(op => `
    (SELECT hp_count FROM operator_coverage oc 
     WHERE oc.simc = p.simc AND oc.id_ulicy = p.id_ulicy AND oc.nr = p.nr 
     AND oc.operator_id = ${op.id} LIMIT 1) as "hp_${op.id}"
  `).join(',');

  const dataQuery = `
    SELECT 
      p.simc,
      p.id_ulicy,
      p.nr,
      p.teryt,
      p.miejscowosc,
      p.ulica
      ${operators.length > 0 ? ',' + operatorColumns : ''}
    FROM polska p
    WHERE ${whereClause}
    AND EXISTS (
      SELECT 1 FROM operator_coverage oc 
      WHERE oc.simc = p.simc AND oc.id_ulicy = p.id_ulicy AND oc.nr = p.nr
    )
    ORDER BY ${orderColumn} ${sortOrder.toUpperCase()}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countQuery = `
    SELECT COUNT(*)::int as total
    FROM polska p
    WHERE ${whereClause}
    AND EXISTS (
      SELECT 1 FROM operator_coverage oc 
      WHERE oc.simc = p.simc AND oc.id_ulicy = p.id_ulicy AND oc.nr = p.nr
    )
  `;

  const [data, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(dataQuery, ...values),
    prisma.$queryRawUnsafe<any[]>(countQuery, ...values)
  ]);

  const total = Number(countResult[0]?.total || 0);

  return {
    data,
    operators,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// Aktualizuj HP
export async function updateCoverageHP(
  operator_id: number,
  simc: string,
  id_ulicy: string,
  nr: string,
  hp_count: number
) {
  const existing = await prisma.operatorCoverage.findFirst({
    where: { operator_id, simc, id_ulicy, nr }
  });

  if (existing) {
    return prisma.operatorCoverage.update({
      where: { id: existing.id },
      data: { hp_count, updated_at: new Date() }
    });
  } else {
    return prisma.operatorCoverage.create({
      data: {
        operator_id,
        simc,
        id_ulicy,
        nr,
        hp_count,
        source: 'manual'
      }
    });
  }
}

// Kopiuj wiersz
export async function copyAddressCoverage(
  simc: string,
  id_ulicy: string,
  oldNr: string,
  newNr: string
) {
  const coverages = await prisma.operatorCoverage.findMany({
    where: { simc, id_ulicy, nr: oldNr }
  });

  if (coverages.length === 0) {
    throw new Error('Brak zasięgów do skopiowania');
  }

  for (const cov of coverages) {
    await prisma.operatorCoverage.create({
      data: {
        operator_id: cov.operator_id,
        simc,
        id_ulicy,
        nr: newNr,
        hp_count: cov.hp_count,
        source: 'manual_copy'
      }
    });
  }

  return { copied: coverages.length };
}

// Pobierz operatorów
export async function getOperatorsForFilter() {
  return prisma.operator.findMany({
    where: { aktywny: true },
    select: { id: true, nazwa: true, slug: true },
    orderBy: { nazwa: 'asc' }
  });
}
